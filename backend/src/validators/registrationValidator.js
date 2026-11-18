import { z } from 'zod';

export const reserveTicketSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  ticketType: z.enum(['free', 'standard', 'vip', 'early_bird']).default('standard'),
});

export const joinWaitlistSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
});

export default {
  reserveTicketSchema,
  joinWaitlistSchema,
};
