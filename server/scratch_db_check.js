const mongoose = require('mongoose');
const { PropertyListing } = require('./src/models/Listing');

mongoose.connect('mongodb+srv://admin:admin123@baserabazar.mcz2j.mongodb.net/baserabazar?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
       const counts = await PropertyListing.countDocuments();
       console.log("Total properties in DB:", counts);
       const latest = await PropertyListing.find().sort({createdAt: -1}).limit(3);
       console.log("Latest properties:", JSON.stringify(latest, null, 2));
    } catch(e) {
       console.log(e);
    }
    process.exit(0);
  });
