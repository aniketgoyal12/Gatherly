import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  review: z.string().optional().default(''),
});

export default {
  submitFeedbackSchema,
};
