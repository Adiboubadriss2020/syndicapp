const Residence = require('../models/residence');

exports.bulkInsertResidences = async (req, res) => {
  try {
    const { residences } = req.body;
    console.log('Received residences data:', residences);
    
    if (!Array.isArray(residences) || residences.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à importer.' });
    }

    // Validate each residence
    const errors = [];
    const validResidences = [];

    residences.forEach((r, idx) => {
      console.log(`Validating row ${idx + 1}:`, r);
      const rowErrors = [];
      if (!r.name || typeof r.name !== 'string' || !r.name.trim()) {
        rowErrors.push('Nom manquant');
      }
      if (!r.address || typeof r.address !== 'string' || !r.address.trim()) {
        rowErrors.push('Adresse manquante');
      }
      if (typeof r.num_apartments !== 'number' || isNaN(r.num_apartments) || r.num_apartments <= 0) {
        rowErrors.push('Nombre d\'appartements invalide');
      }
      if (!r.contact || typeof r.contact !== 'string' || !r.contact.trim()) {
        rowErrors.push('Contact manquant');
      }
      console.log(`Row ${idx + 1} errors:`, rowErrors);
      if (rowErrors.length) {
        errors.push({ row: idx + 2, errors: rowErrors });
      } else {
        validResidences.push({
          name: r.name.trim(),
          address: r.address.trim(),
          num_apartments: r.num_apartments,
          contact: r.contact.trim(),
        });
      }
    });

    console.log('Validation errors:', errors);
    console.log('Valid residences:', validResidences);

    if (errors.length) {
      return res.status(400).json({ error: 'Des erreurs ont été détectées.', details: errors });
    }

    await Residence.bulkCreate(validResidences, { validate: true, ignoreDuplicates: true });
    res.status(201).json({ message: 'Importation réussie.', imported: validResidences.length });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'importation.' });
  }
}; 