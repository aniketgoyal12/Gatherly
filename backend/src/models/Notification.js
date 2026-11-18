import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: ['system', 'event_update', 'ticket_confirmed', 'task_assigned', 'payment_alert', 'reminder'],
      default: 'system',
    },
    readStatus: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

notificationSchema.index({ userId: 1, readStatus: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
