const logger = require('../../utils/logger');
const { Partner } = require('../../models/Partner');
const { User } = require('../../models/User');
const { Transaction } = require('../../models/Finance');

const getSubscriptionReport = async (req, res) => {
  try {
    const { Subscription } = require('../../models/Finance');
    const [report, totalPartners, activeSubs, totalRevenue] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'subscription_payment', status: 'success' } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Partner.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
    ]);

    let growth = 0;
    if (report.length >= 2) {
      const lastMonth = report[report.length - 1].revenue;
      const prevMonth = report[report.length - 2].revenue;
      if (prevMonth > 0) growth = ((lastMonth - prevMonth) / prevMonth) * 100;
    }

    res.status(200).json({ success: true, data: { history: report, summary: { totalRevenue: totalRevenue[0]?.total || 0, activeSubscriptions: activeSubs, totalPartners, conversionRate: totalPartners > 0 ? (activeSubs / totalPartners) * 100 : 0, growthRate: growth.toFixed(1) } } });
  } catch (error) {
    logger.error({ err: error }, "Subscription report error:");
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getUserReport = async (req, res) => {
  try {
    const [history, totalPartners, verifiedPartners] = await Promise.all([
      User.aggregate([{ $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Partner.countDocuments(),
      Partner.countDocuments({ onboarding_status: 'approved' })
    ]);

    let growth = 0;
    if (history.length >= 2) {
      const lastMonth = history[history.length - 1].count;
      const prevMonth = history[history.length - 2].count;
      if (prevMonth > 0) growth = ((lastMonth - prevMonth) / prevMonth) * 100;
    }

    res.status(200).json({ success: true, data: { history, summary: { totalUsers: history.reduce((sum, item) => sum + item.count, 0), verifiedPercentage: totalPartners > 0 ? (verifiedPartners / totalPartners) * 100 : 0, growthRate: growth.toFixed(1) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTransactionLedger = async (req, res) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status.toLowerCase();
    if (type && type !== 'All') query.type = type;

    const transactions = await Transaction.find(query).populate('partner_id', 'name email phone').sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Transaction.countDocuments(query);

    res.status(200).json({ success: true, data: transactions, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getFinancialStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([{
      $facet: {
        totals: [{ $match: { status: 'success' } }, { $group: { _id: null, totalRevenue: { $sum: "$amount" }, count: { $sum: 1 } } }],
        pending: [{ $match: { status: 'pending' } }, { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }],
        failed: [{ $match: { status: 'failed' } }, { $count: "count" }],
        totalCount: [{ $count: "count" }]
      }
    }]);

    res.status(200).json({ success: true, data: { totalRevenue: stats[0].totals[0]?.totalRevenue || 0, successCount: stats[0].totals[0]?.count || 0, pendingAmount: stats[0].pending[0]?.totalAmount || 0, failedCount: stats[0].failed[0]?.count || 0, totalTransactions: stats[0].totalCount[0]?.count || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getSubscriptionReport, getUserReport, getTransactionLedger, getFinancialStats };
