const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Client = require('./client');

const Invoice = sequelize.define('Invoice', {
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  pdf_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Payé', 'Non Payé'),
    allowNull: false,
    defaultValue: 'Non Payé',
  },
});

Invoice.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Invoice, { foreignKey: 'client_id' });

module.exports = Invoice; 