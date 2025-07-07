const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Residence = require('./residence');

const Client = sequelize.define('Client', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0.00,
  },
  payment_status: {
    type: DataTypes.ENUM('Payé', 'Non Payé'),
    allowNull: false,
    defaultValue: 'Non Payé',
  },
});

Client.belongsTo(Residence, { foreignKey: 'residence_id' });
Residence.hasMany(Client, { foreignKey: 'residence_id' });

module.exports = Client; 