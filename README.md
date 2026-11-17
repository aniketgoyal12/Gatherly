# Gatherly - AI-Powered Event Planning & Management Platform

> **Last updated:** 2026-11-16  
> **Owner:** Engineering Lead & Scrum Master  
> **Repository:** Major Project / Gatherly  
> **Methodology:** Agile Scrum (6 Sprints × 2 Weeks = 12 Weeks)

---

## 1. Project Summary

**Gatherly** is an end-to-end, AI-powered event planning and management platform designed to automate event organization, streamline ticket sales, prevent ticket fraud, and deliver real-time coordination for events of any scale.

### Key Capabilities
- **Multi-Role Experience:** Tailored dashboards for Super Admins, Event Organizers, Attendees, and On-ground Event Staff.
- **AI Event Blueprinting:** FastAPI microservice utilizing scikit-learn and LLMs to generate schedules, budget estimates, vendor recommendations, and attendance predictions.
- **Fraud-Resistant Ticketing:** Unique cryptographically signed QR tickets with hashed verification tokens (`SHA-256`) and offline replay prevention.
- **High-Concurrency Booking:** Atomic seat reservation queries to eliminate race conditions and overselling during peak traffic.
- **Secure Payment Processing:** Razorpay checkout integration with idempotent webhook handling for automated ticket issuance and refunds.
- **Real-Time Collaboration:** Socket.IO event streams for instant schedule updates, capacity warnings, and staff dispatching.

---

## 2. Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend (Client)** | React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons | Responsive SPA, role-based dashboards, QR scanner interface |
| **Backend (Server)** | Node.js (v18+), Express.js (v5), Mongoose ODM, Socket.IO | RESTful API (`/api/v1`), WebSocket gateway, business logic |
| **AI / ML Service** | Python 3.11, FastAPI, scikit-learn, LangChain, Uvicorn | Intelligent schedule generation, budget planning, turn-out prediction |
| **Database** | MongoDB Atlas / Local MongoDB 7.0 | Document store for 17 collections with compound & unique indexes |
| **Payment Gateway** | Razorpay (Test Mode) | Order creation, payment capture, automated refunds, signature verification |
| **Caching & Security** | Helmet, express-rate-limit, JWT (HTTP-only cookies), Bcrypt | API hardening, rate limiting, stateless authentication |
| **DevOps & Tooling** | Git, Git Hooks, GitHub Actions, Jest, Supertest, Postman | Automated pull syncing, CI/CD pipeline, automated testing |

---

## 3. Repository Structure

```text
Gatherly/
├── .githooks/                  # Git hooks (post-merge auto-sync)
├── .github/                    # GitHub configuration & PR templates
│   └── pull_request_template.md
├── client/                     # [frontend/] React + TypeScript + Tailwind
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/                     # [backend/] Node.js + Express + Mongoose
│   ├── src/
│   │   ├── config/             # DB and Razorpay clients
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, validation, error handlers
│   │   ├── models/             # 17 Mongoose schemas
│   │   ├── routes/             # REST endpoints (/api/v1/*)
│   │   ├── services/           # Payment, QR, Email, Notification logic
│   │   ├── utils/              # QR crypto, helpers
│   │   └── validators/         # Zod schemas
│   ├── .env.example
│   └── package.json
├── ai-service/                 # Python FastAPI Microservice
│   ├── app/
│   │   ├── api/                # FastAPI routes
│   │   ├── core/               # App config & LLM clients
│   │   ├── models/             # Pydantic schemas & ML pipelines
│   │   └── services/           # Budget & schedule generators
│   ├── requirements.txt
│   └── .env.example
├── docs/                       # Complete project tracking documentation
│   ├── API_CONTRACT.md         # Endpoints, payloads, and status codes
│   ├── CHANGELOG.md            # Keep a Changelog releases
│   ├── DATABASE.md             # 17 schemas, indexes, and relations
│   ├── DECISIONS.md            # Architecture Decision Records (ADRs)
│   ├── ENV_SETUP.md            # Environment variables & setup guide
│   ├── GIT_WORKFLOW.md         # Branching, commits, PR review guidelines
│   ├── HOW_TO_USE_THESE_DOCS.md# Daily team workflow & Definition of Done
│   ├── KNOWN_ISSUES.md         # 7 critical failure cases & edge issues
│   ├── MEETINGS.md             # Standup & retrospective notes
│   ├── PROJECT_STATUS.md       # High-level sprint & module dashboard
│   ├── SYNC_LOG.md             # Automated git pull sync log
│   ├── TASKS.md                # Sprint-wise task board (S1 - S6)
│   ├── TESTING.md              # 12 must-test QA scenarios
│   └── USER_STORIES.md         # User stories with acceptance criteria
├── scripts/                    # Automation & sync scripts
│   ├── pull.sh / pull.ps1      # Safe pull wrapper with sync summary
│   ├── setup-hooks.sh / .ps1   # One-time git hooks setup script
│   └── sync-log.sh / .ps1      # Auto-generates SYNC_LOG.md entry
├── .gitignore
├── package.json                # Root orchestration & npm run commands
└── README.md
```

> *Note:* In development, `client/` corresponds to the frontend workspace and `server/` corresponds to the backend workspace.

---

## 4. Quick Start

### 4.1 Prerequisites
- **Node.js**: v18.x or v20.x
- **Python**: v3.10 or v3.11
- **MongoDB**: MongoDB Community Server 7.x locally OR a MongoDB Atlas cluster URI
- **Git**: v2.30+ installed

### 4.2 Initial Clone & One-Time Setup
Every team member must run the setup hook immediately after cloning:

```bash
# 1. Clone repository
git clone <repo-url>
cd Gatherly

# 2. Run one-time developer setup (registers git hooks)
npm run setup
```

### 4.3 Environment Configuration
Copy sample environment files and configure your local values:

```bash
# Backend / Server
cp backend/.env.example backend/.env

# AI Service
cp ai-service/.env.example ai-service/.env
```
*(Refer to [docs/ENV_SETUP.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/ENV_SETUP.md) for variable definitions and mock test keys).*

### 4.4 Install Dependencies & Run

```bash
# 1. Install Server Dependencies
cd backend
npm install
npm run dev

# 2. Install Client Dependencies (new terminal)
cd frontend
npm install
npm run dev

# 3. Install AI Service Dependencies (new terminal)
cd ai-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 5. Daily Git Workflow

To ensure smooth collaboration across all 6 members, always pull and sync before coding:

```bash
# Pull upstream changes and auto-update docs/SYNC_LOG.md
npm run pull
```

Check the terminal output for:
1. New commits and authors
2. Modified dependencies (`package.json`, `requirements.txt`)
3. Database changes (`docs/DATABASE.md`)
4. API updates (`docs/API_CONTRACT.md`)

---

## 6. Team Roster

| Role | Name / Assignee | Core Responsibilities | Primary Docs |
| :--- | :--- | :--- | :--- |
| **Engineering Lead & Backend** | Backend Lead | API architecture, Express routes, Socket.IO, security | `API_CONTRACT.md`, `DECISIONS.md` |
| **Frontend Lead** | Frontend Lead | React SPA, UI components, Tailwind styling, state | `USER_STORIES.md`, `PROJECT_STATUS.md` |
| **Database Engineer** | Database Engineer | Mongoose schemas, MongoDB Atlas indexes, migrations | `DATABASE.md` |
| **AI / ML Engineer** | AI/ML Specialist | FastAPI endpoints, prompt engineering, scikit models | `API_CONTRACT.md` (AI section) |
| **Integrations Specialist** | Integrations Lead | Razorpay payments, Webhooks, QR crypto, email/SMS | `KNOWN_ISSUES.md`, `API_CONTRACT.md` |
| **QA & DevOps Lead** | QA/DevOps Lead | CI/CD, Jest/Supertest suite, Git sync hooks, releases | `TESTING.md`, `SYNC_LOG.md`, `CHANGELOG.md` |

---

## 7. Documentation Index

| Document | Purpose |
| :--- | :--- |
| [docs/PROJECT_STATUS.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/PROJECT_STATUS.md) | Single-page status dashboard, sprint goals, and module completion |
| [docs/HOW_TO_USE_THESE_DOCS.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/HOW_TO_USE_THESE_DOCS.md) | Standard Operating Procedure, daily cycle, Definition of Done |
| [docs/TASKS.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/TASKS.md) | Sprint task breakdown with ownership, priorities, and PR status |
| [docs/USER_STORIES.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/USER_STORIES.md) | User stories grouped by Super Admin, Organizer, Attendee, Staff |
| [docs/API_CONTRACT.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/API_CONTRACT.md) | REST API specification with request/response schemas & status codes |
| [docs/DATABASE.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/DATABASE.md) | Complete specifications for all 17 collections & change log |
| [docs/GIT_WORKFLOW.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/GIT_WORKFLOW.md) | Conventional Commits, branch naming, code review rules |
| [docs/SYNC_LOG.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/SYNC_LOG.md) | Auto-generated audit log of git pulls and team catch-up checklists |
| [docs/DECISIONS.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/DECISIONS.md) | Architecture Decision Records (MERN, FastAPI, Razorpay, QR hash) |
| [docs/KNOWN_ISSUES.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/KNOWN_ISSUES.md) | 7 critical concurrency & failure edge cases under verification |
| [docs/TESTING.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/TESTING.md) | 12 must-test QA scenarios, test runners, and pass/fail states |
| [docs/ENV_SETUP.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/ENV_SETUP.md) | Environment configuration, API key setup, and `.env.example` |
| [docs/MEETINGS.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/MEETINGS.md) | Daily standup logs, sprint reviews, and retrospective templates |
| [docs/CHANGELOG.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/CHANGELOG.md) | Version history following Keep a Changelog conventions |
| [.github/pull_request_template.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/.github/pull_request_template.md) | Standardized PR submission checklist and verification guide |
