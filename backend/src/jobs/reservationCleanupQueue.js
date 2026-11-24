import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Waitlist from '../models/Waitlist.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { emitToRoom } from '../config/socket.js';
import { sendWaitlistPromotionEmail } from '../services/emailService.js';

/**
 * Reservation Cleanup & Waitlist Auto-Promotion Queue (Workflow 5 & ADR-005)
 * 
 * Rules:
 * 1. Scans for temporary reservations in 'reserved' state older than 15 minutes (TTL).
 * 2. Marks them 'expired' and sets associated uncaptured payment to 'failed'.
 * 3. Inspects Waitlist for the corresponding event in strict FIFO order (lowest position).
 * 4. Auto-promotes the first attendee in queue from 'waiting' -> 'offered'.
 * 5. Dispatches real-time Socket.IO alert + in-app notification + email notification with 15m claim window.
 */

let timer = null;
const DEFAULT_TTL_MINUTES = 15;

export const runReservationCleanup = async (ttlMinutes = DEFAULT_TTL_MINUTES) => {
  const expiryCutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

  try {
    // 1. Find all expired reservations
    const expiredReservations = await Registration.find({
      bookingStatus: 'reserved',
      createdAt: { $lt: expiryCutoff },
    }).populate('eventId');

    if (expiredReservations.length === 0) {
      return { cleanedCount: 0, promotedCount: 0 };
    }

    console.log(`[Reservation Cleanup] Found ${expiredReservations.length} expired reservation(s)`);

    let cleanedCount = 0;
    let promotedCount = 0;

    for (const reg of expiredReservations) {
      // 2. Mark reservation expired
      reg.bookingStatus = 'expired';
      await reg.save();
      cleanedCount++;

      // 3. Mark any open Razorpay payment order as expired/failed
      await Payment.updateMany(
        { registrationId: reg._id, paymentStatus: 'created' },
        { paymentStatus: 'failed' }
      );

      const eventId = reg.eventId?._id || reg.eventId;
      const eventTitle = reg.eventId?.title || 'Gatherly Event';

      // 4. Notify user that their reservation expired
      await Notification.create({
        userId: reg.userId,
        title: 'Reservation Expired',
        message: `Your reserved ticket for "${eventTitle}" has expired due to 15-minute checkout timeout.`,
        type: 'reservation_expired',
        eventId,
      });

      emitToRoom(`user_${reg.userId}`, 'reservation_expired', {
        registrationId: reg._id,
        eventId,
      });

      // 5. Check Waitlist for this event (FIFO by lowest position)
      const nextInLine = await Waitlist.findOne({
        eventId,
        status: 'waiting',
      })
        .sort({ position: 1 })
        .populate('userId');

      if (nextInLine && nextInLine.userId) {
        // Promote waitlisted attendee to 'offered'
        nextInLine.status = 'offered';
        await nextInLine.save();
        promotedCount++;

        const attendeeUser = nextInLine.userId;
        const attendeeName = attendeeUser.name || 'Attendee';
        const attendeeEmail = attendeeUser.email;

        // Create in-app Notification
        await Notification.create({
          userId: attendeeUser._id,
          title: '🎉 Waitlist Alert: Seat Available!',
          message: `A ticket opened up for "${eventTitle}". You have 15 minutes to claim your spot!`,
          type: 'waitlist_promoted',
          eventId,
        });

        // Real-time WebSocket Alert
        emitToRoom(`user_${attendeeUser._id}`, 'waitlist_promoted', {
          eventId,
          eventTitle,
          waitlistId: nextInLine._id,
          claimMinutes: 15,
        });

        // Email Alert with direct claim link
        if (attendeeEmail) {
          sendWaitlistPromotionEmail({
            to: attendeeEmail,
            attendeeName,
            eventTitle,
            claimDeadlineMinutes: 15,
            claimUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}`,
          }).catch((err) => console.warn('[Reservation Cleanup] Promotion email warning:', err.message));
        }

        console.log(`[Reservation Cleanup] Promoted waitlist user ${attendeeUser._id} for event "${eventTitle}"`);
      }
    }

    return { cleanedCount, promotedCount };
  } catch (error) {
    console.error('[Reservation Cleanup] Execution error:', error.message);
    return { error: error.message };
  }
};

/**
 * Start the Scheduled Background Cleanup Job
 */
export const startReservationCleanupJob = ({ intervalMs = 60000, ttlMinutes = DEFAULT_TTL_MINUTES } = {}) => {
  if (timer) {
    clearInterval(timer);
  }

  console.log(`[Reservation Cleanup] Background job scheduled (interval: ${intervalMs / 1000}s, TTL: ${ttlMinutes}m)`);
  
  // Run an immediate scan on launch
  runReservationCleanup(ttlMinutes);

  timer = setInterval(() => {
    runReservationCleanup(ttlMinutes);
  }, intervalMs);

  return timer;
};

/**
 * Stop the background cleanup job
 */
export const stopReservationCleanupJob = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[Reservation Cleanup] Background job stopped.');
  }
};

export default {
  runReservationCleanup,
  startReservationCleanupJob,
  stopReservationCleanupJob,
};
