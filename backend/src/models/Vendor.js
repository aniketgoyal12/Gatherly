import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Vendor category is required'],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Vendor location is required'],
      trim: true,
    },
    services: {
      type: [String],
      default: [],
    },
    pricing: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ category: 1, location: 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
