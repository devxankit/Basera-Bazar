require('dotenv').config();
const mongoose = require('mongoose');
const { Category } = require('../models/System');

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const cats = await Category.find({});
    console.log('All Categories:', cats.map(c => ({ id: c._id, name: c.name, slug: c.slug, type: c.type })));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCategories();
