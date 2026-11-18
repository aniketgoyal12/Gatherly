import { Router } from 'express';
import {
  generateEventPlan,
  approveAiPlan,
  predictTurnout,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/generate-plan', protect, requireRoles('organizer', 'super_admin'), generateEventPlan);
router.post('/approve-plan', protect, requireRoles('organizer', 'super_admin'), approveAiPlan);
router.post('/predict-turnout', protect, requireRoles('organizer', 'super_admin'), predictTurnout);

export default router;
