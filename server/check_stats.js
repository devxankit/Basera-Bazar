const mongoose = require('mongoose');
const { ServiceListing, PropertyListing, MandiListing } = require('./src/models/Listing');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://developer:a50xN8w3yPof26T4@cluster0.mongodb.net/baserabazar?retryWrites=true&w=majority')
  .then(async () => {
    const id = '69f04ff1f5d2ada58c2b3893';
    let listing = await ServiceListing.findById(id);
    if (!listing) listing = await PropertyListing.findById(id);
    if (!listing) listing = await MandiListing.findById(id);
    
    console.log("Listing Stats:", listing?.stats);
    process.exit(0);
  })
  .catch(console.error);
