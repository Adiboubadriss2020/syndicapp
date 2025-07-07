const express = require('express');
const router = express.Router();
const Residence = require('../models/residence');
const residencesController = require('../controllers/residences');

// Get all residences
router.get('/', async (req, res) => {
  const residences = await Residence.findAll();
  res.json(residences);
});

// Get residence by id
router.get('/:id', async (req, res) => {
  const residence = await Residence.findByPk(req.params.id);
  if (!residence) return res.status(404).json({ error: 'Not found' });
  res.json(residence);
});

// Create residence
router.post('/', async (req, res) => {
  try {
    const residence = await Residence.create(req.body);
    res.status(201).json(residence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bulk import residences
router.post('/bulk', residencesController.bulkInsertResidences);

// Update residence
router.put('/:id', async (req, res) => {
  const residence = await Residence.findByPk(req.params.id);
  if (!residence) return res.status(404).json({ error: 'Not found' });
  await residence.update(req.body);
  res.json(residence);
});

// Delete residence
router.delete('/:id', async (req, res) => {
  const residence = await Residence.findByPk(req.params.id);
  if (!residence) return res.status(404).json({ error: 'Not found' });
  await residence.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router; 