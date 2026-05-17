const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  staffLoginSchema,
  staffPasswordResetSchema,
} = require('../utils/validators');
const {
  staffLogin,
  staffLogout,
  getStaffMe,
  changeStaffPassword,
  staffForgotPassword,
  staffResetPassword,
} = require('../controllers/staff/staffAuthController');

// Public
router.post('/login', validate(staffLoginSchema), staffLogin);
router.post('/forgot-password', staffForgotPassword);
router.post('/reset-password', staffResetPassword);

// Protected (any staff role)
router.use(protect);
router.get('/me', getStaffMe);
router.post('/logout', staffLogout);
router.put('/change-password', validate(staffPasswordResetSchema), changeStaffPassword);

module.exports = router;
