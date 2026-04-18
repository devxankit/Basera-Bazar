const express = require('express');
const router = express.Router();
const { subscribePartner, getVapidKey } = require('../controllers/pushController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/vapid-key', protect, getVapidKey);
router.post('/subscribe', protect, subscribePartner);

module.exports = router;
