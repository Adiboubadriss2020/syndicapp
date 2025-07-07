const Charge = require('../models/charge');
const Residence = require('../models/residence');

exports.bulkInsertCharges = async (req, res) => {
  try {
    const { charges } = req.body;
    if (!Array.isArray(charges) || charges.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à importer.' });
    }

    // Fetch all valid residence IDs
    const residences = await Residence.findAll({ attributes: ['id'] });
    const validResidenceIds = new Set(residences.map(r => r.id));

    // Validate each charge
    const errors = [];
    const validCharges = [];

    charges.forEach((c, idx) => {
      const rowErrors = [];
      if (!c.description || typeof c.description !== 'string' || !c.description.trim()) {
        rowErrors.push('Description manquante');
      }
      if (!c.residence_id || !validResidenceIds.has(Number(c.residence_id))) {
        rowErrors.push('Résidence ID invalide');
      }
      if (typeof c.amount !== 'number' || isNaN(c.amount) || c.amount <= 0) {
        rowErrors.push('Montant invalide');
      }
      if (!c.date || !c.date.trim()) {
        rowErrors.push('Date manquante');
      }
      if (rowErrors.length) {
        errors.push({ row: idx + 2, errors: rowErrors });
      } else {
        validCharges.push({
          description: c.description.trim(),
          amount: c.amount,
          residence_id: Number(c.residence_id),
          date: c.date,
        });
      }
    });

    if (errors.length) {
      return res.status(400).json({ error: 'Des erreurs ont été détectées.', details: errors });
    }

    await Charge.bulkCreate(validCharges, { validate: true, ignoreDuplicates: true });
    res.status(201).json({ message: 'Importation réussie.', imported: validCharges.length });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'importation.' });
  }
}; 