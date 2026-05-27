const { Notification } = require('../models/System');
const logger = require('../utils/logger');

/**
 * @desc    Get notifications for the logged in partner/user
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = async (req, res) => {
  try {
    // Determine recipient_type based on role
    let recipient_type = 'user';
    if (req.user.role === 'partner') {
      recipient_type = 'partner';
    } else if (['admin', 'super_admin', 'Admin', 'SuperAdmin'].includes(req.user.role)) {
      recipient_type = 'admin';
    } else if (req.user.role === 'executive') {
      recipient_type = 'executive';
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient_type, recipient_id: req.user._id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient_type, recipient_id: req.user._id })
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page,
      data: notifications
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching notifications:")
    res.status(500).json({ success: false, message: 'Error fetching notifications.' });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    // Security: Ensure the notification belongs to the requester
    if (notification.recipient_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notification.' });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification removed.'
    });
  } catch (error) {
    logger.error({ err: error }, "Error deleting notification:")
    res.status(500).json({ success: false, message: 'Error deleting notification.' });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    if (notification.recipient_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    notification.is_read = true;
    await notification.save();
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error marking notification as read:');
    res.status(500).json({ success: false, message: 'Error updating notification.' });
  }
};

/**
 * @desc    Mark all notifications as read for the logged-in user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    let recipient_type = 'user';
    if (req.user.role === 'partner') {
      recipient_type = 'partner';
    } else if (['admin', 'super_admin', 'Admin', 'SuperAdmin'].includes(req.user.role)) {
      recipient_type = 'admin';
    } else if (req.user.role === 'executive') {
      recipient_type = 'executive';
    }
    await Notification.updateMany(
      { recipient_type, recipient_id: req.user._id, is_read: false },
      { $set: { is_read: true } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error marking all notifications as read:');
    res.status(500).json({ success: false, message: 'Error updating notifications.' });
  }
};

module.exports = {
  getMyNotifications,
  deleteNotification,
  markAsRead,
  markAllAsRead,
};
