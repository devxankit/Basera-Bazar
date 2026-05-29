/**
 * runCronJobsNow.js
 *
 * Testing utility — fires all scheduled cron jobs immediately so you can
 * verify subscription expiry and salary deduction logic without waiting
 * for the next scheduled window.
 *
 * Usage:
 *   node src/scripts/runCronJobsNow.js              # run both jobs
 *   node src/scripts/runCronJobsNow.js expiry        # expiry job only
 *   node src/scripts/runCronJobsNow.js deduction     # salary deduction only
 *   node src/scripts/runCronJobsNow.js expire-sub <subscriptionId>
 *       # force-expire a specific subscription immediately (sets ends_at = now - 1 min)
 *       # then re-runs the expiry job so the partner is expired right away
 */

require('dotenv').config();
const mongoose = require('mongoose');

const { runSubscriptionExpiryJob } = require('../jobs/subscriptionExpiryJob');
const { runMonthlyDeductionJob }   = require('../jobs/monthlyDeductionJob');

const arg = process.argv[2];
const subId = process.argv[3];

async function connect() {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  MongoDB connected');
}

async function forceExpireSub(id) {
  const { Subscription } = require('../models/Finance');
  const sub = await Subscription.findById(id);
  if (!sub) {
    console.error(`❌  Subscription ${id} not found`);
    process.exit(1);
  }
  // Backdate ends_at to 1 minute ago so the expiry job picks it up
  sub.ends_at = new Date(Date.now() - 60 * 1000);
  await sub.save();
  console.log(`⏪  Subscription ${id} ends_at set to ${sub.ends_at.toISOString()} (1 min ago)`);
}

async function main() {
  await connect();

  try {
    if (arg === 'expire-sub') {
      if (!subId) {
        console.error('❌  Provide a subscription ID:  node runCronJobsNow.js expire-sub <id>');
        process.exit(1);
      }
      await forceExpireSub(subId);
      console.log('\n▶  Running subscription expiry job...');
      await runSubscriptionExpiryJob();

    } else if (arg === 'expiry') {
      console.log('\n▶  Running subscription expiry job...');
      await runSubscriptionExpiryJob();

    } else if (arg === 'deduction') {
      console.log('\n▶  Running monthly salary deduction job...');
      await runMonthlyDeductionJob();

    } else {
      console.log('\n▶  Running subscription expiry job...');
      await runSubscriptionExpiryJob();
      console.log('\n▶  Running monthly salary deduction job...');
      await runMonthlyDeductionJob();
    }

    console.log('\n✅  Done.');
  } catch (err) {
    console.error('❌  Job failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
