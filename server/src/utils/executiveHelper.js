const Executive = require('../models/Executive');
const { Transaction } = require('../models/Finance');
const { logActivity } = require('./activityLogger');
const { sendPushNotification } = require('./notificationHelper');

/**
 * Credits commission to an executive when a referred partner buys a subscription.
 * @param {string} referralCode - The executive's referral code.
 * @param {string} partnerId - The ID of the partner who made the purchase.
 * @param {string} partnerName - The name of the partner.
 */
const creditExecutivePayout = async (referralCode, partnerId, partnerName) => {
  try {
    if (!referralCode) return;

    const executive = await Executive.findOne({ referral_code: referralCode, is_active: true });
    if (!executive) {
      console.log(`[PAYOUT] No active executive found for code: ${referralCode}`);
      return;
    }

    const amount = executive.payout_rate || 100;

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
      reference_id: partnerId // Link to the partner who triggered this
    });

    // 3. Log Activity
    logActivity({
      actor_name: 'System',
      actor_id: executive._id, // Associated with the executive
      action: 'executive_commission_earned',
      entity_type: 'executive',
      entity_name: executive.name,
      entity_id: executive._id,
      description: `Executive ${executive.name} earned ₹${amount} commission from partner ${partnerName}.`
    });

    // 4. Send Notification
    await sendPushNotification(
      executive._id,
      'Executive',
      'Commission Credited! 💰',
      `₹${amount} has been added to your wallet for onboarding ${partnerName}. Keep it up!`,
      { type: 'commission_credit', amount: amount.toString() }
    );

    console.log(`[PAYOUT] Successfully credited ₹${amount} to Executive: ${executive.name}`);
  } catch (error) {
    console.error('[PAYOUT ERROR]', error);
  }
};

module.exports = {
  creditExecutivePayout
};
