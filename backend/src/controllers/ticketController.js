import Ticket from '../models/Ticket.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import EventStaff from '../models/EventStaff.js';
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { hashToken } from '../utils/hashQr.js';
import { emitToRoom } from '../config/socket.js';

/**
 * Get Current User's Tickets (/api/v1/tickets/my-tickets)
 */
export const getMyTickets = asyncHandler(async (req, res) => {
  // Find all registrations for this user
  const registrations = await Registration.find({ userId: req.user._id });
  const regIds = registrations.map((r) => r._id);

  const tickets = await Ticket.find({ registrationId: { $in: regIds } })
    .populate({
      path: 'registrationId',
      populate: { path: 'eventId', select: 'title category startDate endDate venueId' },
    })
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { tickets }, 'Tickets retrieved successfully'));
});

/**
 * Staff QR Check-In Scanner API (Workflow 9)
 */
export const checkInTicket = asyncHandler(async (req, res) => {
  const { qrToken, eventId } = req.body;
  const staffId = req.user._id;

  // 1. Verify staff is assigned to this event (or organizer / admin)
  if (req.user.role === 'staff') {
    const isAssigned = await EventStaff.findOne({ eventId, userId: staffId });
    if (!isAssigned) {
      throw new ApiError(403, 'Unauthorized: Staff member is not assigned to this event.');
    }
  }

  // 2. Hash received QR token using SHA-256 (matches Workflow 9 & ADR-007)
  const computedHash = hashToken(qrToken);

  // 3. Find ticket using token hash
  const ticket = await Ticket.findOne({ tokenHash: computedHash }).populate('registrationId');
  if (!ticket) {
    throw new ApiError(404, 'Invalid ticket. QR code does not match any issued ticket.');
  }

  // 4. Verify ticket belongs to the event being scanned
  if (ticket.registrationId.eventId.toString() !== eventId) {
    throw new ApiError(400, 'Ticket is for a different event, not the selected event.');
  }

  // 5. Check ticket status (Valid vs Checked-In vs Cancelled) (Workflow 9)
  if (ticket.ticketStatus === 'checked_in') {
    throw new ApiError(409, 'Ticket Already Used', [
      {
        issue: 'This ticket was already checked in previously.',
        checkedInAt: ticket.checkedInAt,
      },
    ]);
  }

  if (ticket.ticketStatus !== 'valid') {
    throw new ApiError(400, `Entry Denied: Ticket is ${ticket.ticketStatus}.`);
  }

  // 6. Atomically mark ticket as checked_in
  ticket.ticketStatus = 'checked_in';
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = staffId;
  await ticket.save();

  // 7. Calculate live event check-in count
  const allEventRegs = await Registration.find({ eventId }).select('_id');
  const checkedInCount = await Ticket.countDocuments({
    registrationId: { $in: allEventRegs.map((r) => r._id) },
    ticketStatus: 'checked_in',
  });

  // 8. Emit live check-in update via Socket.IO (Workflow 9)
  emitToRoom(`event_${eventId}_staff`, 'live_checkin_update', {
    eventId,
    checkedInCount,
    lastCheckedInAt: ticket.checkedInAt,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        valid: true,
        ticket: {
          id: ticket._id,
          ticketStatus: ticket.ticketStatus,
          checkedInAt: ticket.checkedInAt,
        },
        liveTotalCheckedIn: checkedInCount,
      },
      'Ticket verified successfully. Entry granted.'
    )
  );
});

/**
 * Fetch Events Assigned to Current Staff Member (Workflow 9)
 */
export const getAssignedStaffEvents = asyncHandler(async (req, res) => {
  const staffAssignments = await EventStaff.find({ userId: req.user._id }).populate('eventId');
  const events = staffAssignments.map((a) => a.eventId).filter(Boolean);

  return res.status(200).json(
    new ApiResponse(200, { events }, 'Assigned staff events retrieved successfully')
  );
});

export default {
  getMyTickets,
  checkInTicket,
  getAssignedStaffEvents,
};
