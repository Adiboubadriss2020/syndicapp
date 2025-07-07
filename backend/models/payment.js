const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Client = require('./client');

const Payment = sequelize.define('Payment', {
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Clients', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  month: {
    type: DataTypes.STRING, // e.g. '2024-06'
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Payé', 'Non Payé'),
    defaultValue: 'Non Payé',
  },
});

Payment.belongsTo(Client, { foreignKey: 'client_id' });
Client.hasMany(Payment, { foreignKey: 'client_id' });

module.exports = Payment; 