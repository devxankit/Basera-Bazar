const express = require('express');
const router = express.Router();
const { 
  getCurrentMilestone, 
  claimReward, 
  getRewardRequests, 
  updateRewardStatus,
  upsertMilestoneConfig,
  getMilestoneConfigs,
  deleteMilestoneConfig
} = require('../controllers/milestoneController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { milestoneClaimSchema, milestoneRewardStatusSchema, milestoneConfigSchema, idParamSchema } = require('../utils/validators');

// Partner Routes
router.get('/current', protect, getCurrentMilestone);
router.post('/claim', protect, validate(milestoneClaimSchema), claimReward);

// Admin Routes
router.get('/admin/rewards', protect, authorizeRoles('super_admin', 'SuperAdmin'), getRewardRequests);
router.patch('/admin/rewards/:id', protect, authorizeRoles('super_admin', 'SuperAdmin'), validate(idParamSchema, 'params'), validate(milestoneRewardStatusSchema), updateRewardStatus);
router.get('/admin/configs', protect, authorizeRoles('super_admin', 'SuperAdmin'), getMilestoneConfigs);
router.post('/admin/config', protect, authorizeRoles('super_admin', 'SuperAdmin'), validate(milestoneConfigSchema), upsertMilestoneConfig);
router.delete('/admin/config/:id', protect, authorizeRoles('super_admin', 'SuperAdmin'), validate(idParamSchema, 'params'), deleteMilestoneConfig);

module.exports = router;
