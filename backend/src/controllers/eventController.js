import bcrypt from 'bcrypt';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import EventStaff from '../models/EventStaff.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { emitToRoom } from '../config/socket.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Public Discovery: Search & Filter Events (Workflow 5)
 */
export const getEvents = asyncHandler(async (req, res) => {
  const { search, q, category, startDate, endDate, status = 'published', page = 1, limit = 10 } = req.query;
  const searchTerm = search || q;

  const query = {};

  // For public users, default to published only
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'organizer') {
    query.status = 'published';
  } else if (status) {
    query.status = status;
  }

  if (category && category !== 'All') {
    query.category = { $regex: new RegExp(category, 'i') };
  }

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Event.countDocuments(query);
  const events = await Event.find(query)
    .populate('venueId', 'name address capacity facilities')
    .populate('organizerId', 'name email')
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        events,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      'Events fetched successfully'
    )
  );
});

/**
 * Get Single Event Details (Workflow 5)
 */
export const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id)
    .populate('venueId')
    .populate('organizerId', 'name email');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  return res.status(200).json(new ApiResponse(200, { event }, 'Event details fetched'));
});

/**
 * Create Event (Saved as Draft) (Workflow 6)
 */
export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, venueId, startDate, endDate, capacity, ticketPrice } = req.body;

  // Validate venue exists if provided
  if (venueId) {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw new ApiError(404, 'Specified venue does not exist');
    }
    if (capacity > venue.capacity) {
      throw new ApiError(400, `Event capacity (${capacity}) cannot exceed venue maximum capacity (${venue.capacity})`);
    }
  }

  const event = await Event.create({
    title,
    description,
    category,
    organizerId: req.user._id,
    venueId: venueId || null,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    capacity,
    ticketPrice: ticketPrice || 0,
    status: 'draft',
  });

  return res.status(201).json(new ApiResponse(201, { event }, 'Event created successfully as draft'));
});

/**
 * Edit Event Details (Workflow 6)
 * Only events in 'draft' or 'rejected' status can be modified by organizers.
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Ownership verification
  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not have permission to edit this event');
  }

  // State guard: Organizers cannot modify published or completed events directly
  if (req.user.role !== 'super_admin' && !['draft', 'rejected'].includes(event.status)) {
    throw new ApiError(
      400,
      `Cannot edit event with status '${event.status}'. Only draft or rejected events can be edited.`
    );
  }

  Object.assign(event, req.body);
  await event.save();

  return res.status(200).json(new ApiResponse(200, { event }, 'Event updated successfully'));
});

/**
 * Submit Event for Approval (Workflow 6)
 */
export const submitForApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the event organizer can submit this event for approval');
  }

  if (event.status !== 'draft' && event.status !== 'rejected') {
    throw new ApiError(400, `Cannot submit event with status '${event.status}' for approval`);
  }

  event.status = 'pending_approval';
  event.rejectionReason = null;
  await event.save();

  return res.status(200).json(
    new ApiResponse(200, { event }, 'Event submitted for Super Admin approval')
  );
});

/**
 * Super Admin Review: Approve or Reject Event (Workflow 6)
 */
export const reviewEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (action === 'approve') {
    event.status = 'published';
    event.approvedBy = req.user._id;
    event.rejectionReason = null;
    await event.save();

    // Notify organizer
    await Notification.create({
      userId: event.organizerId,
      title: 'Event Approved!',
      message: `Your event "${event.title}" has been approved and is now published.`,
      type: 'event_update',
    });

    emitToRoom(`user_${event.organizerId}`, 'notification', {
      title: 'Event Approved',
      eventId: event._id,
    });

    return res.status(200).json(new ApiResponse(200, { event }, 'Event approved and published'));
  } else if (action === 'reject') {
    if (!rejectionReason) {
      throw new ApiError(400, 'Rejection reason is required when rejecting an event');
    }

    event.status = 'rejected';
    event.rejectionReason = rejectionReason;
    await event.save();

    // Notify organizer with rejection reason
    await Notification.create({
      userId: event.organizerId,
      title: 'Event Needs Revision',
      message: `Your event "${event.title}" was rejected. Reason: ${rejectionReason}`,
      type: 'event_update',
    });

    emitToRoom(`user_${event.organizerId}`, 'notification', {
      title: 'Event Rejected',
      reason: rejectionReason,
      eventId: event._id,
    });

    return res.status(200).json(new ApiResponse(200, { event }, 'Event rejected with reason'));
  }

  throw new ApiError(400, "Invalid review action. Use 'approve' or 'reject'.");
});

/**
 * Organizer Cancels Event (Workflow 4 & 6)
 */
export const cancelEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this event');
  }

  event.status = 'cancelled';
  await event.save();

  // Find all active registrations to notify attendees
  const registrations = await Registration.find({
    eventId: event._id,
    bookingStatus: { $in: ['confirmed', 'reserved'] },
  });

  for (const reg of registrations) {
    await Notification.create({
      userId: reg.userId,
      title: 'Event Cancelled',
      message: `Notice: The event "${event.title}" has been cancelled. Refunds will be processed automatically.`,
      type: 'event_update',
    });

    // Mark associated payments as refund_pending
    await Payment.updateMany(
      { registrationId: reg._id, paymentStatus: 'paid' },
      { $set: { paymentStatus: 'refund_pending' } }
    );
  }

  emitToRoom(`event_${event._id}`, 'event_cancelled', {
    eventId: event._id,
    message: 'Event has been cancelled by the organizer.',
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { event, affectedAttendees: registrations.length },
      'Event cancelled and attendees notified. Bulk refunds scheduled.'
    )
  );
});

/**
 * Mark Event as Completed (Workflow 6 & 7)
 */
export const completeEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  event.status = 'completed';
  await event.save();

  const registrations = await Registration.find({ eventId: event._id, bookingStatus: 'confirmed' });
  for (const reg of registrations) {
    await Notification.create({
      userId: reg.userId,
      title: 'How was the event?',
      message: `Please share your feedback and review for "${event.title}".`,
      type: 'event_update',
    });
  }

  return res.status(200).json(new ApiResponse(200, { event }, 'Event marked as completed. Feedback requests dispatched.'));
});

/**
 * Upload or Replace Event Banner Image
 */
export const uploadEventBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not have permission to update this event banner');
  }

  if (!req.file) {
    throw new ApiError(400, "No image file provided. Upload an image using multipart field 'banner'.");
  }

  const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
    folder: 'gatherly/events',
    originalName: req.file.originalname,
  });

  if (event.bannerPublicId) {
    await deleteFromCloudinary(event.bannerPublicId).catch(() => {});
  }

  event.bannerUrl = uploaded.url;
  event.bannerPublicId = uploaded.publicId;
  await event.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        event,
        upload: {
          bannerUrl: uploaded.url,
          publicId: uploaded.publicId,
          storage: uploaded.storage,
        },
      },
      'Event banner uploaded successfully'
    )
  );
});

/**
 * Get Staff Assigned to Event (/api/v1/events/:eventId/staff)
 */
export const getEventStaff = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId || req.params.id;
  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this event');
  }

  const staffAssignments = await EventStaff.find({ eventId }).populate(
    'userId',
    'name email role phone accountStatus'
  );

  return res.status(200).json(
    new ApiResponse(200, { staff: staffAssignments }, 'Event staff assignments retrieved')
  );
});

/**
 * Assign Staff to Event (/api/v1/events/:eventId/staff)
 * If staff user does not exist, auto-create staff account with temporary password.
 */
export const assignStaffToEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId || req.params.id;
  const { email, gate } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this event');
  }

  let staffUser = await User.findOne({ email: email.toLowerCase() });
  let temporaryPassword = null;

  if (!staffUser) {
    // Generate temporary password
    temporaryPassword = `Staff@${Math.floor(100000 + Math.random() * 900000)}`;
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    staffUser = await User.create({
      name: email.split('@')[0],
      email: email.toLowerCase(),
      passwordHash,
      role: 'staff',
      accountStatus: 'active',
      mustChangePassword: true,
    });
  } else if (staffUser.role === 'attendee') {
    staffUser.role = 'staff';
    await staffUser.save();
  }

  let assignment = await EventStaff.findOne({ eventId, userId: staffUser._id });
  if (assignment) {
    if (gate !== undefined) assignment.gate = gate || null;
    await assignment.save();
  } else {
    assignment = await EventStaff.create({
      eventId,
      userId: staffUser._id,
      gate: gate || null,
    });
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        assignment: {
          id: assignment._id,
          eventId,
          gate: assignment.gate,
          user: {
            id: staffUser._id,
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
          },
        },
        temporaryPassword, // Provided only when a brand-new staff user is provisioned
      },
      'Staff member assigned to event successfully'
    )
  );
});

/**
 * Remove Staff Assignment (/api/v1/events/:eventId/staff/:staffId)
 */
export const removeStaffFromEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId || req.params.id;
  const { staffId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not own this event');
  }

  // Find assignment by assignment ID or userId
  const deleted = await EventStaff.findOneAndDelete({
    eventId,
    $or: [{ _id: staffId }, { userId: staffId }],
  });

  if (!deleted) {
    throw new ApiError(404, 'Staff assignment record not found for this event');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Staff member removed from event shift successfully')
  );
});

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  submitForApproval,
  reviewEvent,
  cancelEvent,
  completeEvent,
  uploadEventBanner,
  getEventStaff,
  assignStaffToEvent,
  removeStaffFromEvent,
};
