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

    const email = process.env.ADMIN_EMAIL || 'superadmin@gmail.com';
    const password = process.env.ADMIN_PASSWORD || process.argv[2];
    if (!password) {
      console.error('❌ Provide a password via ADMIN_PASSWORD env var or as the first CLI argument.');
      process.exit(1);
    }

    // Remove existing if any
    await AdminUser.deleteMany({ email });
    console.log(`🧹 Cleared existing admin: ${email}`);

    // Create new
    await AdminUser.create({
      name: 'Super Admin',
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
