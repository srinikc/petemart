# Agent 08 (QA Agent) — Work Order v3.0

**Work Order ID**: WORK-ORDER-QA-AUTO-CAPTURE-BG-PROCESS-v3.0  
**Submitted**: 2026-06-02T16:00:00Z  
**Last Updated**: 2026-06-02T18:30:00Z  
**Trigger**: Human Gatekeeper Feedback  
**Priority**: High  
**Status**: Queued for execution

---

## ⚠️ Role Expectation: Agent 08 Must Act as Sr Test Architect

The human gatekeeper expects Agent 08 to operate at the level of a **Senior Test Architect**, not merely a code implementer. This is a permanent role expectation for ALL current and future work order executions.

**Required behaviors:**
1. **Design Review First**: Before implementing any change, review the design for completeness, effectiveness, and thoroughness. Identify gaps proactively (missing edge cases, incomplete test coverage, poor UX patterns).
2. **Raise Issues Independently**: Do not wait to be told about problems. If you see a gap or improvement opportunity, raise it in your output even if it's not in the work order.
3. **"Design Review" Section in Output**: After completing work, include a **"Design Review"** section in your completion report showing what you reviewed and what gaps you found (if any).
4. **Think Like an Architect**: Your decisions affect the entire QA pipeline — test selection, dashboard UX, data integrity, report accuracy, defect workflows. Evaluate each change for its broader impact.

**Compliance**: The Supervisor (Agent 0) will check for the "Design Review" section in your output. If missing, the completion will be flagged as non-compliant.

---

## Overview

This work order contains **9 feedback items** from the human gatekeeper that require implementation by Agent 08 (QA Agent). These are enhancements and fixes to the QA Test Engine and Dashboard based on real-world testing observations.

**Items in this work order:**
| Item | Area | Priority |
|------|------|----------|
| ITEM-1 | Test Failure Capture & Auto-Defect Workflow | 🟡 Medium |
| ITEM-2 | Test Summary Historical Run Dropdown (tier+timestamp) | 🔴 **HIGHEST** |
| ITEM-3 | Test Engine Background/Detached Process | 🟢 Low |
| ITEM-4 | Go/No-Go Text Box Enhancement with PDF Export | 🟡 Medium |
| ITEM-5 | Fix External Report Links (404 errors) | 🟢 Low |
| ITEM-6 | Priority Implementation Note (do ITEM-2 first) | 🔴 BLOCKER |
| **ITEM-7** | **Sanity Run Tagged as "custom" Instead of "Sanity"** | 🔴 **HIGH** |
| **ITEM-8** | **CSV Download Should Export Latest Run Only** | 🔴 **HIGH** |
| **ITEM-9** | **Test Summary Should Reflect Latest Run, Not Full Data** | 🔴 **HIGH** |

---

## ITEM 1: Test Failure Capture & Auto-Defect Workflow

### Problem
When the QA Test Engine runs Sanity/Full QA/Release tiers and tests fail in Windows, failures are shown in the engine output but NOT auto-captured to persistent storage. There is no automated defect creation workflow.

### Requirements
1. **Auto-Capture Test Failures**: When test tiers execute and any test fails, the failure details must be automatically logged to `qa-dashboard/results.json` (the structured results file)
2. **Auto-Create Defect Entries**: Failed tests should automatically generate structured defect entries. Append these to:
   - `agents/03_execution_workspace/08_qa_agent/02_DEFECT_LOG.md` (human-readable)
   - A structured JSON defect log (machine-readable, to be created if it doesn't exist)
3. **Supervisor Notification**: After test run completes with failures, write a notification marker file that the Supervisor Agent can detect. Suggested approach:
   - Write to `00_state_ledger/SUPERVISOR_NOTIFICATION.json` with format:
     ```json
     {
       "notification_id": "FAIL-{timestamp}",
       "agent_source": "08_qa_agent",
       "event_type": "test_failure",
       "timestamp": "...",
       "tier": "sanity|full_qa|release",
       "failed_count": 3,
       "defect_ids": ["DEF-005", "DEF-006", "DEF-007"],
       "message": "3 tests failed in Sanity tier. Defects created."
     }
     ```
   - Supervisor monitor script (or STATE_MATRIX.json polling) will detect this and dispatch code agents (07a-d) for fixes
4. **Fix Dispatch Workflow**: The Supervisor (Agent 0) will read the notification and launch the appropriate code agent. Ensure the defect entry contains enough context (file paths, error messages, stack traces) for the code agent to identify and fix the issue

### Implementation Guidance
- Modify `scripts/run-tests.js` (or create a wrapper) to:
  1. Run tests via the existing mechanism
  2. Parse stdout/stderr for failure information
  3. Cross-reference against the existing `test-run-config.json` test type definitions
  4. Update `qa-dashboard/results.json` with the new results including failure details
  5. Create/update defect entries in `02_DEFECT_LOG.md`
  6. Write a supervisor notification file
- Test with a deliberately failing test to validate the full capture → defect → notification flow

### Existing Artifacts to Reference
- `qa-dashboard/results.json` — current results structure (has summary, testTypes, tiers, qualityGates)
- `agents/03_execution_workspace/08_qa_agent/02_DEFECT_LOG.md` — existing defect log format
- `scripts/run-tests.js` — current test runner script
- `qa-dashboard/test-run-config.json` — test configuration

---

## ITEM 2: Test Summary Historical Run Dropdown

### Problem
The Test Summary by Category section only shows the current/latest run. There is no way to view results from previous test runs for comparison or trend analysis. Currently, the dropdown shows only a timestamp without the tier name, making it hard to distinguish runs.

### Requirements
1. **Historical Run Dropdown**: Add a dropdown/select component above the Test Summary by Category section in the QA Dashboard
2. **Label Format — Tier + Timestamp**: Each dropdown entry MUST show the tier that was executed followed by the timestamp, formatted as `"{Tier} — {Timestamp}"` e.g.:
   - `"Sanity — 2026-06-02 14:30"`
   - `"Full QA — 2026-06-02 10:00"`
   - `"Release — 2026-06-01 16:45"`
3. **run-history.json Schema Update**: Ensure the `tier` field is present on EVERY entry in `qa-dashboard/run-history.json`. The schema for each entry must include:
   - `tier` (string): one of `"sanity"`, `"full-qa"`, `"release"`, or `"custom"`
   - `tierLabel` (string): human-readable tier name (e.g. `"Sanity"`, `"Full QA"`, `"Release"`)
   - `started` (ISO timestamp string)
   - `completed` (ISO timestamp string)
   - Backfill older entries that lack a `tier` field (the first 3 entries from 2026-06-01 are missing it)
4. **Data Source**: The dropdown should read from `qa-dashboard/run-history.json` via the existing API endpoint `GET /api/qa/run-history`
5. **Click to Load**: When a user selects a historical run entry from the dropdown, the summary table must reload with that run's results data. This includes:
   - Updating the Test Summary by Category table to reflect the historical run's test results
   - Showing a visual indicator (amber banner) that historical data is being viewed, with a "View Current Results" button to return to latest
6. **Default Selection**: The dropdown should default to the latest/most recent run (index `-1` = "Current Results")
7. **Persistence**: Historical run data must be preserved (not overwritten) each time new tests run. New runs are appended to the array.

### Refinement Note (Human Gatekeeper — 2026-06-02)
This item has been refined to require **tier + timestamp** format explicitly. The dropdown must show tags like `"Sanity — 2026-06-02 14:30"` instead of just a raw timestamp. The `run-history.json` schema must be updated to guarantee the `tier` field is always present.

### Implementation Guidance
- Modify the QA Dashboard page: `app/qa-dashboard/page.tsx`
  - The dropdown label line currently uses `run.tierLabel || run.tier || 'Run'` — ensure this always resolves to the proper tier name
  - The format string should be: `{tierLabel} — {formattedTimestamp}`
- Update `qa-dashboard/run-history.json` schema:
  - Add `tier` and `tierLabel` fields where missing (backfill older entries)
  - The API route at `app/api/qa/run/route.ts` writes to run-history.json — ensure it always includes the `tier` field when writing new entries
- The existing `app/api/qa/run-history/route.ts` serves the data — verify it returns the updated schema
- Add React state to track the selected run and conditionally render the summary table with the selected run's data
- Ensure backward compatibility — existing functionality should not break

### Existing Artifacts to Reference
- `qa-dashboard/run-history.json` — existing historical run data (main data source for dropdown)
- `qa-dashboard/history.json` — legacy summary history (verify if still needed)
- `app/qa-dashboard/page.tsx` — the QA dashboard React component (lines 695-719 contain the dropdown, lines 728-752 contain the viewing indicator)
- `app/api/qa/run-history/route.ts` — API endpoint serving run history data
- `app/api/qa/run/route.ts` — writes new runs to run-history.json (must include tier field)
- `qa-dashboard/test-types.json` — test type definitions used in summary rendering

### Verification
1. Open QA Dashboard → verify dropdown shows "Sanity — 2026-06-02 14:30" format (not just a raw timestamp)
2. Select a historical run → verify summary table updates with correct historical data
3. Amber banner with "Viewing historical run: Sanity — ..." appears
4. Click "View Current Results" → returns to latest run data
5. Run-history.json schema validates — every entry has `tier` and `tierLabel` fields

---

## ITEM 3: Test Engine Background/Detached Process

### Problem
Currently when a user clicks a tier button (Sanity/Full QA/Release) in the QA Dashboard, the UI blocks/freezes while tests run. This is because `execSync` in `app/api/qa/run/route.ts` blocks the Node.js event loop.

### Requirements
1. **Detached Background Process**: The test execution API route should launch tests as a detached background process instead of blocking
2. **Status Polling Endpoint**: Create a new API endpoint (e.g., `GET /api/qa/status`) that returns the current test execution status:
   ```json
   {
     "status": "idle|running|completed|failed",
     "tier": "sanity|null",
     "started_at": "ISO timestamp",
     "progress": "3/15 tests complete",
     "results_url": "/api/qa/results/latest"
   }
   ```
3. **UI Polling**: The QA Dashboard should poll the status endpoint every 5 seconds while tests are running and show a progress indicator (spinner/progress bar) instead of blocking
4. **Result Retrieval**: When polling detects `completed` status, the UI should automatically load the results and update the summary table
5. **Error Handling**: If the background process fails or times out (>10 minutes), the UI should show an error state with retry option

### Implementation Guidance
- Modify `app/api/qa/run/route.ts`:
  - Replace `execSync` with `spawn` from `child_process` (or use `exec` with detached option)
  - Write PID to a status file (e.g., `qa-dashboard/.run-status.json`) for polling
  - Return immediately with `{ "status": "started", "run_id": "..." }`
- Create `app/api/qa/status/route.ts`:
  - Read the status file and return current execution state
- Modify `app/qa-dashboard/page.tsx`:
  - Add `useEffect` with `setInterval` for polling
  - Show loading state during test execution
  - Update results table on completion
- Use the Self-Decomposition Protocol (`.antigravity/skills/self_decompose.md`) for the background process if needed

### Existing Artifacts to Reference
- `app/api/qa/run/route.ts` — current blocking implementation (uses `execSync`)
- `app/qa-dashboard/page.tsx` — dashboard UI component
- `qa-dashboard/test-run-config.json` — test environment/tier configuration

---

## ITEM 4: Go/No-Go Text Box Enhancement with PDF Export

### Problem
The Go/No-Go decision panel in the QA Dashboard uses a single-line `<input type="text">` field for the decision comment. This is insufficient for detailed rationales. Users need a proper multiline textarea with scroll support, and the ability to export the decision as a PDF document for formal record-keeping.

### Requirements
1. **Replace single-line input with multiline textarea**: The current `<input type="text" placeholder="Reason / blockers...">` at line 488 of `app/qa-dashboard/page.tsx` must be replaced with a `<textarea>` that:
   - Supports text wrapping (word wrap)
   - Has a reasonable default height (min 4-6 rows) with manual resize handle
   - Allows typing up to a page or two of content
2. **Add scroll support**: The textarea should have `overflow-y: auto` with a max-height (e.g., 200-300px) so that long content becomes scrollable rather than expanding infinitely
3. **Add "Download as PDF" button**: After a decision is applied (Go or No-Go is submitted), show a download button that generates a PDF containing:
   - **Verdict**: GO or NO-GO (with green/red styling)
   - **Comment Text**: The full rationale text
   - **Timestamp**: Date and time of decision (IST)
   - **Signature Fields**: Pre-formatted signature lines for:
     - "QA Lead Signature"
     - "Project Manager Signature"
     - "Human Gatekeeper Signature"
     - Each signature line should have a dotted line and date field below it
4. **Client-side PDF generation**: Use a simple library like `html2pdf.js` or `jsPDF` for client-side PDF generation:
   - Add the library via npm (e.g., `npm install jspdf jspdf-autotable` or `html2pdf.js`)
   - Generate the PDF entirely in the browser — no server round-trip needed
   - PDF filename format: `GoNoGo-{GO|NOGO}-{YYYY-MM-DD}.pdf`
5. **Position**: Place the "Download as PDF" button next to or below the "Apply Decision" button, visible only after a decision has been applied
6. **Persistence**: The Go/No-Go decisions (and their full text) should continue to be saved to `localStorage` as they currently are, and also optionally be logged to `qa-dashboard/go-nogo-history.json` for server-side persistence

### Current Implementation (for reference)
- Lines 472-514 in `app/qa-dashboard/page.tsx` contain the Go/No-Go panel
- Line 488: `<input type="text" placeholder="Reason / blockers..." ...>` — this is the single-line input to replace
- Lines 94-97: React state variables `goNoGo`, `goNoGoComment`, `goNoGoHistory`, `showGoNoGoHistory`
- Line 390-395: `applyGoNoGo()` function that saves decisions to state + localStorage

### Implementation Guidance
- Replace the `<input>` with `<textarea>` with `rows={5}` and CSS `max-h-[200px] overflow-y-auto`
- Add `goNoGoPdfButton` state or similar to show PDF button after apply
- Install `jspdf` (and optionally `jspdf-autotable`) via npm
- Create a `downloadGoNoGoPdf()` function that:
  1. Creates a new jsPDF document
  2. Adds a title header "Go/No-Go Decision Record"
  3. Adds verdict with green/red color coding
  4. Adds the comment text (with text wrapping)
  5. Adds the timestamp (IST formatted)
  6. Adds signature fields with dotted lines
  7. Saves the PDF with the naming convention above
- Ensure backward compatibility — existing localStorage persistence must not break

### Verification Criteria
1. Click GO or NO-GO → type a detailed reason (multiple paragraphs) → verify text wraps and scrolls properly
2. Click "Apply Decision" → verify "Download as PDF" button appears
3. Click "Download as PDF" → verify PDF opens with correct verdict, full comment text, timestamp, and signature fields
4. Verify the PDF looks professional with proper formatting

---

## ITEM 5: Fix External Report Links (404 Errors)

### Problem
The "External Reports" section at the bottom of the QA Dashboard (lines 1065-1087 of `app/qa-dashboard/page.tsx`) provides clickable links to generated test reports. These links currently point to paths that return 404 errors because:
- The report files/directories do not actually exist on disk
- The paths used are hypothetical (e.g., `/qa-dashboard/reports/vitest/index.html`)

### Report File Audit (Performed 2026-06-02)
| Report | Expected Path | Exists? | Notes |
|--------|--------------|---------|-------|
| Vitest | `qa-dashboard/reports/vitest/index.html` | ❌ | Vitest runs via CLI — output is in console, no HTML report file generated yet |
| Playwright | `qa-dashboard/reports/playwright/index.html` | ❌ | Playwright config exists but HTML report hasn't been generated (`npx playwright show-report` needed) |
| k6 / Lighthouse | `qa-dashboard/reports/performance/index.html` | ❌ | `scripts/k6-loadtest.js` exists, `lighthouse.config.js` exists, but neither has been run to produce output |
| Coverage | `qa-dashboard/reports/coverage/index.html` | ❌ | `vitest.config.ts` has coverage config, but `npx vitest run --coverage` hasn't been executed |

Supporting files that DO exist:
- ✅ `scripts/k6-loadtest.js` — k6 load test script (exists but not executed)
- ✅ `lighthouse.config.js` — Lighthouse CI config (exists but not executed)
- ✅ `playwright.config.ts` — Playwright configuration (exists)
- ✅ `vitest.config.ts` — Vitest + coverage configuration (exists)

### Requirements
1. **Verify report files on disk**: Before rendering the External Reports section, check whether each report file actually exists. Options:
   - **Option A (Recommended)**: Add a `GET /api/qa/report-exists` endpoint (or extend the existing API) that proxies a `fs.existsSync` check for each report path
   - **Option B**: Embed a known report status in `qa-dashboard/report-status.json` (manually maintained or auto-detected)
2. **For reports that exist**: Render the link as active (clickable, with `href` pointing to the correct path, `target="_blank"`, and ExternalLink icon)
3. **For reports that don't exist**: Render a **disabled/grayed state** with:
   - Reduced opacity (e.g., `opacity-50`)
   - No `href` or `onClick` (not clickable)
   - Gray background instead of hover effect
   - Text shown: **"Not generated yet — run tests first"** instead of the description
   - A tooltip or helper text explaining how to generate the report
4. **Add generation instructions**: For each report type that doesn't exist, include a tooltip/popover or small helper text explaining the command to generate it:

   | Report | Generate Command |
   |--------|-----------------|
   | Vitest | `npx vitest run --reporter=html --output-file=qa-dashboard/reports/vitest/index.html` |
   | Playwright | `npx playwright test --reporter=html` then `npx playwright show-report qa-dashboard/reports/playwright/` |
   | k6/Lighthouse | `npx playwright test --project=performance` (runs Lighthouse via Playwright) |
   | Coverage | `npx vitest run --coverage --coverage.reporter=html --coverage.reportsDirectory=qa-dashboard/reports/coverage` |

5. **Auto-detect approach**: Use a lightweight Node.js API endpoint (`GET /api/qa/reports/status`) that:
   - Takes a list of report paths
   - Returns JSON `{ "reports": { "vitest": { "exists": false, "path": "...", "generateCommand": "..." }, ... } }`
   - Dashboard fetches this on load and renders accordingly

### Implementation Guidance
- Create `app/api/qa/reports/status/route.ts`:
  ```typescript
  import { NextResponse } from 'next/server';
  import fs from 'fs';
  import path from 'path';

  const REPORTS = [
    { id: 'vitest', path: 'qa-dashboard/reports/vitest/index.html', command: 'npx vitest run --reporter=html --output-file=...' },
    { id: 'playwright', path: 'qa-dashboard/reports/playwright/index.html', command: 'npx playwright test --reporter=html ...' },
    { id: 'performance', path: 'qa-dashboard/reports/performance/index.html', command: 'npx playwright test --project=performance' },
    { id: 'coverage', path: 'qa-dashboard/reports/coverage/index.html', command: 'npx vitest run --coverage ...' },
  ];

  export async function GET() {
    const reports = REPORTS.map(r => ({
      ...r,
      exists: fs.existsSync(path.join(process.cwd(), r.path)),
    }));
    return NextResponse.json({ reports });
  }
  ```
- Modify `app/qa-dashboard/page.tsx`:
  - Add a `useEffect` to fetch report statuses on mount
  - Replace the hardcoded report array (lines 1068-1073) with dynamic rendering based on API response
  - For non-existent reports: render with `opacity-50`, no `href`, `cursor-not-allowed`, description replaced with "Not generated yet — run tests first"
  - Add a tooltip component using a simple hover popover or title attribute showing the generate command
- Add the `title` attribute or a popover element to show generation instructions on hover

### Verification Criteria
1. Open QA Dashboard → scroll to External Reports section
2. Verify ALL 4 report cards appear in disabled/grayed state (since none exist yet)
3. Verify each card shows "Not generated yet — run tests first" instead of the description
4. Hover over a disabled card → verify tooltip shows the generate command
5. Verify none of the cards link to 404 pages (no href on disabled cards)
6. Generate a report (e.g., vitest) → refresh → verify that report now shows as active/clickable with the correct path

---

## ITEM 6: Test Summary Dropdown — Priority Implementation Note

### Context
During the previous work order (WORK-ORDER-QA-DASHBOARD-FIXES-v2.1), the Test Summary by Category historical run dropdown was refined to show `tier + timestamp` format (e.g., "Sanity — 2026-06-02 14:30") instead of just a raw timestamp. This refinement was documented in the ITEM-2 description but **has not been implemented yet** because Agent 08 has not been launched to execute the work order.

### Priority Directive
1. **Implement ITEM-2 first**: The Test Summary Historical Run Dropdown (with tier+timestamp format) should be the **first task** Agent 08 executes upon launch
2. **The refinement is already documented** in ITEM-2 above — ensure the implementation follows the REFINE-ITEM2-v3.1 specification:
   - Dropdown shows `"{Tier} — {Timestamp}"` format (e.g., "Sanity — 2026-06-02 14:30")
   - `run-history.json` schema updated to guarantee `tier` field on every entry
   - Older entries backfilled with the missing `tier` field
   - Amber banner shows "Viewing historical run: {Tier} — {Timestamp}"
3. **Why priority**: The dropdown was already refined and approved by the human gatekeeper in a previous work order refinement (REFINE-ITEM2-v3.1). It should not be deferred further.

### Execution Order for Agent 08
1. 🔴 **ITEM-2 FIRST**: Historical Run Dropdown with tier+timestamp format
2. 🟡 **ITEM-4**: Go/No-Go Text Box Enhancement with PDF Export
3. 🟡 **ITEM-1**: Test Failure Capture & Auto-Defect Workflow
4. 🟢 **ITEM-5**: Fix External Report Links (404 errors)
5. 🟢 **ITEM-3**: Test Engine Background/Detached Process
6. 🔴 **ITEM-7**: Fix Sanity Run Tagged as "custom" (tier capture bug)
7. 🔴 **ITEM-8**: Fix CSV Download to Export Latest Run Only
8. 🔴 **ITEM-9**: Fix Test Summary to Reflect Latest Run, Not Full Data

### Compliance Check
After Agent 08 completes, Supervisor Agent 0 will verify:
- [ ] ITEM-2: Dropdown displays `"{Tier} — {Timestamp}"` format (verify visually)
- [ ] ITEM-2: Old run-history entries have been backfilled with `tier` field
- [ ] ITEM-4: Textarea replaces input field, PDF download works
- [ ] ITEM-5: No 404 links, disabled state for non-existent reports, tooltips present
- [ ] All changes pass pre-commit gate (AI code review → TypeScript check → unit tests)

---

---

## ITEM 7: Sanity Run Tagged as "custom" Instead of "Sanity"

### Problem
When clicking the **Sanity (Tier 1)** button in the Test Engine, the historical run entry shows `"custom — timestamp"` instead of `"Sanity — timestamp"`. The tier information is not being captured correctly in the run history.

**Example of bug**: Button clicked = Sanity (Tier 1), but `run-history.json` entry shows `{tier: "custom", tierLabel: "Custom"}` instead of `{tier: "sanity", tierLabel: "Sanity"}`.

### Root Cause
The API route (`app/api/qa/run/route.ts`) or the dashboard page (`app/qa-dashboard/page.tsx`) is likely not passing the tier name correctly when creating run-history entries. The tier parameter from the button click (Sanity/Full QA/Release) is not being forwarded to the run-history write operation.

### Requirements
1. **Fix tier capture**: When clicking **Sanity (Tier 1)**, the run-history entry **MUST** record `{tier: "sanity", tierLabel: "Sanity"}` — NOT `{tier: "custom"}`
2. **Fix for all three tiers**: Ensure the same fix applies correctly to all three tier buttons:
   - **Sanity (Tier 1)** → `{tier: "sanity", tierLabel: "Sanity"}`
   - **Full QA (Tier 2)** → `{tier: "full-qa", tierLabel: "Full QA"}`
   - **Release (Tier 3)** → `{tier: "release", tierLabel: "Release"}`
3. **Prevent "custom" fallback**: If a tier value is somehow missing or invalid, the system should default to a meaningful error state (e.g., `{tier: "unknown"}`) rather than silently falling through to `"custom"`
4. **Backfill check**: Verify that `run-history.json` has no remaining entries with `tier: "custom"` that should have been `"sanity"`, `"full-qa"`, or `"release"`

### Trace Analysis
Follow the tier button click through the full data flow:
1. User clicks **Sanity (Tier 1)** button in `app/qa-dashboard/page.tsx`
2. `handleTierClick('sanity')` or equivalent handler fires
3. API call is made to `POST /api/qa/run` with `{ tier: "sanity" }`
4. `app/api/qa/run/route.ts` receives the request and runs tests
5. After run completes, `run-history.json` is updated with a new entry
6. **BUG OCCURS HERE**: The tier value `"sanity"` is lost/overwritten and becomes `"custom"`

### Implementation Guidance
- Examine `app/api/qa/run/route.ts` — look for where `run-history.json` entries are created
- Trace how the `tier` parameter flows from the request body to the written JSON entry
- Check if there's a default/fallback value that's incorrectly overriding the passed tier
- Examine `app/qa-dashboard/page.tsx` — the `handleTierClick` function or equivalent to verify the correct tier is being sent in the API request
- After fixing, test each tier button to verify correct labeling

### Verification Criteria
1. Open QA Dashboard
2. Click **Sanity (Tier 1)** → wait for test run to complete
3. Open browser DevTools → Network tab → find the run-history write call
4. Verify the new entry has `tier: "sanity"` and `tierLabel: "Sanity"`
5. Check the dropdown shows "Sanity — {timestamp}" (not "custom — {timestamp}")
6. Repeat for Full QA (Tier 2) → verify `tier: "full-qa"`, `tierLabel: "Full QA"`
7. Repeat for Release (Tier 3) → verify `tier: "release"`, `tierLabel: "Release"`

---

## ITEM 8: CSV Download Should Export Latest Run Only

### Problem
Currently, CSV download exports **ALL** test data across all 21 test types, regardless of which run was performed. This is incorrect because:
- After running **Sanity (Tier 1)**, only 4 test types were executed (unit, integration, api-contract, regression)
- But CSV exports all 21 test types with their full planned/automated/run numbers
- This makes the CSV misleading — it appears to show comprehensive data when only a subset was actually tested

### Requirements
1. **Export latest run results only**: The CSV download button must export **ONLY** the data from the latest executed run, not the full test type database
2. **Disabled state when no run exists**: If no test run has been performed yet, the CSV download button must show a **disabled/grayed state** with text: "Run a test tier first"
3. **Content matches run scope**: The CSV columns/rows must contain **only** the test types that were part of the latest run:
   - After **Sanity (Tier 1)**: rows for unit, integration, api-contract, regression only
   - After **Full QA (Tier 2)**: all test types except disaster-recovery
   - After **Release (Tier 3)**: all 21 test types
4. **Data accuracy**: The Planned/Automated/Run/Pass/Fail counts in the CSV must reflect the **actual results of that specific run**, not the full test type totals

### Implementation Guidance
- Locate the CSV download function in `app/qa-dashboard/page.tsx` (search for "csv", "export", "download")
- The function likely builds a CSV string from `qa-dashboard/test-types.json` or hardcoded data
- Modify it to instead read from the **latest run entry's results** — likely found in `run-history.json` or `results.json`
- Filter the CSV data to include only test types that were executed in that run
- Add a `disabled` state check: if `run-history.json` is empty (no runs exist), disable the button
- Use the same tier-to-test-types mapping that the Test Engine uses (from `test-run-config.json`):
  - Sanity → unit, integration, api-contract, regression
  - Full QA → all except disaster-recovery
  - Release → all 21 test types

### Verification Criteria
1. Open QA Dashboard with NO runs performed → verify CSV button shows "Run a test tier first" disabled state
2. Run **Sanity (Tier 1)** → click CSV download → verify exported CSV contains ONLY 4 test type rows (unit, integration, api-contract, regression)
3. Run **Full QA (Tier 2)** → click CSV download → verify CSV contains all types except disaster-recovery
4. Run **Release (Tier 3)** → click CSV download → verify CSV contains all 21 test types
5. Verify the counts in the CSV match what's shown in the dashboard for that run

---

## ITEM 9: Test Summary Should Reflect Latest Run, Not Full Data

### Problem
After clicking **Sanity (Tier 1)**, the **Test Summary by Category** table continues to show ALL 21 test types with their full planned/automated/run numbers. Instead, it should filter to show only the test types that were actually part of the latest run.

**Example**: After running Sanity, the Test Summary shows 21 test types with counts like "Planned: 284, Automated: 148, Run: 148" — but the run only executed 4 types. This is misleading.

### Requirements
1. **Filter by run scope**: The Test Summary by Category table must filter to show **ONLY** the test types that were part of the latest executed run, not all 21 test types

2. **Tier-to-test-type mappings**:
   - **Sanity (Tier 1)**: Show only → unit, integration, api-contract, regression
   - **Full QA (Tier 2)**: Show all except → disaster-recovery
   - **Release (Tier 3)**: Show all 21 test types

3. **Count accuracy**: The Planned/Automated/Run counts in the summary table must reflect the **actual data from that specific run**, not the full grand totals

4. **Visual run indicator**: Add a visual indicator at the top of the Test Summary section (or above the table) showing which run's data is currently displayed. Format: `"Showing results for: {TierLabel} — {Timestamp}"` (e.g., "Showing results for: Sanity — 2026-06-02 14:30")

5. **Consistency with historical dropdown**: When the user selects a historical run from the dropdown (ITEM-2), the Test Summary should also filter to that run's scope AND update the visual indicator. When returning to "Current Results", restore the latest run's filter and indicator.

### Implementation Guidance
- Locate the Test Summary by Category rendering logic in `app/qa-dashboard/page.tsx`
- The table is likely generated from a loop over `testTypes` loaded from `qa-dashboard/test-types.json`
- Modify the filter to cross-reference with the selected/latest run's data from `run-history.json`
- Use the same tier-to-test-type mapping defined in `qa-dashboard/test-run-config.json`:
  - Look at `test-run-config.json` for the `tiers` array — each tier has a `testTypes` array defining which types are included
- The `run-history.json` entry for the selected run should contain the `tier` field (now guaranteed by ITEM-2 and ITEM-7 fixes)
- Map the `tier` value to the appropriate test types from the config file
- Add a new `useState` or derived variable for `activeRunLabel` that renders the indicator text
- Style the indicator as a subtle badge/banner (e.g., blue background, monospace timestamp) above the table

### Verification Criteria
1. Run **Sanity (Tier 1)** → verify Test Summary shows ONLY 4 rows (unit, integration, api-contract, regression)
2. Verify the indicator shows "Showing results for: Sanity — 2026-06-02 14:30"
3. Verify the counts shown match the Sanity run's actual results (not the full 284/148/148 totals)
4. Run **Full QA (Tier 2)** → verify Test Summary shows all types except disaster-recovery
5. Run **Release (Tier 3)** → verify Test Summary shows all 21 types
6. Select a historical run from dropdown → verify Test Summary filters and indicator update accordingly
7. Click "View Current Results" → verify Test Summary returns to latest run's filter and indicator

---

## Execution Requirements

1. **Execute ITEM-2 FIRST** before any other items (per ITEM-6 priority directive)
2. **All code changes MUST pass the pre-commit gate** (AI code review → TypeScript check → unit tests) before reaching git — follow the Pre-Commit Code Review Gate section in AGENTS.md
3. **All changes should be committed** to the current working branch with descriptive commit messages
4. **Save all output artifacts** in `agents/03_execution_workspace/08_qa_agent/`
5. **Generate a COMPLETION SLIDE** (`08_qa_agent_COMPLETION_SLIDE.pptx`) summarizing all 9 implemented items
6. **Update token usage** by running `python scripts/track_usage.py` upon completion

## Verification Criteria

| Item | Verification Method |
|------|-------------------|
| ITEM-1 | Run tests that fail → verify results.json is updated, DEFECT_LOG.md has new entries, supervisor notification file is created |
| ITEM-2 | Open QA Dashboard → verify dropdown shows "Sanity — 2026-06-02 14:30" format (tier+timestamp), click historical run → summary updates, amber banner appears |
| ITEM-3 | Click a tier button → verify UI doesn't freeze, poll endpoint returns status, results load automatically on completion |
| ITEM-4 | Replace input with textarea → verify multiline + scroll support. Click Apply → verify "Download as PDF" appears. Click download → verify PDF has verdict, comment, timestamp, signature fields |
| ITEM-5 | Scroll to External Reports → verify ALL reports show disabled/grayed state with "Not generated yet" text. Hover → verify tooltip with generation command. Generate a report → verify it becomes active/clickable |
| ITEM-6 | Verify ITEM-2 is the first commit in the execution sequence (check git log order) |
| ITEM-7 | Click Sanity (Tier 1) → run completes → check run-history.json entry has `tier: "sanity"`, `tierLabel: "Sanity"` (not "custom"). Repeat for Full QA and Release |
| ITEM-8 | No runs → CSV button shows disabled "Run a test tier first". Run Sanity → CSV exports only 4 types. Run Full QA → CSV exports all except disaster-recovery. Run Release → CSV exports all 21 |
| ITEM-9 | Run Sanity → Test Summary shows only 4 test type rows with correct counts + indicator "Showing results for: Sanity — {timestamp}". Verify Full QA and Release filters. Check historical dropdown sync |
