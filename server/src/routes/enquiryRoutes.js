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
const validate = require('../middlewares/validateMiddleware');
const { enquirySchema, idParamSchema } = require('../utils/validators');

router.post('/enquiries', protect, validate(enquirySchema), createEnquiry);
router.get('/users/enquiries', protect, getMyEnquiries);

// Partner Routes
router.get('/partners/enquiries', protect, getPartnerInquiries);
router.get('/partners/enquiries/:id', protect, validate(idParamSchema, 'params'), getInquiryById);
router.patch('/partners/enquiries/:id/status', protect, validate(idParamSchema, 'params'), updateInquiryStatus);
router.delete('/partners/enquiries/:id', protect, validate(idParamSchema, 'params'), deleteInquiry);

module.exports = router;
