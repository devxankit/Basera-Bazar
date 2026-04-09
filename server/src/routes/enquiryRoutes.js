const express = require('express');
const router = express.Router();
const { createEnquiry, getMyEnquiries } = require('../controllers/enquiryController');

const { protect } = require('../middlewares/authMiddleware');

// Note: In our plan, we decided "users" fetch their own history at `/api/users/enquiries`
// but submit new ones at `/api/enquiries`. 
// For clean scaling, we put them together here and mount this router at different places in index.js, 
// OR we just mount this router at `/api/enquiries` and make the sub-paths clear.
// We will mount this router at `/api` in index.js to support both!

router.post('/enquiries', protect, createEnquiry);
router.get('/users/enquiries', protect, getMyEnquiries);

module.exports = router;
