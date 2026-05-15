const Executive = require('../models/Executive');
const logger = require('./logger');
const { Transaction } = require('../models/Finance');
const { AppConfig } = require('../models/System');
const { logActivity } = require('./activityLogger');
const { sendPushNotification } = require('./notificationHelper');

/**
 * Credits commission to an executive when a referred partner buys or renews a subscription.
 * Commission is calculated as a % of the plan price, controlled by the AppConfig key
 * `executive_commission_rate` (default: 10%).
 *
 * @param {string} referralCode - The executive's referral code (used to find the executive).
 * @param {string} partnerId - The ID of the partner who made the purchase.
 * @param {string} partnerName - The name of the partner.
 * @param {number} planPrice - The price of the subscription plan in rupees.
 */
const creditExecutivePayout = async (referralCode, partnerId, partnerName, planPrice = 0) => {
  try {
    if (!referralCode) return;

    const executive = await Executive.findOne({ referral_code: referralCode, is_active: true });
    if (!executive) {
      logger.info(`[PAYOUT] No active executive found for code: ${referralCode}`)
      return;
    }

    // Fetch commission rate from AppConfig, default to 10%
    let commissionRate = 10;
    const rateConfig = await AppConfig.findOne({ key: 'executive_commission_rate' });
    if (rateConfig && !isNaN(Number(rateConfig.value))) {
      commissionRate = Number(rateConfig.value);
    }

    // Calculate commission amount: percentage of plan price, minimum ₹1
    const amount = planPrice > 0
      ? Math.max(1, Math.round((planPrice * commissionRate) / 100))
      : (executive.payout_rate || 100); // fallback for backward compat

    // 1. Update Executive Balance
    executive.wallet_balance += amount;
    executive.total_earnings += amount;
    await executive.save();

    // 2. Record Transaction
    await Transaction.create({
      type: 'executive_commission',
      amount,
      direction: 'credit',
      status: 'success',
      executive_id: executive._id,
      partner_id: partnerId,
      reference_id: partnerId
    });

    // 3. Log Activity
    logActivity({
      actor_name: 'System',
      actor_id: executive._id,
      action: 'executive_commission_earned',
      entity_type: 'executive',
      entity_name: executive.name,
      entity_id: executive._id,
      description: `Executive ${executive.name} earned ₹${amount} (${commissionRate}% of ₹${planPrice}) from partner ${partnerName}.`
    });

    // 4. Send Notification
    await sendPushNotification(
      executive._id,
      'Executive',
      'Commission Credited! 💰',
      `₹${amount} has been added to your wallet for ${partnerName}'s subscription. Keep it up!`,
      { type: 'commission_credit', amount: amount.toString() }
    );

    logger.info(`[PAYOUT] Successfully credited ₹${amount} to Executive: ${executive.name}`)
  } catch (error) {
    logger.error({ err: error }, '[PAYOUT ERROR]')
  }
};

module.exports = {
  creditExecutivePayout
};
