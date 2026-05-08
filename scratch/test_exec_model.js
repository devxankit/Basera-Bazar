const mongoose = require('mongoose');
const Executive = require('./server/src/models/Executive');
require('dotenv').config({ path: './server/.env' });

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');
    
    // Test creating an executive
    const testExec = new Executive({
      name: 'Test',
      phone: '1234567890',
      email: 'test@test.com',
      password: 'password'
    });
    
    await testExec.validate();
    console.log('Validation passed');
    
    // We won't actually save to avoid polluting DB, but we can check hooks
    console.log('Test passed');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
