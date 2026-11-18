import { Router } from 'express';
import {
  verifyPayment,
  handleWebhook,
  requestRefund,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { verifyPaymentSchema, refundRequestSchema } from '../validators/paymentValidator.js';

const router = Router();

router.post('/verify', protect, validate(verifyPaymentSchema), verifyPayment);
router.post('/webhook', handleWebhook);
router.post('/refund', protect, validate(refundRequestSchema), requestRefund);

export default router;
