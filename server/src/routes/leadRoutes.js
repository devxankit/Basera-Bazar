const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/broadcast', protect, leadController.createBroadcastLead);
router.get('/partner', protect, leadController.getPartnerLeads);

module.exports = router;
