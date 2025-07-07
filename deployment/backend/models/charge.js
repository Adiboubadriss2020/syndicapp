const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Residence = require('./residence');

const Charge = sequelize.define('Charge', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
});

Charge.belongsTo(Residence, { foreignKey: 'residence_id', allowNull: true });
Residence.hasMany(Charge, { foreignKey: 'residence_id' });

module.exports = Charge; 