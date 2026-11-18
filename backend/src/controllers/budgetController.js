import Budget from '../models/Budget.js';
import Event from '../models/Event.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Set or Update Total Event Budget (Workflow 3)
 */
export const setBudget = asyncHandler(async (req, res) => {
  const { eventId, totalBudget, expenseCategories } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  let budget = await Budget.findOne({ eventId });
  if (budget) {
    budget.totalBudget = totalBudget;
    if (expenseCategories) budget.expenseCategories = expenseCategories;
    await budget.save();
  } else {
    budget = await Budget.create({
      eventId,
      totalBudget,
      expenseCategories: expenseCategories || [],
      actualExpenses: [],
    });
  }

  return res.status(200).json(new ApiResponse(200, { budget }, 'Budget configured successfully'));
});

/**
 * Record Actual Expense (Workflow 3)
 */
export const addActualExpense = asyncHandler(async (req, res) => {
  const { eventId, title, amount, category } = req.body;

  const budget = await Budget.findOne({ eventId });
  if (!budget) {
    throw new ApiError(404, 'Budget not found for this event');
  }

  const expenseItem = {
    title,
    amount: Number(amount),
    category: category || 'general',
    recordedAt: new Date(),
  };

  budget.actualExpenses.push(expenseItem);
  await budget.save();

  // Compare planned vs actual expenses (Workflow 3)
  const totalActual = budget.actualExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const exceedsThreshold = totalActual > budget.totalBudget;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        budget,
        totalActualSpent: totalActual,
        exceedsThreshold,
        message: exceedsThreshold
          ? 'Warning: Total actual expenses exceed planned budget threshold.'
          : 'Expense recorded within budget limits.',
      },
      'Actual expense recorded successfully'
    )
  );
});

/**
 * Get Budget by Event ID (Workflow 3)
 */
export const getBudgetByEvent = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ eventId: req.params.eventId });
  if (!budget) {
    return res.status(200).json(new ApiResponse(200, { budget: null }, 'No budget defined yet for this event'));
  }

  const totalActual = (budget.actualExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        budget,
        totalActualSpent: totalActual,
        remainingBudget: budget.totalBudget - totalActual,
      },
      'Budget fetched successfully'
    )
  );
});

export default {
  setBudget,
  addActualExpense,
  getBudgetByEvent,
};
