import { Router } from 'express';
import {
  getMyTickets,
  checkInTicket,
  getAssignedStaffEvents,
} from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { checkInSchema } from '../validators/ticketValidator.js';

const router = Router();

router.get('/my-tickets', protect, getMyTickets);
router.post('/check-in', protect, requireRoles('staff', 'organizer', 'super_admin'), validate(checkInSchema), checkInTicket);
router.get('/staff/assigned-events', protect, requireRoles('staff'), getAssignedStaffEvents);

export default router;
