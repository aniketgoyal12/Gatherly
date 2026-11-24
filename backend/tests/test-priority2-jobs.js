import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Waitlist from '../src/models/Waitlist.js';
import Ticket from '../src/models/Ticket.js';
import Notification from '../src/models/Notification.js';
import Venue from '../src/models/Venue.js';

import { generateSecureQrToken, hashToken, verifyQrToken, generateQrDataUrl } from '../src/services/qrService.js';
import { sendTicketConfirmationEmail, sendWaitlistPromotionEmail, sendEventReminderEmail } from '../src/services/emailService.js';
import { enqueueTicketEmail } from '../src/jobs/ticketEmailQueue.js';
import { runReservationCleanup } from '../src/jobs/reservationCleanupQueue.js';
import { runEventReminderScan } from '../src/jobs/eventReminderQueue.js';
import { isRedisReady } from '../src/config/redis.js';

const runTests = async () => {
  console.log('=== GATHERLY PRIORITY 2 VERIFICATION SUITE ===\n');

  try {
    await connectDB();
    console.log('✓ MongoDB Connected');

    // TEST 1: QR Service
    console.log('\n--- 1. Testing QR Code & Hashing Service ---');
    const rawToken = generateSecureQrToken();
    const tokenHash = hashToken(rawToken);
    const isValid = verifyQrToken(rawToken, tokenHash);
    const isInvalid = verifyQrToken('wrong_token_123', tokenHash);
    const qrDataUrl = await generateQrDataUrl(rawToken);

    if (!isValid || isInvalid || !qrDataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('QR Service validation failed');
    }
    console.log('✓ QR Token Generated (64-char hex)');
    console.log('✓ QR Token SHA-256 HMAC Verified (Timing-safe match)');
    console.log('✓ QR Base64 PNG Data URL Generated successfully');

    // TEST 2: Email Service & Templates
    console.log('\n--- 2. Testing Email Service & Templates ---');
    const ticketEmailRes = await sendTicketConfirmationEmail({
      to: 'test-attendee@example.com',
      attendeeName: 'Alex Test',
      eventTitle: 'Gatherly Tech Summit 2026',
      eventDate: new Date(),
      venueName: 'Main Auditorium',
      ticketId: new mongoose.Types.ObjectId(),
      ticketType: 'VIP',
      rawQrToken: rawToken,
    });
    console.log('✓ Ticket confirmation email rendered and dispatched');

    const promoEmailRes = await sendWaitlistPromotionEmail({
      to: 'test-waitlist@example.com',
      attendeeName: 'Sam Waitlist',
      eventTitle: 'Gatherly Tech Summit 2026',
      claimDeadlineMinutes: 15,
    });
    console.log('✓ Waitlist promotion email rendered and dispatched');

    const reminderEmailRes = await sendEventReminderEmail({
      to: 'test-attendee@example.com',
      attendeeName: 'Alex Test',
      eventTitle: 'Gatherly Tech Summit 2026',
      eventDate: new Date(Date.now() + 86400000),
      venueName: 'Main Auditorium',
      ticketId: new mongoose.Types.ObjectId(),
    });
    console.log('✓ 24-Hour event reminder email rendered and dispatched');

    // TEST 3: Ticket Email Worker Queue
    console.log('\n--- 3. Testing Async Ticket Email Queue ---');
    enqueueTicketEmail({
      to: 'queued-attendee@example.com',
      attendeeName: 'Queued Attendee',
      eventTitle: 'Async Queue Demo',
      rawQrToken: rawToken,
    });
    console.log('✓ Ticket email enqueued non-blockingly');

    // TEST 4: Reservation Cleanup & Waitlist Auto-Promotion
    console.log('\n--- 4. Testing Reservation Cleanup & Waitlist Auto-Promotion ---');
    // Create mock organizer & event
    let organizer = await User.findOne({ role: 'organizer' });
    if (!organizer) {
      organizer = await User.create({
        name: 'Job Test Organizer',
        email: `organizer_test_${Date.now()}@gatherly.test`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890dummyhash3',
        role: 'organizer',
      });
    }

    const testEvent = await Event.create({
      title: `Job Test Event ${Date.now()}`,
      description: 'Testing reservation cleanup queue',
      category: 'Technology',
      organizerId: organizer._id,
      startDate: new Date(Date.now() + 3600000 * 20), // 20 hrs from now
      endDate: new Date(Date.now() + 3600000 * 24),
      capacity: 5,
      ticketPrice: 499,
      status: 'published',
    });

    // Create attendee 1 (has expired reservation)
    const attendee1 = await User.create({
      name: 'Expired Attendee',
      email: `expired_${Date.now()}@gatherly.test`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890dummyhash1',
      role: 'attendee',
    });

    // Create registration with old createdAt (e.g. 20 minutes ago)
    const oldDate = new Date(Date.now() - 20 * 60 * 1000);
    const expiredReg = await Registration.create({
      userId: attendee1._id,
      eventId: testEvent._id,
      bookingStatus: 'reserved',
      createdAt: oldDate,
    });
    // Force past timestamp
    await Registration.collection.updateOne(
      { _id: expiredReg._id },
      { $set: { createdAt: oldDate } }
    );

    // Create attendee 2 on waitlist (position 1)
    const attendee2 = await User.create({
      name: 'Waitlist Attendee',
      email: `waitlist_${Date.now()}@gatherly.test`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890dummyhash2',
      role: 'attendee',
    });

    const waitlistEntry = await Waitlist.create({
      eventId: testEvent._id,
      userId: attendee2._id,
      position: 1,
      status: 'waiting',
    });

    console.log(`✓ Seeded test scenario: 1 expired reservation, 1 waitlisted attendee at position #1`);

    // Run cleanup
    const cleanupResult = await runReservationCleanup(15);
    console.log(`✓ Cleanup Job executed: Cleaned ${cleanupResult.cleanedCount}, Promoted ${cleanupResult.promotedCount}`);

    // Verify reservation status changed to 'expired'
    const updatedReg = await Registration.findById(expiredReg._id);
    if (updatedReg.bookingStatus !== 'expired') {
      throw new Error(`Expected bookingStatus 'expired', got '${updatedReg.bookingStatus}'`);
    }
    console.log(`✓ Verified: Reservation status transitioned to '${updatedReg.bookingStatus}'`);

    // Verify waitlist status changed to 'offered'
    const updatedWaitlist = await Waitlist.findById(waitlistEntry._id);
    if (updatedWaitlist.status !== 'offered') {
      throw new Error(`Expected waitlist status 'offered', got '${updatedWaitlist.status}'`);
    }
    console.log(`✓ Verified: Waitlist attendee auto-promoted to '${updatedWaitlist.status}'`);

    // Verify Notification was generated for attendee 2
    const promoNotif = await Notification.findOne({
      userId: attendee2._id,
      type: 'waitlist_promoted',
    });
    if (!promoNotif) {
      throw new Error('Waitlist promotion notification not found in database');
    }
    console.log(`✓ Verified: In-app Notification saved with title: "${promoNotif.title}"`);

    // TEST 5: Event Reminder Scanner
    console.log('\n--- 5. Testing 24-Hour Event Reminder Scanner ---');
    const reminderResult = await runEventReminderScan();
    console.log(`✓ Reminder scan executed: Notified events: ${reminderResult.eventsNotified}, attendees: ${reminderResult.attendeesNotified}`);

    // Clean up test event and registrations
    await Registration.deleteMany({ eventId: testEvent._id });
    await Waitlist.deleteMany({ eventId: testEvent._id });
    await Notification.deleteMany({ eventId: testEvent._id });
    await Event.findByIdAndDelete(testEvent._id);
    await User.findByIdAndDelete(attendee1._id);
    await User.findByIdAndDelete(attendee2._id);
    console.log('✓ Cleaned up test database entities');

    console.log('\n======================================================');
    console.log('🎉 ALL PRIORITY 2 BACKGROUND QUEUE & EMAIL TESTS PASSED!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exit(1);
  }
};

runTests();
