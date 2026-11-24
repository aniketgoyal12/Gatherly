import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Ticket from '../models/Ticket.js';
import Payment from '../models/Payment.js';
import Budget from '../models/Budget.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Organizer Event Analytics Dashboard (Workflow 7)
 */
export const getEventAnalytics = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId || req.params.id;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Verify ownership
  if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Forbidden: You do not have permission to view analytics for this event.');
  }

  // 1. Calculate Registrations
  const totalRegistrations = await Registration.countDocuments({
    eventId,
    bookingStatus: 'confirmed',
  });

  // 2. Calculate Checked-in Attendance
  const allRegs = await Registration.find({ eventId }).select('_id');
  const checkedInAttendance = await Ticket.countDocuments({
    registrationId: { $in: allRegs.map((r) => r._id) },
    ticketStatus: 'checked_in',
  });

  // 3. Calculate No-Show Percentage (Workflow 7)
  const noShowCount = Math.max(0, totalRegistrations - checkedInAttendance);
  const noShowPercentage = totalRegistrations > 0
    ? ((noShowCount / totalRegistrations) * 100).toFixed(1)
    : 0;

  // 4. Calculate Revenue from paid payments
  const paidPayments = await Payment.find({
    registrationId: { $in: allRegs.map((r) => r._id) },
    paymentStatus: 'paid',
  });
  const grossRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // 5. Calculate Actual Expenses from budgets
  const budget = await Budget.findOne({ eventId });
  const actualExpenses = budget?.actualExpenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const netProfit = grossRevenue - actualExpenses;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        eventId,
        eventTitle: event.title,
        capacity: event.capacity,
        totalRegistrations,
        checkedInAttendance,
        noShowCount,
        noShowPercentage: Number(noShowPercentage),
        financials: {
          grossRevenue,
          actualExpenses,
          netProfit,
          plannedBudget: budget?.totalBudget || 0,
        },
      },
      'Event analytics calculated successfully'
    )
  );
});

export default {
  getEventAnalytics,
};
