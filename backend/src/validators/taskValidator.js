import { z } from 'zod';

export const createTaskSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  assignedTo: z.string().optional().nullable(),
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  deadline: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
});

export default {
  createTaskSchema,
  updateTaskStatusSchema,
};
