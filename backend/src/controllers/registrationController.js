import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Ticket from '../models/Ticket.js';
import Payment from '../models/Payment.js';
import Waitlist from '../models/Waitlist.js';
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createSignedTicketToken, hashToken } from '../utils/hashQr.js';
import { createOrder } from '../config/razorpay.js';
import { enqueueTicketEmail } from '../jobs/ticketEmailQueue.js';

/**
 * Register / Reserve Ticket (Workflow 5 & 8)
 */
export const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId, ticketType = 'standard' } = req.body;
  const userId = req.user._id;

  // 1. Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // 2. Check if event is published
  if (event.status !== 'published') {
    throw new ApiError(400, `Event is unavailable for registration (Status: ${event.status})`);
  }

  // 3. Check duplicate active booking for this user
  const existingReg = await Registration.findOne({
    eventId,
    userId,
    bookingStatus: { $in: ['confirmed', 'reserved'] },
  });

  if (existingReg) {
    throw new ApiError(
      409,
      'You already have an active registration or reservation for this event.',
      [{ registrationId: existingReg._id, status: existingReg.bookingStatus }]
    );
  }

  // 4. Check capacity availability
  const currentCount = await Registration.countDocuments({
    eventId,
    bookingStatus: { $in: ['confirmed', 'reserved'] },
  });

  if (currentCount >= event.capacity) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          capacityAvailable: false,
          canJoinWaitlist: true,
          eventId: event._id,
          message: 'Event is fully booked. You may join the waitlist.',
        },
        'Capacity full. Waitlist available.'
      )
    );
  }

  // 5. Handle Free Event (Price === 0)
  if (!event.ticketPrice || event.ticketPrice === 0 || ticketType === 'free') {
    const registration = await Registration.create({
      userId,
      eventId,
      ticketType,
      bookingStatus: 'confirmed',
    });

    const ticket = new Ticket({
      registrationId: registration._id,
      ticketStatus: 'valid',
    });
    const signedToken = createSignedTicketToken(ticket._id, registration._id, userId);
    ticket.tokenHash = hashToken(signedToken);
    await ticket.save();

    await Notification.create({
      userId,
      title: 'Ticket Confirmed!',
      message: `You are confirmed for "${event.title}". Access your QR ticket in My Tickets.`,
      type: 'ticket_confirmed',
    });

    if (req.user?.email) {
      enqueueTicketEmail({
        to: req.user.email,
        attendeeName: req.user.name,
        eventTitle: event.title,
        eventDate: event.startDate,
        ticketId: ticket._id,
        ticketType,
        rawQrToken: signedToken,
      });
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          registration,
          ticket: {
            id: ticket._id,
            ticketStatus: ticket.ticketStatus,
            rawQrToken: signedToken,
          },
        },
        'Free ticket confirmed successfully'
      )
    );
  }

  // 6. Handle Paid Event -> Payment Flow
  const registration = await Registration.create({
    userId,
    eventId,
    ticketType,
    bookingStatus: 'reserved',
  });

  const rzpOrder = await createOrder({
    amount: event.ticketPrice,
    currency: 'INR',
    receipt: `reg_${registration._id}`,
  });

  await Payment.create({
    registrationId: registration._id,
    amount: event.ticketPrice,
    currency: 'INR',
    gatewayOrderId: rzpOrder.id,
    paymentStatus: 'created',
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        registrationId: registration._id,
        orderId: rzpOrder.id,
        amount: event.ticketPrice,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        expiresInMinutes: 10,
      },
      'Ticket temporarily reserved. Proceed to Razorpay checkout.'
    )
  );
});

/**
 * Join Waitlist when Event is Full (Workflow 5)
 */
export const joinWaitlist = asyncHandler(async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user._id;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const existingWaitlist = await Waitlist.findOne({ eventId, userId });
  if (existingWaitlist) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { waitlist: existingWaitlist },
        `You are already on the waitlist at position #${existingWaitlist.position}`
      )
    );
  }

  const highestPos = await Waitlist.findOne({ eventId }).sort({ position: -1 });
  const position = highestPos ? highestPos.position + 1 : 1;

  const waitlist = await Waitlist.create({
    eventId,
    userId,
    position,
    status: 'waiting',
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { waitlist },
      `Successfully joined waitlist at position #${position}`
    )
  );
});

/**
 * Get Current User Registrations (/api/v1/registrations/my)
 */
export const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ userId: req.user._id })
    .populate('eventId')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { registrations }, 'User registrations fetched')
  );
});

/**
 * Cancel Registration & Request Refund (/api/v1/registrations/:id/cancel)
 */
export const cancelRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const registration = await Registration.findById(id).populate('eventId');

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  if (registration.userId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this registration');
  }

  if (registration.bookingStatus === 'cancelled') {
    throw new ApiError(400, 'Registration is already cancelled');
  }

  registration.bookingStatus = 'cancelled';
  await registration.save();

  // Cancel associated ticket
  await Ticket.findOneAndUpdate(
    { registrationId: registration._id },
    { $set: { ticketStatus: 'cancelled' } }
  );

  // Mark payment refund_pending if paid
  const payment = await Payment.findOne({ registrationId: registration._id });
  if (payment && payment.paymentStatus === 'paid') {
    payment.paymentStatus = 'refund_pending';
    await payment.save();
  }

  return res.status(200).json(
    new ApiResponse(200, { registration, payment }, 'Booking cancelled successfully. Refund initiated if applicable.')
  );
});

/**
 * Get Event Registrations for Organizer / Admin (/api/v1/registrations)
 */
export const getEventRegistrations = asyncHandler(async (req, res) => {
  const { eventId, status, ticketType } = req.query;
  const query = {};
  if (eventId) query.eventId = eventId;
  if (status) query.bookingStatus = status;
  if (ticketType) query.ticketType = ticketType;

  const registrations = await Registration.find(query)
    .populate('userId', 'name email phone avatar')
    .populate('eventId', 'title startDate venueId ticketPrice')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { registrations }, 'Event registrations fetched successfully')
  );
});

export default {
  registerForEvent,
  joinWaitlist,
  getMyRegistrations,
  cancelRegistration,
  getEventRegistrations,
};
