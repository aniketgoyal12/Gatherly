import AiPlan from '../models/AiPlan.js';
import Budget from '../models/Budget.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Generate Event AI Plan (Workflow 1 - FastAPI Proxy / Fallback)
 * Note: AI service will be fully wired up with FastAPI in Sprint 4
 */
export const generateEventPlan = asyncHandler(async (req, res) => {
  const { eventType, attendees, budget, duration, location, goals } = req.body;

  // Placeholder structured draft matching Workflow 1 schema
  const draftPlan = {
    checklist: [
      'Finalize venue booking and contract',
      'Deploy registration desk & QR gates',
      'Arrange catering and audio/visual setup',
      'Confirm sponsor deliverables',
    ],
    timeline: [
      { time: '09:00 AM', activity: 'Registrations & Breakfast' },
      { time: '10:00 AM', activity: 'Keynote & Opening Ceremony' },
      { time: '01:00 PM', activity: 'Networking Lunch' },
      { time: '05:00 PM', activity: 'Closing Remarks & Awards' },
    ],
    staffNeeds: [
      { role: 'Gate Ticket Scanner', count: Math.ceil((attendees || 100) / 100) },
      { role: 'Information Desk', count: 2 },
    ],
    budgetSplit: {
      venue: Math.round((budget || 10000) * 0.4),
      catering: Math.round((budget || 10000) * 0.3),
      avAndTech: Math.round((budget || 10000) * 0.2),
      contingency: Math.round((budget || 10000) * 0.1),
    },
    riskAssessment: 'High attendance surge expected during morning registration window.',
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        planType: 'comprehensive_event_blueprint',
        inputs: { eventType, attendees, budget, duration, location, goals },
        generatedPlan: draftPlan,
        note: 'AI Service placeholder response. Full Python FastAPI microservice will be linked in Sprint 4.',
      },
      'AI draft generated successfully'
    )
  );
});

/**
 * Organizer Approves Final AI Plan (Workflow 1)
 * Saves in `aiPlans` with approved = true and approvedBy = req.user._id
 */
export const approveAiPlan = asyncHandler(async (req, res) => {
  const { eventId, planType = 'event_blueprint', inputs, generatedPlan, applyBudget = true } = req.body;

  const aiPlan = await AiPlan.create({
    eventId,
    planType,
    inputs: inputs || {},
    generatedPlan: generatedPlan || {},
    approved: true,
    approvedBy: req.user._id,
  });

  // If approved and budget split exists, optionally seed into Budget model (Workflow 1 & 3)
  if (applyBudget && generatedPlan?.budgetSplit) {
    const totalAllocated = Object.values(generatedPlan.budgetSplit).reduce((a, b) => Number(a) + Number(b), 0);
    const expenseCategories = Object.entries(generatedPlan.budgetSplit).map(([cat, amt]) => ({
      category: cat,
      allocatedAmount: amt,
    }));

    await Budget.findOneAndUpdate(
      { eventId },
      {
        eventId,
        totalBudget: totalAllocated,
        expenseCategories,
      },
      { upsert: true, new: true }
    );
  }

  return res.status(201).json(
    new ApiResponse(201, { aiPlan }, 'AI plan approved and saved to database')
  );
});

/**
 * Predict Attendance Turnout (Workflow 7 - Placeholder)
 */
export const predictTurnout = asyncHandler(async (req, res) => {
  const { eventId } = req.body;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        eventId,
        predictedTurnoutRate: 0.88,
        expectedAttendees: 350,
        confidenceInterval: '85% - 92%',
        note: 'ML prediction model will be deployed in Sprint 5.',
      },
      'Turnout prediction calculated'
    )
  );
});

export default {
  generateEventPlan,
  approveAiPlan,
  predictTurnout,
};
