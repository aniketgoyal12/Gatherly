import Vendor from '../models/Vendor.js';
import EventVendor from '../models/EventVendor.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getVendors = asyncHandler(async (req, res) => {
  const { category, location } = req.query;
  const query = {};
  if (category) query.category = { $regex: new RegExp(category, 'i') };
  if (location) query.location = { $regex: new RegExp(location, 'i') };

  const vendors = await Vendor.find(query).sort({ rating: -1 });
  return res.status(200).json(new ApiResponse(200, { vendors }, 'Vendors fetched'));
});

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  return res.status(201).json(new ApiResponse(201, { vendor }, 'Vendor created'));
});

export const bookVendorForEvent = asyncHandler(async (req, res) => {
  const { eventId, vendorId, bookingStatus = 'inquiry' } = req.body;
  const eventVendor = await EventVendor.create({
    eventId,
    vendorId,
    bookingStatus,
  });
  return res.status(201).json(new ApiResponse(201, { eventVendor }, 'Vendor booked for event'));
});

export default {
  getVendors,
  createVendor,
  bookVendorForEvent,
};
