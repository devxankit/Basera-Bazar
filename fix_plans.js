const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

// Define Models inline to avoid path issues
const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  applicable_to: { type: [String], enum: ['service_provider', 'property_agent', 'supplier', 'mandi_seller'] },
  duration_days: { type: Number, required: true },
  price: { type: Number, required: true },
  listings_limit: { type: Number, default: 0 },
  featured_listings_limit: { type: Number, default: 0 },
  leads_limit: { type: Number, default: 0 },
  features: [String],
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) throw new Error("MONGODB_URI not found in env");
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const plans = [
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
    await SubscriptionPlan.insertMany(plans);
    console.log("Successfully seeded subscription plans with mandi_seller support!");
    
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
