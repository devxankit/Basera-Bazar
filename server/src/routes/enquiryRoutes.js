const express = require('express');
const router = express.Router();
const { 
  createEnquiry, 
  getMyEnquiries, 
  getPartnerInquiries, 
  getInquiryById, 
  updateInquiryStatus, 
  deleteInquiry 
} = require('../controllers/enquiryController');

const { protect } = require('../middlewares/authMiddleware');

router.post('/enquiries', protect, createEnquiry);
router.get('/users/enquiries', protect, getMyEnquiries);

// Partner Routes
router.get('/partners/enquiries', protect, getPartnerInquiries);
router.get('/partners/enquiries/:id', protect, getInquiryById);
router.patch('/partners/enquiries/:id/status', protect, updateInquiryStatus);
router.delete('/partners/enquiries/:id', protect, deleteInquiry);

module.exports = router;
