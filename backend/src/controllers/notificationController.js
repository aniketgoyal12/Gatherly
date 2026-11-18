import Notification from '../models/Notification.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, readStatus: false });

  return res.status(200).json(
    new ApiResponse(200, { notifications, unreadCount }, 'Notifications fetched')
  );
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { $set: { readStatus: true } },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return res.status(200).json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id }, { $set: { readStatus: true } });
  return res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

export default {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
