import Payment from '../models/Payment.js';
import ApiError from '../utils/apiError.js';
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from '../config/razorpay.js';

/**
 * Payment & Transaction Service (ADR-003, ADR-006)
 */

export const initiatePaymentOrder = async ({ registrationId, amount, currency = 'INR' }) => {
  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid payment amount');
  }

  // Create Razorpay Order
  const rzpOrder = await createOrder({
    amount,
    currency,
    receipt: `reg_${registrationId}`,
  });

  // Create local payment entry
  const payment = await Payment.create({
    registrationId,
    amount,
    currency,
    gatewayOrderId: rzpOrder.id,
    paymentStatus: 'created',
  });

  return { payment, rzpOrder };
};

export const verifyAndFinalizePayment = async ({
  registrationId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    throw new ApiError(400, 'Invalid payment signature. Payment verification failed.');
  }

  const payment = await Payment.findOne({ registrationId });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found.');
  }

  payment.gatewayPaymentId = razorpayPaymentId;
  payment.paymentStatus = 'paid';
  await payment.save();

  return payment;
};

export const recordRefund = async (paymentId, refundAmount, reason = 'Event cancelled') => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  payment.paymentStatus = 'refunded';
  await payment.save();

  return payment;
};

export default {
  initiatePaymentOrder,
  verifyAndFinalizePayment,
  recordRefund,
  verifyWebhookSignature,
};
