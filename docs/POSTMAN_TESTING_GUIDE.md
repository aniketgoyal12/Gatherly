# Postman API Testing Guide — Gatherly Backend

> **Collection File:** [Gatherly_API_Collection.json](../backend/postman/Gatherly_API_Collection.json)  
> **Environment File:** [Gatherly_Local.postman_environment.json](../backend/postman/Gatherly_Local.postman_environment.json)  
> **CLI Test Runner:** `npm run test:api`  
> **Base URL:** `http://localhost:5000/api/v1`

---

## 1. Overview & Test Suite Architecture

The Gatherly API Test Suite is a **production-ready, zero-configuration** collection that comprehensively tests all 9 core backend modules and workflows.

### Key Highlights:
- **43 Automated API Requests** organized across 9 sequential phases.
- **Dynamic Variable Chaining**: JWT tokens (`organizerToken`, `adminToken`, `attendeeToken`, `staffToken`) and generated IDs (`venueId`, `eventId`, `registrationId`, `qrToken`, `taskId`, `targetUserId`, `aiPlanId`) are extracted and chained automatically across requests using both `pm.environment.set` and `pm.collectionVariables.set`.
- **Negative & Anti-Fraud Security Assertions**:
  - RBAC security checks (Attendee blocked from Admin routes with `403 Forbidden`).
  - Capacity & duplicate booking prevention (`409 Conflict`).
  - Single-use QR check-in anti-fraud verification (`200 OK` on 1st scan, `409 Conflict` on 2nd scan, `400/404` on tampered QR hash).
- **Two Flexible Execution Modes**:
  1. **Postman Desktop UI** (Visual Collection Runner)
  2. **Terminal / CLI Runner** (`npm run test:api`)

---

## 2. Pre-Requisites (Before Running Tests)

1. Ensure MongoDB is running locally or connection string is active in `backend/.env`.
2. Seed the database with the standard demo accounts:
   ```powershell
   npm run seed
   ```
   *Seeded Users (Password for all: `Password@123`):*
   - Organizer: `organizer@gatherly.com`
   - Super Admin: `admin@gatherly.com`
   - Attendee: `attendee@gatherly.com`
   - Staff: `staff@gatherly.com`

3. Start the Express backend server:
   ```powershell
   npm run dev:server
   ```
   *(Server will start at `http://localhost:5000`)*

---

## 3. How to Import & Run in Postman (Mode A — GUI)

### Step 1: Import Files into Postman
1. Open the **Postman** desktop app.
2. Click the **Import** button in the top-left corner.
3. Select and import both files from `backend/postman/`:
   - `backend/postman/Gatherly_API_Collection.json`
   - `backend/postman/Gatherly_Local.postman_environment.json`
4. In the top-right environment selector dropdown, select **"Gatherly — Local Dev"**. *(Note: The collection also has built-in collection variables, so it will execute seamlessly even without selecting an environment).*

### Step 2: 1-Click Automated Collection Runner
1. In the left sidebar, hover over **"Gatherly Backend API — Complete End-to-End Test Suite"** and click the `...` menu → **Run collection**.
2. Keep all 9 folders selected.
3. Set **Delay** to `200 ms` (recommended to avoid hitting rate limiters).
4. Click the blue **"Run Gatherly Backend API"** button.
5. Watch all **43 tests** run sequentially and finish **100% Green**!

---

## 4. Complete 9-Phase Testing Sequence

| Phase | Module / Folder | Key Endpoints Tested | What is Validated |
| :---: | :--- | :--- | :--- |
| **0** | **Health Check** | `GET /health` | Gateway live status, process uptime, system health |
| **1** | **Authentication** | `POST /auth/login`<br>`GET /auth/me`<br>`POST /auth/forgot-password` | All 4 role tokens issued & stored; profile verification; forgot-password request |
| **2** | **AI Event Blueprint Studio** | `POST /ai/generate-plan`<br>`POST /ai/approve-plan`<br>`POST /ai/predict-turnout` | AI draft generation (checklist, timeline, budget split), plan approval, and ML turnout forecast |
| **3** | **Venue & Event Creation** | `GET /venues`<br>`POST /venues`<br>`POST /events`<br>`PATCH /events/:id/submit` | Venue listing & creation; event drafted; state transition to `pending_approval` |
| **4** | **Admin Moderation & Governance** | `GET /admin/pending-events`<br>`PATCH /events/:id/review`<br>`GET /admin/users`<br>`PATCH /admin/users/:id/status` | RBAC `403` negative test; admin approves event (`published`); user suspension & reactivation lifecycle |
| **5** | **Attendee Discovery & Ticketing** | `GET /events?category=`<br>`GET /events/:id`<br>`POST /registrations/reserve`<br>`GET /tickets/my-tickets`<br>`GET /registrations/my` | Public search; free ticket reservation; raw SHA-256 QR token issued; duplicate booking block (`409`) |
| **6** | **Gate QR Check-In & Security** | `GET /tickets/staff/assigned-events`<br>`POST /tickets/check-in` | Staff shift listing; single-use QR entry granted (`200 OK`); duplicate scan blocked (`409`); tampered QR blocked (`400/404`) |
| **7** | **Organizer Budget, Tasks & Operations** | `GET /events/:id/budget`<br>`POST /events/budget`<br>`POST /events/budget/expense`<br>`POST /tasks`<br>`PATCH /tasks/:id/status`<br>`GET /registrations?eventId=`<br>`GET /admin/analytics/event/:id` | Total budget allocation; itemized expense tracking; task assignment & completion; attendee roster; live event analytics (turnout %, no-show %) |
| **8** | **Feedback, Notifications & Audit** | `PATCH /events/:id/complete`<br>`POST /feedback`<br>`GET /feedback/event/:id`<br>`GET /notifications`<br>`PATCH /notifications/read-all`<br>`GET /admin/audit-logs` | Event marked `completed`; attendee 5-star review & sentiment analysis; public feedback stream; notification delivery & mark-all-read; immutable security audit log |

---

## 5. Automated Terminal Runner (Mode B — CLI)

If you prefer testing directly in your terminal without opening Postman, run the built-in runner:

```powershell
npm run test:api
```

### Expected Output:
```text
🚀 Gatherly Backend — Complete 9-Phase E2E API Test Suite
Target: http://localhost:5000/api/v1

━━━ Phase 0: System Health & Gateway Status ━━━
  ✅ PASS 0.1 GET /health returns 200 OK (8ms)

━━━ Phase 1: Authentication (4 Seeded Roles) ━━━
  ✅ PASS 1.1 Login Organizer (organizer@gatherly.com) (42ms)
  ✅ PASS 1.2 Login Super Admin (admin@gatherly.com) (39ms)
  ✅ PASS 1.3 Login Attendee (attendee@gatherly.com) (35ms)
  ✅ PASS 1.4 Login Staff (staff@gatherly.com) (33ms)
  ✅ PASS 1.5 GET /auth/me verifies Organizer JWT (12ms)
  ✅ PASS 1.6 POST /auth/forgot-password handles reset request (15ms)

... [Phases 2 through 8 execute sequentially] ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 ALL 35/35 API TESTS PASSED (100% GREEN)!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Viva / Demo Walkthrough Script

When presenting to evaluators or professors:

1. **Step 1 — Show System Architecture:** Point out the separation of concerns between Auth, Events, Tickets, AI Blueprint, and Admin Governance.
2. **Step 2 — Demonstrate Token & QR Security:**
   - Explain how raw QR tokens are only returned once upon booking confirmation.
   - Explain the cryptographic SHA-256 hash stored in MongoDB (`ADR-007`).
   - Run **Folder 6 (Gate QR Check-In)** to prove that scanning the same QR a second time triggers `409 Ticket Already Used`.
3. **Step 3 — Demonstrate Role-Based Access Control (RBAC):**
   - Run request `4.1 RBAC Negative Test` to show that an Attendee attempting to access the Admin approval queue is immediately rejected with `403 Forbidden`.
4. **Step 4 — Show Full Event Lifecycle:**
   - Draft → Pending Approval → Approved (Published) → Completed → Feedback.

---

## 7. Common Troubleshooting

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:5000` | Backend Express server is not running | Run `npm run dev:server` in a separate terminal window |
| `401 Invalid credentials` | Database was not seeded or passwords do not match | Run `npm run seed` to re-seed demo accounts with `Password@123` |
| `429 Too Many Requests` | Rapid-fire requests triggered Express rate limiting | Set delay to `200ms` in Postman Collection Runner |
| `409 Already registered` | Running booking test against an event you already registered for | Run the collection from Phase 3 (`3.2 Create Event`), which creates a fresh event ID |
| `403 Unauthorized Staff` | Staff member not assigned to event | Handled automatically: Check-in request uses `organizerToken` (organizers have check-in authority over their events) |
