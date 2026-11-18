import Task from '../models/Task.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { emitToRoom } from '../config/socket.js';

/**
 * Create Task (Workflow 3)
 */
export const createTask = asyncHandler(async (req, res) => {
  const { eventId, assignedTo, title, deadline, priority } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const task = await Task.create({
    eventId,
    assignedTo: assignedTo || null,
    title,
    deadline: deadline ? new Date(deadline) : null,
    priority: priority || 'medium',
    status: 'pending',
  });

  // If assigned to a staff member, send notification (Workflow 3)
  if (assignedTo) {
    await Notification.create({
      userId: assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned to: "${title}" for event "${event.title}".`,
      type: 'task_assigned',
    });

    emitToRoom(`user_${assignedTo}`, 'task_assigned', {
      taskId: task._id,
      title: task.title,
    });
  }

  return res.status(201).json(new ApiResponse(201, { task }, 'Task created successfully'));
});

/**
 * Get Tasks for Event / Assigned User (Workflow 3)
 */
export const getTasks = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const query = {};

  if (eventId) {
    query.eventId = eventId;
  }

  // If staff, can filter by assignedTo
  if (req.user.role === 'staff') {
    query.assignedTo = req.user._id;
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .sort({ deadline: 1 });

  return res.status(200).json(new ApiResponse(200, { tasks }, 'Tasks fetched successfully'));
});

/**
 * Update Task Status: To Do -> In Progress -> Done (Workflow 3)
 */
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const task = await Task.findById(id).populate('eventId');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  task.status = status;
  await task.save();

  // Notify event organizer when task is completed
  if (status === 'completed' && task.eventId?.organizerId) {
    await Notification.create({
      userId: task.eventId.organizerId,
      title: 'Task Completed',
      message: `Task "${task.title}" has been marked as Completed by staff.`,
      type: 'event_update',
    });

    emitToRoom(`user_${task.eventId.organizerId}`, 'task_completed', {
      taskId: task._id,
      title: task.title,
    });
  }

  return res.status(200).json(new ApiResponse(200, { task }, 'Task status updated'));
});

export default {
  createTask,
  getTasks,
  updateTaskStatus,
};
