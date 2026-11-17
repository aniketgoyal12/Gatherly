# Project Task Board: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Scrum Master & Engineering Lead  
> **Methodology:** 6 Sprints × 2 Weeks (Agile Scrum)  
> **Legend:** Priority: `M` (Must Have), `H` (High / Should Have), `O` (Optional / Nice to Have)  
> **Status:** `Backlog` \| `In Progress` \| `In Review` \| `Done`

---

## Sprint 1: Planning, Architecture & Design (Weeks 1 – 2)

**Sprint Goal:** Establish repository foundation, architecture standards, database schemas, API contracts, environment setup, and automated Git pull sync hooks.

| [ ] | Task ID | Task Description | Owner | Priority | Status | Branch | PR Link |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| [x] | `TSK-S1-01` | Initialize multi-directory project repository (`client/`, `server/`, `ai-service/`, `docs/`) | QA/DevOps Lead | M | Done | `chore/repo-init` | [#1](https://github.com/gatherly/gatherly/pull/1) |
| [x] | `TSK-S1-02` | Design MongoDB architecture and document all 17 Mongoose schemas in `DATABASE.md` | Database Lead | M | Done | `docs/database-schemas` | [#2](https://github.com/gatherly/gatherly/pull/2) |
| [x] | `TSK-S1-03` | Define `/api/v1` REST API contracts, request/response bodies, and HTTP status codes | Backend Lead | M | Done | `docs/api-contract` | [#3](https://github.com/gatherly/gatherly/pull/3) |
| [x] | `TSK-S1-04` | Author Architecture Decision Records (ADR-001 through ADR-007) in `DECISIONS.md` | Backend Lead | M | Done | `docs/adrs` | [#4](https://github.com/gatherly/gatherly/pull/4) |
| [x] | `TSK-S1-05` | Build automated Git pull sync log system (`sync-log.ps1`, `sync-log.sh`, `.githooks`) | QA/DevOps Lead | M | Done | `feat/git-sync-hooks` | [#5](https://github.com/gatherly/gatherly/pull/5) |
| [x] | `TSK-S1-06` | Draft comprehensive project tracking docs (`PROJECT_STATUS`, `TASKS`, `USER_STORIES`) | Frontend Lead | M | Done | `docs/project-tracking` | [#6](https://github.com/gatherly/gatherly/pull/6) |
| [x] | `TSK-S1-07` | Create `.env.example` templates and author environment onboarding guide in `ENV_SETUP.md` | Backend Lead | M | Done | `docs/env-setup` | [#7](https://github.com/gatherly/gatherly/pull/7) |
| [x] | `TSK-S1-08` | Scaffold Express 5 server with Helmet, rate limiting, and MongoDB connection helper | Backend Lead | M | Done | `feat/server-scaffold` | [#8](https://github.com/gatherly/gatherly/pull/8) |
| [x] | `TSK-S1-09` | Bootstrap Python FastAPI microservice with Pydantic models and Uvicorn runner | AI/ML Lead | M | Done | `feat/ai-scaffold` | [#9](https://github.com/gatherly/gatherly/pull/9) |
| [ ] | `TSK-S1-10` | Bootstrap React 18 + Vite + Tailwind CSS SPA with base layout and router | Frontend Lead | H | In Review | `feat/client-scaffold` | [#10](https://github.com/gatherly/gatherly/pull/10) |
| [ ] | `TSK-S1-11` | Register Razorpay test gateway account and verify webhook signing secret format | Integrations Lead | M | In Review | `chore/razorpay-creds` | [#11](https://github.com/gatherly/gatherly/pull/11) |
| [ ] | `TSK-S1-12` | Review and merge Sprint 1 deliverables; run verification sprint retro | All Team | M | In Progress | `release/sprint-1-wrap` | PR Pending |

---

## Sprint 2: Authentication, Authorization & Events Management (Weeks 3 – 4)

**Sprint Goal:** Implement secure JWT authentication with role-based access control, user profile management, event creation lifecycle, and public event discovery.

| [ ] | Task ID | Task Description | Owner | Priority | Status | Branch | PR Link |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| [ ] | `TSK-S2-01` | Implement `User` model, Bcrypt password hashing, and indexing (`email` unique) | Database Lead | M | Backlog | `feat/user-model` | - |
| [ ] | `TSK-S2-02` | Create Auth endpoints: `/api/v1/auth/register`, `/login`, `/logout`, `/refresh-token` | Backend Lead | M | Backlog | `feat/auth-endpoints` | - |
| [ ] | `TSK-S2-03` | Build `authMiddleware` and `requireRole(['admin','organizer','attendee','staff'])` | Backend Lead | M | Backlog | `feat/rbac-middleware` | - |
| [ ] | `TSK-S2-04` | Implement Client Auth UI: Login, Registration, Password Reset, and Role Selector | Frontend Lead | M | Backlog | `feat/auth-ui` | - |
| [ ] | `TSK-S2-05` | Implement `Event` and `Venue` Mongoose schemas with status validation enum | Database Lead | M | Backlog | `feat/event-schema` | - |
| [ ] | `TSK-S2-06` | Build Event CRUD endpoints: Create, Read, Update, Delete with ownership check | Backend Lead | M | Backlog | `feat/event-crud-api` | - |
| [ ] | `TSK-S2-07` | Implement Event Lifecycle state machine (`draft` -> `pending_approval` -> `published`) | Backend Lead | M | Backlog | `feat/event-lifecycle` | - |
| [ ] | `TSK-S2-08` | Build Super Admin Event Approval dashboard and moderation toggle endpoints | Frontend / Backend | H | Backlog | `feat/admin-approval-ui` | - |
| [ ] | `TSK-S2-09` | Build Organizer Event Creation wizard with multi-step forms and ticket tiers | Frontend Lead | M | Backlog | `feat/event-wizard-ui` | - |
| [ ] | `TSK-S2-10` | Implement Public Event Discovery page with category filters, date picker, search bar | Frontend Lead | H | Backlog | `feat/discovery-ui` | - |
| [ ] | `TSK-S2-11` | Build cloud image upload pipeline (Cloudinary/S3) for event banners and posters | Integrations Lead | H | Backlog | `feat/banner-uploads` | - |
| [ ] | `TSK-S2-12` | Write unit tests for Auth controller, JWT verification, and Event CRUD APIs | QA/DevOps Lead | M | Backlog | `test/auth-events` | - |

---

## Sprint 3: Registration, Razorpay Payments & QR Ticketing MVP (Weeks 5 – 6)

**Sprint Goal:** Deliver end-to-end booking flow: atomic capacity reduction, Razorpay checkout, idempotent webhook processing, SHA-256 signed QR ticket issuance, and on-ground staff scan.

| [ ] | Task ID | Task Description | Owner | Priority | Status | Branch | PR Link |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| [ ] | `TSK-S3-01` | Implement `Registration`, `Ticket`, and `Payment` Mongoose models | Database Lead | M | Backlog | `feat/reg-ticket-models` | - |
| [ ] | `TSK-S3-02` | Build atomic seat reservation endpoint with `$inc` and remaining capacity filter | Backend Lead | M | Backlog | `feat/atomic-reservation` | - |
| [ ] | `TSK-S3-03` | Integrate Razorpay Orders API: create order with currency `INR` and receipt ID | Integrations Lead | M | Backlog | `feat/razorpay-orders` | - |
| [ ] | `TSK-S3-04` | Embed Razorpay Standard Checkout in React frontend with payment modal handler | Frontend Lead | M | Backlog | `feat/checkout-modal` | - |
| [ ] | `TSK-S3-05` | Build Razorpay Webhook listener with HMAC SHA-256 signature verification | Integrations Lead | M | Backlog | `feat/payment-webhook` | - |
| [ ] | `TSK-S3-06` | Implement webhook idempotency using `payments` collection and unique `paymentId` | Integrations Lead | M | Backlog | `feat/webhook-idempotent` | - |
| [ ] | `TSK-S3-07` | Implement QR generation service: create JWT token, compute SHA-256 hash, store hash | Integrations Lead | M | Backlog | `feat/qr-generator` | - |
| [ ] | `TSK-S3-08` | Build Attendee "My Tickets" view with offline QR view and PDF download button | Frontend Lead | M | Backlog | `feat/attendee-tickets-ui` | - |
| [ ] | `TSK-S3-09` | Build Event Staff QR Scanner interface (html5-qrcode) with camera access | Frontend Lead | M | Backlog | `feat/staff-scanner-ui` | - |
| [ ] | `TSK-S3-10` | Implement staff check-in validation API with atomic status update (`checked_in`) | Backend Lead | M | Backlog | `feat/checkin-validate` | - |
| [ ] | `TSK-S3-11` | Build automated refund trigger for cancelled events and refund policy enforcement | Integrations Lead | H | Backlog | `feat/refund-engine` | - |
| [ ] | `TSK-S3-12` | Concurrency & stress testing for race conditions (100 simultaneous bookings on 5 seats)| QA/DevOps Lead | M | Backlog | `test/concurrency-race` | - |

---

## Sprint 4: AI Planning & Event Automation Features (Weeks 7 – 8)

**Sprint Goal:** Integrate the Python FastAPI service with LLM chains to auto-generate event schedules, budgets, vendor checklists, and marketing copy.

| [ ] | Task ID | Task Description | Owner | Priority | Status | Branch | PR Link |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| [ ] | `TSK-S4-01` | Build FastAPI prompt templates for event agenda generation (start/end times, speakers) | AI/ML Lead | M | Backlog | `feat/ai-agenda-gen` | - |
| [ ] | `TSK-S4-02` | Build FastAPI budget estimator based on attendee count, venue category, and catering | AI/ML Lead | M | Backlog | `feat/ai-budget-gen` | - |
| [ ] | `TSK-S4-03` | Create Express-to-FastAPI secure HTTP proxy client (`/api/v1/ai/*` routes) | Backend Lead | M | Backlog | `feat/ai-gateway-proxy` | - |
| [ ] | `TSK-S4-04` | Implement `aiPlans` schema to cache generated blueprints and user modifications | Database Lead | H | Backlog | `feat/ai-plans-schema` | - |
| [ ] | `TSK-S4-05` | Build Interactive AI Planning Assistant UI in Organizer dashboard | Frontend Lead | M | Backlog | `feat/ai-planner-ui` | - |
| [ ] | `TSK-S4-06` | Implement one-click "Apply AI Plan" to populate Event description, schedule, and tasks | Frontend / Backend | H | Backlog | `feat/apply-plan-flow` | - |
| [ ] | `TSK-S4-07` | Implement circuit breaker / fallback in Node.js when AI microservice times out | Backend Lead | M | Backlog | `feat/ai-fallback` | - |
| [ ] | `TSK-S4-08` | Automated testing of AI endpoints with mocked LLM responses | QA/DevOps Lead | H | Backlog | `test/ai-microservice` | - |

---

## Sprint 5: Machine Learning Turnout, Analytics & Real-Time Ops (Weeks 9 – 10)

**Sprint Goal:** Train scikit-learn attendance prediction model, build real-time Socket.IO notifications, organizer analytics dashboards, and attendee feedback.

| [ ] | Task ID | Task Description | Owner | Priority | Status | Branch | PR Link |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| [ ] | `TSK-S5-01` | Train scikit-learn regression model for turnout rate prediction from historical features | AI/ML Lead | M | Backlog | `feat/ml-turnout-model` | - |
| [ ] | `TSK-S5-02` | Deploy turnout prediction endpoint `/ai/v1/predict-turnout` with confidence interval | AI/ML Lead | M | Backlog | `feat/turnout-endpoint` | - |
| [ ] | `TSK-S5-03` | Build MongoDB aggregation pipelines for revenue, ticket sales rate, and check-in % | Database Lead | M | Backlog | `feat/analytics-pipelines`| - |
| [ ] | `TSK-S5-04` | Implement Organizer Analytics UI with charts (Recharts / Chart.js) and metrics cards | Frontend Lead | M | Backlog | `feat/organizer-charts` | - |
| [ ] | `TSK-S5-05` | Implement Socket.IO room subscriptions for real-time check-in counters | Backend Lead | H | Backlog | `feat/realtime-checkins` | - |
| [ ] | `TSK-S5-06` | Build real-time alert notifications (schedule shift, room full) for attendees | Frontend / Backend | H | Backlog | `feat/socket-alerts` | - |
| [ ] | `TSK-S5-07` | Implement post-event attendee Feedback & Rating submission and aggregation | Frontend / Backend | O | Backlog | `feat/feedback-system` | - |
| [ ] | `TSK-S5-08` | Build Staff Task Assignment & Live Progress tracking board | Backend / Frontend | H | Backlog | `feat/staff-taskboard` | - |

---

## Sprint 6: End-to-End Testing, Cloud Deployment & Viva Demo Prep (Weeks 11 – 12)

**Sprint Goal:** Execute 12 QA test suites, perform security audit, deploy services to cloud, populate realistic demo seed data, and conduct dry run demonstrations.

| [ ] | Task ID | Task Description | Owner | Priority | Status | Branch | PR Link |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| [ ] | `TSK-S6-01` | Execute and document 12 critical QA scenarios in `TESTING.md` | QA/DevOps Lead | M | Backlog | `test/e2e-verification` | - |
| [ ] | `TSK-S6-02` | Verify all 7 critical failure cases in `KNOWN_ISSUES.md` (race condition, webhooks) | QA & Integrations | M | Backlog | `fix/edge-case-audit` | - |
| [ ] | `TSK-S6-03` | Security hardening: check input sanitization, rate limits, CORS, header audits | Backend Lead | M | Backlog | `chore/security-hardening`| - |
| [ ] | `TSK-S6-04` | Create database seed script (`npm run seed`) with realistic sample events and users | Database Lead | M | Backlog | `chore/demo-seed-data` | - |
| [ ] | `TSK-S6-05` | Set up CI GitHub Actions workflow for linting, type-checking, and test runner | QA/DevOps Lead | H | Backlog | `ci/github-actions` | - |
| [ ] | `TSK-S6-06` | Deploy Frontend to Vercel/Netlify and Node Backend + AI Service to Render/Railway | QA/DevOps Lead | M | Backlog | `deploy/cloud-staging` | - |
| [ ] | `TSK-S6-07` | Conduct multi-device dry run (Organizer laptop, Attendee phone, Staff scanner phone) | All Team | M | Backlog | `test/dry-run-demo` | - |
| [ ] | `TSK-S6-08` | Finalize project presentation slides, viva documentation, and demo screencast | All Team | M | Backlog | `docs/viva-prep` | - |
