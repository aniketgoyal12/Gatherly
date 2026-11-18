import mongoose from 'mongoose';

const aiPlanSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    planType: {
      type: String,
      required: [true, 'Plan type is required (e.g., schedule, budget, tasks)'],
      trim: true,
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Inputs object is required'],
      default: {},
    },
    generatedPlan: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Generated plan object is required'],
      default: {},
    },
    approved: {
      type: Boolean,
      default: false,
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiPlanSchema.index({ eventId: 1, planType: 1 });

const AiPlan = mongoose.model('AiPlan', aiPlanSchema);

export default AiPlan;
