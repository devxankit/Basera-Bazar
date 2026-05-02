const mongoose = require('mongoose');
const Category = mongoose.model('Category', new mongoose.Schema({ name: String, type: String }));
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/baserabazar');
  const catId = '69de251bf2a1df88cb7d3b11';
  try {
    const cat = await Category.findById(catId);
    if (cat) {
      console.log(`Category found: ${cat.name} (Type: ${cat.type})`);
    } else {
      console.log(`Category with ID ${catId} not found.`);
    }
  } catch (e) {
    console.error("Error finding category:", e.message);
  }
  process.exit();
}

check();
