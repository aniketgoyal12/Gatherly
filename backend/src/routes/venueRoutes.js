import { Router } from 'express';
import { getVenues, getVenueById, createVenue } from '../controllers/venueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);
router.post('/', protect, requireRoles('organizer', 'super_admin'), createVenue);

export default router;
