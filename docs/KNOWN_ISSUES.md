# Known Issues & Critical Failure Cases: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** QA Lead & Integrations Engineer  
> **Review Cycle:** Assessed before each sprint release  
> **Severity Levels:** `Critical` (Showstopper / Data integrity risk) \| `High` (Feature failure) \| `Medium` (Edge case degradation) \| `Low` (Cosmetic / Minor)

---

## 1. Critical Failure Verification Matrix

The following 7 critical edge cases are pre-registered as **To Verify** ahead of Sprint 3 & Sprint 4 implementation. Every scenario must be verified with automated or stress tests before production sign-off.

| ID | Issue Description | Severity | Module | Reported By | Owner | Status | Date | Mitigation / Verification Strategy |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `ISS-001` | **Last-Ticket Race Condition:** Multiple users attempt to purchase the single remaining ticket for an event at the exact same millisecond. | Critical | Registration / Capacity | QA Lead | Backend Lead | To Verify | 2026-11-16 | Use atomic MongoDB `$inc` with `{ remaining: { $gte: qty } }` condition (ADR-005). Verify with Autocannon/Locust running 100 concurrent requests on 1 seat. |
| `ISS-002` | **Payment Success but Browser Closed:** Attendee completes UPI/Card payment on Razorpay modal, but battery dies or user closes browser tab before redirect to confirmation page. | Critical | Payments / Registrations | Integrations Lead | Integrations Lead | To Verify | 2026-11-16 | Implement asynchronous Razorpay Webhook `payment.captured`. Webhook verifies payment and automatically generates `tickets` regardless of browser state. |
| `ISS-003` | **Duplicate Webhook Delivery:** Razorpay retries webhook notification after network latency, potentially causing double issuance of tickets. | Critical | Payments / Webhooks | Integrations Lead | Integrations Lead | To Verify | 2026-11-16 | Track processed `event_id` in `payments.webhookEvents` array. Ignore subsequent incoming webhooks with identical event ID (ADR-006). |
| `ISS-004` | **QR Scanned Twice at Gate:** An attendee shares their QR screenshot with a friend; both attempt entry at different gates nearly simultaneously. | Critical | Tickets / QR Scanner | QA Lead | Integrations Lead | To Verify | 2026-11-16 | Atomic ticket state update: `findOneAndUpdate({ _id: id, status: 'valid' }, { $set: { status: 'checked_in', checkedInAt: new Date() } })`. Second scan fails with 409 Conflict. |
| `ISS-005` | **Event Cancelled After Sales:** Organizer cancels an event that already has 200+ paid attendees. | High | Events / Payments | Frontend Lead | Integrations Lead | To Verify | 2026-11-16 | Implement automated batch refund queue. Sets all tickets to `cancelled` and calls Razorpay Refund API for all associated `paid` payment records. |
| `ISS-006` | **Refund Requested After Deadline:** Attendee requests a ticket refund after the event organizer's cutoff date (e.g., 48 hours prior to start). | Medium | Registrations / Payments | Backend Lead | Backend Lead | To Verify | 2026-11-16 | Backend validation rejects refund requests where `event.startDate - now < event.refundPolicyHours`. Returns `400 Bad Request` with policy explanation. |
| `ISS-007` | **AI Provider Unavailable / Rate Limited:** External LLM API (Gemini/Groq/OpenAI) returns 429 Rate Limit or 503 Outage during event blueprint generation. | High | AI Microservice | AI/ML Lead | AI/ML Lead | To Verify | 2026-11-16 | Implement fallback circuit breaker in FastAPI returning deterministic rule-based template schedules and budgets so user is never blocked. |

---

## 2. General Defect Log

| ID | Issue Description | Severity | Module | Reported By | Owner | Status | Date | Notes / Resolution |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `DEF-001` | Express 5 CORS credentials wildcard rejected when using cookies | Medium | Server Config | Backend Lead | Backend Lead | Resolved | 2026-11-16 | Explicitly configured `cors({ origin: process.env.CLIENT_URL, credentials: true })`. |
| `DEF-002` | Git hooks execution permission lost on Windows clone | Low | Tooling / Hooks | QA Lead | QA Lead | Resolved | 2026-11-16 | Added `scripts/setup-hooks.ps1` and `scripts/setup-hooks.sh` to configure `core.hooksPath .githooks`. |
