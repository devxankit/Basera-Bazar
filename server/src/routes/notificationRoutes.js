const express = require('express');
const router = express.Router();
const { getMyNotifications, deleteNotification, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { idParamSchema } = require('../utils/validators');

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validate(idParamSchema, 'params'), markAsRead);
router.delete('/:id', validate(idParamSchema, 'params'), deleteNotification);

module.exports = router;
