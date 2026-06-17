# QA Backlog

## Pending

### 1. E2E/Visual-Regression/A11y/Performance via `POST /api/qa/run`
`POST /api/qa/run` currently only runs vitest test types (unit, component, api-contract, sse, security). Cannot run Playwright-based tests:

- `e2e` — Playwright E2E (requires running dev server)
- `visual-regression` — Playwright `toHaveScreenshot()` (requires baselines)
- `a11y` — axe-core accessibility via Playwright
- `perf:lighthouse` — Lighthouse CI (requires Chrome)
- `loadtest:k6` — k6 load testing (requires k6 binary)

**Requirements:**
- Add Playwright test types to `ALL_KNOWN_TYPES` and `TIER_TEST_TYPE_MAP` in `app/api/qa/run/route.ts`
- For each Playwright type, spawn `npx playwright test <pattern>` with `--reporter=json`
- Dev server must be running before Playwright tests can execute
- Merge results into per-project results.json/defects.json
- Visual regression baselines must be generated first via `npm run e2e:visual:update`

**Status:** Not started
**Priority:** Medium

### 2. Visual Regression Baseline Snapshots
`toHaveScreenshot()` assertions in `e2e/visual-regression.spec.ts` and `e2e/agentic-console/visual-regression.spec.ts` require baseline images that don't exist yet.

**Requirements:**
- Run `npm run e2e:visual:update` against a running dev server with real data
- Commit the generated baseline snapshots to the repo
- Verify `npm run e2e:visual` passes

**Status:** Not started
**Priority:** Medium

### 3. Quality Gates QG-AC-07/08/10 — "not-evaluated"
Three quality gates show "not-evaluated" because they depend on infrastructure not yet running in CI:
- QG-AC-07: Cross-browser (needs Playwright in CI)
- QG-AC-08: Accessibility (needs axe-core Playwright run)
- QG-AC-10: Visual regression (needs baseline snapshots)

**Status:** Blocked by items 1 and 2
**Priority:** Low

### 4. Real Jira Integration
`POST /api/qa/jira-sync` only does dry-run export to Jira payload format. No actual API calls.

**Requirements:**
- Add Jira credentials to GitHub secrets
- Implement actual `POST` to Jira REST API
- Wire into defect lifecycle (auto-create Jira issue when defect created)

**Status:** Not started
**Priority:** Low

### 5. React `act()` Warnings in Component Tests
Pre-existing warnings in component tests (dashboard, layout, health, quality, operations). Non-fatal but noisy.

**Status:** Not started
**Priority:** Low

### 6. Traceability.json Population
`qa-dashboard/projects/agentic-console/traceability.json` is empty. Feature-to-requirement mapping not populated.

**Status:** Not started
**Priority:** Low

### 7. Authentication on QA API Routes
All QA routes (`/api/qa/*`) are unauthenticated. Only `BLOCK_QA_API` env var guards them.

**Requirements:**
- Add session/auth middleware check to QA routes
- Or integrate with existing RBAC

**Status:** Not started
**Priority:** Low
