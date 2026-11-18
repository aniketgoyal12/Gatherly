# Testing Strategy & Verification Suite: Gatherly

> **Last updated:** 2026-11-18  
> **Owner:** QA & DevOps Lead  
> **Test Frameworks:** Jest, Supertest (Node.js), Pytest (FastAPI), Autocannon (Load/Concurrency), Postman  
> **Status Options:** `Pass 🟢` \| `Fail 🔴` \| `Pending ⚪`

---

## 1. 12 Must-Test Critical Scenarios

| ID | Scenario Description | Test Type | Tool / Harness | Expected Outcome | Status | Tested By | Date |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| `TC-01` | **User Auth & JWT Refresh Flow:** Register, login, obtain access token, verify expiration, use refresh token cookie to rotate. | Integration | Postman E2E | Access token issued for all 4 roles (`organizer`, `super_admin`, `attendee`, `staff`) & verified via `/auth/me`. | 🟢 Pass | Backend Lead (Aniket) | 2026-11-18 |
| `TC-02` | **Role-Based Access Control (RBAC):** Attendee attempts to call `/api/v1/admin/pending-events`. | Security | Postman E2E | Returns `403 Forbidden`; unauthorized role mutation blocked. | 🟢 Pass | Backend Lead (Aniket) | 2026-11-18 |
| `TC-03` | **Event Lifecycle Transitions:** Event moves from `draft` -> `pending_approval` -> `published` -> `completed`. | Integration | Postman E2E | Only Super Admin can approve; state machine transitions verified end-to-end. | 🟢 Pass | Backend Lead (Aniket) | 2026-11-18 |
| `TC-04` | **Last-Ticket Concurrency & Overselling:** 50 concurrent requests simultaneously attempt to reserve 1 remaining ticket. | Concurrency | Autocannon / Locust | Exactly 1 request succeeds with `201 Created`; 49 requests receive `409 Conflict` (zero overselling). | ⚪ Pending | QA Lead | - |
| `TC-05` | **Razorpay Order Creation & Signature Verification:** Create order, simulate client checkout signature, and verify HMAC SHA-256. | Integration | Jest + Supertest | Valid HMAC signature accepts payment; altered signature returns `400 Bad Request`. | ⚪ Pending | Integrations Lead | - |
| `TC-06` | **Webhook Idempotency Under Replay:** Send the identical `payment.captured` webhook payload 3 consecutive times. | Integration | Postman / Jest | First payload sets status `paid` and issues ticket; 2nd and 3rd return `200 OK` (Duplicate ignored). | ⚪ Pending | Integrations Lead | - |
| `TC-07` | **Payment Failure Capacity Rollback:** User initiates reservation; payment gateway reports failed payment or TTL expires. | Integration | Jest + Supertest | Temporary capacity hold is cancelled; `remainingCapacity` increments back to initial value. | ⚪ Pending | Integrations Lead | - |
| `TC-08` | **QR Generation & SHA-256 Hash Verification:** Generate signed QR ticket; verify gate check-in succeeds with valid token. | Integration | Postman E2E | Gate API matches token hash with `tickets.tokenHash`; flips status to `checked_in` (`200 OK`). | 🟢 Pass | Backend Lead (Aniket) | 2026-11-18 |
| `TC-09` | **Replay Attack / Duplicate & Tampered QR Scan:** Re-scan a `checked_in` ticket + submit fake QR hash. | Security | Postman E2E | Duplicate scan blocked (`400/409`) and fake QR token rejected (`400/404`). | 🟢 Pass | Backend Lead (Aniket) | 2026-11-18 |
| `TC-10` | **AI Service LLM Outage Fallback:** Disconnect LLM API key; request itinerary generation from `/api/v1/ai/generate-schedule`. | Resiliency | Pytest / Supertest | Circuit breaker returns deterministic fallback schedule template with HTTP 200 within 500ms. | ⚪ Pending | AI/ML Lead | - |
| `TC-11` | **Socket.IO Real-Time Stream Delivery:** Organizer triggers schedule change; verify connected client room receives event. | Integration | Jest + Socket.IO Client | Connected attendee clients receive `SCHEDULE_UPDATED` payload within 250ms without polling. | ⚪ Pending | Backend Lead | - |
| `TC-12` | **Organizer Analytics, Budget, Tasks, Feedback & Audit Trail:** Full operational flow verified against live MongoDB. | Integration | Postman E2E | Budget, expenses, tasks, analytics aggregation, feedback, notifications & audit logs all `200/201`. | 🟢 Pass | Backend Lead (Aniket) | 2026-11-18 |

---

## 2. Verified Postman E2E Execution Proof (2026-11-18 — PPT / Report Ready)

- **Suite:** `backend/postman/Gatherly_API_Collection.json` + `backend/postman/Gatherly_Local.postman_environment.json`
- **Result:** **28 / 28 API Requests PASSED — 35 / 35 Assertions PASSED — 0 Failures (100% Green)**
- **Tested Phases:**
  - Phase 0: API Gateway Health Check (`2/2`)
  - Phase 1: 4-Role JWT Authentication + `/auth/me` (`7/7`)
  - Phase 2: Venue Creation, Draft Event Creation, Submit for Approval (`5/5`)
  - Phase 3: RBAC `403` Negative Test, Pending Queue, Admin Approval (`4/4`)
  - Phase 4: Public Discovery, Free Ticket + SHA-256 QR Issuance, Duplicate Booking `409` Block, My Tickets (`5/5`)
  - Phase 5: Valid Gate QR Check-In, Duplicate QR Re-Scan Block, Fake QR Rejection (`3/3`)
  - Phase 6: Event Budget, Actual Expense Logging, Task Creation & Completion, Event Analytics (`5/5`)
  - Phase 7: Event Completion, Attendee Feedback & Sentiment, Notifications, Security Audit Logs (`4/4`)
- **Saved Proof Screenshots (for Major Project PPT & Final Report):**
  - Part 1 (Phase 0 – Phase 3.1): `docs/assets/testing/postman_e2e_part1.png`
  - Part 2 (Phase 3.2 – Phase 7.4): `docs/assets/testing/postman_e2e_part2.png`

---

## 3. Test Execution Commands

```bash
# 1-Click End-to-End API Test Suite (27 automated checks)
npm run test:api

# Backend Unit & Integration Tests
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
