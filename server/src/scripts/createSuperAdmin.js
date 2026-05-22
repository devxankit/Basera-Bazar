const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const run = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) { console.error('❌ MONGO_URI not set in .env'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const col = db.collection('adminusers');

  const email = 'superadmin@gmail.com';
  const existing = await col.findOne({ email });
  if (existing) {
    console.log('⚠️  Admin already exists with this email — removing and recreating...');
    await col.deleteOne({ email });
  }

  const hash = await bcrypt.hash('password123', 10);
  const now = new Date();

  await col.insertOne({
    name: 'Super Admin',
    email,
    phone: '0000000000',
    password: hash,
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

  console.log('🎉 Super Admin created successfully!');
  console.log('   📧 Email    : superadmin@gmail.com');
  console.log('   🔒 Password : password123');
  console.log('   👤 Role     : super_admin');
  process.exit(0);
};

run().catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });
