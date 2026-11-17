# Git Workflow & Team Collaboration Guide: Gatherly

> **Last updated:** 2026-11-16  
> **Owner:** QA & DevOps Lead  
> **Target Audience:** All 6 Team Members (Frontend, Backend, Database, AI/ML, Integrations, QA)

---

## 1. Core Principles & Golden Rules

> [!CAUTION]
> **Strict Violations That Will Break CI or Trigger Rollback:**
> 1. **Never commit `.env` files or raw secrets** (Razorpay secret, MongoDB password, JWT secrets, LLM API keys).
> 2. **Never push directly to `main`**. All changes must go through a pull request (PR).
> 3. **Always run `npm run pull` before starting any work** to keep your local branch fresh and prevent divergence.
> 4. **Never merge a PR without updating corresponding docs** (`API_CONTRACT.md`, `DATABASE.md`, `CHANGELOG.md`, `TASKS.md`).

---

## 2. Branch Naming Conventions

All branches must follow lowercase, hyphen-separated naming prefixed by the task type and module scope:

| Branch Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feature/` | New functionality or user-facing feature | `feature/auth-jwt-middleware`<br>`feature/qr-scanner-ui` |
| `fix/` | Bug fixes and edge-case error resolutions | `fix/webhook-duplicate-delivery`<br>`fix/capacity-race-condition` |
| `docs/` | Documentation additions or updates | `docs/api-contracts`<br>`docs/testing-guide` |
| `test/` | Adding test suites or mock setups | `test/concurrency-booking`<br>`test/ai-service-mock` |
| `chore/` | Tooling, dependencies, build, git hooks | `chore/upgrade-tailwind`<br>`chore/setup-hooks-ps1` |
| `refactor/` | Code refactoring without behavioral change | `refactor/payment-service-split` |

### Branch Lifecycle:
1. Always branch off the latest `main`:
   ```bash
   npm run pull
   git checkout -b feature/auth-jwt-middleware
   ```
2. Keep branches short-lived (maximum lifespan: 2 to 3 days).
3. Delete local and remote feature branches after merging into `main`.

---

## 3. Conventional Commits Standard

We adhere to the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/) specification. This structure powers our automated Git sync log and changelog generation.

### Format:
```text
<type>(<scope>): <short description in present imperative tense>

[optional body explaining context and why the change was made]

[optional footer referencing task ID, e.g., Resolves #TSK-S2-02]
```

### Commit Types & Gatherly Examples:

| Type | When to Use | Example Commit Subject |
| :--- | :--- | :--- |
| `feat` | A new feature | `feat(auth): add jwt authentication and refresh cookie handler` |
| `fix` | A bug fix | `fix(payments): prevent duplicate ticket generation on replayed webhook` |
| `docs` | Documentation changes | `docs(database): update registrations schema with ttl expiration index` |
| `style` | Formatting, missing semi-colons, Tailwind tweaks | `style(client): adjust ticket card padding and font weight` |
| `refactor`| Refactoring code without functional change | `refactor(server): modularize razorpay order builder into service class` |
| `perf` | Performance improvement | `perf(database): add compound index on eventId and status for tickets` |
| `test` | Adding or correcting tests | `test(tickets): add concurrency race test for last remaining seat` |
| `chore` | Build process, auxiliary tools, configs | `chore(hooks): add cross-platform post-merge sync script` |

---

## 4. Pull Request (PR) Rules & Review Workflow

### 4.1 PR Submission Criteria
Before opening a PR on GitHub, the author must:
- [ ] Run `npm run pull` to rebase/merge the latest `main` into the branch.
- [ ] Ensure the server, client, or AI service builds and tests pass locally.
- [ ] Verify no `.env` or temporary files are staged (`git status`).
- [ ] Fill out the PR template (`.github/pull_request_template.md`).
- [ ] Link the task ID from `docs/TASKS.md` (e.g. `Resolves TSK-S2-02`).

### 4.2 Review Requirements
- Every PR requires at least **1 approving review** from a relevant module owner before merging.
- If schema files changed (`backend/src/models/*`), the **Database Engineer** must review.
- If endpoints changed (`backend/src/routes/*`), the **Frontend Lead** must review.
- Use **Squash and Merge** on GitHub to keep `main` history clean and linear.

---

## 5. Code Review Checklist

Reviewers must inspect PRs against this checklist before granting approval:

| Category | Verification Checks |
| :--- | :--- |
| **Security** | • No hardcoded keys, passwords, or tokens.<br>• Input validated with Zod/Pydantic schemas.<br>• RBAC middleware enforced on protected routes. |
| **Correctness** | • Solves the linked task criteria in `docs/TASKS.md`.<br>• Edge cases handled (e.g., zero seats remaining, network timeout).<br>• Correct HTTP status codes used as defined in `docs/API_CONTRACT.md`. |
| **Performance** | • No unindexed queries on large collections.<br>• Database operations use atomic operators (`$inc`, `$set`) where needed.<br>• Large assets (QR images, banners) compressed or streamed properly. |
| **Documentation** | • `docs/CHANGELOG.md` updated under `[Unreleased]`.<br>• `docs/API_CONTRACT.md` updated if endpoints changed.<br>• `docs/DATABASE.md` updated if schemas changed.<br>• `docs/TASKS.md` status checkbox updated. |

---

## 6. Resolving Merge Conflicts Step-by-Step

When two teammates modify the same file (e.g. `docs/TASKS.md` or a route file), follow these safe steps:

```bash
# 1. Ensure you are on your working branch with clean working directory
git checkout feature/your-branch-name
git status

# 2. Fetch latest main branch
git fetch origin main

# 3. Rebase your changes on top of main (or merge)
git merge origin/main

# 4. If conflicts occur, Git lists the conflicted files:
#    CONFLICT (content): Merge conflict in docs/TASKS.md
# Open the file in your editor and look for conflict markers:
# <<<<<<< HEAD (your branch changes)
# =======
# >>>>>>> origin/main (remote changes)

# 5. Manually resolve the markers keeping both updates intact.

# 6. Stage resolved files:
git add docs/TASKS.md

# 7. Commit the merge:
git commit -m "chore(merge): resolve conflicts with origin/main"

# 8. Push to your feature branch:
git push origin feature/your-branch-name
```
