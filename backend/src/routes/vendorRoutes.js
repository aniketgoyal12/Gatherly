import { Router } from 'express';
import {
  getVendors,
  createVendor,
  bookVendorForEvent,
} from '../controllers/vendorController.js';
import { getSponsorsByEvent, addSponsor } from '../controllers/sponsorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// Vendors
router.get('/', getVendors);
router.post('/', protect, requireRoles('super_admin', 'organizer'), createVendor);
router.post('/book', protect, requireRoles('super_admin', 'organizer'), bookVendorForEvent);

// Sponsors
router.get('/sponsors/:eventId', getSponsorsByEvent);
router.post('/sponsors', protect, requireRoles('super_admin', 'organizer'), addSponsor);

export default router;
