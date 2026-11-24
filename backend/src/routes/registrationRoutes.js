import { Router } from 'express';
import {
  registerForEvent,
  joinWaitlist,
  getMyRegistrations,
  cancelRegistration,
  getEventRegistrations,
} from '../controllers/registrationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { reserveTicketSchema, joinWaitlistSchema } from '../validators/registrationValidator.js';

const router = Router();

// Specific routes before generic /:id
router.post('/reserve', protect, validate(reserveTicketSchema), registerForEvent);
router.post('/waitlist', protect, validate(joinWaitlistSchema), joinWaitlist);
router.get('/my', protect, getMyRegistrations);
router.patch('/:id/cancel', protect, cancelRegistration);
router.get('/', protect, requireRoles('organizer', 'super_admin'), getEventRegistrations);

export default router;
