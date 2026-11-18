import { z } from 'zod';

export const verifyPaymentSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

export const refundRequestSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
  reason: z.string().optional(),
});

export default {
  verifyPaymentSchema,
  refundRequestSchema,
};
