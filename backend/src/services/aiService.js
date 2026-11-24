/**
 * AI Microservice Integration Client & Circuit Breaker (ADR-002 & TSK-S4-07)
 * 
 * Proxies calls to the Python FastAPI microservice (port 8000).
 * If the Python service is offline or unreachable, falls back seamlessly to
 * deterministic heuristics so organizers can always generate plans and budgets.
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const generateEventPlan = async ({ title, description, category, expectedAttendees = 100 }) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${AI_BASE_URL}/api/v1/ai/generate-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.AI_SERVICE_SECRET || 'gatherly_ai_secret',
      },
      body: JSON.stringify({ title, description, category, expectedAttendees }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log(`[AI Service] FastAPI microservice offline (${error.message}). Using intelligent heuristic fallback.`);
  }

  // Fallback intelligent heuristic plan
  return {
    source: 'heuristic_fallback',
    schedule: [
      { time: '09:00 AM', title: 'Registration & Welcome Coffee', speaker: 'Gatherly Desk' },
      { time: '10:00 AM', title: `Keynote: The Future of ${category}`, speaker: 'Industry Leader' },
      { time: '11:30 AM', title: 'Panel Discussion & Interactive Q&A', speaker: 'Guest Panel' },
      { time: '01:00 PM', title: 'Networking Lunch & Product Demos', speaker: 'All Attendees' },
      { time: '02:30 PM', title: 'Hands-on Workshop & Breakout Sessions', speaker: 'Facilitators' },
      { time: '04:30 PM', title: 'Closing Remarks & Awards', speaker: 'Organizing Committee' },
    ],
    budgetEstimate: {
      totalEstimatedCost: expectedAttendees * 1200,
      breakdown: {
        venueRental: Math.round(expectedAttendees * 400),
        catering: Math.round(expectedAttendees * 500),
        audioVisualAndStage: Math.round(expectedAttendees * 150),
        marketingAndBadges: Math.round(expectedAttendees * 150),
      },
    },
    suggestedVendors: ['Premium Audio-Visuals', 'FreshBites Catering', 'Skyline Security & Crew'],
  };
};

export const predictAttendanceTurnout = async ({ category, ticketPrice, capacity, daysUntilEvent }) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${AI_BASE_URL}/api/v1/ai/predict-turnout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, ticketPrice, capacity, daysUntilEvent }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log(`[AI Service] Microservice offline. Using ML prediction fallback.`);
  }

  // Fallback turnout rate heuristic
  const baseRate = ticketPrice === 0 ? 0.82 : 0.68;
  const predictedTurnout = Math.round(capacity * baseRate);

  return {
    source: 'heuristic_fallback',
    predictedTurnout,
    predictedAttendanceRate: `${Math.round(baseRate * 100)}%`,
    confidenceInterval: [Math.round(predictedTurnout * 0.9), Math.min(capacity, Math.round(predictedTurnout * 1.1))],
  };
};

export default {
  generateEventPlan,
  predictAttendanceTurnout,
};
