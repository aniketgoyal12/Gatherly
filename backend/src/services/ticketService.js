import Ticket from '../models/Ticket.js';
import Registration from '../models/Registration.js';
import ApiError from '../utils/apiError.js';
import { generateSecureQrToken, hashToken, verifyQrToken } from './qrService.js';

/**
 * Ticket & Check-in Service (Workflow 9)
 */

export const issueTicketForRegistration = async (registrationId) => {
  const existingTicket = await Ticket.findOne({ registrationId });
  if (existingTicket) {
    return { ticket: existingTicket, rawQrToken: null, isNew: false };
  }

  const rawQrToken = generateSecureQrToken();
  const tokenHash = hashToken(rawQrToken);

  const ticket = await Ticket.create({
    registrationId,
    tokenHash,
    ticketStatus: 'valid',
  });

  return { ticket, rawQrToken, isNew: true };
};

export const checkInAttendee = async (rawQrToken, staffUserId) => {
  if (!rawQrToken) {
    throw new ApiError(400, 'QR Token is required for check-in');
  }

  // Compute token hash to find matching ticket
  const computedHash = hashToken(rawQrToken);

  const ticket = await Ticket.findOne({ tokenHash: computedHash })
    .populate({
      path: 'registrationId',
      populate: [
        { path: 'userId', select: 'name email role' },
        { path: 'eventId', select: 'title startDate endDate status venueId' },
      ],
    });

  if (!ticket) {
    throw new ApiError(404, 'Invalid or unrecognized QR ticket');
  }

  // Check if ticket is valid
  if (ticket.ticketStatus === 'checked_in') {
    throw new ApiError(409, 'Ticket has already been checked in', [
      { checkedInAt: ticket.checkedInAt, ticketId: ticket._id },
    ]);
  }

  if (ticket.ticketStatus !== 'valid') {
    throw new ApiError(400, `Ticket is not valid for entry (Status: ${ticket.ticketStatus})`);
  }

  // Mark ticket checked in atomically
  ticket.ticketStatus = 'checked_in';
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = staffUserId;
  await ticket.save();

  return {
    ticket,
    attendee: ticket.registrationId?.userId,
    event: ticket.registrationId?.eventId,
  };
};

export default {
  issueTicketForRegistration,
  checkInAttendee,
};
