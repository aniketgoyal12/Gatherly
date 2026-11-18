import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  submitForApproval,
  reviewEvent,
  cancelEvent,
  completeEvent,
} from '../controllers/eventController.js';
import {
  setBudget,
  addActualExpense,
  getBudgetByEvent,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createEventSchema,
  updateEventSchema,
  approveRejectSchema,
} from '../validators/eventValidator.js';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Organizer & Admin event management
router.post('/', protect, requireRoles('organizer', 'super_admin'), validate(createEventSchema), createEvent);
router.put('/:id', protect, requireRoles('organizer', 'super_admin'), validate(updateEventSchema), updateEvent);
router.patch('/:id/submit', protect, requireRoles('organizer'), submitForApproval);
router.patch('/:id/review', protect, requireRoles('super_admin'), validate(approveRejectSchema), reviewEvent);
router.patch('/:id/cancel', protect, requireRoles('organizer', 'super_admin'), cancelEvent);
router.patch('/:id/complete', protect, requireRoles('organizer', 'super_admin'), completeEvent);

// Budget routes for event
router.get('/:eventId/budget', protect, requireRoles('organizer', 'super_admin'), getBudgetByEvent);
router.post('/budget', protect, requireRoles('organizer', 'super_admin'), setBudget);
router.post('/budget/expense', protect, requireRoles('organizer', 'super_admin'), addActualExpense);

export default router;
