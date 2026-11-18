import Venue from '../models/Venue.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getVenues = asyncHandler(async (req, res) => {
  const venues = await Venue.find().sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { venues }, 'Venues fetched successfully'));
});

export const getVenueById = asyncHandler(async (req, res) => {
  const venue = await Venue.findById(req.params.id);
  if (!venue) {
    throw new ApiError(404, 'Venue not found');
  }
  return res.status(200).json(new ApiResponse(200, { venue }, 'Venue details fetched'));
});

export const createVenue = asyncHandler(async (req, res) => {
  const { name, address, capacity, facilities } = req.body;
  const venue = await Venue.create({
    name,
    address,
    capacity,
    facilities: facilities || [],
  });
  return res.status(201).json(new ApiResponse(201, { venue }, 'Venue created successfully'));
});

export default {
  getVenues,
  getVenueById,
  createVenue,
};
