import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    position: {
      type: Number,
      required: [true, 'Waitlist position is required'],
      min: [1, 'Position must be at least 1'],
    },
    status: {
      type: String,
      enum: ['waiting', 'offered', 'expired', 'claimed'],
      default: 'waiting',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One waitlist entry per user per event
waitlistSchema.index({ eventId: 1, userId: 1 }, { unique: true });
waitlistSchema.index({ eventId: 1, position: 1 });

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;
