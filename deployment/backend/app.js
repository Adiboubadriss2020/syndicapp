const express = require('express');
const sequelize = require('./config/db');
require('dotenv').config();
const cors = require('cors');

// Import models to ensure associations are set up
require('./models/residence');
require('./models/client');
require('./models/charge');
require('./models/invoice');
require('./models/notification');
require('./models/user');

// Import notification service
const notificationService = require('./services/notificationService');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5050;

// Test route
app.get('/', (req, res) => {
  res.send('Syndic backend is running!');
});

const residencesRouter = require('./routes/residences');
const clientsRouter = require('./routes/clients');
const chargesRouter = require('./routes/charges');
const invoicesRouter = require('./routes/invoices');
const dashboardRouter = require('./routes/dashboard');
const paymentsRouter = require('./routes/payments');
const notificationsRouter = require('./routes/notifications');
const authRouter = require('./routes/auth');

app.use('/api/residences', residencesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/charges', chargesRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);

// Serve static files from invoices folder
app.use('/invoices', require('express').static('invoices'));

// Sync database and start server
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
    
    // Start notification service
    notificationService.start();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to sync database:', err);
  }); 