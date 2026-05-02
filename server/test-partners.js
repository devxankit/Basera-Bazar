const mongoose = require('mongoose');
const { Partner } = require('./src/models/Partner');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://developer:Wq0L98e9uV8r6aGj@cluster0.z2g73.mongodb.net/baserabazar?retryWrites=true&w=majority")
  .then(async () => {
    const featured = await Partner.find({ is_featured: true });
    console.log("Featured partners:", featured.length);
    console.log(featured.map(p => ({ name: p.name, roles: p.roles, partner_type: p.partner_type })));
    process.exit(0);
  });
