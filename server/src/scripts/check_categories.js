const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    const Category = mongoose.model('Category', new mongoose.Schema({
      name: String,
      type: String
    }, { collection: 'categories' }));

    const categories = await Category.find({ type: 'service' });
    console.log('Service Categories:', JSON.stringify(categories.map(c => ({ id: c._id, name: c.name })), null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

connectDB();
