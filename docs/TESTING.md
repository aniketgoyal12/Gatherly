# Testing Strategy & Verification Suite: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** QA & DevOps Lead  
> **Test Frameworks:** Jest, Supertest (Node.js), Pytest (FastAPI), Autocannon (Load/Concurrency), Postman  
> **Status Options:** `Pass 🟢` \| `Fail 🔴` \| `Pending ⚪`

---

## 1. 12 Must-Test Critical Scenarios

| ID | Scenario Description | Test Type | Tool / Harness | Expected Outcome | Status | Tested By | Date |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| `TC-01` | **User Auth & JWT Refresh Flow:** Register, login, obtain access token, verify expiration, use refresh token cookie to rotate. | Integration | Jest + Supertest | Access token expires in 15m; `/refresh-token` issues valid new token without requiring credentials. | ⚪ Pending | Backend Lead | - |
| `TC-02` | **Role-Based Access Control (RBAC):** Attendee attempts to call `/api/v1/events` (POST); Staff attempts `/api/v1/audit-logs`. | Security | Jest + Supertest | Returns `403 Forbidden` with `{ code: "INSUFFICIENT_PERMISSIONS" }`; no mutation occurs. | ⚪ Pending | QA Lead | - |
| `TC-03` | **Event Lifecycle Transitions:** Event moves from `draft` -> `pending_approval` -> `published` -> `completed` -> `cancelled`. | Integration | Jest + Supertest | Only Super Admin can approve; transitions outside state machine return `400 Bad Request`. | ⚪ Pending | Backend Lead | - |
| `TC-04` | **Last-Ticket Concurrency & Overselling:** 50 concurrent requests simultaneously attempt to reserve 1 remaining ticket. | Concurrency | Autocannon / Locust | Exactly 1 request succeeds with `201 Created`; 49 requests receive `409 Conflict` (zero overselling). | ⚪ Pending | QA Lead | - |
| `TC-05` | **Razorpay Order Creation & Signature Verification:** Create order, simulate client checkout signature, and verify HMAC SHA-256. | Integration | Jest + Supertest | Valid HMAC signature accepts payment; altered signature returns `400 Bad Request`. | ⚪ Pending | Integrations Lead | - |
| `TC-06` | **Webhook Idempotency Under Replay:** Send the identical `payment.captured` webhook payload 3 consecutive times. | Integration | Postman / Jest | First payload sets status `paid` and issues ticket; 2nd and 3rd return `200 OK` (Duplicate ignored). | ⚪ Pending | Integrations Lead | - |
| `TC-07` | **Payment Failure Capacity Rollback:** User initiates reservation; payment gateway reports failed payment or TTL expires. | Integration | Jest + Supertest | Temporary capacity hold is cancelled; `remainingCapacity` increments back to initial value. | ⚪ Pending | Integrations Lead | - |
| `TC-08` | **QR Generation & SHA-256 Hash Verification:** Generate signed QR ticket; verify gate check-in succeeds with valid token. | Integration | Jest + Supertest | Gate API matches token hash with `tickets.qrTokenHash`; flips status to `checked_in`. | ⚪ Pending | Integrations Lead | - |
| `TC-09` | **Replay Attack / Duplicate QR Scan:** Scan a ticket that has already been marked as `checked_in`. | Security | Postman / Scanner | Scanner receives `409 Conflict` with `"TICKET_ALREADY_USED"` and previous check-in timestamp. | ⚪ Pending | QA Lead | - |
| `TC-10` | **AI Service LLM Outage Fallback:** Disconnect LLM API key; request itinerary generation from `/api/v1/ai/generate-schedule`. | Resiliency | Pytest / Supertest | Circuit breaker returns deterministic fallback schedule template with HTTP 200 within 500ms. | ⚪ Pending | AI/ML Lead | - |
| `TC-11` | **Socket.IO Real-Time Stream Delivery:** Organizer triggers schedule change; verify connected client room receives event. | Integration | Jest + Socket.IO Client | Connected attendee clients receive `SCHEDULE_UPDATED` payload within 250ms without polling. | ⚪ Pending | Backend Lead | - |
| `TC-12` | **Organizer Analytics Aggregation Accuracy:** Compute gross revenue, ticket count, and check-in percentage across 100 test tickets. | Integration | Jest + Mongoose | Revenue equals sum of paid amounts minus refunds; check-in % matches checked_in ticket count. | ⚪ Pending | Database Lead | - |

---

## 2. Test Execution Commands

```bash
# Backend Unit & Integration Tests (Jest)
cd backend
npm test

# Run Concurrency Benchmark on Booking Endpoint
npx autocannon -c 50 -d 10 -m POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -b '{"eventId":"<EVENT_ID>","tierId":"<TIER_ID>","quantity":1}' \
  http://localhost:5000/api/v1/registrations/reserve

# AI Service Unit Tests (Pytest)
cd ai-service
pytest tests/ -v
```
