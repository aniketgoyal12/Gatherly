import Sponsor from '../models/Sponsor.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getSponsorsByEvent = asyncHandler(async (req, res) => {
  const sponsors = await Sponsor.find({ eventId: req.params.eventId }).sort({ amount: -1 });
  return res.status(200).json(new ApiResponse(200, { sponsors }, 'Event sponsors fetched'));
});

export const addSponsor = asyncHandler(async (req, res) => {
  const { eventId, companyName, package: pkg, amount, deliverables } = req.body;
  const sponsor = await Sponsor.create({
    eventId,
    companyName,
    package: pkg,
    amount: amount || 0,
    deliverables: deliverables || [],
  });
  return res.status(201).json(new ApiResponse(201, { sponsor }, 'Sponsor added'));
});

export default {
  getSponsorsByEvent,
  addSponsor,
};
