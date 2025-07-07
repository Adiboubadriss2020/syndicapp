const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Residence = sequelize.define('Residence', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  num_apartments: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Residence; 