import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { sendEmail } from './emailService.js';

/**
 * Unified Notification Service
 * Dispatches both in-app database notifications and live WebSocket socket.io alerts
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  eventId = null,
  sendEmailAlert = false,
  emailData = null,
}) => {
  try {
    // 1. Persist notification in database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      eventId,
    });

    // 2. Dispatch real-time WebSocket event if Socket.IO is initialized
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          eventId: notification.eventId,
          createdAt: notification.createdAt,
        });
      }
    } catch (socketErr) {
      console.warn('[Notification Service] Socket emit skipped (fallback mode):', socketErr.message);
    }

    // 3. Optional Email Alert
    if (sendEmailAlert && emailData && emailData.to) {
      sendEmail({
        to: emailData.to,
        subject: emailData.subject || title,
        text: emailData.text || message,
        html: emailData.html,
      }).catch((err) => console.warn('[Notification Service] Background email failed:', err.message));
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service] Failed to create notification:', error.message);
    throw error;
  }
};

export default {
  createNotification,
};
