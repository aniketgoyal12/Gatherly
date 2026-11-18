import { Router } from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import venueRoutes from './venueRoutes.js';
import registrationRoutes from './registrationRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import taskRoutes from './taskRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import adminRoutes from './adminRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = Router();

// Mount all modules at /api/v1/*
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/venues', venueRoutes);
router.use('/registrations', registrationRoutes);
router.use('/payments', paymentRoutes);
router.use('/tickets', ticketRoutes);
router.use('/tasks', taskRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationRoutes);
router.use('/vendors', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gatherly API v1 gateway is healthy and operational.',
    timestamp: new Date().toISOString(),
  });
});

export default router;
