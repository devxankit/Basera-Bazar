const express = require('express');
const router = express.Router();
const { getMyNotifications, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.delete('/:id', deleteNotification);

module.exports = router;
