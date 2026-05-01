const express = require('express');
const router = express.Router();
const { saveFCMToken, removeFCMToken, sendTestNotification } = require('../controllers/pushController');
const { protect } = require('../middlewares/authMiddleware');

// Save FCM Token (Web or Mobile)
router.post('/save', protect, saveFCMToken);

// Remove FCM Token (Logout)
router.delete('/remove', protect, removeFCMToken);

// Test Notification
router.post('/test', protect, sendTestNotification);

module.exports = router;
