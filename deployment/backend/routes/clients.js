const express = require('express');
const router = express.Router();
const Client = require('../models/client');
const Residence = require('../models/residence');
const clientsController = require('../controllers/clients');

// Get all clients (with residence)
router.get('/', async (req, res) => {
  const clients = await Client.findAll({ include: { model: Residence } });
  res.json(clients);
});

// Get client by id (with residence)
router.get('/:id', async (req, res) => {
  const client = await Client.findByPk(req.params.id, { include: { model: Residence } });
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

// Get unpaid clients
router.get('/unpaid', async (req, res) => {
  const unpaidClients = await Client.findAll({
    where: { payment_status: 'Non Payé' },
    include: Residence
  });
  res.json(unpaidClients);
});

// Create client
router.post('/', async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  await client.update(req.body);
  res.json(client);
});

// Delete client
router.delete('/:id', async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  await client.destroy();
  res.json({ message: 'Deleted' });
});

// Bulk import clients
router.post('/bulk', clientsController.bulkInsertClients);

module.exports = router; 