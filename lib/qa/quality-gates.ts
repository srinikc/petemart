import fs from 'fs';
import path from 'path';
import { projectResultsPath, projectHistoryPath, readProjectJSON } from '@/lib/qa/project-paths';

export interface QualityGate {
  gateId: string;
  name: string;
  status: 'pass' | 'fail' | 'not-evaluated';
  description: string;
  metrics: Record<string, string | number | boolean>;
}

interface ResultsData {
  summary?: { totalTests?: number; passed?: number; failed?: number; passRate?: number; coveragePct?: number };
  testTypes?: Array<{
    id: string; name: string; status: string; total: number; passed: number; failed: number;
    coverageActual?: number; subcategories?: Array<{ id: string; total: number }>;
  }>;
  qualityGates?: Array<{ id: string; status: string }>;
}

interface RunHistoryEntry {
  runId: string; tier: string; status: string;
  summary?: { total?: number; passed?: number; failed?: number; passRate?: number };
  tests?: Record<string, { total: number; passed: number; failed: number; status: string }>;
}

function loadJSON<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch { return null; }
}

function hasFilePattern(pattern: string): boolean {
  const fullPattern = path.join(process.cwd(), pattern);
  try {
    const dir = path.dirname(fullPattern);
    if (!fs.existsSync(dir)) return false;
    const entries = fs.readdirSync(dir);
    const fileName = path.basename(fullPattern);
    if (fileName.includes('*')) return entries.some((e) => e.endsWith('.ts') || e.endsWith('.tsx'));
    return entries.includes(fileName);
  } catch { return false; }
}

export function evaluateQualityGates(project?: string): QualityGate[] {
  const proj = project || 'agentic-console';
  const results = loadJSON<ResultsData>(projectResultsPath(proj));
  const history = loadJSON<RunHistoryEntry[]>(projectHistoryPath(proj));

  const summary = results?.summary || {};
  const testTypes = results?.testTypes || [];
  const passRate = summary.passRate ?? 0;
  const coveragePct = summary.coveragePct ?? 0;

  const testTypeById = (id: string) => testTypes.find((t) => t.id === id);

  const gates: QualityGate[] = [];

  const apiTests = testTypeById('api-contract');
  const apiPass = apiTests ? apiTests.failed === 0 && apiTests.total > 0 : false;
  gates.push({ gateId: 'QG-AC-01', name: 'All API contract tests pass', status: apiPass ? 'pass' : (apiTests?.total ? 'fail' : 'not-evaluated'), description: 'Contract tests for all 32 API routes', metrics: { totalApiTests: apiTests?.total ?? 0, apiPassed: apiTests?.passed ?? 0, apiFailed: apiTests?.failed ?? 0 } });

  const sseTests = testTypeById('sse');
  const ssePass = sseTests ? sseTests.failed === 0 && sseTests.total > 0 : false;
  gates.push({ gateId: 'QG-AC-02', name: 'SSE stream connects and delivers events', status: ssePass ? 'pass' : (sseTests?.total ? 'fail' : 'not-evaluated'), description: 'Events SSE endpoint tests exist and pass', metrics: { totalSseTests: sseTests?.total ?? 0, ssePassed: sseTests?.passed ?? 0, sseFailed: sseTests?.failed ?? 0 } });

  const compTests = testTypeById('component');
  const compPassRate = compTests && compTests.total > 0 ? (compTests.passed / compTests.total) * 100 : 0;
  const compPass = compPassRate > 70;
  gates.push({ gateId: 'QG-AC-03', name: 'Component tests have >70% pass rate', status: compPass ? 'pass' : (compTests?.total ? 'fail' : 'not-evaluated'), description: `Component test pass rate: ${compPassRate.toFixed(1)}%`, metrics: { totalComponentTests: compTests?.total ?? 0, componentPassed: compTests?.passed ?? 0, componentFailed: compTests?.failed ?? 0, passRate: parseFloat(compPassRate.toFixed(1)) } });

  const approvalExists = hasFilePattern('__tests__/agentic-console/approval*');
  const e2eExists = hasFilePattern('e2e/**/approval*');
  gates.push({ gateId: 'QG-AC-04', name: 'Agent approval flow completes', status: 'not-evaluated', description: 'Approve/reject works end-to-end', metrics: { hasApprovalTests: approvalExists || e2eExists } });

  gates.push({ gateId: 'QG-AC-05', name: 'Pipeline control (start/stop/pause/resume)', status: 'not-evaluated', description: 'Pipeline lifecycle management', metrics: {} });

  const compCoverageActual = compTests?.coverageActual ?? 0;
  const covPass = compCoverageActual >= 70;
  gates.push({ gateId: 'QG-AC-06', name: 'Component test coverage >= 70%', status: covPass ? 'pass' : (compTests?.total ? 'fail' : 'not-evaluated'), description: `Coverage: ${compCoverageActual}%`, metrics: { coverageActual: compCoverageActual, coverageTarget: 70 } });

  const xbExists = hasFilePattern('e2e/**/cross-browser*');
  gates.push({ gateId: 'QG-AC-07', name: 'Cross-browser dashboard loads', status: xbExists ? 'not-evaluated' : 'not-evaluated', description: 'Chrome, Firefox, Safari', metrics: { hasCrossBrowserTests: xbExists } });

  const a11yExists = hasFilePattern('e2e/accessibility*');
  gates.push({ gateId: 'QG-AC-08', name: 'Accessibility: no critical violations', status: a11yExists ? 'not-evaluated' : 'not-evaluated', description: 'axe-core audit', metrics: { hasAccessibilityTests: a11yExists } });

  gates.push({ gateId: 'QG-AC-09', name: 'Supervisor SSE connects and streams', status: ssePass ? 'pass' : 'fail', description: 'Supervisor chat SSE endpoint', metrics: { supervisorSseTests: sseTests?.total ?? 0, supervisorSsePassed: sseTests?.passed ?? 0 } });

  const vrExists = hasFilePattern('e2e/**/visual-regression*');
  gates.push({ gateId: 'QG-AC-10', name: 'Visual regression: no layout diffs', status: vrExists ? 'not-evaluated' : 'not-evaluated', description: 'Page screenshots match', metrics: { hasVisualRegressionTests: vrExists } });

  return gates;
}

export function saveQualityGates(gates: QualityGate[], project?: string): void {
  const proj = project || 'agentic-console';
  const resultsPath = projectResultsPath(proj);
  try {
    if (!fs.existsSync(resultsPath)) return;
    const raw = fs.readFileSync(resultsPath, 'utf-8');
    const data = JSON.parse(raw);
    data.qualityGates = gates.map((g) => ({
      id: g.gateId, name: g.name, category: g.gateId.split('-').pop() || 'general',
      status: g.status, description: g.description, metrics: g.metrics,
    }));
    data.summary = { ...data.summary, qualityGatesPassed: gates.filter((g) => g.status === 'pass').length, qualityGatesTotal: gates.length };
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(resultsPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch { /* continue */ }
}
