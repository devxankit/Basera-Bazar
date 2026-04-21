const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

const CategorySchema = new mongoose.Schema({ name: String, type: String, is_active: Boolean });
const Category = mongoose.model('Category', CategorySchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cats = await Category.find({ is_active: true });
  console.log('--- ALL ACTIVE CATEGORIES ---');
  cats.forEach(c => console.log(`- [${c.type}] ${c.name} (${c._id})`));
  process.exit(0);
}

check();
