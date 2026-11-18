import Feedback from '../models/Feedback.js';
import Registration from '../models/Registration.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Submit Attendee Feedback (Workflow 7)
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const { eventId, rating, review } = req.body;
  const userId = req.user._id;

  // 1. Verify user was registered for this event
  const registration = await Registration.findOne({
    eventId,
    userId,
    bookingStatus: 'confirmed',
  });

  if (!registration) {
    throw new ApiError(403, 'Only confirmed event attendees can submit reviews.');
  }

  // 2. Determine sentiment (rule-based fallback until FastAPI AI service connects)
  let sentiment = 'neutral';
  if (rating >= 4) sentiment = 'positive';
  else if (rating <= 2) sentiment = 'negative';

  // 3. Upsert feedback (one review per user per event)
  const feedback = await Feedback.findOneAndUpdate(
    { eventId, userId },
    {
      rating,
      review: review || '',
      sentiment,
    },
    { new: true, upsert: true }
  );

  return res.status(201).json(new ApiResponse(201, { feedback }, 'Feedback submitted successfully'));
});

/**
 * Get Feedback for Event (Workflow 7)
 */
export const getEventFeedback = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const reviews = await Feedback.find({ eventId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        summary: {
          totalReviews,
          averageRating: Number(avgRating),
        },
      },
      'Event feedback fetched'
    )
  );
});

export default {
  submitFeedback,
  getEventFeedback,
};
