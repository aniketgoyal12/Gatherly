import Payment from '../models/Payment.js';
import Registration from '../models/Registration.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Waitlist from '../models/Waitlist.js';
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from '../config/razorpay.js';
import { createSignedTicketToken, hashToken } from '../utils/hashQr.js';
import { emitToRoom } from '../config/socket.js';
import { enqueueTicketEmail } from '../jobs/ticketEmailQueue.js';

/**
 * Create Payment Order (/api/v1/payments/create-order)
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { registrationId } = req.body;

  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  if (registration.userId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this registration');
  }

  const event = registration.eventId;
  const amount = event.ticketPrice || 0;

  let payment = await Payment.findOne({ registrationId });
  let orderId = payment?.gatewayOrderId;

  if (!orderId) {
    const rzpOrder = await createOrder({
      amount,
      currency: 'INR',
      receipt: `reg_${registration._id}`,
    });
    orderId = rzpOrder.id;

    if (payment) {
      payment.gatewayOrderId = orderId;
      payment.amount = amount;
      await payment.save();
    } else {
      payment = await Payment.create({
        registrationId,
        amount,
        currency: 'INR',
        gatewayOrderId: orderId,
        paymentStatus: 'created',
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId,
        amount,
        currency: 'INR',
        registrationId,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      },
      'Payment order created successfully'
    )
  );
});

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

  // 6. Generate secure signed ticket token and store HMAC hash
  const ticket = new Ticket({
    registrationId: registration._id,
    ticketStatus: 'valid',
  });
  const signedToken = createSignedTicketToken(ticket._id, registration._id, registration.userId);
  ticket.tokenHash = hashToken(signedToken);
  await ticket.save();

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

  // Asynchronously dispatch email with QR code
  const attendeeUser = await User.findById(registration.userId);
  const eventDetails = await Event.findById(registration.eventId);
  if (attendeeUser?.email && eventDetails) {
    enqueueTicketEmail({
      to: attendeeUser.email,
      attendeeName: attendeeUser.name,
      eventTitle: eventDetails.title,
      eventDate: eventDetails.startDate,
      ticketId: ticket._id,
      ticketType: registration.ticketType,
      rawQrToken: signedToken,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentStatus: 'paid',
        ticket: {
          id: ticket._id,
          ticketStatus: ticket.ticketStatus,
          rawQrToken: signedToken,
        },
      },
      'Payment verified and ticket generated successfully'
    )
  );
});

/**
 * Razorpay Webhook Handler (Workflow 8 - Server-to-Server Fallback)
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookBody = req.body;

  const isValidWebhook = verifyWebhookSignature(JSON.stringify(webhookBody), webhookSignature);
  if (!isValidWebhook) {
    return res.status(400).json({ status: 'failure', message: 'Invalid webhook signature' });
  }

  const { event: webhookEvent, payload } = webhookBody;

  if (webhookEvent === 'payment.captured') {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    const payment = await Payment.findOne({ gatewayOrderId: orderId });
    if (payment && payment.paymentStatus !== 'paid') {
      payment.gatewayPaymentId = paymentId;
      payment.paymentStatus = 'paid';
      await payment.save();

      const registration = await Registration.findById(payment.registrationId);
      if (registration && registration.bookingStatus !== 'confirmed') {
        registration.bookingStatus = 'confirmed';
        await registration.save();

        const ticket = new Ticket({
          registrationId: registration._id,
          ticketStatus: 'valid',
        });
        const signedToken = createSignedTicketToken(ticket._id, registration._id, registration.userId);
        ticket.tokenHash = hashToken(signedToken);
        await ticket.save();

        await Notification.create({
          userId: registration.userId,
          title: 'Payment Confirmed via Gateway Webhook',
          message: 'Your payment was successfully received. View your ticket in My Tickets.',
          type: 'payment_alert',
        });
      }
    }
  }

  return res.status(200).json({ status: 'ok', received: true });
});

/**
 * Request Refund (Workflow 4 & 8)
 */
export const requestRefund = asyncHandler(async (req, res) => {
  const { registrationId, reason } = req.body;

  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  if (registration.userId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this registration');
  }

  const payment = await Payment.findOne({ registrationId, paymentStatus: 'paid' });
  if (!payment) {
    throw new ApiError(400, 'No paid transaction found for this registration');
  }

  payment.paymentStatus = 'refund_pending';
  await payment.save();

  registration.bookingStatus = 'cancelled';
  await registration.save();

  await Ticket.findOneAndUpdate(
    { registrationId: registration._id },
    { $set: { ticketStatus: 'cancelled' } }
  );

  await Notification.create({
    userId: registration.userId,
    title: 'Refund Request Submitted',
    message: `Your refund request for ₹${payment.amount} has been logged and is pending bank processing.`,
    type: 'payment_alert',
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        paymentStatus: payment.paymentStatus,
        refundAmount: payment.amount,
        registrationStatus: registration.bookingStatus,
      },
      'Refund request received and scheduled for processing'
    )
  );
});

export default {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  requestRefund,
};
