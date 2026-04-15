const mongoose = require('mongoose');
require('dotenv').config();

// Define Schemas matches what we found
const subscriptionPlanSchema = new mongoose.Schema({
  name: String,
  applicable_to: [String],
  price: Number,
  duration_days: Number,
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const subscriptionSchema = new mongoose.Schema({
  status: String,
  partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' }
}, { timestamps: true });

async function checkDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
  const Subscription = mongoose.model('Subscription', subscriptionSchema);

  const plans = await SubscriptionPlan.find();
  const subs = await Subscription.find();

  console.log("PLANS COUNT:", plans.length);
  console.log("PLANS:", JSON.stringify(plans, null, 2));

  console.log("SUBSCRIPTIONS COUNT:", subs.length);

  await mongoose.disconnect();
}

checkDb();
