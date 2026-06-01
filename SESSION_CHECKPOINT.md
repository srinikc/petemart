# Session Checkpoint — June 1, 2026

## Goal
- Complete QA Agent (08) E2E Automation Framework — Playwright tests, test selection mechanism, dashboard enhancements, CI integration, and git check-in

## Done
- **Playwright config**: `playwright.config.ts` with chromium/firefox/webkit matrix, env-aware settings, HTML+JSON reporters
- **39 E2E tests** across 6 spec files:
  - `home-page.spec.ts` — landing page load, featured merchants, navigation, how-it-works
  - `auth-flow.spec.ts` — login/signup tabs, email/phone forms, persona selection, validation
  - `customer-journey.spec.ts` — market browse, merchant shop, product detail, cart, checkout, orders, tracking
  - `merchant-flow.spec.ts` — auth redirect, protected route enforcement, layout verification
  - `admin-flow.spec.ts` — auth redirect, admin page loading, layout verification
  - `api-health.spec.ts` — 12 API endpoint tests (health, markets, products, merchants, auth, orders, tracking, admin)
- **Test selection mechanism** (`qa-dashboard/test-run-config.json`):
  - Sandbox profile: unit + integration + security + regression (fast subset, chromium only)
  - CI profile: unit + integration + e2e + security + regression (full matrix, fail fast)
  - `scripts/run-tests.js` — reads config, runs selected tests, logs history
  - `npm run qa:run` (sandbox), `npm run qa:run:ci` (CI), `npm run qa:list` (list types)
- **QA dashboard enhanced** (`app/qa-dashboard/page.tsx`):
  - Environment toggle (Sandbox ↔ CI/CD) with visual badge
  - Test selection panel showing enabled types per environment
  - Playwright projects, fail-fast mode, and collection status display
- **Collector script updated** (`scripts/collect-test-results.js`):
  - Now reads `playwright-results.json` and merges E2E counts into dashboard
- **CI workflow updated** (`.github/workflows/ci.yml`):
  - New `e2e-tests` job: installs Playwright, starts Next.js, runs tests, uploads artifacts
  - QA collector step in `build-and-test` job
  - `ci-summary` aggregate job showing all gate results
- **npm scripts added**: `e2e`, `e2e:ui`, `e2e:headed`, `e2e:debug`, `e2e:report`, `e2e:install`, `qa:run`, `qa:run:ci`, `qa:list`
- **STATE_MATRIX.json**: QA Agent 08 marked completed, downstream agents unblocked
- **Token usage** logged via `python scripts/track_usage.py`

## Key Decisions
- Playwright E2E tests run as a **separate CI job** (e2e-tests) that depends on build-and-test, not inline
- Test selection config is JSON-based (`test-run-config.json`) — easy to edit per environment
- QA dashboard reads the config live and shows current environment's enabled types
- `run-tests.js` can be called with `--type=unit,e2e` to override config for debugging
- Playwright multi-browser (firefox, webkit) runs only in CI to keep local fast

## What's Blocked
- Agents 07a (UI), 07b (API), 07c (Backend DB), 07d (Integration) still awaiting HITL approval
- Agent 09 (Production) needs 07a-07d approved first
- Vercel CD: needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets
- Supabase migrations: needs `SUPABASE_ACCESS_TOKEN`

## Next Steps
1. HITL approve agents 07a-07d (UI, API, Backend DB, Integration)
2. Proceed to agents 09-15 (Production, Tech Pub, Customer Onboarding, Marketing, Maintenance, FinOps, Secrets)
3. Set GitHub secrets for Vercel + Supabase when ready to deploy
4. Run `npm run qa:run` locally to verify test selection works
5. Run `npx playwright test` to verify E2E tests pass on local dev server

## Package Scripts Added
| Script | Description |
|--------|-------------|
| `npm run e2e` | Run all Playwright tests (headless) |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run e2e:headed` | Run with browser visible |
| `npm run e2e:debug` | Debug mode |
| `npm run e2e:report` | Open Playwright HTML report |
| `npm run e2e:install` | Install Playwright browsers |
| `npm run qa:run` | Run tests per sandbox config |
| `npm run qa:run:ci` | Run tests per CI config |
| `npm run qa:list` | List enabled test types |
