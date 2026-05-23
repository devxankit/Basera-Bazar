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

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { enquirySchema, idParamSchema } = require('../utils/validators');

router.post('/enquiries', protect, validate(enquirySchema), createEnquiry);
router.get('/users/enquiries', protect, getMyEnquiries);

// Partner Routes
router.get('/partners/enquiries', protect, authorizeRoles('partner'), getPartnerInquiries);
router.get('/partners/enquiries/:id', protect, authorizeRoles('partner'), validate(idParamSchema, 'params'), getInquiryById);
router.patch('/partners/enquiries/:id/status', protect, authorizeRoles('partner'), validate(idParamSchema, 'params'), updateInquiryStatus);
router.delete('/partners/enquiries/:id', protect, authorizeRoles('partner'), validate(idParamSchema, 'params'), deleteInquiry);

module.exports = router;
