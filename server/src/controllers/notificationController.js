const { Notification } = require('../models/System');

/**
 * @desc    Get notifications for the logged in partner/user
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = async (req, res) => {
  try {
    // Determine recipient_type based on role
    let recipient_type = 'user';
    if (['Agent', 'Supplier', 'Service Provider', 'Partner', 'partner'].includes(req.user.role)) {
      recipient_type = 'partner';
    } else if (['Admin', 'super_admin'].includes(req.user.role)) {
      recipient_type = 'admin';
    }

    const notifications = await Notification.find({
      recipient_type,
      recipient_id: req.user._id
    }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
      return res.status(401).json({ success: false, message: 'Not authorized to delete this notification.' });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification removed.'
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: 'Error deleting notification.' });
  }
};

module.exports = {
  getMyNotifications,
  deleteNotification
};
