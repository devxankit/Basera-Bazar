const mongoose = require('mongoose');
const { PropertyListing, ServiceListing, SupplierListing, MandiListing } = require('./src/models/Listing');
require('dotenv').config();

async function debug() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const lat = 26.1209;
    const lng = 85.3647;
    const district = "Muzaffarpur";
    const state = "Bihar";
    const radiusKm = 300;

    const buildProximityPipeline = (lat, lng, userDistrict, userState, radiusKm = 300) => {
      return [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance",
            maxDistance: parseFloat(radiusKm) * 1000,
            query: { status: 'active' },
            spherical: true
          }
        },
        {
          $addFields: {
            priorityScore: {
              $cond: {
                if: { $eq: ["$address.district", userDistrict] },
                then: 2,
                else: {
                  $cond: {
                    if: { $eq: ["$address.state", userState] },
                    then: 1,
                    else: 0
                  }
                }
              }
            }
          }
        },
        {
          $sort: { priorityScore: -1, distance: 1 }
        }
      ];
    };

    console.log("Testing PropertyListing aggregation...");
    const pipeline = buildProximityPipeline(lat, lng, district, state, radiusKm);
    pipeline.push({ $limit: 10 });
    
    const results = await PropertyListing.aggregate(pipeline);
    console.log("Success! Found:", results.length);

  } catch (err) {
    console.error("Aggregation Failed!");
    console.error("Message:", err.message);
    console.error("Full Error:", err);
  } finally {
    await mongoose.connection.close();
  }
}

debug();
