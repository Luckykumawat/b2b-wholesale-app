const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Route for test
app.get('/', (req, res) => {
  res.send('B2B Wholesale API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const quotationRoutes = require('./routes/quotations');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const catalogRoutes = require('./routes/catalogs');
const cataloguesRoutes = require('./routes/catalogues');
const activityRoutes = require('./routes/activity');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalogs/shared', catalogRoutes);
app.use('/api/catalogues', cataloguesRoutes);
app.use('/api/activity', activityRoutes);

// Configure static path for local image uploads
app.use('/uploads', express.static('uploads'));

module.exports = app;
