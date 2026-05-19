/**
 * resetAdmin.js
 * Consolidates all admin-role accounts into one clean super_admin in AdminUser collection.
 * Searches users + partners + adminusers, copies the hash, purges all, creates one fresh doc.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { AdminUser } = require('../models/Admin');

dotenv.config({ path: '.env' });

const resetAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) { console.error('❌ MONGO_URI not found in .env'); process.exit(1); }

    await mongoose.connect(mongoUri);
    console.log('🚀 Connected to MongoDB');

    const db = mongoose.connection.db;
    const ADMIN_ROLES = ['admin', 'Admin', 'superadmin', 'super_admin', 'SuperAdmin'];

    // 1. Find the best existing admin doc to copy credentials from
    let source =
      await db.collection('adminusers').findOne({ role: { $in: ADMIN_ROLES } }) ||
      await db.collection('users').findOne({ role: { $in: ADMIN_ROLES } }) ||
      await db.collection('partners').findOne({ role: { $in: ADMIN_ROLES } });

    if (!source) {
      console.error('❌ No admin-role account found anywhere. Cannot copy credentials.');
      process.exit(1);
    }

    const savedHash  = source.password;
    const savedName  = source.name  || 'Super Admin';
    const savedEmail = source.email || 'superadmin@gmail.com';
    const savedPhone = source.phone || '0000000000';

    console.log(`🔑 Copying credentials from: ${savedEmail} (source: ${source.role})`);

    // 2. Purge all admin-role docs from every collection
    const [a, u, p] = await Promise.all([
      db.collection('adminusers').deleteMany({ role: { $in: ADMIN_ROLES } }),
      db.collection('users').deleteMany({ role: { $in: ADMIN_ROLES } }),
      db.collection('partners').deleteMany({ role: { $in: ADMIN_ROLES } }),
    ]);
    console.log(`🗑️  Deleted — adminusers: ${a.deletedCount}, users: ${u.deletedCount}, partners: ${p.deletedCount}`);

    // 3. Insert ONE clean super_admin into the adminusers collection.
    //    Insert directly to bypass the bcrypt pre-save hook (hash already done).
    const now = new Date();
    await db.collection('adminusers').insertOne({
      name: savedName,
      email: savedEmail,
      phone: savedPhone,
      password: savedHash,
      role: 'super_admin',
      status: 'Active',
      is_active: true,
      permissions: [],
      profileImage: '',
      token_version: 0,
      fcmTokens: [],
      fcmTokenMobile: [],
      createdAt: now,
      updatedAt: now,
    });

    console.log('✅ Fresh Super Admin created in adminusers collection!');
    console.log(`   📧 Email : ${savedEmail}`);
    console.log(`   📱 Phone : ${savedPhone}`);
    console.log('   🔒 Password: unchanged (hash copied)');
    console.log('\n⚠️  Restart your server so it picks up the new admin document.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

resetAdmin();
