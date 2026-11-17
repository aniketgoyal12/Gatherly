import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    review: {
      type: String,
      default: '',
      trim: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// One review per attendee per event
feedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
