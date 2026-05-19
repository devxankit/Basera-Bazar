/**
 * backfillListingCoords.js
 * One-time script: finds ServiceListing and PropertyListing docs with [0,0] coordinates
 * and copies the owning partner's stored GPS coordinates into them.
 * Also strips " District"/" Zila" suffixes from address.district for consistency.
 *
 * Run: node src/scripts/backfillListingCoords.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const normalizeDistrict = (s) =>
  s ? s.trim().replace(/\s*(district|zila|jila|जिला)\s*$/i, '').trim() : s;

const run = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) { console.error('❌ MONGO_URI not found'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = ['servicelistings', 'propertylistings'];

  for (const colName of collections) {
    const col = db.collection(colName);
    const zeroCoords = await col
      .find({ 'location.coordinates': [0, 0] })
      .toArray();

    console.log(`\n📦 ${colName}: ${zeroCoords.length} listings with [0,0] coordinates`);
    if (zeroCoords.length === 0) continue;

    let fixed = 0;
    let skipped = 0;

    for (const listing of zeroCoords) {
      const partnerId = listing.partner_id;
      if (!partnerId) { skipped++; continue; }

      const partner = await db.collection('partners').findOne(
        { _id: partnerId },
        { projection: { location: 1 } }
      );

      const coords = partner?.location?.coordinates;
      if (!coords || (coords[0] === 0 && coords[1] === 0)) { skipped++; continue; }

      const updateOps = {
        $set: { 'location.coordinates': coords }
      };

      // Also normalize district suffix if present
      const rawDistrict = listing.address?.district;
      if (rawDistrict) {
        const norm = normalizeDistrict(rawDistrict);
        if (norm !== rawDistrict) updateOps.$set['address.district'] = norm;
      }

      await col.updateOne({ _id: listing._id }, updateOps);
      fixed++;
    }

    console.log(`   ✅ Fixed: ${fixed}  ⏭️  Skipped (no partner coords): ${skipped}`);
  }

  // Also normalize district names in existing listings that already have valid coords
  for (const colName of collections) {
    const col = db.collection(colName);
    const withDistrict = await col
      .find({ 'address.district': { $regex: /\s*(district|zila|jila)\s*$/i } })
      .toArray();

    if (withDistrict.length === 0) continue;
    console.log(`\n🏷️  ${colName}: normalizing district suffix in ${withDistrict.length} docs`);

    for (const listing of withDistrict) {
      const norm = normalizeDistrict(listing.address.district);
      if (norm !== listing.address.district) {
        await col.updateOne({ _id: listing._id }, { $set: { 'address.district': norm } });
      }
    }
    console.log(`   ✅ Done`);
  }

  console.log('\n✅ Backfill complete. Restart your server.\n');
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
