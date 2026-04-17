const mongoose = require('mongoose');
const { Partner } = require('../server/src/models/Partner');
const { User } = require('../server/src/models/User');
const { Subscription, SubscriptionPlan } = require('../server/src/models/Finance');
require('dotenv').config({ path: '../server/.env' });

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/baserabazar');
    console.log('Connected to DB');

    // 1. Get or Create a Default Plan
    let plan = await SubscriptionPlan.findOne({ name: /Free/i });
    if (!plan) {
      plan = await SubscriptionPlan.create({
        name: 'Free Trail',
        description: 'Default onboarding plan',
        applicable_to: ['service_provider', 'property_agent', 'supplier'],
        duration_days: 30,
        price: 0,
        listings_limit: 1,
        featured_listings_limit: 1,
        leads_limit: 50,
        features: ['30 days Account Validity', 'Email Support']
      });
      console.log('Created default Free Trail plan');
    }

    // 2. Find partners without subscriptions
    const partners = await Partner.find({ active_subscription_id: null });
    console.log(`Found ${partners.length} partners without subscriptions`);

    for (const partner of partners) {
      const subscription = await Subscription.create({
        partner_id: partner._id,
        plan_id: plan._id,
        plan_snapshot: plan.toObject(),
        status: 'active',
        starts_at: new Date(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usage: {
          listings_created: 0,
          featured_listings_used: 0,
          enquiries_received_this_month: 0
        }
      });

      await Partner.findByIdAndUpdate(partner._id, { active_subscription_id: subscription._id });
      // Also update User if there is a matching user by phone
      await User.findOneAndUpdate({ phone: partner.phone }, { active_subscription_id: subscription._id });
      
      console.log(`Assigned subscription to partner: ${partner.name}`);
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
