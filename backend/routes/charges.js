const express = require('express');
const router = express.Router();
const Charge = require('../models/charge');
const Residence = require('../models/residence');
const chargesController = require('../controllers/charges');

// Get all charges (with residence)
router.get('/', async (req, res) => {
  const charges = await Charge.findAll({ include: { model: Residence } });
  res.json(charges);
});

// Get charge by id (with residence)
router.get('/:id', async (req, res) => {
  const charge = await Charge.findByPk(req.params.id, { include: { model: Residence } });
  if (!charge) return res.status(404).json({ error: 'Not found' });
  res.json(charge);
});

// Create charge
router.post('/', async (req, res) => {
  try {
    const charge = await Charge.create(req.body);
    res.status(201).json(charge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update charge
router.put('/:id', async (req, res) => {
  const charge = await Charge.findByPk(req.params.id);
  if (!charge) return res.status(404).json({ error: 'Not found' });
  await charge.update(req.body);
  res.json(charge);
});

// Delete charge
router.delete('/:id', async (req, res) => {
  const charge = await Charge.findByPk(req.params.id);
  if (!charge) return res.status(404).json({ error: 'Not found' });
  await charge.destroy();
  res.json({ message: 'Deleted' });
});

// Bulk import charges
router.post('/bulk', chargesController.bulkInsertCharges);

module.exports = router; 