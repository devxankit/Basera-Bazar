const mongoose = require('mongoose');
require('dotenv').config();
const { SubscriptionPlan } = require('../models/Finance');

async function seedPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const plansData = [
      {
        name: 'Free Trial',
        applicable_to: ['service_provider', 'property_agent', 'supplier', 'mandi_seller'],
        duration_days: 30,
        price: 0,
        listings_limit: 1,
        featured_listings_limit: 1,
        leads_limit: 50,
        features: ['30 days Account Validity', '1 Listings', '1 Featured Listing', '50 leads'],
        is_active: true
      },
      {
        name: 'Gold Package',
        applicable_to: ['service_provider', 'property_agent', 'supplier', 'mandi_seller'],
        duration_days: 365,
        price: 9999,
        listings_limit: 100,
        featured_listings_limit: 20,
        leads_limit: -1,
        features: ['1 Year Validity', '100 Listings', '20 Featured Listing', 'Unlimited leads', 'Priority Support'],
        is_active: true
      }
    ];

    await SubscriptionPlan.deleteMany({});
    const createdPlans = await SubscriptionPlan.insertMany(plansData);
    console.log(`Created ${createdPlans.length} plans`);

    console.log("Plan Seeding Completed Successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seedPlans();
