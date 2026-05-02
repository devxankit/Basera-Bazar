const mongoose = require('mongoose');
const { Partner } = require('./src/models/Partner');

mongoose.connect("mongodb+srv://ujjawal:ujjawal2002@cluster0.jmyqtq6.mongodb.net/baserabazar?retryWrites=true&w=majority&appName=Cluster0")
  .then(async () => {
    const featured = await Partner.find({ is_featured: true });
    console.log("Featured partners:", featured.length);
    console.log(featured.map(p => ({ name: p.name, roles: p.roles, partner_type: p.partner_type })));
    process.exit(0);
  });
