import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    ticketType: {
      type: String,
      enum: ['free', 'standard', 'vip', 'early_bird'],
      default: 'standard',
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'reserved', 'expired'],
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Compound index for user bookings per event
registrationSchema.index({ eventId: 1, userId: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
