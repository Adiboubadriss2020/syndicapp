const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice');
const Client = require('../models/client');
const invoiceController = require('../controllers/invoice');
const invoicePdfController = require('../controllers/invoicePdf');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Get all invoices (with client)
router.get('/', async (req, res) => {
  const invoices = await Invoice.findAll({ include: Client });
  res.json(invoices);
});

// Get all invoices for a client
router.get('/by-client', async (req, res) => {
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id is required' });
  try {
    const invoices = await Invoice.findAll({
      where: { client_id },
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des factures.' });
  }
});

// Export invoice PDF - MUST come before /:id route
router.get('/pdf', invoicePdfController.exportInvoicePdf);

// Serve PDF for iframe viewing (clean version) - MUST come before /:id route
router.get('/pdf-view/:filename', (req, res, next) => {
  // Remove X-Frame-Options header to allow iframe embedding
  res.removeHeader('X-Frame-Options');
  next();
}, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../invoices', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  // Set proper headers for PDF viewing in iframe
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(filePath);
});

// Get invoice by id (with client)
router.get('/:id', async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id, { include: Client });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  res.json(invoice);
});

// Generate PDF for any client and month (creates invoice if doesn't exist)
router.post('/generate-pdf', async (req, res) => {
  const { client_id, month, year, amount } = req.body;
  if (!client_id || !month || !year) {
    return res.status(400).json({ error: 'client_id, month, and year are required' });
  }
  
  try {
    // Find or create invoice
    const [invoice, created] = await Invoice.findOrCreate({
      where: { client_id, month, year },
      defaults: { 
        amount: amount || 0, 
        status: 'Non Payé' 
      }
    });
    
    if (!created && amount) {
      invoice.amount = amount;
      await invoice.save();
    }
    
    // Generate PDF using the direct function
    const { publicUrl } = await invoicePdfController.generateInvoicePdf(invoice.id);
    
    // Update invoice with pdf_url
    invoice.pdf_url = publicUrl;
    await invoice.save();
    
    res.json({ 
      success: true, 
      message: 'PDF généré avec succès',
      invoice,
      pdf_url: publicUrl 
    });
  } catch (err) {
    console.error('Generate PDF error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// Upsert invoice (create or update for client/month/year)
router.post('/upsert', invoiceController.upsertInvoice);

// Create invoice
router.post('/', async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  await invoice.update(req.body);
  res.json(invoice);
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  await invoice.destroy();
  res.json({ message: 'Deleted' });
});

// Debug: Get all invoices (raw)
router.get('/debug-all', async (req, res) => {
  const all = await Invoice.findAll();
  res.json(all);
});

// Merge PDFs for paid clients of current month/year
router.post('/merged-pdf', async (req, res) => {
  const { clientIds, month, year } = req.body;
  
  if (!Array.isArray(clientIds) || !month || !year) {
    return res.status(400).json({ error: 'Missing required parameters: clientIds, month, year' });
  }

  try {
    const mergedPdf = await PDFDocument.create();
    let added = 0;
    const invoicesDir = path.join(__dirname, '../invoices');

    // Check if invoices directory exists
    if (!fs.existsSync(invoicesDir)) {
      return res.status(404).json({ error: 'Invoices directory not found' });
    }

    for (const clientId of clientIds) {
      // Find the file matching the pattern: <clientId>_..._<month>-<year>.pdf
      const files = fs.readdirSync(invoicesDir);
      const regex = new RegExp(`^${clientId}_.+_${String(month).padStart(2, '0')}-${year}\\.pdf$`);
      const match = files.find(f => regex.test(f));
      
      if (match) {
        const pdfPath = path.join(invoicesDir, match);
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        added++;
        console.log(`Added PDF: ${match}`);
      } else {
        console.log(`No PDF found for client ${clientId}, month ${month}, year ${year}`);
      }
    }

    if (added === 0) {
      return res.status(404).json({ 
        error: 'Aucune facture trouvée pour les clients sélectionnés pour ce mois/année.' 
      });
    }

    console.log(`Merging ${added} PDFs for month ${month}, year ${year}`);
    const mergedPdfBytes = await mergedPdf.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="factures_payees.pdf"');
    res.send(Buffer.from(mergedPdfBytes));
    
  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).json({ error: 'Erreur lors de la fusion des PDFs' });
  }
});

module.exports = router; 