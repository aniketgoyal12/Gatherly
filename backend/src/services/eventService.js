import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import ApiError from '../utils/apiError.js';

/**
 * Event Management Service
 * Handles event lifecycle, capacity calculations, and availability checks
 */

export const getEventWithStats = async (eventId) => {
  const event = await Event.findById(eventId)
    .populate('organizerId', 'name email role')
    .populate('venueId');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Calculate current registration stats
  const [confirmedCount, reservedCount] = await Promise.all([
    Registration.countDocuments({ eventId, bookingStatus: 'confirmed' }),
    Registration.countDocuments({ eventId, bookingStatus: 'reserved' }),
  ]);

  const activeBookings = confirmedCount + reservedCount;
  const availableCapacity = Math.max(0, event.capacity - activeBookings);

  return {
    event,
    stats: {
      capacity: event.capacity,
      confirmedAttendees: confirmedCount,
      reservedAttendees: reservedCount,
      availableCapacity,
      isSoldOut: availableCapacity === 0,
    },
  };
};

export const checkVenueConflict = async (venueId, startDate, endDate, excludeEventId = null) => {
  if (!venueId) return false;

  const query = {
    venueId,
    status: { $in: ['published', 'pending_approval'] },
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
    ],
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const conflictingEvent = await Event.findOne(query);
  return Boolean(conflictingEvent);
};

export const transitionEventStatus = async (eventId, newStatus, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const validTransitions = {
    draft: ['pending_approval', 'cancelled'],
    pending_approval: ['published', 'rejected', 'draft'],
    published: ['completed', 'cancelled'],
    rejected: ['draft'],
    completed: [],
    cancelled: [],
  };

  const allowed = validTransitions[event.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition event from '${event.status}' to '${newStatus}'`);
  }

  event.status = newStatus;
  if (newStatus === 'published') {
    event.approvedBy = user._id;
  }

  await event.save();
  return event;
};

export default {
  getEventWithStats,
  checkVenueConflict,
  transitionEventStatus,
};
