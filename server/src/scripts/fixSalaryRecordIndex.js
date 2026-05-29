/**
 * fixSalaryRecordIndex.js  (bug #338)
 *
 * The salaryrecords collection has a legacy unique index `executive_id_1_month_1`
 * built with { sparse: true }. Sparse does NOT exclude documents where
 * executive_id is explicitly `null` in a COMPOUND index (because `month` is
 * present), so processing more than one non-executive staff member (team leader /
 * office staff — executive_id = null) in the same month throws E11000 and the
 * monthly-salary endpoint returns a 500.
 *
 * The model now defines this index with a partialFilterExpression so it only
 * applies to real executives. Mongoose will NOT drop the old index automatically,
 * so run this one-off migration against each environment:
 *
 *     node src/scripts/fixSalaryRecordIndex.js
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
// Load the server's .env regardless of the current working directory
// (so it works whether run from repo root or server/).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) { console.error('❌ MONGO_URI not found in .env'); process.exit(1); }
    await mongoose.connect(mongoUri);
    console.log('🚀 Connected to MongoDB');

    const coll = mongoose.connection.db.collection('salaryrecords');
    const indexes = await coll.indexes();
    const legacy = indexes.find(i => i.name === 'executive_id_1_month_1');

    if (legacy && !legacy.partialFilterExpression) {
      await coll.dropIndex('executive_id_1_month_1');
      console.log('🗑️  Dropped stale sparse index executive_id_1_month_1');
    } else if (legacy) {
      console.log('ℹ️  Index already partial — nothing to drop.');
    } else {
      console.log('ℹ️  No legacy index found.');
    }

    // Recreate with the correct partial filter (matches the model definition)
    await coll.createIndex(
      { executive_id: 1, month: 1 },
      { unique: true, partialFilterExpression: { executive_id: { $type: 'objectId' } }, name: 'executive_id_1_month_1' }
    );
    console.log('✅ Created partial unique index executive_id_1_month_1');

    await mongoose.disconnect();
    console.log('✅ Done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
