const Payment = require('../models/payment');
const Client = require('../models/client');

// Create or update a payment for a client/month
exports.upsertPayment = async (req, res) => {
  try {
    const { client_id, amount, month, status } = req.body;
    if (!client_id || !amount || !month) {
      return res.status(400).json({ error: 'client_id, amount, and month are required.' });
    }
    const [payment, created] = await Payment.findOrCreate({
      where: { client_id, month },
      defaults: { amount, status: status || 'Non Payé' },
    });
    if (!created) {
      payment.amount = amount;
      if (status) payment.status = status;
      await payment.save();
    }
    res.status(201).json(payment);
  } catch (err) {
    console.error('Upsert payment error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du paiement.' });
  }
};

// Get all payments for a given month
exports.getPaymentsByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month is required.' });
    const payments = await Payment.findAll({ where: { month }, include: Client });
    res.json(payments);
  } catch (err) {
    console.error('Get payments by month error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des paiements.' });
  }
};

// Get payment history for a client
exports.getPaymentsByClient = async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id is required.' });
    const payments = await Payment.findAll({ where: { client_id }, order: [['month', 'DESC']] });
    res.json(payments);
  } catch (err) {
    console.error('Get payments by client error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
  }
};

// (Stub) Export PDF invoice for a client/month
exports.exportInvoice = async (req, res) => {
  // TODO: Implement PDF export
  res.status(501).json({ error: 'PDF export not implemented yet.' });
}; 