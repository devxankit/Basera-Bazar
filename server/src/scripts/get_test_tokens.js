const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { User } = require('../models/User');
const { Partner } = require('../models/Partner');
const { AdminUser } = require('../models/Admin');
const Executive = require('../models/Executive');

async function getTokens() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('🚀 Connected to MongoDB');

    // 1. Find a user with FCM tokens
    let user = await User.findOne({ 
      $or: [
        { fcmTokens: { $exists: true, $not: { $size: 0 } } },
        { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
      ]
    });
    let role = 'user';

    if (!user) {
      user = await Partner.findOne({ 
        $or: [
          { fcmTokens: { $exists: true, $not: { $size: 0 } } },
          { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
        ]
      });
      role = 'partner';
    }

    if (!user) {
      user = await Executive.findOne({ 
        $or: [
          { fcmTokens: { $exists: true, $not: { $size: 0 } } },
          { fcmTokenMobile: { $exists: true, $not: { $size: 0 } } }
        ]
      });
      role = 'executive';
    }

    if (!user) {
      // Fallback: just get any user or create a fake one?
      // Let's just try to find any admin first
      user = await AdminUser.findOne();
      role = 'super_admin';
    }

    if (!user) {
        console.log('❌ No user found in database to generate token for.');
        process.exit(0);
    }

    // 2. Generate Auth Token
    const token = jwt.sign(
      { id: user._id, role: role, email: user.email, version: user.token_version || 0 },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 3. Output
    const fcmToken = (user.fcmTokens && user.fcmTokens[0]) || (user.fcmTokenMobile && user.fcmTokenMobile[0]) || "NO_FCM_TOKEN_IN_DB";

    console.log('\n--- TEST TOKENS ---');
    console.log(`User: ${user.name} (${user.email || user.phone})`);
    console.log(`Role: ${role}`);
    console.log(`\nAUTH_TOKEN: \n${token}`);
    console.log(`\nFCM_TOKEN (from DB): \n${fcmToken}`);
    console.log('-------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getTokens();
