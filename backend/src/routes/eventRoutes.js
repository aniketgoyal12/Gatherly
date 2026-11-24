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
  uploadEventBanner,
  getEventStaff,
  assignStaffToEvent,
  removeStaffFromEvent,
} from '../controllers/eventController.js';
import {
  setBudget,
  addActualExpense,
  getBudgetByEvent,
} from '../controllers/budgetController.js';
import { getEventAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';
import {
  createEventSchema,
  updateEventSchema,
  approveRejectSchema,
  assignStaffSchema,
  setBudgetSchema,
  addExpenseSchema,
} from '../validators/eventValidator.js';

const router = Router();

// Public routes
router.get('/', getEvents);

// Specific nested sub-resource routes (declare BEFORE generic /:id)
router.get('/:eventId/budget', protect, requireRoles('organizer', 'super_admin'), getBudgetByEvent);
router.post('/:eventId/budget', protect, requireRoles('organizer', 'super_admin'), validate(setBudgetSchema), setBudget);
router.post('/:eventId/budget/expenses', protect, requireRoles('organizer', 'super_admin'), validate(addExpenseSchema), addActualExpense);

// Aliases for budget endpoints for backward compatibility
router.post('/budget', protect, requireRoles('organizer', 'super_admin'), setBudget);
router.post('/budget/expense', protect, requireRoles('organizer', 'super_admin'), addActualExpense);

// Event Staff Management routes
router.get('/:eventId/staff', protect, requireRoles('organizer', 'super_admin'), getEventStaff);
router.post('/:eventId/staff', protect, requireRoles('organizer', 'super_admin'), validate(assignStaffSchema), assignStaffToEvent);
router.delete('/:eventId/staff/:staffId', protect, requireRoles('organizer', 'super_admin'), removeStaffFromEvent);

// Organizer Event Analytics with ownership check
router.get('/:eventId/analytics', protect, requireRoles('organizer', 'super_admin'), getEventAnalytics);

// Single Event Details
router.get('/:id', getEventById);

// Organizer & Admin event management
router.post('/', protect, requireRoles('organizer', 'super_admin'), validate(createEventSchema), createEvent);
router.put('/:id', protect, requireRoles('organizer', 'super_admin'), validate(updateEventSchema), updateEvent);
router.patch('/:id/submit', protect, requireRoles('organizer'), submitForApproval);
// Plan uses /:id/approval; keep /:id/review as an alias
router.patch('/:id/approval', protect, requireRoles('super_admin'), validate(approveRejectSchema), reviewEvent);
router.patch('/:id/review', protect, requireRoles('super_admin'), validate(approveRejectSchema), reviewEvent);
router.patch('/:id/cancel', protect, requireRoles('organizer', 'super_admin'), cancelEvent);
router.patch('/:id/complete', protect, requireRoles('organizer', 'super_admin'), completeEvent);
router.patch(
  '/:id/banner',
  protect,
  requireRoles('organizer', 'super_admin'),
  uploadSingleImage('banner'),
  uploadEventBanner
);

export default router;
