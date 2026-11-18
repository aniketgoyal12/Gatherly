import { Router } from 'express';
import {
  registerForEvent,
  joinWaitlist,
  getMyRegistrations,
} from '../controllers/registrationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { reserveTicketSchema, joinWaitlistSchema } from '../validators/registrationValidator.js';

const router = Router();

router.post('/reserve', protect, validate(reserveTicketSchema), registerForEvent);
router.post('/waitlist', protect, validate(joinWaitlistSchema), joinWaitlist);
router.get('/my', protect, getMyRegistrations);

export default router;
