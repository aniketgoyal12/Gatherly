import User from '../models/User.js';
import Event from '../models/Event.js';
import AuditLog from '../models/AuditLog.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Super Admin: Get All Users (Workflow 2)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { users }, 'Users fetched successfully'));
});

/**
 * Super Admin: Suspend or Activate User Account (Workflow 2)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accountStatus } = req.body;

  if (!['active', 'suspended'].includes(accountStatus)) {
    throw new ApiError(400, "Invalid status. Must be 'active' or 'suspended'.");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.accountStatus = accountStatus;
  await user.save();

  // Record audit log
  await AuditLog.create({
    userId: req.user._id,
    action: `USER_${accountStatus.toUpperCase()}`,
    entityType: 'User',
    entityId: user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, { user: { id: user._id, accountStatus: user.accountStatus } }, `User status updated to ${accountStatus}`)
  );
});

/**
 * Super Admin: Get Pending Events for Approval (Workflow 6)
 */
export const getPendingEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ status: 'pending_approval' })
    .populate('organizerId', 'name email')
    .populate('venueId')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { events }, 'Pending approval events fetched'));
});

/**
 * Super Admin: Get System Audit Logs
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .populate('userId', 'name email role')
    .sort({ timestamp: -1 })
    .limit(100);

  return res.status(200).json(new ApiResponse(200, { logs }, 'Audit logs fetched'));
});

export default {
  getAllUsers,
  toggleUserStatus,
  getPendingEvents,
  getAuditLogs,
};
