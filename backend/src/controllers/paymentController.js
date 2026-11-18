import Payment from '../models/Payment.js';
import Registration from '../models/Registration.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import Waitlist from '../models/Waitlist.js';
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../config/razorpay.js';
import { generateSecureQrToken, hashToken } from '../utils/hashQr.js';
import { emitToRoom } from '../config/socket.js';

/**
 * Verify Client Payment Callback (Workflow 8)
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { registrationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // 1. Verify Razorpay HMAC SHA-256 signature
  const isSignatureValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isSignatureValid) {
    throw new ApiError(400, 'Invalid payment signature. Payment verification failed.');
  }

  // 2. Fetch linked registration
  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new ApiError(404, 'Registration not found.');
  }

  // 3. Fetch linked payment
  const payment = await Payment.findOne({ registrationId });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found.');
  }

  // 4. Check payment idempotency (Already processed?)
  if (payment.paymentStatus === 'paid') {
    const existingTicket = await Ticket.findOne({ registrationId });
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          paymentStatus: 'paid',
          ticket: existingTicket,
          note: 'Payment was already processed.',
        },
        'Payment already verified.'
      )
    );
  }

  // 5. Update payment and registration status
  payment.gatewayPaymentId = razorpayPaymentId;
  payment.paymentStatus = 'paid';
  await payment.save();

  registration.bookingStatus = 'confirmed';
  await registration.save();

  // 6. Generate secure random QR token and store SHA-256 hash
  const rawQrToken = generateSecureQrToken();
  const tokenHash = hashToken(rawQrToken);

  const ticket = await Ticket.create({
    registrationId: registration._id,
    tokenHash,
    ticketStatus: 'valid',
  });

  // 7. Dispatch confirmation notification
  await Notification.create({
    userId: registration.userId,
    title: 'Payment Successful & Ticket Confirmed',
    message: 'Your payment was successfully captured. Your QR ticket is now active.',
    type: 'payment_alert',
  });

  emitToRoom(`user_${registration.userId}`, 'ticket_confirmed', {
    ticketId: ticket._id,
    eventId: registration.eventId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentStatus: 'paid',
        ticket: {
          id: ticket._id,
          ticketStatus: ticket.ticketStatus,
          rawQrToken, // Rendered as QR code on client
        },
      },
      'Payment verified successfully and ticket issued'
    )
  );
});

/**
 * Razorpay Webhook Ingestion Handler (Workflow 4 & 8)
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  // 1. Verify Webhook Signature
  if (signature && !verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Webhook] Warning: Invalid webhook signature received.');
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  const eventType = rawBody.event;
  const paymentPayload = rawBody.payload?.payment?.entity;

  console.log(`[Webhook] Event received: ${eventType}`);

  if (eventType === 'payment.captured' && paymentPayload) {
    const orderId = paymentPayload.order_id;
    const payment = await Payment.findOne({ gatewayOrderId: orderId });

    if (payment && payment.paymentStatus !== 'paid') {
      payment.gatewayPaymentId = paymentPayload.id;
      payment.paymentStatus = 'paid';
      await payment.save();

      const registration = await Registration.findById(payment.registrationId);
      if (registration && registration.bookingStatus !== 'confirmed') {
        registration.bookingStatus = 'confirmed';
        await registration.save();

        const rawQrToken = generateSecureQrToken();
        const tokenHash = hashToken(rawQrToken);

        await Ticket.create({
          registrationId: registration._id,
          tokenHash,
          ticketStatus: 'valid',
        });

        await Notification.create({
          userId: registration.userId,
          title: 'Ticket Confirmed (Webhook)',
          message: 'Your payment was captured via gateway webhook.',
          type: 'ticket_confirmed',
        });
      }
    }
  } else if (eventType === 'refund.processed' || eventType === 'payment.refunded') {
    // Workflow 4: Refund processed webhook
    const paymentId = paymentPayload?.id;
    const payment = await Payment.findOne({ gatewayPaymentId: paymentId });

    if (payment && payment.paymentStatus !== 'refunded') {
      payment.paymentStatus = 'refunded';
      await payment.save();

      // Invalidate ticket & registration
      await Ticket.updateOne({ registrationId: payment.registrationId }, { $set: { ticketStatus: 'refunded' } });
      await Registration.updateOne({ _id: payment.registrationId }, { $set: { bookingStatus: 'cancelled' } });

      // Check if there is a waitlist for this event to offer released seat (Workflow 4)
      const reg = await Registration.findById(payment.registrationId);
      if (reg) {
        const nextInWaitlist = await Waitlist.findOne({ eventId: reg.eventId, status: 'waiting' }).sort({ position: 1 });
        if (nextInWaitlist) {
          nextInWaitlist.status = 'offered';
          await nextInWaitlist.save();

          await Notification.create({
            userId: nextInWaitlist.userId,
            title: 'Seat Available!',
            message: 'A seat has opened up for your waitlisted event. Please complete registration.',
            type: 'event_update',
          });
        }
      }
    }
  }

  // Always respond 200 OK to prevent Razorpay retries
  return res.status(200).json({ received: true });
});

/**
 * Attendee / Organizer Initiates Ticket Cancellation & Refund (Workflow 4)
 */
export const requestRefund = asyncHandler(async (req, res) => {
  const { registrationId, reason } = req.body;

  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  // Authorization check
  if (registration.userId.toString() !== req.user._id.toString() && req.user.role !== 'organizer' && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You cannot cancel this ticket');
  }

  // Check cancellation deadline (must be before event start date)
  if (new Date() >= new Date(registration.eventId.startDate)) {
    throw new ApiError(400, 'Cancellation deadline has passed. Event has already commenced.');
  }

  const payment = await Payment.findOne({ registrationId });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found for this registration');
  }

  if (payment.paymentStatus !== 'paid') {
    throw new ApiError(400, `Cannot refund payment with status '${payment.paymentStatus}'`);
  }

  // Mark payment as refund_pending (Workflow 4)
  payment.paymentStatus = 'refund_pending';
  await payment.save();

  // Invalidate ticket
  await Ticket.updateOne({ registrationId: registration._id }, { $set: { ticketStatus: 'cancelled' } });
  registration.bookingStatus = 'cancelled';
  await registration.save();

  // Notify attendee
  await Notification.create({
    userId: registration.userId,
    title: 'Refund Request Received',
    message: `Your cancellation request for "${registration.eventId.title}" has been registered. Refund is processing.`,
    type: 'payment_alert',
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { paymentId: payment._id, status: 'refund_pending' },
      'Ticket cancelled and refund marked as pending.'
    )
  );
});

export default {
  verifyPayment,
  handleWebhook,
  requestRefund,
};
