const User = require('../models/user');
const sequelize = require('../config/db');
require('dotenv').config();

async function checkAdmin() {
  try {
    await sequelize.sync();

    // Find admin user
    const admin = await User.findOne({
      where: { role: 'admin' }
    });

    if (admin) {
      console.log('Admin user found:');
      console.log('Username:', admin.username);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Permissions:', JSON.stringify(admin.permissions, null, 2));
    } else {
      console.log('No admin user found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking admin:', error);
    process.exit(1);
  }
}

checkAdmin(); 