const mongoose = require('mongoose');
const { PropertyListing } = require('./src/models/Listing');
const User = mongoose.model('User', new mongoose.Schema({ phone: String, role: String })); 

mongoose.connect('mongodb+srv://admin:admin123@baserabazar.mcz2j.mongodb.net/baserabazar?retryWrites=true&w=majority')
  .then(async () => {
    try {
       const user = await User.findOne({ phone: '8770620342' });
       if (!user) {
         console.log("User Palak not found with phone 8770620342");
       } else {
         console.log("Palak ID:", user._id);
         const properties = await PropertyListing.find({ partner_id: user._id });
         console.log("Properties count for Palak ID:", properties.length);
         if (properties.length > 0) {
            console.log("First property title:", properties[0].title);
            console.log("First property status:", properties[0].status);
         }
       }
    } catch(e) { console.log(e); }
    process.exit(0);
  });
