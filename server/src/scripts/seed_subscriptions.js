const mongoose = require('mongoose');
require('dotenv').config();

const { Partner } = require('../models/Partner');
const { Subscription, SubscriptionPlan } = require('../models/Finance');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Create Mock Plans
    const plansData = [
      {
        name: 'Free Trail',
        applicable_to: ['service_provider', 'property_agent', 'supplier'],
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
        applicable_to: ['service_provider', 'property_agent', 'supplier'],
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

    // 2. Create Mock Partners
    const partnersData = [
      {
        name: 'Ujjawal Mahawar',
        phone: '9876543210',
        email: 'ujjawal@appzeto.com',
        partner_type: 'service_provider',
        role: 'Service Provider',
        onboarding_status: 'approved',
        is_active: true
      },
      {
        name: 'Basant Kumar Singh',
        phone: '9123456789',
        email: 'basant@basera.com',
        partner_id: 'Agent',
        partner_type: 'property_agent',
        role: 'Agent',
        onboarding_status: 'approved',
        is_active: true
      },
      {
        name: 'Ankit Gupta',
        phone: '9988776655',
        email: 'ankit@suppliers.com',
        partner_type: 'supplier',
        role: 'Supplier',
        onboarding_status: 'approved',
        is_active: true
      }
    ];

    // Delete existing with these phones to avoid clashes
    await Partner.deleteMany({ phone: { $in: partnersData.map(p => p.phone) }});
    const createdPartners = await Partner.insertMany(partnersData);
    console.log(`Created ${createdPartners.length} partners`);

    // 3. Create Subscriptions
    const subData = [
      {
        partner_id: createdPartners[0]._id,
        plan_id: createdPlans[0]._id,
        plan_snapshot: createdPlans[0].toObject(),
        status: 'active',
        starts_at: new Date(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usage: { listings_created: 0, enquiries_received_this_month: 0 }
      },
      {
        partner_id: createdPartners[1]._id,
        plan_id: createdPlans[0]._id,
        plan_snapshot: createdPlans[0].toObject(),
        status: 'active',
        starts_at: new Date(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usage: { listings_created: 0, enquiries_received_this_month: 0 }
      },
      {
        partner_id: createdPartners[2]._id,
        plan_id: createdPlans[1]._id,
        plan_snapshot: createdPlans[1].toObject(),
        status: 'active',
        starts_at: new Date(),
        ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usage: { listings_created: 5, enquiries_received_this_month: 12 }
      }
    ];

    await Subscription.deleteMany({});
    const createdSubs = await Subscription.insertMany(subData);
    console.log(`Created ${createdSubs.length} user subscriptions`);

    // Update partner active_subscription_id
    for (let i = 0; i < createdSubs.length; i++) {
        await Partner.findByIdAndUpdate(createdSubs[i].partner_id, {
            active_subscription_id: createdSubs[i]._id
        });
    }

    console.log("Seeding Completed Successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seedData();
