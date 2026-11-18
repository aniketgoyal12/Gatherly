import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      unique: true,
      index: true,
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      default: 0,
      min: [0, 'Total budget cannot be negative'],
    },
    expenseCategories: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    actualExpenses: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
