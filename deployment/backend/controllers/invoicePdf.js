const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Client = require('../models/client');
const Invoice = require('../models/invoice');
const Residence = require('../models/residence');

// Helper: Sanitize filename
function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Helper: Render HTML invoice
function renderInvoiceHtml({ client, invoice, residence }) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture - ${client.name} - ${invoice.month}/${invoice.year}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
        .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0001; padding: 32px; }
        h1 { color: #0d6efd; margin-bottom: 0; }
        .subtitle { color: #6c757d; margin-top: 0; }
        .section { margin: 32px 0 16px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #dee2e6; padding: 10px 14px; text-align: left; }
        th { background: #f1f3f4; }
        .total { font-size: 1.2em; font-weight: bold; color: #198754; }
        .footer { margin-top: 40px; color: #6c757d; font-size: 0.95em; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Facture</h1>
        <div class="subtitle">Mois: ${String(invoice.month).padStart(2, '0')}/${invoice.year}</div>
        <div class="section">
          <strong>Client:</strong> ${client.name}<br/>
          <strong>Résidence:</strong> ${residence ? residence.name : 'N/A'}<br/>
        </div>
        <div class="section">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Mois</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Charges de copropriété</td>
                <td>${String(invoice.month).padStart(2, '0')}/${invoice.year}</td>
                <td>${Number(invoice.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" class="total">Total à payer</td>
                <td class="total">${Number(invoice.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="footer">
          Facture générée automatiquement le ${new Date().toLocaleDateString('fr-FR')}<br/>
          Merci de votre confiance.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Function to generate PDF for an invoice
async function generateInvoicePdf(invoiceId) {
  try {
    // Find invoice with client and residence
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Client, include: [Residence] }
      ]
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const client = invoice.Client;
    const residence = client.Residence;
    
    // Prepare file path - save in backend/invoices directory
    const pdfDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
    const safeName = sanitizeFilename(client.name);
    const fileName = `${client.id}_${safeName}_${String(invoice.month).padStart(2, '0')}-${invoice.year}.pdf`;
    const filePath = path.join(pdfDir, fileName);
    const publicUrl = `/invoices/${fileName}`;
    
    // If file exists, return the URL
    if (fs.existsSync(filePath)) {
      return { filePath, publicUrl };
    }
    
    // Render HTML
    const html = renderInvoiceHtml({ client, invoice, residence });
    
    // Generate PDF with puppeteer
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    
    // Save PDF to disk
    fs.writeFileSync(filePath, pdfBuffer);
    
    return { filePath, publicUrl };
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
}

exports.exportInvoicePdf = async (req, res) => {
  const { client_id, month } = req.query;
  if (!client_id || !month) {
    return res.status(400).json({ error: 'client_id and month are required' });
  }
  try {
    // Parse month and year
    console.log('PDF endpoint called with:', { client_id, month });
    const [year, m] = month.split('-');
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(year, 10);
    console.log('Parsed:', { monthNum, yearNum });
    // Find invoice for client and month
    const invoice = await Invoice.findOne({
      where: { client_id, month: monthNum, year: yearNum },
    });
    console.log('Invoice found:', invoice);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found for this client and month' });
    }
    // Fetch client and residence
    const client = await Client.findByPk(client_id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const residence = await Residence.findByPk(client.residence_id);
    // Prepare file path
    const pdfDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
    const safeName = sanitizeFilename(client.name);
    const fileName = `${client_id}_${safeName}_${String(monthNum).padStart(2, '0')}-${yearNum}.pdf`;
    const filePath = path.join(pdfDir, fileName);
    const publicUrl = `/invoices/${fileName}`;
    // If file exists, serve it
    if (fs.existsSync(filePath)) {
      // Update pdf_url if needed
      if (invoice.pdf_url !== publicUrl) {
        invoice.pdf_url = publicUrl;
        await invoice.save();
      }
      return res.sendFile(filePath);
    }
    // Render HTML
    const html = renderInvoiceHtml({ client, invoice, residence });
    // Generate PDF with puppeteer
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    // Save PDF to disk
    fs.writeFileSync(filePath, pdfBuffer);
    // Update invoice pdf_url
    invoice.pdf_url = publicUrl;
    await invoice.save();
    // Serve the file
    res.sendFile(filePath);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la facture PDF' });
  }
};

// Export the generate function for direct use
exports.generateInvoicePdf = generateInvoicePdf; 