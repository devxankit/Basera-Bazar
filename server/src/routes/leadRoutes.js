const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { leadCreateSchema } = require('../utils/validators');

router.post('/broadcast', protect, validate(leadCreateSchema), leadController.createBroadcastLead);
router.get('/partner', protect, leadController.getPartnerLeads);
router.get('/partner/:id', protect, leadController.getPartnerLeadById);

module.exports = router;
