/**
 * One-time migration: Populate 'roles' array and 'active_role' from legacy 'partner_type'.
 * 
 * Usage: node src/scripts/migratePartnerRoles.js
 * 
 * Safe to run multiple times — skips partners that already have roles populated.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Partner } = require('../models/Partner');

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all partners where roles array is empty or missing
    const partnersToMigrate = await Partner.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } }
      ],
      partner_type: { $exists: true, $ne: null }
    });

    console.log(`📦 Found ${partnersToMigrate.length} partners to migrate`);

    let migrated = 0;
    for (const partner of partnersToMigrate) {
      partner.roles = [partner.partner_type];
      partner.active_role = partner.partner_type;
      await partner.save();
      migrated++;
      console.log(`  ✓ ${partner.name} (${partner.phone}) → roles: [${partner.partner_type}]`);
    }

    console.log(`\n🎉 Migration complete. ${migrated} partners updated.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
