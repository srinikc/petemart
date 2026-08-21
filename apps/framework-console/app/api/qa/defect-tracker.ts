import fs from 'fs';
import path from 'path';
import { projectDir, ensureProjectDir } from '@/lib/qa/project-paths';

export interface TestFailure {
  testFile: string;
  testName: string;
  layer: 'unit' | 'component' | 'api' | 'integration' | 'sse' | 'e2e' | 'security' | 'visual-regression';
  error: string;
  timestamp: string;
  agentId?: string;
  featureId?: string;
  prNumber?: number;
  screenshotPath?: string;
  project?: string;
}

export interface Defect {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'fixed' | 'verified' | 'closed';
  layer: TestFailure['layer'];
  testFile: string;
  testName: string;
  error: string;
  foundAt: string;
  fixedAt?: string;
  prNumber?: number;
  jiraIssueId?: string;
  assignee?: string;
  notes: string[];
  project: string;
}

let _idCounter = 0;

function defectsFile(project: string): string {
  return path.join(projectDir(project), 'defects.json');
}

export function createDefect(failure: TestFailure, project?: string): Defect {
  const proj = project || failure.project || 'agentic-console';
  ensureProjectDir(proj);
  _idCounter += 1;
  const id = `DEF-${String(_idCounter).padStart(3, '0')}`;
  const defect: Defect = {
    id, project: proj,
    title: `[${failure.layer.toUpperCase()}] ${failure.testName}`,
    description: `Test failure in ${failure.testFile}: ${failure.testName}`,
    severity: failure.layer === 'security' || failure.layer === 'sse' ? 'high' : 'medium',
    status: 'open',
    layer: failure.layer,
    testFile: failure.testFile,
    testName: failure.testName,
    error: failure.error,
    foundAt: failure.timestamp || new Date().toISOString(),
    prNumber: failure.prNumber,
    assignee: failure.agentId,
    notes: [`Auto-created from test failure at ${failure.timestamp || new Date().toISOString()}`],
  };
  return defect;
}

export function loadDefects(project?: string): Defect[] {
  const proj = project || 'agentic-console';
  const file = defectsFile(proj);
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    for (const d of data) {
      const match = d.id?.match(/DEF-(\d+)/);
      if (match) { const num = parseInt(match[1], 10); if (num > _idCounter) _idCounter = num; }
    }
    return data as Defect[];
  } catch { return []; }
}

export function saveDefects(defects: Defect[], project?: string): void {
  const proj = project || 'agentic-console';
  ensureProjectDir(proj);
  fs.writeFileSync(defectsFile(proj), JSON.stringify(defects, null, 2), 'utf-8');
}

export function getDefectsByLayer(layer: string, project?: string): Defect[] {
  return loadDefects(project).filter((d) => d.layer === layer);
}

export function getDefectsByStatus(status: string, project?: string): Defect[] {
  return loadDefects(project).filter((d) => d.status === status);
}

export function getOpenDefectCount(project?: string): number {
  return loadDefects(project).filter((d) => d.status === 'open' || d.status === 'in_progress').length;
}

export function updateDefectStatus(id: string, status: Defect['status'], notes?: string, project?: string): Defect | null {
  const defects = loadDefects(project);
  const idx = defects.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  defects[idx].status = status;
  if (status === 'fixed' && !defects[idx].fixedAt) defects[idx].fixedAt = new Date().toISOString();
  if (notes) defects[idx].notes.push(notes);
  saveDefects(defects, project);
  return defects[idx];
}

export function exportToJiraFormat(defects: Defect[], projectKey?: string): Record<string, any>[] {
  const key = projectKey || 'PETEMART';
  return defects.map((d) => ({
    fields: {
      project: { key },
      summary: d.title,
      description: [
        `*Description*: ${d.description}`,
        `*Test File*: ${d.testFile}`,
        `*Test Name*: ${d.testName}`,
        `*Error*: ${d.error}`,
        `*Layer*: ${d.layer}`,
        `*Found At*: ${d.foundAt}`,
        d.fixedAt ? `*Fixed At*: ${d.fixedAt}` : '',
        `*Severity*: ${d.severity}`,
        d.prNumber ? `*PR*: #${d.prNumber}` : '',
        d.assignee ? `*Assignee*: ${d.assignee}` : '',
        '', '*Notes*:', ...d.notes.map((n) => `  - ${n}`),
      ].filter(Boolean).join('\n'),
      issuetype: { name: d.severity === 'critical' ? 'Bug' : 'Task' },
      priority: { name: d.severity === 'critical' ? 'Highest' : d.severity === 'high' ? 'High' : d.severity === 'medium' ? 'Medium' : 'Low' },
      labels: [`project-${d.project}`, `layer-${d.layer}`, d.status === 'open' ? 'needs-triage' : ''].filter(Boolean),
    },
  }));
}
