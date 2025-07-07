const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user',
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      // Navigation permissions
      canViewDashboard: true,
      canViewResidences: true,
      canViewClients: true,
      canViewCharges: true,
      canViewUsers: false,
      
      // Action permissions
      canCreateResidences: false,
      canEditResidences: false,
      canDeleteResidences: false,
      canExportResidences: false,
      
      canCreateClients: false,
      canEditClients: false,
      canDeleteClients: false,
      canExportClients: false,
      
      canCreateCharges: false,
      canEditCharges: false,
      canDeleteCharges: false,
      canExportCharges: false,
      
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      
      canCreateNotifications: false,
      canViewNotifications: true,
      
      // Dashboard visibility permissions
      canViewDashboardCharges: true,
      canViewDashboardRevenues: true,
      canViewDashboardBalance: true,
      
      // Special permissions
      canViewFinancialData: false,
      canExportData: false,
      canManageSettings: false
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // Set admin permissions if role is admin
      if (user.role === 'admin') {
        user.permissions = {
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
          
          // Dashboard visibility permissions
          canViewDashboardCharges: true,
          canViewDashboardRevenues: true,
          canViewDashboardBalance: true,
          
          canViewFinancialData: true,
          canExportData: true,
          canManageSettings: true
        };
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

// Instance method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if user has permission
User.prototype.hasPermission = function(permission) {
  return this.permissions && this.permissions[permission] === true;
};

// Instance method to get user data without password
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User; 