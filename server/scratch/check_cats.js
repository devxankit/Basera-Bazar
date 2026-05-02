const mongoose = require('mongoose');
const path = require('path');
const { Category } = require('../src/models/System');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkCategories() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Using URI:', uri ? (uri.substring(0, 20) + '...') : 'undefined');
    
    if (!uri) throw new Error('MONGO_URI or MONGODB_URI not found in env');
    
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    const cats = await Category.find({});
    console.log(`Found ${cats.length} categories`);
    
    const types = [...new Set(cats.map(c => c.type))];
    console.log('Unique category types:', types);
    
    const mandiCats = cats.filter(c => c.type === 'product' || c.type === 'material' || c.type === 'mandi_product');
    console.log('Mandi-related categories:', mandiCats.map(c => ({ name: c.name, type: c.type, parent: c.parent_id })));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkCategories();
