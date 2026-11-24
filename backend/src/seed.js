import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import {
  User,
  Venue,
  Event,
  Registration,
  Ticket,
  Payment,
  Budget,
  Task,
  EventStaff,
  Notification,
} from './models/index.js';
import { hashToken } from './utils/hashQr.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('\n=============================================');
    console.log('🌱 Starting Gatherly Database Seeding Process');
    console.log('=============================================\n');

    await connectDB();

    // 1. Clean existing seed collections
    console.log('[1/7] Cleaning existing test collections...');
    await Promise.all([
      User.deleteMany({}),
      Venue.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({}),
      Ticket.deleteMany({}),
      Payment.deleteMany({}),
      Budget.deleteMany({}),
      Task.deleteMany({}),
      EventStaff.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('  ✓ Collections cleared successfully.');

    // 2. Create standard password hash for all seed accounts: "Password@123"
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    // 3. Create 4 Seed Users (1 per role)
    console.log('[2/7] Seeding 4 role-based user accounts...');
    const users = await User.create([
      {
        name: 'Super Admin',
        email: 'admin@gatherly.com',
        phone: '+91 98111 00001',
        passwordHash,
        role: 'super_admin',
        interests: ['platform_governance', 'analytics', 'moderation'],
        accountStatus: 'active',
        isEmailVerified: true,
      },
      {
        name: 'Aarav Sharma (Organizer)',
        email: 'organizer@gatherly.com',
        phone: '+91 98222 00002',
        passwordHash,
        role: 'organizer',
        interests: ['tech', 'music', 'conferences'],
        accountStatus: 'active',
        isEmailVerified: true,
      },
      {
        name: 'Rohan Verma (Attendee)',
        email: 'attendee@gatherly.com',
        phone: '+91 98333 00003',
        passwordHash,
        role: 'attendee',
        interests: ['tech', 'hackathons', 'ai'],
        accountStatus: 'active',
        isEmailVerified: true,
      },
      {
        name: 'Priya Singh (Staff Scanner)',
        email: 'staff@gatherly.com',
        phone: '+91 98444 00004',
        passwordHash,
        role: 'staff',
        interests: ['event_operations', 'security'],
        accountStatus: 'active',
        isEmailVerified: true,
      },
    ]);

    const [adminUser, organizerUser, attendeeUser, staffUser] = users;
    console.log('  ✓ Seed users created with password: Password@123');

    // 4. Create Venues
    console.log('[3/7] Seeding venues...');
    const venues = await Venue.create([
      {
        name: 'Pragati Convention Grand Hall',
        address: 'Pragati Maidan, Mathura Road, New Delhi',
        capacity: 1200,
        facilities: ['High-Speed WiFi', 'Central AC', 'AV Setup', 'VIP Lounge', 'Parking'],
      },
      {
        name: 'Tech Auditorium Block A',
        address: 'Campus Complex, Hauz Khas, New Delhi',
        capacity: 500,
        facilities: ['Stage Projector', 'Surround Sound', 'Wheelchair Accessible', 'Cafeteria'],
      },
    ]);
    const [venueGrand, venueAuditorium] = venues;
    console.log('  ✓ 2 Venues created.');

    // 5. Create Realistic Sample Events
    console.log('[4/7] Seeding sample events...');
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
    const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead
    const futureDate3 = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days ahead

    const events = await Event.create([
      {
        title: 'Gatherly National AI & Web3 Hackathon 2026',
        description: 'A 36-hour flagship hackathon bringing together top collegiate engineers to build agentic AI systems.',
        category: 'tech',
        organizerId: organizerUser._id,
        venueId: venueGrand._id,
        startDate: futureDate1,
        endDate: new Date(futureDate1.getTime() + 36 * 60 * 60 * 1000),
        capacity: 400,
        ticketPrice: 499, // Paid event
        status: 'published',
        approvedBy: adminUser._id,
      },
      {
        title: 'Campus Indie Music Festival 2026',
        description: 'An evening of live unplugged music, open mic, food trucks, and indie collegiate bands.',
        category: 'music',
        organizerId: organizerUser._id,
        venueId: venueAuditorium._id,
        startDate: futureDate2,
        endDate: new Date(futureDate2.getTime() + 6 * 60 * 60 * 1000),
        capacity: 300,
        ticketPrice: 0, // Free event!
        status: 'published',
        approvedBy: adminUser._id,
      },
      {
        title: 'Inter-College Robotics League',
        description: 'Autonomous line follower and combat robot arena battles.',
        category: 'tech',
        organizerId: organizerUser._id,
        venueId: venueGrand._id,
        startDate: futureDate3,
        endDate: new Date(futureDate3.getTime() + 8 * 60 * 60 * 1000),
        capacity: 250,
        ticketPrice: 199,
        status: 'pending_approval', // Pending Super Admin approval
      },
    ]);

    const [eventHackathon, eventMusic] = events;
    console.log('  ✓ 3 Events created (Hackathon - Paid, Music Fest - Free, Robotics - Pending).');

    // 6. Assign Staff to Events
    console.log('[5/7] Assigning staff gate duty...');
    await EventStaff.create([
      {
        eventId: eventHackathon._id,
        userId: staffUser._id,
        gate: 'Gate A - North Concourse',
      },
      {
        eventId: eventMusic._id,
        userId: staffUser._id,
        gate: 'Gate B - Main Entrance',
      },
    ]);
    console.log('  ✓ Staff member assigned to Hackathon & Music Fest.');

    // 7. Seed Registrations, Payments & QR Tickets for Attendee
    console.log('[6/7] Seeding registrations, payments, and QR tickets...');

    // A. Confirmed Paid Ticket for Hackathon
    const regPaid = await Registration.create({
      userId: attendeeUser._id,
      eventId: eventHackathon._id,
      ticketType: 'standard',
      bookingStatus: 'confirmed',
    });

    const payment = await Payment.create({
      registrationId: regPaid._id,
      amount: 499,
      currency: 'INR',
      gatewayOrderId: 'order_seed_demo_98214',
      gatewayPaymentId: 'pay_seed_demo_77182',
      paymentStatus: 'paid',
    });

    // Known QR Token for Testing Gate Scanner:
    const DEMO_VALID_QR_TOKEN = 'GATHERLY_DEMO_QR_VALID_TOKEN_123';
    const demoTokenHash = hashToken(DEMO_VALID_QR_TOKEN);

    const validTicket = await Ticket.create({
      registrationId: regPaid._id,
      tokenHash: demoTokenHash,
      ticketStatus: 'valid',
    });

    // B. Confirmed Free Ticket for Music Fest
    const regFree = await Registration.create({
      userId: attendeeUser._id,
      eventId: eventMusic._id,
      ticketType: 'free',
      bookingStatus: 'confirmed',
    });

    const DEMO_USED_QR_TOKEN = 'GATHERLY_DEMO_QR_USED_TOKEN_456';
    const usedTokenHash = hashToken(DEMO_USED_QR_TOKEN);

    // This ticket is already checked_in to test duplicate scanning!
    const usedTicket = await Ticket.create({
      registrationId: regFree._id,
      tokenHash: usedTokenHash,
      ticketStatus: 'checked_in',
      checkedInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      checkedInBy: staffUser._id,
    });

    console.log('  ✓ 2 Tickets seeded:');
    console.log(`    - Valid Ticket Token (Ready to scan): "${DEMO_VALID_QR_TOKEN}"`);
    console.log(`    - Already-Used Ticket Token (To test duplicate rejection): "${DEMO_USED_QR_TOKEN}"`);

    // 8. Seed Budget & Tasks for Organizer
    console.log('[7/7] Seeding budget, tasks, and notifications...');
    await Budget.create({
      eventId: eventHackathon._id,
      totalBudget: 150000,
      expenseCategories: [
        { category: 'Venue & Power', allocatedAmount: 50000 },
        { category: 'Catering & Red Bull', allocatedAmount: 40000 },
        { category: 'Prizes & Swag', allocatedAmount: 45000 },
        { category: 'Contingency', allocatedAmount: 15000 },
      ],
      actualExpenses: [
        { title: 'Venue Advance Payment', amount: 30000, category: 'Venue & Power', recordedAt: new Date() },
        { title: 'Stickers & Lanyards Batch', amount: 12000, category: 'Prizes & Swag', recordedAt: new Date() },
      ],
    });

    await Task.create([
      {
        eventId: eventHackathon._id,
        assignedTo: staffUser._id,
        title: 'Setup Gate A QR Verification Scanner Desks',
        priority: 'high',
        status: 'pending',
        deadline: futureDate1,
      },
      {
        eventId: eventHackathon._id,
        assignedTo: staffUser._id,
        title: 'Check WiFi SSID & Power Extenders in Hall 1',
        priority: 'critical',
        status: 'in_progress',
        deadline: futureDate1,
      },
    ]);

    await Notification.create({
      userId: attendeeUser._id,
      title: 'Ticket Confirmed!',
      message: 'Your ticket for Gatherly National AI & Web3 Hackathon 2026 is confirmed.',
      type: 'ticket_confirmed',
    });

    console.log('\n=============================================');
    console.log('🎉 SEEDING COMPLETE! Test Credentials:');
    console.log('=============================================');
    console.log('Password for ALL accounts: Password@123\n');
    console.log('1. Super Admin: admin@gatherly.com');
    console.log('2. Organizer:   organizer@gatherly.com');
    console.log('3. Attendee:    attendee@gatherly.com');
    console.log('4. Staff:       staff@gatherly.com\n');
    console.log('Testing QR Check-in:');
    console.log(`- Valid QR Token:   ${DEMO_VALID_QR_TOKEN} (Event: Hackathon)`);
    console.log(`- Duplicate Token:  ${DEMO_USED_QR_TOKEN} (Should return 409 Conflict)`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Seeding failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
