# Changelog: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** QA & DevOps Lead  
> **Format:** Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), following [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for Sprint 2 (v0.2.0)
- **Added:** User registration, login, logout, and token refresh endpoints with JWT and HTTP-only cookies.
- **Added:** Role-based access control (RBAC) middleware verifying roles (`admin`, `organizer`, `attendee`, `staff`).
- **Added:** Event CRUD endpoints with state machine (`draft`, `pending_approval`, `published`, `rejected`, `completed`, `cancelled`).
- **Added:** Public event discovery page with search and category filtering in React client.
- **Changed:** Express server error handler to return standardized error format.
- **Security:** Password hashing enforcement with bcrypt (salt rounds = 12).

---

## [0.2.0] - 2026-11-16

### Added
- **Complete 22-Screen Frontend Client:** Delivered all 22 screens across 5 user role modules adhering strictly to the **60:30:10 color rule** (60% Deep Navy `#080D1A`, 30% Warm Cream `#FDFBF7`, 10% Energetic Coral `#FF6B5B`):
  1. *Attendee Module (6 screens):* Home Discovery, Search Results, Event Details, Checkout Booking, My QR Tickets, Attendee Profile.
  2. *Organizer Module (6 screens):* Organizer Dashboard, Create Event Wizard, AI Event Planner, Budget Management, Registrations Management, Event Analytics.
  3. *Super Admin Module (4 screens):* Admin Dashboard, Event Approval Queue, User Management & Roles, Reports & Audit Logs.
  4. *Staff Module (3 screens):* Assigned Event Shifts, QR Camera Scanner with reticle & manual fallback, Audio-Visual Check-In Result.
  5. *Common / Auth Module (3 screens):* Login & Register with role toggle, Notifications Center, Forgot Password.
- **Backend Models & REST Architecture:** Built all 17 Mongoose models and Express 5 REST API routes, controllers, and middlewares across all 9 workflow diagrams.
- **Database Seeder:** Created `backend/src/seed.js` with 4 test credentials, venues, published events, budgets, tasks, and test QR tickets.
- **Zero-Error Production Build:** Verified clean TypeScript check and Vite production bundling (`tsc && vite build` succeeded in 24.4s).

---

## [0.1.0] - 2026-11-16

### Added
- **Repository Architecture:** Scaffolding for client (`React 18 + TypeScript + Tailwind`), server (`Node.js + Express 5 + Mongoose`), and AI service (`Python FastAPI + scikit-learn`).
- **Database Specifications:** Defined complete data schemas, fields, indexes, and relationships for all 17 collections in `docs/DATABASE.md`.
- **REST API Contract:** Authored base `/api/v1` contract covering Auth, Events, Registrations, Tickets, Payments, AI, and Staff tasks in `docs/API_CONTRACT.md`.
- **Git Pull Sync Automation:** Built automated cross-platform sync logger (`scripts/sync-log.sh`, `scripts/sync-log.ps1`), Git `post-merge` hook, and root commands (`npm run setup`, `npm run pull`).
- **Architecture Decision Records:** Documented initial system decisions ADR-001 through ADR-007 in `docs/DECISIONS.md`.
- **Project Tracking System:** Published single-page dashboard (`docs/PROJECT_STATUS.md`), sprint task board (`docs/TASKS.md`), user stories (`docs/USER_STORIES.md`), and failure cases (`docs/KNOWN_ISSUES.md`).
- **Quality Assurance Foundation:** Defined 12 must-test scenarios in `docs/TESTING.md` covering concurrency, idempotent webhooks, and QR verification.
- **Environment Templates:** Documented all required environment variables and local setup guides in `docs/ENV_SETUP.md` with sanitized placeholder examples.

### Changed
- Standardized API response format across all microservices to `{ success, message, data, error }`.
- Configured Express 5 application with `helmet`, `cors`, and `express-rate-limit` middlewares.

### Fixed
- Fixed Git hook permission handling across Windows PowerShell and Unix-like bash environments.

### Removed
- Removed legacy unversioned template documents in favor of structured Markdown tracking sheets.
