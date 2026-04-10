const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { AdminUser } = require('../models/Admin');

dotenv.config({ path: '.env' });

const resetAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI or MONGODB_URI not found in .env');
      console.log('Current directory:', process.cwd());
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('🚀 Connected to MongoDB');

    const email = 'ujjawalmahawar2002@gmail.com';
    const password = 'password123'; // Default reset password

    // Remove existing if any
    await AdminUser.deleteMany({ email });
    console.log(`🧹 Cleared existing admin: ${email}`);

    // Create new
    await AdminUser.create({
      name: 'Ujjawal Mahawar',
      email,
      password,
      role: 'super_admin',
      status: 'Active'
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

resetAdmin();
