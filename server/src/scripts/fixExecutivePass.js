const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Executive = require('../models/Executive');
const connectDB = require('../config/db');

const resetExecutivePassword = async (phone, newPassword) => {
  try {
    await connectDB();
    
    // Normalize phone
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);
    
    console.log(`Searching for executive with phone: ${normalizedPhone}`);
    const executive = await Executive.findOne({ phone: normalizedPhone });
    
    if (!executive) {
      console.error('Executive not found!');
      process.exit(1);
    }

    console.log(`Found executive: ${executive.name}. Resetting password...`);
    
    // We set the password directly and let the pre-save hook handle it correctly now
    executive.password = newPassword;
    await executive.save();
    
    console.log('✅ Password reset successfully!');
    console.log(`You can now login with:
Phone: ${normalizedPhone}
Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
};

const phone = process.argv[2] || '8769959424';
const password = process.argv[3] || 'password123';

resetExecutivePassword(phone, password);
