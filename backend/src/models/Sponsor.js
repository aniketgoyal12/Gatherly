import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    package: {
      type: String,
      required: [true, 'Sponsorship package tier is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Sponsorship contribution amount is required'],
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
    deliverables: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

sponsorSchema.index({ eventId: 1, package: 1 });

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

export default Sponsor;
