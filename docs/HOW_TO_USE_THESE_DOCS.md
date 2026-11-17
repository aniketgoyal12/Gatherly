# How to Use These Docs: Team Standard Operating Procedure

> **Last updated:** 2026-11-16  
> **Owner:** Engineering Lead & Scrum Master  
> **Audience:** All 6 Team Members (Frontend, Backend, Database, AI/ML, Integrations, QA/DevOps)

---

## 1. Philosophy: Living Documentation

In Gatherly, documentation is not an afterthought written the night before the college submission. **These markdown files are our living source of truth.** When code changes, the docs change in the exact same commit. If an endpoint is added without updating `API_CONTRACT.md`, the PR will be rejected.

---

## 2. Daily 4-Step Developer Workflow

Every team member must follow this routine every single day:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. RUN PULL     │       │ 2. READ SYNC    │       │ 3. PICK TASK    │       │ 4. CODE & SYNC  │
│                 │──────►│                 │──────►│                 │──────►│                 │
│ npm run pull    │       │ Check SYNC_LOG  │       │ Mark In Progress│       │ Commit with doc │
│                 │       │ catch-up items  │       │ in TASKS.md     │       │ updates + PR    │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Step 1: Run Safe Pull
```bash
npm run pull
```
Never run raw `git pull` blindly. `npm run pull` fetches remote commits, updates `docs/SYNC_LOG.md`, and prints color-coded action items directly in your terminal.

### Step 2: Read the Latest Sync Entry
Open [docs/SYNC_LOG.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/SYNC_LOG.md) and examine the **Latest Sync** card:
- Did `package.json` change? -> Run `npm install`.
- Did `requirements.txt` change? -> Run `pip install -r requirements.txt`.
- Did `docs/DATABASE.md` change? -> Read what fields or indexes were modified.
- Did `docs/API_CONTRACT.md` change? -> Check if endpoint paths or payloads shifted.

### Step 3: Pick & Update Task
1. Open [docs/TASKS.md](file:///c:/Users/Aniket/OneDrive/Desktop/Major%20Project/Gatherly/docs/TASKS.md).
2. Locate your assigned task in the current sprint.
3. Update Status from `Backlog` to `In Progress`.
4. Create your branch following conventions:
   ```bash
   git checkout -b feature/<module>-<short-description>
   ```

### Step 4: Develop, Test, and Commit with Docs Updates
When your feature or fix is ready:
1. Run local tests (`npm test` or `pytest`).
2. Update the corresponding docs:
   - Added/modified an API route? -> Update `docs/API_CONTRACT.md`.
   - Added/modified a Mongoose schema? -> Update `docs/DATABASE.md`.
   - Update `docs/CHANGELOG.md` under `[Unreleased]`.
   - Update task status in `docs/TASKS.md` to `In Review`.
3. Commit with Conventional Commits:
   ```bash
   git add .
   git commit -m "feat(auth): add refresh token cookie rotation"
   git push origin feature/auth-refresh-token
   ```
4. Open a PR using `.github/pull_request_template.md`.

---

## 3. Document Ownership Matrix

| Document | Primary Owner | Secondary Reviewer | When to Update |
| :--- | :--- | :--- | :--- |
| `PROJECT_STATUS.md` | QA / DevOps Lead | Engineering Lead | Weekly during sprint reviews |
| `TASKS.md` | Scrum Master / All | Engineering Lead | Daily as task status changes |
| `USER_STORIES.md` | Frontend Lead | Product Owner | Start of each sprint |
| `CHANGELOG.md` | QA / DevOps Lead | Backend Lead | Every PR containing features/fixes |
| `API_CONTRACT.md` | Backend Lead | Frontend Lead | Whenever any REST/Socket endpoint changes |
| `DATABASE.md` | Database Lead | Backend Lead | Whenever any schema, field, or index changes |
| `GIT_WORKFLOW.md` | QA / DevOps Lead | Backend Lead | When git conventions or hooks change |
| `DECISIONS.md` | Senior Lead / Architect | Team Consensus | Whenever an architectural choice is finalized |
| `KNOWN_ISSUES.md` | QA Lead | Integrations Lead | As soon as an edge case or defect is logged |
| `TESTING.md` | QA / DevOps Lead | Module Owners | After executing test scenarios |
| `ENV_SETUP.md` | Backend Lead | DevOps Lead | Whenever a new environment variable is introduced |
| `MEETINGS.md` | Scrum Master | All Team | After daily standups and sprint retros |
| `SYNC_LOG.md` | Automated Scripts | All Team | Updated automatically by `npm run pull` |

---

## 4. Definition of Done (DoD) Checklist

A user story or task is **ONLY** marked `[x] Done` when:

- [ ] **Code Quality:** Code is written cleanly in TypeScript / JavaScript / Python, formatted, and linted without warnings.
- [ ] **Functional Verification:** The feature meets all Acceptance Criteria specified in `docs/USER_STORIES.md`.
- [ ] **Automated Testing:** Unit/integration tests pass locally without regressions.
- [ ] **API Contract Sync:** Any modified endpoints are documented in `docs/API_CONTRACT.md`.
- [ ] **Database Spec Sync:** Any modified schemas or indexes are documented in `docs/DATABASE.md` and logged in the Schema Change Log.
- [ ] **Changelog Updated:** A bullet has been added to `docs/CHANGELOG.md` under `[Unreleased]`.
- [ ] **Task Status Updated:** The checkbox is checked in `docs/TASKS.md` with PR link attached.
- [ ] **Peer Review:** At least one peer review approval has been granted and merged into `main`.
