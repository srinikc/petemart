# QA Dashboard & CI/CD Pipeline Architecture

## Overview

Enterprise-grade Quality Dashboard with 3-tier CI/CD pipeline, full test run traceability, and reusable config-driven framework. Designed for any product, not just PeteMart.

## 1. CI/CD Pipeline — 3-Tier Model

```
COMMIT → PR → CODE REVIEW → CI/CD → QA DASHBOARD
```

### Tier 1: Sanity (Every Push/PR — ~3 min)

**Trigger**: `push` or `pull_request` to any branch

**Goal**: Fast developer feedback — catch compilation errors, type issues, and critical regressions immediately.

| Step | Tool | What it validates |
|------|------|-------------------|
| 1. AI Code Review | PR-Agent (DeepSeek) | Logic errors, security, bugs, quality |
| 2. Secrets Scan | truffleHog + Gitleaks | Hardcoded credentials, API keys |
| 3. Build Check | `next build` | Compilation, bundling |
| 4. TypeScript Check | `tsc --noEmit` | Type safety |
| 5. Lint | ESLint | Code style, best practices |
| 6. Unit Tests | Vitest (122 tests) | Pure logic, utilities, hooks |
| 7. **API Tests** | Vitest + Supertest | API routes, auth guards, middleware |
| 8. Post Results | POST to Dashboard API | Run recorded in run-history |

**What it does NOT run**: E2E, visual regression, performance, stress, cross-browser, security full, accessibility, multi-tenant, migration, disaster recovery.

**Verdict**: GitHub Status Check ✅/❌ — blocks merge if failed.

---

### Tier 2: Build Promotion to QA (Manual / Workflow Dispatch — ~15 min)

**Trigger**: `workflow_dispatch` or automated "Promote to QA" button

**Goal**: Comprehensive validation before handing a build to QA team. Runs ALL test types **except Disaster Recovery**.

**workflow_dispatch inputs**:

| Input | Options | Default | Description |
|-------|---------|---------|-------------|
| `test_suite` | `dev`, `qa`, `all` | `qa` | Which test group to run |
| `build_label` | (free text) | `build-#` | Human-readable label (e.g. "build-47", "sprint-12") |
| `commit_sha` | (auto) | HEAD | Specific commit to test |

**Test groups**:

| Group | Test types included | Est. time |
|-------|-------------------|-----------|
| `dev` | Tier 1 + component + integration + api-contract | ~5 min |
| `qa` | `dev` + E2E (chromium) + visual regression + security + multi-tenant + migration + accessibility + cross-browser + performance | ~15 min |
| `all` | `qa` + stress/load | ~20 min |

**What it intentionally SKIPS**: Disaster Recovery (manual procedure).

**Output**: Full results posted to QA Dashboard, run recorded with `build_label` and git SHA for traceability.

---

### Tier 3: Release (Git Tag — ~25 min)

**Trigger**: `git tag v*.*.*` or GitHub Release created

**Goal**: Production-grade validation — ZERO compromises. Every single test type runs.

**Includes ALL tests** from Tiers 1 + 2 **PLUS**:

| Test type | Why it's release-only |
|-----------|----------------------|
| Disaster Recovery | Backup/restore, failover — heavy infra, run only for releases |
| Stress/Load (full) | 500+ concurrent users, 30-min endurance — time-consuming |
| Full cross-browser | Chromium + Firefox + Safari + Edge — parallel but resource-heavy |
| Full E2E suite | All Playwright projects, all spec files |
| Performance budget | Lighthouse CI with strict thresholds |

**Release Gates**:

| Gate | Criteria | Verdict |
|------|----------|---------|
| All tests pass | 0 failures across all types | ✅ Pass |
| No critical defects | 0 open P0/P1 defects | ✅ Pass |
| Security scan clear | No High/Critical vulnerabilities | ✅ Pass |
| Performance budget | Lighthouse scores ≥ thresholds | ✅ Pass |
| Coverage ≥ threshold | 80%+ line coverage | ✅ Pass |
| **Go/No-Go Decision** | All gates green → **GO** | 🟢 / 🔴 |

**Output**:
- Full results posted to QA Dashboard with release version tag
- Go/No-Go verdict recorded in dashboard
- GitHub Release created with test summary
- SBOM generated + attached to release

---

### Traceability: Every Run Tracked Forever

Each test run records:

```json
{
  "runId": "run_abc123",
  "environment": "ci-full",
  "tier": "release",
  "buildLabel": "v1.2.0",
  "gitSha": "a1b2c3d4e5f6...",
  "gitBranch": "main",
  "gitTag": "v1.2.0",
  "triggeredBy": "GitHub Actions / tag",
  "startedAt": "2026-06-01T10:00:00Z",
  "completedAt": "2026-06-01T10:25:00Z",
  "allPassed": true,
  "tests": {
    "unit": { "status": "passed", "passed": 45, "failed": 0, "durationMs": 296 },
    "api-contract": { "status": "passed", "passed": 7, "failed": 0, "durationMs": 9 },
    "e2e": { "status": "passed", "passed": 51, "failed": 0, "durationMs": 32000 },
    "disaster-recovery": { "status": "passed", "passed": 5, "failed": 0, "durationMs": 12000 }
  },
  "qualityGates": {
    "allTestsPass": true,
    "noCriticalDefects": true,
    "securityClear": true,
    "performanceBudget": true,
    "coverageThreshold": true
  },
  "goNoGo": "GO"
}
```

**Where it's stored**:
- `qa-dashboard/run-history.json` — full history (append-only, capped at 500 entries)
- `qa-dashboard/results.json` — latest snapshot (always current state)
- Deployed dashboard POST API — persists across deployments

**Traceability queries possible**:
- "When did test X last pass?"
- "Which release introduced this regression?"
- "What was the pass rate for build #47?"
- "Show all runs where E2E failed in the last 30 days"

---

### Tests Engine — 3-Tier One-Click Runner

Added to the QA dashboard as a dedicated section. Each tier maps to a CI/CD pipeline stage:

| Tier | Button | Tests Run | Est. Time | Local | CI |
|------|--------|-----------|-----------|-------|----|
| **Sanity** (Tier 1) | 🟢 One-click | unit, integration, api-contract, regression | ~3 min | ✅ | ✅ |
| **Full QA** (Tier 2) | 🟡 One-click | All except DR | ~15 min | ❌ | ✅ |
| **Release** (Tier 3) | 🔴 One-click | All including DR | ~25 min | ❌ | ✅ |

**NPM Scripts**:
```
npm run qa:sanity    # Run Sanity tier locally
npm run qa:full      # Run Full QA tier locally
npm run qa:release   # Run Release tier locally
npm run qa:run       # Default sandbox mode (existing)
npm run qa:run:ci    # CI mode (existing)
```

**Run Metadata**: Each run now captures:
- `gitSha`, `gitBranch`, `gitTag` — auto-detected from git
- `buildLabel` — user-provided or auto-generated
- `triggeredBy` — qa-dashboard / developer / ci-pipeline / release-manager
- `tier` — sanity / full / release / custom

### Standalone Deployment

The QA dashboard is decoupled from the dev server:

1. **Production mode** (no dev server needed):
   ```
   npm run build
   npm run serve:qa          # starts on port 3458
   ```

2. **Standalone export** (zero runtime deps):
   ```
   npm run build
   node .next/standalone/server.js -p 3458
   ```

3. **Vercel deployment** (remote instance):
   The dashboard is automatically deployed with the app. Available at `/qa-dashboard`.

4. **Local dev** (for development):
   ```
   npm run dev               # available at localhost:3458/qa-dashboard
   ```

**Single instance strategy**: One QA dashboard instance (on Vercel) that accepts POST results from both local runs and CI/CD. Local runs push results via the POST API. CI/CD runs push results via the same API after workflow completion. The dashboard reads the shared `results.json` and `run-history.json` to show unified data.

---

## 2. QA Dashboard Architecture

### Deployment

| Environment | URL | Data source |
|-------------|-----|-------------|
| Local dev | `http://localhost:3458/qa-dashboard` | Local `results.json` |
| Vercel Preview (PR) | `*-petemart.vercel.app/qa-dashboard` | PR CI run results |
| Vercel QA | `qa.petemart.vercel.app/qa-dashboard` | All CI/CD run results |
| Vercel Production | `petemart.vercel.app/qa-dashboard` | All runs |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│                                                                  │
│  Local Dev          GitHub Sanity CI     GitHub Full CI/CD       │
│  (scripts/run       (ci-sanity.yml)      (ci-full.yml)           │
│  -tests.js)                                                      │
│       │                   │                      │               │
│       ▼                   ▼                      ▼               │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              QA Dashboard API (Next.js)                    │   │
│  │                                                           │   │
│  │  POST /api/qa/results  ← Receive CI/CD run results       │   │
│  │  GET  /api/qa/history  ← Query run history               │   │
│  │  POST /api/qa/run      ← Trigger local test execution    │   │
│  └───────────────────────┬───────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    DATA STORAGE                            │   │
│  │                                                           │   │
│  │  qa-dashboard/results.json     → Latest snapshot          │   │
│  │  qa-dashboard/run-history.json → Historical runs (500)    │   │
│  │  qa-dashboard/test-run-config.json → Environment config   │   │
│  │  qa-dashboard/test-types.json   → Test type definitions   │   │
│  └───────────────────────┬───────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              QA DASHBOARD VIEWS (Next.js)                  │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ ① Table of Contents (anchor nav)                   │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ ② KPI Cards + Go/No-Go Status + Release Toggle     │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ ③ Test Summary by Category (with Run%, Bugs col)   │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ ④ Traceability by Requirements/Features             │  │   │
│  │  │   (PRD Req ID → Test Cases → Pass/Fail/Blocked)     │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ ⑤ Persona-Based Test Results                        │  │   │
│  │  │   (Customer/Merchant/Admin/Anonymous flows)         │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ 6. Charts: Distribution, Stacked Bar, Trend Line    │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ 7. Quality Gates (12 gates with pass/fail)          │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ 8. Bug Metrics Dashboard                            │  │   │
│  │  │   (Severity donut, open vs fixed, defect age)       │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ 9. Run History Table (per-build traceability)       │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ 10. Test Selection + Run (sandbox/CI toggle)        │  │   │
│  │  ├─────────────────────────────────────────────────────┤  │   │
│  │  │ 11. Export CSV + Download Reports                   │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Sections Detail

#### Section 1: Table of Contents
Sticky top nav with anchor links to each section:
- Summary → Quality Gates → By Category → By Feature → By Persona → Charts → Bug Metrics → Run History → Test Tools

#### Section 2: KPI Cards + Go/No-Go
- Total Tests, Pass Rate, Test Types Implemented, Quality Gates Passed, Open Defects, Blocked
- **Go/No-Go toggle** with comment box + timestamp + audit log
- Green/Red banner at top showing current release readiness

#### Section 3: Test Summary by Category
| Planned | Automated | Run | Pass | Fail | Blocked | In Prog | **Run%** | Pass% | Fail% | Blocked% | In Prog% | **Bugs** |

- **Planned** = automated + blocked (total test inventory)
- **Automated** = tests coded/scripted
- **Run** = tests that executed (passed + failed)
- **Run%** = (run / planned) × 100 — shows execution coverage
- **Bugs** = clickable count → filters defect log below

#### Section 4: Traceability by Requirements/Features
Maps PRD Requirement IDs to test types to results:

| Requirement ID | Feature | Test Types | Total | Pass | Fail | Blocked | Status |
|----------------|---------|------------|-------|------|------|---------|--------|
| REQ-001 | Customer Registration | unit, integration, e2e | 15 | 15 | 0 | 0 | 🟢 |
| REQ-002 | Product Search | unit, integration | 12 | 10 | 2 | 0 | 🟡 |
| REQ-010 | Payment Processing | integration, e2e, security | 20 | 15 | 0 | 5 | 🔴 |

#### Section 5: Persona-Based Test Results
| Persona | Test Types | Total | Pass | Fail | Blocked | Pass% |
|---------|-----------|-------|------|------|---------|-------|
| Customer | unit, integration, e2e, a11y | 80 | 65 | 0 | 15 | 81% |
| Merchant | unit, integration, e2e | 55 | 45 | 0 | 10 | 82% |
| Admin | unit, integration, e2e | 30 | 25 | 0 | 5 | 83% |
| Anonymous | integration, e2e | 15 | 10 | 0 | 5 | 67% |

#### Section 8: Bug Metrics Dashboard
- Severity donut chart (critical/high/medium/low)
- Bug status breakdown (open/fixed/verified)
- Defect age bar chart (0-7d, 7-30d, 30-90d, 90d+)
- Open vs Closed trend over time
- Bug count by component/feature

#### Section 9: Run History
Per-run traceability table:

| Run ID | Tier | Build | Branch | Date | Unit | API | E2E | Security | DR | Overall |
|--------|------|-------|--------|------|------|-----|-----|----------|----|---------|
| run_001 | sanity | PR #47 | feat/cart | Jun 1 | ✅ | ✅ | ⏭️ | ⏭️ | ⏭️ | ✅ |
| run_002 | qa | build-47 | develop | Jun 1 | ✅ | ✅ | ✅ | ✅ | ⏭️ | ✅ |
| run_003 | release | v1.2.0 | main | Jun 1 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 GO |

Click any run → drill-down to full per-test-type results.

---

## 3. Test Type Inventory

All 21 test types tracked in the dashboard:

| # | Test Type | Tier 1 (Sanity) | Tier 2 (QA) | Tier 3 (Release) | Tool |
|---|-----------|:---:|:---:|:---:|------|
| 1 | Unit Tests | ✅ | ✅ | ✅ | Vitest |
| 2 | Component Tests | | ✅ | ✅ | RTL + Vitest |
| 3 | Integration Tests | | ✅ | ✅ | Supertest |
| 4 | **API Tests** | ✅ | ✅ | ✅ | Vitest + Supertest |
| 5 | E2E Tests | | ✅ | ✅ | Playwright |
| 6 | API Contract Tests | | ✅ | ✅ | Zod |
| 7 | Visual Regression | | ✅ | ✅ | Playwright Snapshot |
| 8 | Performance | | ✅ | ✅ | Lighthouse CI |
| 9 | Stress/Load | | | ✅ | k6 |
| 10 | Security | | ✅ | ✅ | OWASP + Vitest |
| 11 | Accessibility | | ✅ | ✅ | Playwright a11y |
| 12 | Cross-Browser | | ✅ | ✅ | Playwright (4 browsers) |
| 13 | Regression | | ✅ | ✅ | Full suite |
| 14 | Multi-Tenant Isolation | | ✅ | ✅ | Vitest |
| 15 | Data Migration | | ✅ | ✅ | Vitest |
| 16 | Disaster Recovery | | | ✅ | Manual + Script |
| 17 | Visual Regression (full) | | | ✅ | BackstopJS |
| 18 | Smoke Tests | ✅ | ✅ | ✅ | CI health check |
| 19 | Security (full scan) | | | ✅ | CodeQL + Snyk |
| 20 | SonarQube Static Analysis | | ✅ | ✅ | SonarQube Cloud |
| 21 | Secrets Scan | ✅ | ✅ | ✅ | truffleHog + Gitleaks |

---

## 4. Reusability Framework

### For Any New Project

```
my-new-project/
├── qa-dashboard/
│   ├── results.json              # ← Update with your test data
│   ├── test-run-config.json      # ← Configure environments + test commands
│   ├── test-types.json           # ← Define your test types
│   ├── run-history.json          # ← Auto-populated
│   └── history.json              # ← Auto-populated
├── scripts/
│   ├── run-tests.js              # ← Generic — works as-is
│   └── collect-results.js        # ← Generic — works as-is
├── .github/workflows/
│   ├── ci-sanity.yml             # ← Template — update project name
│   ├── ci-full.yml               # ← Template — update project name
│   ├── code-review.yml           # ← Generic — works as-is
│   └── deploy.yml                # ← Update Vercel project ID
└── app/qa-dashboard/
    └── page.tsx                  # ← Data-driven — renders any results.json
```

### Configuration Points

| File | What to change |
|------|---------------|
| `test-run-config.json` | Environment names, test commands, environment variables |
| `test-types.json` | Test type definitions, IDs, icons, descriptions |
| `results.json` | Test data, quality gates, defects, history |
| `ci-sanity.yml` | `env.PROJECT_NAME`, trigger branches |
| `ci-full.yml` | `env.PROJECT_NAME`, test group definitions |
| `deploy.yml` | Vercel project ID, Supabase project ref |

### Zero changes needed in:
- `scripts/run-tests.js` — reads config, runs whatever commands are configured
- `app/qa-dashboard/page.tsx` — reads `results.json`, renders all views dynamically
- `code-review.yml` — generic PR-Agent + SonarQube setup

---

## 5. Implementation Plan

### Phase 1 — Immediate (Current Sprint)
1. Fix pass rate calculation (60.9%, not 100%)
2. Rename Total → Planned, add Run% column
3. Add Bugs column with clickable filter
4. Add Export CSV button
5. Add Table of Contents with anchor links
6. Add Go/No-Go toggle with comments box
7. Fix broken dashboard tool links
8. Clarify Sandbox/CI mode with tooltip
9. Split CI workflow into ci-sanity.yml + ci-full.yml
10. Add API tests to sanity tier

### Phase 2 — Traceability (Next Sprint)
1. Add Requirements/Features traceability table
2. Add Persona-based test results
3. Add Run History table with per-build drill-down
4. Add Bug Metrics dashboard (charts)
5. Deploy dashboard to Vercel
6. Add POST /api/qa/results endpoint for CI/CD

### Phase 3 — Release Readiness (Future)
1. Release gate automation
2. Go/No-Go engine with configurable rules
3. SBOM generation for releases
4. Historical trend dashboards (30/60/90 day)
5. Slack/email notifications on gate failures
6. SonarQube integration in dashboard
