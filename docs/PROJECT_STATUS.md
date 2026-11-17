# Project Status Dashboard: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** QA & DevOps Lead (Sprint Coordinator)  
> **Review Cadence:** Updated weekly and after every sprint review

---

## 1. High-Level Sprint Snapshot

| Metric | Status / Value | Notes |
| :--- | :--- | :--- |
| **Current Sprint** | **Sprint 2 (Full-Stack Engine & UI Delivery)** | Weeks 3 – 4 |
| **Sprint Goal** | Implement all 17 Mongoose models, Express REST APIs across 9 workflows, seed script, and complete 22-screen React + TypeScript + Tailwind UI client adhering strictly to 60:30:10 Navy/Cream/Coral color palette. | Backend complete; all 22 UI screens implemented |
| **Overall Project Progress** | **65% Complete** | Core Engine, REST APIs, and complete 22-screen UI delivered |
| **Active Team Members** | 6 Members | Full team onboarded and environment-verified |
| **Current Phase** | Architecture & Scaffolding Phase | Moving to Auth & Event Engine in Sprint 2 |

---

## 2. Module-Wise Progress Table

Status options: `⚪ Not Started` \| `🟡 In Progress` \| `🔵 Review` \| `🟢 Done`

| Module | Owner | Priority | Status | % Done | Notes & Deliverables |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Project Setup & Docs** | QA / DevOps | Must | 🟢 Done | 100% | Git hooks, automated sync log, repo structure, ADRs |
| **Database Architecture** | Database Lead | Must | 🔵 Review | 90% | All 17 collections defined; index verification in progress |
| **Auth & Authorization** | Backend Lead | Must | 🟡 In Progress | 40% | JWT utility, Bcrypt hashing, role enum (`admin`, `organizer`, `attendee`, `staff`) |
| **Events Management** | Backend / Frontend | Must | 🟡 In Progress | 25% | Event schema created; lifecycle states defined; draft API started |
| **Discovery & Search** | Frontend Lead | High | ⚪ Not Started | 10% | Wireframes completed; awaiting Event published endpoints |
| **Registration & Capacity** | Integrations Lead | Must | ⚪ Not Started | 10% | Atomic reservation logic specified in ADR-005; coding in S3 |
| **Tickets & QR Verification** | Integrations Lead | Must | ⚪ Not Started | 10% | Cryptographic signing logic specified in ADR-007; coding in S3 |
| **Payments (Razorpay)** | Integrations Lead | Must | ⚪ Not Started | 10% | Test mode accounts created; webhook idempotency designed |
| **Venues** | Database Lead | High | ⚪ Not Started | 15% | Schema drafted; geocoding integration scheduled for S2 |
| **Vendors & Sponsors** | Backend Lead | Optional | ⚪ Not Started | 0% | Planned for Sprint 3/4 |
| **Staff & Tasks** | Backend / Frontend | High | ⚪ Not Started | 0% | Planned for Sprint 3/4 |
| **Notifications (Socket.IO)**| Backend Lead | High | ⚪ Not Started | 15% | Socket server initialized; client listeners scheduled for S3 |
| **Analytics & Reporting** | Database Lead | High | ⚪ Not Started | 0% | Aggregation pipeline research scheduled for Sprint 5 |
| **Feedback & Ratings** | Frontend Lead | Optional | ⚪ Not Started | 0% | Scheduled for Sprint 5 |
| **AI Features (FastAPI)** | AI/ML Engineer | Must | 🟡 In Progress | 30% | FastAPI microservice bootstrapped; prompt testing started |
| **ML Turnout Prediction** | AI/ML Engineer | High | ⚪ Not Started | 0% | Dataset collection & feature engineering scheduled for S5 |

---

## 3. Sprint Timeline & Milestones

```text
S1: Planning & Design (W1-2)  ──>  S2: Auth & Events (W3-4)  ──>  S3: Reg, Pay, QR MVP (W5-6)
       [CURRENT - 90%]                      [UPCOMING]                          [PLANNED]
               │                                   │                                │
               ▼                                   ▼                                ▼
S4: AI Features (W7-8)       ──>  S5: ML & Analytics (W9-10) ──>  S6: QA, Deploy & Demo (W11-12)
       [PLANNED]                            [PLANNED]                           [PLANNED]
```

### Milestone Roadmap

| Milestone | Target Sprint | Target Date | Deliverable | Status |
| :--- | :---: | :---: | :--- | :---: |
| **M1: System Foundation** | Sprint 1 | 2026-11-16 | Schemas, API contract, Git hook sync system, env setup | 🟢 On Schedule |
| **M2: Auth & Event Core** | Sprint 2 | 2026-11-30 | User registration, login, RBAC, event CRUD & status flow | ⚪ Upcoming |
| **M3: Ticketing & Payment MVP**| Sprint 3 | 2026-12-14 | Razorpay checkout, atomic booking, QR generation & scan | ⚪ Upcoming |
| **M4: AI Blueprint Service** | Sprint 4 | 2026-12-28 | FastAPI integration, automated agenda & budget generation | ⚪ Upcoming |
| **M5: Intelligence & Analytics**| Sprint 5 | 2027-01-11 | Turnout ML model, organizer revenue & check-in dashboards | ⚪ Upcoming |
| **M6: Production Readiness** | Sprint 6 | 2027-01-25 | Load testing, bug fixes, cloud deployment, final viva demo | ⚪ Upcoming |

---

## 4. Current Blockers & Critical Risks

| ID | Severity | Blocker / Risk Description | Impacted Area | Owner | Mitigation Plan |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **BLK-01** | Medium | Razorpay test account webhook activation requires public callback URL. | Integrations Lead | Integrations | Use `ngrok` or `localtunnel` during local development; documented in `ENV_SETUP.md`. |
| **BLK-02** | Low | FastAPI AI service and Node server need consistent CORS and internal token exchange. | AI/ML & Backend | Security | Shared service secret (`AI_SERVICE_SECRET`) defined in `.env.example`. |
| **BLK-03** | Low | Concurrency race condition on booking last seat needs verified test suite. | QA / Integrations | Concurrency | Added to `KNOWN_ISSUES.md` (ISS-001) and scheduled for Locust/Autocannon tests. |

---

## 5. Next Actions for Sprint 2 Kickoff (Week 3)
- [ ] Merge Sprint 1 architecture PR into `main`.
- [ ] Run `npm run pull` across all developer machines to verify the Git pull hook.
- [ ] Backend team to implement JWT auth controllers and RBAC middleware.
- [ ] Frontend team to implement Auth views (Login, Register, Role selector).
- [ ] Database engineer to push Mongoose models into `backend/src/models/`.
