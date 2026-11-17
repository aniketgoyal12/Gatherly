# Team Meetings, Standups & Retrospectives: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** Scrum Master & Engineering Lead  
> **Cadence:** Daily Standups (15 mins) \| Bi-weekly Sprint Review & Retrospective

---

## 1. Meeting Templates

### 1.1 Daily Standup Template
```markdown
### Standup: YYYY-MM-DD
- **Sprint:** Sprint X (Day Y)
- **Attendees:** [Names]
- **Round-Robin Updates:**
  - **Frontend Lead:**
    - *Done:* 
    - *Planned:* 
    - *Blockers:* None
  - **Backend Lead:**
    - *Done:* 
    - *Planned:* 
    - *Blockers:* 
  - **Database Lead:**
    - *Done:* 
    - *Planned:* 
    - *Blockers:* 
  - **AI/ML Lead:**
    - *Done:* 
    - *Planned:* 
    - *Blockers:* 
  - **Integrations Lead:**
    - *Done:* 
    - *Planned:* 
    - *Blockers:* 
  - **QA / DevOps Lead:**
    - *Done:* 
    - *Planned:* 
    - *Blockers:* 
- **Action Items:**
  - [ ] Action item 1 (Owner, Target date)
```

---

## 2. Pre-Filled Meeting Records

### 2.1 Daily Standup: 2026-11-16 (Sprint 1 Wrap-up)
- **Sprint:** Sprint 1 (Day 10)
- **Attendees:** Backend Lead, Frontend Lead, Database Lead, AI/ML Lead, Integrations Lead, QA/DevOps Lead (All present)
- **Round-Robin Updates:**
  - **Frontend Lead:**
    - *Done:* Set up Tailwind theme, shared layout components, and navbar with role switching placeholder.
    - *Planned:* Connect login view with backend JWT auth routes once Sprint 2 begins.
    - *Blockers:* None.
  - **Backend Lead:**
    - *Done:* Scaffolding Express 5 router, Helmet, rate-limiter, and error wrapper. Completed `API_CONTRACT.md`.
    - *Planned:* Implement `/api/v1/auth/register` and `/api/v1/auth/login` with Bcrypt.
    - *Blockers:* None.
  - **Database Lead:**
    - *Done:* Finalized all 17 Mongoose schemas in `DATABASE.md` with indexes and relationships.
    - *Planned:* Write Mongoose schema files in `backend/src/models/` for Sprint 2.
    - *Blockers:* Need to confirm TTL index interval for pending reservations (settled at 10 minutes).
  - **AI/ML Lead:**
    - *Done:* Bootstrapped FastAPI service skeleton on port 8000. Tested basic prompt template with local Ollama/Gemini API.
    - *Planned:* Build JSON output parser for structured event itinerary generation.
    - *Blockers:* Need shared secret for internal Node-to-FastAPI proxy communication (added to `.env.example`).
  - **Integrations Lead:**
    - *Done:* Configured Razorpay test mode dashboard and generated test API keys. Drafted webhook idempotency flow in ADR-006.
    - *Planned:* Implement Razorpay signature verification utility in `backend/src/services/razorpay.js`.
    - *Blockers:* Need public tunneling URL for local webhook testing (will use `ngrok`).
  - **QA / DevOps Lead:**
    - *Done:* Created cross-platform Git pull sync hooks (`sync-log.sh`, `sync-log.ps1`, `.githooks/post-merge`) and root `npm run pull` command.
    - *Planned:* Add GitHub Actions CI workflow to run linter and tests on pull requests.
    - *Blockers:* None.
- **Action Items:**
  - [x] Merge Sprint 1 architecture documentation PR into `main` (QA Lead, 2026-11-16).
  - [ ] Every member to run `npm run setup` after pulling `main` to activate hooks (All Team, 2026-11-17).

---

### 2.2 Sprint 1 Review & Retrospective: 2026-11-16
- **Sprint Goal:** System planning, 17 database schemas, API contracts, ADRs, and developer workflow automation.
- **Goal Outcome:** **Met (100% of Sprint 1 tasks complete).**
- **What Went Well:**
  - Defining API contracts and DB schemas upfront eliminated ambiguity between frontend and backend.
  - Automated Git pull sync log prevents silent file divergence and missed migrations.
  - Clear ADRs established for critical risks (atomic bookings, hashed QR tokens).
- **What Could Be Improved:**
  - Team members need to ensure local Node and Python versions match project recommendations (Node 18/20, Python 3.11).
  - PR reviews should be conducted within 24 hours to avoid blocking dependent feature branches.
- **Action Items for Sprint 2:**
  - [ ] Enforce the Definition of Done on all Sprint 2 PRs (QA Lead).
  - [ ] Deliver Auth and Event CRUD endpoints by end of Week 3 (Backend & Frontend Leads).
