## Pull Request Title Convention
> Format: `type(scope): short description in imperative tense`  
> Examples: `feat(auth): add jwt login endpoint and refresh cookie`, `fix(payments): prevent duplicate ticket creation on webhook replay`

---

## 1. Description of Changes
*Provide a concise summary of what this pull request introduces or fixes.*

---

## 2. Linked Task & Issue
- **Task ID:** Resolves #`TSK-S__-___` (from `docs/TASKS.md`)
- **Known Issue / Defect (if applicable):** Fixes #`ISS-___` (from `docs/KNOWN_ISSUES.md`)

---

## 3. Type of Change
- [ ] `feat` - New feature or user capability
- [ ] `fix` - Bug fix or failure case resolution
- [ ] `docs` - Documentation additions or updates
- [ ] `refactor` - Code restructuring without functional change
- [ ] `test` - Adding or updating unit, integration, or load tests
- [ ] `chore` - Dependencies, scripts, or configuration changes

---

## 4. Testing & Verification Performed
- [ ] Unit and integration tests pass locally (`npm test` / `pytest`).
- [ ] Manual end-to-end verification completed.
- [ ] Concurrency / race conditions verified (if ticketing or booking).
- [ ] Error scenarios and edge cases handled (e.g., network failure, invalid input).

### Screenshots / Verification Output (if applicable):
*Paste screenshots, terminal test logs, or curl outputs here.*

---

## 5. Documentation Sync Checklist (Definition of Done)
*A PR cannot be merged until all applicable documentation is kept in sync:*

- [ ] **`docs/TASKS.md`:** Task status updated to `In Review` and PR link added.
- [ ] **`docs/CHANGELOG.md`:** Entry added under `[Unreleased]` (`Added`, `Changed`, `Fixed`).
- [ ] **`docs/API_CONTRACT.md`:** Updated if any endpoint, method, role, payload, or response changed (or N/A).
- [ ] **`docs/DATABASE.md`:** Updated if any schema, field, index, or relationship changed (or N/A).
- [ ] **`.env.example` & `docs/ENV_SETUP.md`:** Updated if any new environment variable was introduced (or N/A).

---

## 6. Safety & Security Check
- [ ] **No `.env` or credentials committed** (`git status` checked).
- [ ] **No merge conflicts** with latest `main`.
- [ ] **Follows project style guides** and TypeScript/ESLint standards.
