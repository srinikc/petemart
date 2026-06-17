# Agentic Console — QA Strategy & Test Plan

## 1. Current State (Gap Analysis)

| Metric | Petemart App | Agentic Console |
|--------|-------------|-----------------|
| Unit/Component tests | 45 (Vitest) | **0** |
| API integration tests | 55 (Supertest) | **0** |
| E2E tests | 47 (Playwright) | **0** |
| API contract tests | 7 (Zod) | **0** |
| Other (security, perf, etc.) | 334 | **0** |
| **Total** | **488** | **0** |

### What exists but is untested:

**32 API routes** under `app/api/agentic-console/`:
`state`, `all-state`, `agents`, `agent-detail`, `agent-memory`, `agent-messages`, `agent-version`, `approve`, `artifacts`, `branches`, `code-reviews`, `consensus`, `dag`, `escalation`, `eval-rules`, `events` (SSE), `health`, `jira`, `logs`, `mcp-servers`, `monitor`, `pipeline`, `projects`, `prompt-snapshots`, `pull-requests`, `rbac`, `run-events`, `sla`, `subtasks`, `supervisor` (SSE + POST), `tools`, `traces`

**11+ UI pages** under `app/agentic-console/`:
- `DashboardClient.tsx` (1783 lines) — main dashboard with live pipeline, phase columns, agent cards, flyout panel, supervisor chat
- `agents/[id]/page.tsx` (1063 lines) — 6-tab agent detail (overview, prompts, artifacts, run logs, A2A comm, MCP tools)
- `quality/page.tsx` (530 lines) — quality KPIs, test results, defects, compliance, SLA
- `health/page.tsx` (267 lines) — error rates, durations, charts
- `operations/page.tsx` (318 lines) — token usage, branches, PRs, Jira
- `logs/page.tsx` (400 lines) — 5-tab log viewer with auto-refresh
- `mcp/page.tsx` (287 lines) — MCP server registry
- `pipeline-graph.tsx` (271 lines) — DAG visualizer with SVG edges
- `agents/page.tsx` (458 lines) — agent pipeline grid/graph
- `onboarding/page.tsx` (377 lines) — 4-step wizard
- `breadcrumbs.tsx`, `tools/page.tsx`, `layout.tsx`

**Key risk areas:**
- SSE streaming endpoints (`events`, `supervisor`) — no reconnection/error handling tests
- Pipeline control (`pipeline/route.ts`) — 320 lines of complex logic, triggers agent processes
- State mutation routes (`approve`, `pipeline`, `agent-memory`, `agent-version`) — no rollback/validation tests
- DAG layout algorithm (`pipeline-graph.tsx`) — no unit tests on `calculateLayout()`
- Quality dashboard reads `/api/qa/reviews` and `/api/qa/results` — endpoints don't exist yet

---

## 2. Proposed Test Architecture

```
                  ┌──────────────────────────────┐
                  │   qa-dashboard/agentic-console │
                  │   (separate product section)  │
                  ├──────────────────────────────┤
                  │  results-aconsole.json        │
                  │  traceability-aconsole.json   │
                  │  run-history-aconsole.json    │
                  │  coverage/ (per-page reports) │
                  └──────────────────────────────┘

Test Layers (bottom-up):
┌──────────────────────────────────────────────────────────┐
│ Layer 6: E2E Workflow Tests (Playwright)                │
│   Full user journeys: dashboard → agent detail →        │
│   approve → monitor pipeline → supervisor chat          │
├──────────────────────────────────────────────────────────┤
│ Layer 5: SSE/Streaming Tests (custom harness)           │
│   events SSE reconnection, supervisor chat streaming     │
├──────────────────────────────────────────────────────────┤
│ Layer 4: Integration Tests (Supertest)                  │
│   32 API routes — happy path, error states, edge cases  │
│   Auth guards, project scoping, file I/O failures       │
├──────────────────────────────────────────────────────────┤
│ Layer 3: API Contract Tests (Zod + Supertest)           │
│   Request validation, response shape, status codes      │
├──────────────────────────────────────────────────────────┤
│ Layer 2: Component Tests (RTL + Vitest)                 │
│   Each page: render, loading state, empty state,        │
│   error state, edge cases, user interactions            │
├──────────────────────────────────────────────────────────┤
│ Layer 1: Unit Tests (Vitest)                            │
│   shared.tsx utilities, pipeline-graph calculateLayout, │
│   API route helpers (readState, safeReadJSON, traces)   │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Test Plan

### Layer 1: Unit Tests (~45 tests)

| Test Suite | File | Count | What to Test |
|-----------|------|-------|-------------|
| Shared Utilities | `__tests__/agentic-console/unit/shared.test.ts` | 10 | `timeAgo()`, `formatETA()`, `fetchWithTimeout()`, `fetchProjectsIndex()`, `withProject()` |
| Pipeline Graph Layout | `__tests__/agentic-console/unit/pipeline-graph.test.ts` | 8 | `calculateLayout()` node positioning, edge routing, phase column arrangement |
| API Helpers | `__tests__/agentic-console/unit/api-helpers.test.ts` | 12 | `safeReadJSON()` with missing/corrupt files, `statePath()` project resolution, `appendTrace()` error handling |
| Constants & Types | `__tests__/agentic-console/unit/constants.test.ts` | 5 | `PHASE_ORDER`, `STATUS_CONFIG` completeness, `AGENT_ICONS` mapping |
| Trace Helpers | `__tests__/agentic-console/unit/trace.test.ts` | 10 | Span creation, trace ID resolution, file append error handling |

### Layer 2: Component Tests (~80 tests)

| Test Suite | File | Count | Key Scenarios |
|-----------|------|-------|--------------|
| DashboardClient | `comp/dashboard.test.tsx` | 15 | Render pipeline phases, agent cards, loading skeleton, empty state (no agents), error state, SSE connection status, flyout panel, supervisor chat modal, create project modal, instrument bar |
| Agent Detail | `comp/agent-detail.test.tsx` | 15 | 6 tabs render, overview metrics, prompts tab, artifacts listing, run logs with filters, A2A message composer, code reviews, version history, memory injection, trace timeline |
| Quality Page | `comp/quality.test.tsx` | 10 | KPI cards, Go/No-Go badge, test types table, guardrails section, defect/review tabs, empty state, error state |
| Health Page | `comp/health.test.tsx` | 5 | Error rate chart (recharts), agent table, aggregate stats, empty data |
| Operations Page | `comp/operations.test.tsx` | 8 | Token usage charts, branch listing, PR tracking, Jira issues, project selector |
| Logs Page | `comp/logs.test.tsx` | 8 | 5 tabs, auto-refresh toggle, agent filter, log level filter, empty state |
| MCP Page | `comp/mcp.test.tsx` | 5 | Server list, status badges, tool counts, agent mapping |
| Pipeline Graph | `comp/pipeline-graph.test.tsx` | 5 | Node rendering, SVG edges, dependency arrows, zoom/pan |
| Onboarding | `comp/onboarding.test.tsx` | 5 | 4-step wizard, step validation, progress indicator |
| Breadcrumbs | `comp/breadcrumbs.test.tsx` | 4 | Path segments, click handlers, responsive behavior |

### Layer 3: API Contract Tests (~64 tests)

1 per API route. Tests:
- Request validation (missing params, invalid types, wrong project)
- Response shape matches expected schema
- HTTP status codes (200, 400, 404, 500)
- Project scoping (with/without project param)

### Layer 4: Integration Tests (~128 tests)

| Group | Routes | Count | Scenarios |
|-------|--------|-------|-----------|
| State & Dashboard | `state`, `all-state`, `projects` | 12 | Full state snapshot, default project, multi-project, missing STATE_MATRIX.json, corrupt JSON |
| Agent Management | `agents`, `agent-detail`, `agent-memory`, `agent-version`, `agent-messages` | 20 | CRUD operations, memory persistence, versioning, A2A messaging |
| Pipeline Control | `pipeline`, `approve`, `monitor` | 15 | Start pipeline, stop, pause/resume, approve/reject, monitor (stuck detection, cascade), LLM selection |
| Approvals | `approve`, `escalation`, `consensus` | 9 | Approve with notes, reject with feedback, consensus state, escalation flow |
| Quality & SLA | `health`, `sla`, `code-reviews`, `eval-rules` | 12 | Health metrics, SLA calculations, code review data, eval rules |
| Logs & Events | `logs`, `run-events`, `events` (SSE) | 10 | Log filtering by source/level, pagination, SSE event stream, reconnection |
| External Integrations | `jira`, `pull-requests`, `branches` | 12 | Jira CRUD, PR listing via gh CLI, branch listing, error handling |
| Tools & Registry | `tools`, `mcp-servers`, `artifacts` | 10 | Tool listing, MCP server status, artifact listing |
| RBAC & Security | `rbac`, `traces`, `prompt-snapshots` | 8 | RBAC rules, trace span CRUD, prompt snapshot diff |
| Supervisor | `supervisor` (SSE + POST) | 8 | SSE stream, command posting, response streaming, error recovery |

**Error scenarios per route (minimum 3 each):**
- Invalid/missing project param → 400
- Missing/empty state file → 404
- Corrupt JSON → 500
- Auth/missing permissions → 403
- Timeout / file lock → 503

### Layer 5: SSE/Streaming Tests (~15 tests)

| Test | What to Validate |
|------|-----------------|
| Events SSE connection | Stream opens, receives `state_snapshot` event, sends `keepalive` |
| Events polling interval | Default 3s poll, respects `?poll=` param |
| Events with since param | Only returns events after timestamp |
| Events reconnection | Drops stream, reconnects, gets full state sync |
| Supervisor SSE | `connected` event, streams `response` chunks |
| Supervisor POST | Sends command, gets response in SSE stream |
| Supervisor error handling | Invalid command → error event, stale stream detection |

### Layer 6: E2E Workflow Tests (~25 tests)

| Test | File | Scenarios |
|------|------|-----------|
| Dashboard loads | `e2e/aconsole-dashboard.spec.ts` | Pipeline phases visible, agent cards render, SSE indicator shows connected, nav links work |
| Agent approval flow | `e2e/aconsole-approval.spec.ts` | Select project, navigate to agent detail, approve agent, verify state changes in real-time, see compliance checks update |
| Pipeline control | `e2e/aconsole-pipeline.spec.ts` | Start pipeline, pause, resume, monitor DAG graph status changes |
| Supervisor chat | `e2e/aconsole-supervisor.spec.ts` | Open supervisor modal, send message, see response stream, verify message persistence |
| Quality dashboard | `e2e/aconsole-quality.spec.ts` | Navigate to quality page, KPIs load, tabs (KPIs/Tests/Defects) switch, requirement quality table renders |
| Health monitoring | `e2e/aconsole-health.spec.ts` | Error rate chart renders, agent table shows data, aggregate stats update |
| Operations hub | `e2e/aconsole-ops.spec.ts` | Token chart renders, branch listing, PR list, Jira issues |
| Agent detail exploration | `e2e/aconsole-agent-detail.spec.ts` | Tab switching, prompt snapshots diff, memory injection, A2A compose, trace timeline |
| MCP server registry | `e2e/aconsole-mcp.spec.ts` | Server list loads, tool counts visible, agent mapping |
| Multi-project switching | `e2e/aconsole-projects.spec.ts` | Project selector changes, state reloads, dashboard reflects new project |
| Onboarding wizard | `e2e/aconsole-onboarding.spec.ts` | 4-step flow, validation, progress tracking |

### Additional Recommended Test Types

| Type | Tests | Tool | Why for Agentic Console |
|------|-------|------|----------------------|
| **Visual Regression** | 15 | Playwright snapshot | Pipeline graph SVG rendering, dashboard layout at various viewports |
| **Accessibility** | 11 | axe-core + Playwright | Agent detail has 6 complex tabs, dashboard has interactive cards — WCAG 2.1 AA audit needed |
| **Cross-Browser** | 15 | Playwright (chromium/firefox/webkit) | SSE streaming behavior differs across browsers |
| **Performance** | 8 | Lighthouse + k6 | SSE polling at 3s intervals can cause memory leaks with 10+ tabs open; API P95 response for state reads |
| **Security** | 10 | Vitest + OWASP | Pipeline control route runs `child_process.spawn()` — injection risk; SSE endpoints need rate limiting; approve route mutates STATE_MATRIX |
| **Load/Stress** | 5 | k6 | SSE with 100+ concurrent connections, pipeline state polling at scale |
| **Regression** | Full suite | CI | Every PR against agentic console must pass all layers before merge |

---

## 4. QA Dashboard Structure (Agentic Console Section)

Create a sub-section under `qa-dashboard/`:

```
qa-dashboard/
├── agentic-console/
│   ├── results.json           # Test results scoped to console
│   ├── traceability.json      # Maps console features → test coverage
│   ├── run-history.json       # Run log for console tests
│   └── coverage/              # Istanbul/V8 coverage reports
├── results.json               # (existing — Petemart app)
├── test-types.json            # Updated to include console-specific types
└── ...
```

The existing `/agentic-console/quality` page (`app/agentic-console/quality/page.tsx`) already reads from `/api/qa/results` and `/api/qa/reviews` — these API endpoints need to be created to serve the agentic-console QA data.

### Dashboard Sections

| Section | Data Source | Content |
|---------|------------|---------|
| **Overview** | `results.json` summary | Total tests, pass rate, coverage %, Go/No-Go |
| **By Layer** | `results.json` testTypes | Per-layer breakdown (Unit/Component/API/E2E/SSE) with pass/fail/blocked |
| **By Feature** | `traceability.json` | Feature → test mapping with coverage % per feature |
| **Run History** | `run-history.json` | Trend chart of pass rates over time |
| **Coverage** | `coverage/` | Per-page/component coverage % from Vitest |
| **Defects** | `results.json` defects | Auto-captured failures linked to PRs |
| **Quality Gates** | `results.json` qualityGates | Go/No-Go gates per release criteria |

### Quality Gates (Agentic Console Specific)

| Gate | Criteria |
|------|----------|
| QG-AC-01 | All 32 API routes respond 200 (contract tests pass) |
| QG-AC-02 | SSE stream opens and delivers events within 5s |
| QG-AC-03 | DashboardClient renders all 5 phase columns without error |
| QG-AC-04 | Agent approval flow completes (POST approve → state updates) |
| QG-AC-05 | Pipeline start/stop/pause/resume all succeed |
| QG-AC-06 | Component test coverage ≥ 70% across all pages |
| QG-AC-07 | Cross-browser: Dashboard loads in Chrome, Firefox, Safari |
| QG-AC-08 | Accessibility: no critical violations in axe-core audit |
| QG-AC-09 | Supervisor SSE connects and streams responses |
| QG-AC-10 | Visual regression: no unintended layout diffs on 3 key pages |

---

## 5. Test Execution Tiers

| Tier | Types | Est. Duration | When |
|------|-------|---------------|------|
| **Sanity** | Unit + API Contract + Smoke | ~3 min | Every commit (pre-commit hook) |
| **Full QA** | Unit + Component + API + SSE + Smoke | ~10 min | Per PR / before merge to develop |
| **Release** | All layers + E2E + Visual + A11y + Performance + Security | ~20 min | Before staging promotion |
| **Stress** | Load (k6) + SSE burst | ~15 min | Weekly / before major release |

---

## 6. Implementation Effort Estimate

| Layer | Test Files | Test Count | Effort (person-days) | Priority |
|-------|-----------|-----------|---------------------|----------|
| Unit | 5 | ~45 | 2 | P0 |
| Component | 10 | ~80 | 5 | P0 |
| API Contract | 1 | ~64 | 2 | P0 |
| Integration | 10 | ~128 | 5 | P0 |
| SSE/Streaming | 3 | ~15 | 2 | P1 |
| E2E Workflow | 8 | ~25 | 4 | P1 |
| Visual Regression | 3 | ~15 | 1 | P2 |
| Accessibility | 1 | ~11 | 1 | P2 |
| Performance | 3 | ~8 | 1 | P2 |
| Security | 2 | ~10 | 1 | P2 |
| QA Dashboard API | 2 endpoints | — | 1 | P0 |
| CI/CD pipeline | 1 workflow file | — | 1 | P1 |
| **Total** | **48** | **~401** | **26 days** | |

**Priority rationale:**
- **P0**: Without unit/component/API/contract tests, there's zero quality baseline. Dashboard API endpoints needed to serve data to the existing quality page.
- **P1**: SSE streaming is unique to agentic console and high-risk. E2E workflows validate real user experiences. CI pipeline enforces gates automatically.
- **P2**: Visual regression, a11y, perf, security are important but can follow after baseline coverage is established.
