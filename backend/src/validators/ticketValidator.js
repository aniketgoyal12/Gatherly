import { z } from 'zod';

export const checkInSchema = z.object({
  qrToken: z.string().min(1, 'QR Token is required'),
  eventId: z.string().min(1, 'Event ID is required'),
});

export default {
  checkInSchema,
};
