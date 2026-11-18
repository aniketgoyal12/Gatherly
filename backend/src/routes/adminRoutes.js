import { Router } from 'express';
import {
  getAllUsers,
  toggleUserStatus,
  getPendingEvents,
  getAuditLogs,
} from '../controllers/adminController.js';
import { getEventAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/users', protect, requireRoles('super_admin'), getAllUsers);
router.patch('/users/:id/status', protect, requireRoles('super_admin'), toggleUserStatus);
router.get('/pending-events', protect, requireRoles('super_admin'), getPendingEvents);
router.get('/audit-logs', protect, requireRoles('super_admin'), getAuditLogs);
router.get('/analytics/event/:eventId', protect, requireRoles('organizer', 'super_admin'), getEventAnalytics);

export default router;
