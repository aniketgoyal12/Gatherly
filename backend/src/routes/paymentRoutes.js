import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  requestRefund,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundRequestSchema,
} from '../validators/paymentValidator.js';

const router = Router();

router.post('/create-order', protect, validate(createOrderSchema), createPaymentOrder);
router.post('/verify', protect, validate(verifyPaymentSchema), verifyPayment);
router.post('/webhook', handleWebhook);
router.post('/refund', protect, validate(refundRequestSchema), requestRefund);

export default router;
