const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { AdminUser } = require('../models/Admin');

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const bcrypt = require('bcryptjs');
    const admins = await AdminUser.find({});
    console.log('--- Current Admins ---');
    for (const a of admins) {
      const isMatch = a.password ? await bcrypt.compare('password123', a.password) : false;
      console.log(`- Name: ${a.name}, Email: ${a.email}, Role: ${a.role}, HasPassword: ${!!a.password}, PassMatches_password123: ${isMatch}, ProfileImage: ${a.profileImage || 'None'}`);
      if (a.password && !isMatch) {
        console.log(`  [INFO] Stored Password Hash: ${a.password}`);
      }
    }
    console.log('----------------------');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAdmins();
