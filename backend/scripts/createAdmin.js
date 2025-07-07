const User = require('../models/user');
const sequelize = require('../config/db');
require('dotenv').config();

async function createAdminUser() {
  try {
    await sequelize.sync();

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user with full permissions
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@syndicapp.com',
      password: 'admin123', // Change this in production!
      role: 'admin',
      isActive: true,
      permissions: {
        canViewDashboard: true,
        canViewResidences: true,
        canViewClients: true,
        canViewCharges: true,
        canViewUsers: true,
        
        canCreateResidences: true,
        canEditResidences: true,
        canDeleteResidences: true,
        canExportResidences: true,
        
        canCreateClients: true,
        canEditClients: true,
        canDeleteClients: true,
        canExportClients: true,
        
        canCreateCharges: true,
        canEditCharges: true,
        canDeleteCharges: true,
        canExportCharges: true,
        
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        
        canCreateNotifications: true,
        canViewNotifications: true,
        
        canViewFinancialData: true,
        canExportData: true,
        canManageSettings: true
      }
    });

    console.log('Admin user created successfully:');
    console.log('Username:', adminUser.username);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Permissions: Full admin access');
    console.log('\n⚠️  IMPORTANT: Change the default password in production!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser(); 