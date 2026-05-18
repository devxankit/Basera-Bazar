const express = require('express');
const router = express.Router();
const { saveFCMToken, removeFCMToken, sendTestNotification } = require('../controllers/pushController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { pushTokenSchema } = require('../utils/validators');

// Save FCM Token (Web or Mobile)
router.post('/save', protect, validate(pushTokenSchema), saveFCMToken);

// Remove FCM Token (Logout)
router.delete('/remove', protect, validate(pushTokenSchema), removeFCMToken);

// Test Notification
router.post('/test', protect, sendTestNotification);

module.exports = router;
