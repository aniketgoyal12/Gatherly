import mongoose from 'mongoose';

const eventVendorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ['inquiry', 'negotiating', 'confirmed', 'cancelled', 'completed'],
      default: 'inquiry',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One vendor contract per vendor per event
eventVendorSchema.index({ eventId: 1, vendorId: 1 }, { unique: true });

const EventVendor = mongoose.model('EventVendor', eventVendorSchema);

export default EventVendor;
