const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Production configuration for Railway
  console.log('Using Railway MySQL configuration');
  console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'Set' : 'Not set');
  console.log('MYSQLHOST:', process.env.MYSQLHOST);
  console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
  
  if (process.env.MYSQL_URL) {
    // Use the complete connection URL if available
    sequelize = new Sequelize(process.env.MYSQL_URL, {
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  } else {
    // Use individual environment variables
    sequelize = new Sequelize(
      process.env.MYSQLDATABASE || 'syndicapp',
      process.env.MYSQLUSER || 'root',
      process.env.MYSQLPASSWORD || '',
      {
        host: process.env.MYSQLHOST || 'localhost',
        port: process.env.MYSQLPORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
} else {
  // Development configuration
  console.log('Using development MySQL configuration');
  sequelize = new Sequelize(
    'syndicapp',
    'root',
    'password',
    {
      host: '127.0.0.1',
      dialect: 'mysql',
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize; 