const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments');

// Upsert payment (create or update)
router.post('/', paymentsController.upsertPayment);

// Get all payments for a given month
router.get('/month', paymentsController.getPaymentsByMonth);

// Get payment history for a client
router.get('/client', paymentsController.getPaymentsByClient);

// Export PDF invoice (stub)
router.get('/invoice', paymentsController.exportInvoice);

module.exports = router; 