import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import '../models/Venue.js';
import { emitToRoom } from '../config/socket.js';
import { sendEventReminderEmail } from '../services/emailService.js';

/**
 * 24-Hour Event Reminder Scanner
 * 
 * Periodically detects published events starting within the next 24 hours.
 * Dispatches both in-app notification and email reminders to all confirmed attendees.
 */

let reminderTimer = null;

export const runEventReminderScan = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Find published events starting in 24 hours that haven't sent reminders yet
    const upcomingEvents = await Event.find({
      status: 'published',
      startDate: { $gte: now, $lte: in24Hours },
      reminderSent: { $ne: true },
    }).populate('venueId');

    if (upcomingEvents.length === 0) {
      return { eventsNotified: 0, attendeesNotified: 0 };
    }

    console.log(`[Event Reminder Queue] Found ${upcomingEvents.length} event(s) scheduled within 24 hours`);

    let totalAttendeesNotified = 0;

    for (const event of upcomingEvents) {
      // Find all confirmed registrations
      const registrations = await Registration.find({
        eventId: event._id,
        bookingStatus: 'confirmed',
      }).populate('userId');

      const venueName = event.venueId?.name || 'Assigned Venue';

      for (const reg of registrations) {
        if (!reg.userId) continue;

        const attendee = reg.userId;
        const attendeeName = attendee.name || 'Attendee';
        const attendeeEmail = attendee.email;

        // 1. Create in-app notification
        await Notification.create({
          userId: attendee._id,
          title: `Reminder: "${event.title}" is tomorrow!`,
          message: `Your event starts within 24 hours at ${venueName}. Have your QR pass ready.`,
          type: 'event_reminder',
          eventId: event._id,
        });

        // 2. Real-time WebSocket ping
        emitToRoom(`user_${attendee._id}`, 'event_reminder', {
          eventId: event._id,
          title: event.title,
          startDate: event.startDate,
          venueName,
        });

        // 3. Dispatch Email
        if (attendeeEmail) {
          sendEventReminderEmail({
            to: attendeeEmail,
            attendeeName,
            eventTitle: event.title,
            eventDate: event.startDate,
            venueName,
            ticketId: reg._id,
          }).catch((err) => console.warn('[Event Reminder Queue] Email sending warning:', err.message));
        }

        totalAttendeesNotified++;
      }

      // Mark event so reminder is not sent repeatedly
      event.reminderSent = true;
      await event.save();

      console.log(`[Event Reminder Queue] Reminded ${registrations.length} attendee(s) for event: "${event.title}"`);
    }

    return {
      eventsNotified: upcomingEvents.length,
      attendeesNotified: totalAttendeesNotified,
    };
  } catch (error) {
    console.error('[Event Reminder Queue] Scan error:', error.message);
    return { error: error.message };
  }
};

/**
 * Start the recurring event reminder scan job (default: every 30 minutes)
 */
export const startEventReminderJob = ({ intervalMs = 30 * 60 * 1000 } = {}) => {
  if (reminderTimer) {
    clearInterval(reminderTimer);
  }

  console.log(`[Event Reminder Queue] Scheduled scanner (interval: ${intervalMs / 1000 / 60}m)`);

  // Initial scan on startup
  runEventReminderScan();

  reminderTimer = setInterval(() => {
    runEventReminderScan();
  }, intervalMs);

  return reminderTimer;
};

export const stopEventReminderJob = () => {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
    console.log('[Event Reminder Queue] Scanner stopped.');
  }
};

export default {
  runEventReminderScan,
  startEventReminderJob,
  stopEventReminderJob,
};
