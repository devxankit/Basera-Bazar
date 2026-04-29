const express = require('express');
const cors = require('cors');
// Metadata: v1.0.1 - Added role deletion support
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const connectDB = require('./config/db');

// Connect to Database
connectDB();

// -----------------------------------------------------
// IMPORT ROUTES
// -----------------------------------------------------
const authRoutes = require('./routes/authRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const listingRoutes = require('./routes/listingRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const financeRoutes = require('./routes/financeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mandiRoutes = require('./routes/mandiRoutes');
const orderRoutes = require('./routes/orderRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminMarketplaceRoutes = require('./routes/adminMarketplaceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pushRoutes = require('./routes/pushRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');

// -----------------------------------------------------
// MOUNT ROUTES
// -----------------------------------------------------
// This means any request starting with /api/auth goes to the authRoutes.js file!
app.use('/api/auth', authRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', enquiryRoutes); // Because enquiryRoutes handles both /api/enquiries and /api/users/enquiries
app.use('/api/admin', adminRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/push', pushRoutes);

// Marketplace/Mandi Bazar Routes
app.use('/api/mandi', mandiRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/admin/marketplace', adminMarketplaceRoutes);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'BaseraBazar API is running',
    version: '1.0.0',
    modules: ['Users', 'Partners', 'Listings', 'Subscriptions', 'Leads', 'Banners']
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 BaseraBazar Backend running on port ${PORT}`);
});

// Handle server errors (like EADDRINUSE)
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please clear it and restart.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
