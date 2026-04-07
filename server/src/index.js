const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import schemas for documentation/future DB implementation
const models = require('./schemas/models');

app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'BaseraBazar API is running',
    version: '1.0.0',
    modules: ['Users', 'Partners', 'Listings', 'Subscriptions', 'Leads', 'Banners']
  });
});

// INITIAL MOCK AUTH ENDPOINT (As requested: use JWT for verification)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // MOCK AUTH LOGIC
  const mockUser = {
    id: 'user_1',
    name: 'Test user',
    email: email,
    role: 'user'
  };

  const token = jwt.sign(mockUser, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });
  
  res.json({
    success: true,
    token,
    user: mockUser
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BaseraBazar Backend running on port ${PORT}`);
});
