const Client = require('../models/client');
const Residence = require('../models/residence');

exports.bulkInsertClients = async (req, res) => {
  try {
    const { clients } = req.body;
    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à importer.' });
    }

    // Fetch all valid residence IDs
    const residences = await Residence.findAll({ attributes: ['id'] });
    const validResidenceIds = new Set(residences.map(r => r.id));

    // Validate each client
    const errors = [];
    const validClients = [];

    clients.forEach((c, idx) => {
      const rowErrors = [];
      if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
        rowErrors.push('Nom manquant');
      }
      if (!c.residence_id || !validResidenceIds.has(Number(c.residence_id))) {
        rowErrors.push('Résidence ID invalide');
      }
      if (typeof c.balance !== 'number' || isNaN(c.balance)) {
        rowErrors.push('Balance invalide');
      }
      if (!['Payé', 'Non Payé'].includes(c.payment_status)) {
        rowErrors.push('Statut de paiement invalide');
      }
      if (rowErrors.length) {
        errors.push({ row: idx + 2, errors: rowErrors }); // +2 for Excel row number (header + 1-based)
      } else {
        validClients.push({
          name: c.name.trim(),
          balance: c.balance || 0,
          payment_status: c.payment_status || 'Non Payé',
          residence_id: Number(c.residence_id),
        });
      }
    });

    if (errors.length) {
      return res.status(400).json({ error: 'Des erreurs ont été détectées.', details: errors });
    }

    await Client.bulkCreate(validClients, { validate: true, ignoreDuplicates: true });
    res.status(201).json({ message: 'Importation réussie.', imported: validClients.length });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'importation.' });
  }
}; 