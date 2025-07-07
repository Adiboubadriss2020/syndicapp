const Invoice = require('../models/invoice');

exports.upsertInvoice = async (req, res) => {
  const { client_id, month, year, amount, status } = req.body;
  if (!client_id || !month || !year || !amount || !status) {
    return res.status(400).json({ error: 'All fields are required: client_id, month, year, amount, status' });
  }
  try {
    // Find or create invoice
    const [invoice, created] = await Invoice.findOrCreate({
      where: { client_id, month, year },
      defaults: { amount, status }
    });
    if (!created) {
      // Update existing invoice
      invoice.amount = amount;
      invoice.status = status;
      await invoice.save();
    }
    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Upsert invoice error:', err);
    res.status(500).json({ error: 'Erreur lors de la création/mise à jour de la facture' });
  }
};

exports.deleteInvoice = async (req, res) => {
  const { client_id, month, year } = req.query;
  if (!client_id || !month || !year) {
    return res.status(400).json({ error: 'client_id, month, and year are required' });
  }
  try {
    const deleted = await Invoice.destroy({ where: { client_id, month, year } });
    if (deleted === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la facture' });
  }
}; 