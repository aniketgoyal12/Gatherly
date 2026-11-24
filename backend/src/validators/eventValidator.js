import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  venueId: z.string().optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  capacity: z.number().int().positive('Capacity must be greater than 0'),
  ticketPrice: z.number().min(0, 'Ticket price cannot be negative').default(0),
});

export const updateEventSchema = createEventSchema.partial();

export const approveRejectSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

export const assignStaffSchema = z.object({
  email: z.string().email('Valid email is required'),
  gate: z.string().optional(),
});

export const setBudgetSchema = z.object({
  eventId: z.string().optional(),
  totalBudget: z.number().positive('Total budget must be a positive number'),
  expenseCategories: z.array(
    z.object({
      category: z.string(),
      allocatedAmount: z.number().min(0),
    })
  ).optional(),
});

export const addExpenseSchema = z.object({
  eventId: z.string().optional(),
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().positive('Expense amount must be positive'),
  category: z.string().optional(),
});

export default {
  createEventSchema,
  updateEventSchema,
  approveRejectSchema,
  assignStaffSchema,
  setBudgetSchema,
  addExpenseSchema,
};
