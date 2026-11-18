import { Router } from 'express';
import { submitFeedback, getEventFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { submitFeedbackSchema } from '../validators/feedbackValidator.js';

const router = Router();

router.post('/', protect, validate(submitFeedbackSchema), submitFeedback);
router.get('/event/:eventId', getEventFeedback);

export default router;
