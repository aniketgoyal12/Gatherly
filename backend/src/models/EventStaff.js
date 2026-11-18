import mongoose from 'mongoose';

const eventStaffSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

// One staff assignment per user per event
eventStaffSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventStaff = mongoose.model('EventStaff', eventStaffSchema);

export default EventStaff;
