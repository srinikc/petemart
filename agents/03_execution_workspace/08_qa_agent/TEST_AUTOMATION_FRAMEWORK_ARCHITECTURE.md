# PeteMart — Test Automation Framework & Reporting Architecture

**Version:** 1.0  
**Date:** 2026-05-31  
**Author:** Agent 08 (QA Architect) / Human Gatekeeper  
**Status:** Reference Document  

---

## 1. Framework Selection by Test Type

| # | Test Type | Framework | Dashboard/Built-in Reporting |
|---|-----------|-----------|------------------------------|
| 1 | **Unit Tests** (utilities, helpers, pure functions) | **Vitest** (v2.1.9) | `@vitest/ui` — Web UI at `http://localhost:51204` with real-time results, test tree, filtering, console logs |
| 2 | **Component Tests** (UI rendering, states) | **Vitest + RTL** | Same as above — Vitest UI covers all Vitest tests |
| 3 | **Integration (API)** (routes, middleware, auth) | **Supertest + Vitest** | Same as above — runs via Vitest, results in Vitest UI |
| 4 | **Integration (DB)** (RLS, migrations) | **Supabase local + Vitest** | Same as above |
| 5 | **E2E (Web)** (full user journeys) | **Playwright** (v1.60.0) | **Built-in HTML Reporter** — `playwright-report/index.html` with search, filters, screenshots, trace viewer, video playback |
| 6 | **E2E (Mobile)** (Expo QR, store flow) | **Detox / Maestro** | Detox: Jest reporter output. Maestro: HTML report |
| 7 | **API Contract** (schema validation) | **Zod + MSW + Vitest** | Covered by Vitest UI |
| 8 | **Visual Regression** (UI snapshots) | **Playwright Snapshot** | Playwright HTML Reporter includes screenshot diffs with side-by-side comparison |
| 9 | **Performance** (Lighthouse) | **Lighthouse CI** | Built-in HTML report viewer (`lighthouse-report/`) with scores, recommendations, trace data |
| 10 | **Stress/Load** (500+ concurrent) | **k6** | Built-in HTML summary + **Grafana dashboards** via k6 output; `k6 run --summary-export` |
| 11 | **Security** (OWASP, secrets) | **OWASP ZAP** (DAST) + **CodeQL** (SAST) + **truffleHog** (secrets) | ZAP: HTML report. CodeQL: GitHub Security tab. truffleHog: JSON output |
| 12 | **Accessibility** (WCAG 2.1 AA) | **axe-core + Lighthouse CI** | Lighthouse HTML report includes a11y section; axe-core JSON output |
| 13 | **Cross-browser** (Chrome, Firefox, Safari, Edge) | **Playwright Matrix** | Playwright HTML Reporter with per-browser tabs |
| 14 | **Payment Flow** (Razorpay test) | **Supertest + Vitest** | Covered by Vitest UI |
| 15 | **WhatsApp Integration** | **Integration test** | Covered by Vitest UI |
| 16 | **Auth Flow** (OTP, JWT, role redirect) | **Playwright E2E** | Playwright HTML Reporter |
| 17 | **Multi-Tenant** (RLS, isolation) | **Supabase local + Vitest** | Covered by Vitest UI |
| 18 | **Data Migration** (schema up/down) | **SQL + Vitest** | Covered by Vitest UI |
| 19 | **Regression** (full suite in CI) | **GitHub Actions CI** | GitHub Checks UI + **Allure** (future: unified dashboard) |
| 20 | **Smoke** (health check on deploy) | **Playwright Quick** | GitHub Actions annotations |
| 21 | **Disaster Recovery** (backup/restore) | **Manual + scripts** | Log output |

---

## 2. Framework Installation Status

### Already Installed (in package.json / globally)

| Tool | Version | Status | Purpose |
|------|---------|--------|---------|
| `vitest` | 2.1.9 | ✅ Installed | Unit, component, integration tests |
| `@vitest/coverage-v8` | 2.1.9 | ✅ Installed | Coverage reporting |
| `jest` | 29.7.0 | ✅ Installed | Legacy API tests (used by `test:api`) |
| `supertest` | 7.0.0 | ✅ Installed | HTTP assertions for API tests |
| `@testing-library/react` | 16.0.0 | ✅ Installed | Component rendering |
| `@testing-library/jest-dom` | 6.6.0 | ✅ Installed | DOM matchers |
| `playwright` | 1.60.0 | ✅ Installed (global) | E2E tests, visual regression, cross-browser |
| `husky` | 9.1.7 | ✅ Installed | Pre-commit hooks |
| `lint-staged` | 17.0.7 | ✅ Installed | Staged file linting |

### Needs Installation

| Tool | Purpose | Install Command | Priority |
|------|---------|----------------|----------|
| `@vitest/ui` | Vitest web dashboard | `npm install -D @vitest/ui` | **High** |
| `allure-playwright` | Allure reporting for Playwright | `npm install -D allure-playwright` | Medium |
| `allure-commandline` | Allure report generation | `npm install -D allure-commandline` | Medium |
| `k6` | Load/stress testing | `winget install k6` or direct download | **High** |
| `@playwright/test` | Playwright test runner | `npm install -D @playwright/test` | **High** |
| `axe-playwright` | Accessibility via Playwright | `npm install -D axe-playwright` | Medium |
| `monocart-reporter` | Enhanced Playwright HTML reports | `npm install -D monocart-reporter` | Low |

---

## 3. Built-in Dashboard Capabilities (What Each Tool Offers Natively)

### 3.1 @vitest/ui — Vitest Web Dashboard

```
npm install -D @vitest/ui
npx vitest --ui          # Opens http://localhost:51204
```

**Features:**
- Real-time test execution with WebSocket updates
- Test tree browser (group by file, suite, or type)
- Console logs and error stack traces per test
- History chart (pass/fail over time)
- Filter by status (passed/failed/pending), file name, test name
- Component explorer (for RTL tests — see component DOM snapshots)
- Coverage tab (when `--coverage` is used)
- Dark/light theme

**How it fits PeteMart:**
- Runs alongside `npm run dev`
- Accessible at `/qa-ui` via reverse proxy or direct port
- Covers ALL Vitest-based tests (unit, component, API integration, DB, payment, WhatsApp, contract, migration, multi-tenant)

### 3.2 Playwright HTML Reporter — Built-in

```
npx playwright test --reporter=html
# Opens: playwright-report/index.html
```

**Features:**
- Search/filter by test name, status, project, browser
- Screenshot viewer with side-by-side diff for visual regression
- Trace Viewer (full timeline of Playwright actions)
- Video playback of failed tests
- Error stack traces and console logs per test
- Per-browser tabs when running matrix
- Flaky test detection

**How it fits PeteMart:**
- Covers all E2E, visual regression, cross-browser, and auth flow tests
- Static HTML — can be served via `/qa-e2e` route or GitHub Pages
- Integrates with CI for artifact publishing

### 3.3 k6 HTML Summary

```
k6 run --summary-trend-stats="avg,min,med,max,p(90),p(95)" script.js
```

**Features:**
- Request duration distribution (percentiles)
- Error rate and response codes
- Virtual user activity timeline
- Built-in HTML output via `handleSummary()` or external reporter

**How it fits PeteMart:**
- Load tests run periodically (not on every PR)
- Results stored in `qa-dashboard/` for trend tracking

### 3.4 Lighthouse CI Report

```
npx lhci collect
npx lhci upload
```

**Features:**
- Scores for Performance, Accessibility, Best Practices, SEO, PWA
- Trace data and filmstrip
- Recommendations with code-level guidance
- Historical comparison via LHCI server

**How it fits PeteMart:**
- Runs on deploy preview URLs
- Score thresholds enforced in CI

### 3.5 GitHub Actions Test Summary

GitHub Actions auto-generates:
- **Check annotations** — inline PR comments for failed tests
- **Test Summary** — in the Actions run view (pass/fail counts, duration)
- **Artifacts** — Playwright HTML reports, coverage reports, screenshots
- **Status badges** — `![tests](https://img.shields.io/...)`

---

## 4. Unified Dashboard Strategy

Rather than building a custom dashboard from scratch, we use a **portal approach**:

```
┌──────────────────────────────────────────────────────────────┐
│              PeteMart QA Portal (/dashboard)                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Vitest   │  │Playwright│  │  k6      │  │  Lighthouse  │ │
│  │ UI       │  │HTML      │  │Dashboard │  │  Reports     │ │
│  │ :51204   │  │Report    │  │(Grafana) │  │              │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Summary Cards + Links + Quality Gates + Trend Chart │    │
│  │  (Lightweight Next.js page, reads qa-dashboard/*)    │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**The Next.js `/dashboard` page serves as:**
1. **Aggregated summary** with KPI cards (total tests, pass rate, coverage, gates)
2. **Links** to each tool's native dashboard (Vitest UI, Playwright report, etc.)
3. **Quality gates** status (pass/fail per gate)
4. **Trend chart** of pass rate over time
5. **Categorized view** of all 21 test types with their current status

**This avoids duplicating what each tool already does well** while providing a single entry point.

---

## 5. Directory Structure for Test Artifacts

```
qa-dashboard/
├── results.json              # Aggregated test results (updated by collector script)
├── quality-gates.json        # Gate definitions and current status
├── defects.json              # Defect log (tied to test failures)
├── test-types.json           # Taxonomy of all 21 test types
├── history.json              # Historical runs for trend charts
├── config.json               # Dashboard configuration
├── vite-report/              # Symlink/copy of @vitest/ui output
├── playwright-report/        # Playwright HTML reporter output
├── k6-report/                # k6 load test HTML reports
├── lighthouse-report/        # Lighthouse CI HTML reports
└── coverage/                 # Vitest coverage output

scripts/
├── collect-test-results.js   # Runs all tests, aggregates results into qa-dashboard/
├── serve-test-reports.js     # Optional: serves test reports on a port
└── run-qa-cycle.sh           # Full QA cycle: test → collect → report
```

---

## 6. Collector Script Flow

The `collect-test-results.js` script:

```
1. Run: vitest run --reporter=json
   → Parse stdout for test counts, pass/fail, duration
   → Append to qa-dashboard/history.json

2. Run: npx playwright test --reporter=json
   → Parse playwright-report/results.json
   → Append to qa-dashboard/history.json

3. Merge into qa-dashboard/results.json:
   → Update summary stats per test type
   → Update quality gate status
   → Calculate coverage trends

4. Generate: qa-dashboard/coverage-summary.json
   → From vitest --coverage output
```

This runs:
- On every PR (CI pipeline, step after build)
- On demand via `npm run qa:collect`
- Scheduled (weekly full cycle with performance tests)

---

## 7. CI Integration

```yaml
# In ci.yml — after build and test steps
- name: Collect QA Results
  run: node scripts/collect-test-results.js

- name: Upload Test Reports
  uses: actions/upload-artifact@v4
  with:
    name: qa-reports
    path: |
      qa-dashboard/
      playwright-report/
      coverage/

- name: Deploy QA Dashboard to GitHub Pages
  if: github.ref == 'refs/heads/develop'
  run: |
    # Static export of qa-dashboard to gh-pages branch
```

---

## 8. Running Each Dashboard

| Dashboard | Command | URL |
|-----------|---------|-----|
| Vitest UI | `npx vitest --ui` | `http://localhost:51204` |
| Playwright Report | `npx playwright show-report` | `http://localhost:9323` |
| k6 HTML | `k6 run --out json=results.json script.js` | File: `k6-report/index.html` |
| Lighthouse | `npx lhci open` | Local HTML |
| PeteMart Portal | `npm run dev` → `/dashboard` | `http://localhost:3458/dashboard` |

---

## 9. Recommended Installation Order

1. `npm install -D @vitest/ui @playwright/test` — core dashboard tools
2. `npm install -D allure-playwright allure-commandline` — unified reporting (optional)
3. Install k6 (system-wide) — load testing
4. Run `npx playwright install` — browser binaries
5. Run `npx vitest --ui` — verify dashboard works
6. Create Playwright config and first E2E tests
7. Wire collector script into CI

---

## 10. Comparison: Allure vs Native Reporters

| Feature | Allure Framework | Native Tool Reporters |
|---------|-----------------|----------------------|
| **Unified view** | ✅ Single dashboard for all test types | ❌ Separate per tool |
| **History/trends** | ✅ Built-in | ⚠️ Vitest UI has basic trends |
| **Setup complexity** | ⚠️ Medium (requires config per tool) | ✅ Zero config (built-in) |
| **CI integration** | ✅ GitHub Actions plugin | ✅ Native GitHub Checks |
| **Screenshots** | ✅ Attached to test cases | ✅ Playwright report has them |
| **Categories/severity** | ✅ Rich metadata | ❌ Basic pass/fail only |
| **Performance** | ⚠️ Can be slow for 1000+ tests | ✅ Fast (static HTML) |
| **Cost** | Free (open source) | Free (built-in) |

**Recommendation:** Start with native reporters (Vitest UI + Playwright HTML) for zero-config setup. Add Allure in Phase 2 when unified historical dashboards become necessary.
