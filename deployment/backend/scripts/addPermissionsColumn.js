const sequelize = require('../config/db');
require('dotenv').config();

async function addPermissionsColumn() {
  try {
    // Add permissions column to users table without default value
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN permissions JSON
    `);

    // Set default permissions for regular users
    await sequelize.query(`
      UPDATE users 
      SET permissions = '{
        "canViewDashboard": true,
        "canViewResidences": true,
        "canViewClients": true,
        "canViewCharges": true,
        "canViewUsers": false,
        "canCreateResidences": false,
        "canEditResidences": false,
        "canDeleteResidences": false,
        "canExportResidences": false,
        "canCreateClients": false,
        "canEditClients": false,
        "canDeleteClients": false,
        "canExportClients": false,
        "canCreateCharges": false,
        "canEditCharges": false,
        "canDeleteCharges": false,
        "canExportCharges": false,
        "canCreateUsers": false,
        "canEditUsers": false,
        "canDeleteUsers": false,
        "canCreateNotifications": false,
        "canViewNotifications": true,
        "canViewFinancialData": false,
        "canExportData": false,
        "canManageSettings": false
      }'
      WHERE role = 'user' OR role IS NULL
    `);

    // Update existing admin users with full permissions
    await sequelize.query(`
      UPDATE users 
      SET permissions = '{
        "canViewDashboard": true,
        "canViewResidences": true,
        "canViewClients": true,
        "canViewCharges": true,
        "canViewUsers": true,
        "canCreateResidences": true,
        "canEditResidences": true,
        "canDeleteResidences": true,
        "canExportResidences": true,
        "canCreateClients": true,
        "canEditClients": true,
        "canDeleteClients": true,
        "canExportClients": true,
        "canCreateCharges": true,
        "canEditCharges": true,
        "canDeleteCharges": true,
        "canExportCharges": true,
        "canCreateUsers": true,
        "canEditUsers": true,
        "canDeleteUsers": true,
        "canCreateNotifications": true,
        "canViewNotifications": true,
        "canViewFinancialData": true,
        "canExportData": true,
        "canManageSettings": true
      }'
      WHERE role = 'admin'
    `);

    console.log('✅ Permissions column added successfully!');
    console.log('✅ Existing users updated with appropriate permissions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding permissions column:', error);
    process.exit(1);
  }
}

addPermissionsColumn(); 