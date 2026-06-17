# QA Backlog

## Pending

### 1. E2E/Visual-Regression/A11y/Performance via POST /api/qa/run
The `POST /api/qa/run` endpoint currently only runs vitest test types (unit, component, api-contract, sse, security). It cannot run Playwright-based tests:

- `e2e` — Playwright E2E (requires running dev server)
- `visual-regression` — Playwright `toHaveScreenshot()` (requires baselines)
- `a11y` — axe-core accessibility via Playwright
- `perf:lighthouse` — Lighthouse CI (requires Chrome)
- `loadtest:k6` — k6 load testing (requires k6 binary)

**Requirements:**
- Add Playwright test types to `ALL_KNOWN_TYPES` and `TIER_TEST_TYPE_MAP` in `app/api/qa/run/route.ts`
- For each Playwright type, spawn `npx playwright test <pattern>` with `--reporter=json` (or `--reporter=line` + parse)
- The dev server must be running before Playwright tests can execute
- Results must be merged into the same per-project results.json/defects.json structure
- Visual regression baselines must be generated first via `npm run e2e:visual:update`

**Status:** Not started
**Priority:** Medium
