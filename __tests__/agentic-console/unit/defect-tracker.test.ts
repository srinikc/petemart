// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── In-memory FS mock ──────────────────────────────────────────────
// NOTE: Must use 'fs' not 'node:fs' — vitest v2.1.9 does NOT normalize the
// node: scheme for built-in mocks when the source code uses import fs from 'fs'.
// Also: all mock definitions must be inside vi.hoisted() because vi.mock is
// hoisted to the top of the file and cannot reference uninitialized variables.
const { mem, mockImpl } = vi.hoisted(() => {
  const mem = new Map<string, string>();
  const mockImpl = {
    existsSync: (p: string) => mem.has(p),
    readFileSync: (p: string, _e?: any) => {
      if (!mem.has(p as string)) throw Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' });
      return mem.get(p)!;
    },
    writeFileSync: (p: string, d: any) => mem.set(p, String(d)),
    appendFileSync: (p: string, d: any) => mem.set(p, (mem.get(p) || '') + String(d)),
    mkdirSync: () => {},
    readdirSync: () => [],
    unlinkSync: (p: string) => mem.delete(p),
    statSync: () => ({ isFile: () => true, isDirectory: () => false, size: 1024, mtime: new Date() }),
  };
  return { mem, mockImpl };
});

vi.mock('fs', async (importOriginal) => {
  const m = await importOriginal();
  return {
    ...(m as any),
    ...mockImpl,
    default: { ...(m as any), ...mockImpl },
  };
});

import {
  createDefect,
  loadDefects,
  saveDefects,
  getDefectsByLayer,
  getDefectsByStatus,
  updateDefectStatus,
  exportToJiraFormat,
} from '@/app/api/qa/defect-tracker';
import type { TestFailure, Defect } from '@/app/api/qa/defect-tracker';

function makeFailure(overrides: Partial<TestFailure> = {}): TestFailure {
  return {
    testFile: '__tests__/example.test.ts',
    testName: 'should do the thing',
    layer: 'unit',
    error: 'Expected true, got false',
    timestamp: '2026-06-16T14:00:00.000Z',
    ...overrides,
  };
}

describe('defect-tracker', () => {
  beforeEach(() => {
    mem.clear();
  });

  afterEach(() => {
    mem.clear();
  });

  it('createDefect generates correct structure', () => {
    const failure = makeFailure({
      layer: 'sse',
      prNumber: 42,
      agentId: '07b_api_agent',
    });
    const defect = createDefect(failure);

    expect(defect).toHaveProperty('id');
    expect(defect.id).toMatch(/^DEF-\d{3}$/);
    expect(defect.title).toContain('[SSE]');
    expect(defect.title).toContain('should do the thing');
    expect(defect.description).toContain('__tests__/example.test.ts');
    expect(defect.severity).toBe('high'); // sse layer → high severity
    expect(defect.status).toBe('open');
    expect(defect.testFile).toBe('__tests__/example.test.ts');
    expect(defect.testName).toBe('should do the thing');
    expect(defect.error).toBe('Expected true, got false');
    expect(defect.foundAt).toBe('2026-06-16T14:00:00.000Z');
    expect(defect.prNumber).toBe(42);
    expect(defect.assignee).toBe('07b_api_agent');
    expect(defect.notes).toHaveLength(1);
    expect(defect.notes[0]).toContain('Auto-created from test failure');
    expect(defect.fixedAt).toBeUndefined();
  });

  it('loadDefects returns empty array when no file', () => {
    mem.clear();
    const defects = loadDefects();
    expect(defects).toEqual([]);
  });

  it('saveDefects persists to file', () => {
    const defect: Defect = {
      id: 'DEF-001',
      title: '[UNIT] should validate input',
      description: 'desc',
      severity: 'medium',
      status: 'open',
      layer: 'unit',
      testFile: 'test.ts',
      testName: 'should validate input',
      error: 'fail',
      foundAt: '2026-06-16T14:00:00.000Z',
      notes: [],
      project: 'agentic-console',
    };

    saveDefects([defect]);
    const loaded = loadDefects();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('DEF-001');
    expect(loaded[0].title).toBe('[UNIT] should validate input');
  });

  it('getDefectsByLayer filters correctly', () => {
    const defects: Defect[] = [
      { id: 'DEF-001', title: 'A', description: 'd', severity: 'low', status: 'open', layer: 'unit', testFile: 'a.ts', testName: 'a', error: 'err', foundAt: '2026-06-16T14:00:00.000Z', notes: [], project: 'agentic-console' },
      { id: 'DEF-002', title: 'B', description: 'd', severity: 'low', status: 'open', layer: 'component', testFile: 'b.ts', testName: 'b', error: 'err', foundAt: '2026-06-16T14:00:00.000Z', notes: [], project: 'agentic-console' },
      { id: 'DEF-003', title: 'C', description: 'd', severity: 'low', status: 'open', layer: 'sse', testFile: 'c.ts', testName: 'c', error: 'err', foundAt: '2026-06-16T14:00:00.000Z', notes: [], project: 'agentic-console' },
    ];
    saveDefects(defects);

    const unitDefects = getDefectsByLayer('unit');
    expect(unitDefects).toHaveLength(1);
    expect(unitDefects[0].id).toBe('DEF-001');

    const sseDefects = getDefectsByLayer('sse');
    expect(sseDefects).toHaveLength(1);
    expect(sseDefects[0].id).toBe('DEF-003');

    const nonexistent = getDefectsByLayer('e2e');
    expect(nonexistent).toEqual([]);
  });

  it('getDefectsByStatus filters correctly', () => {
    const defects: Defect[] = [
      { id: 'DEF-001', title: 'A', description: 'd', severity: 'low', status: 'open', layer: 'unit', testFile: 'a.ts', testName: 'a', error: 'err', foundAt: '2026-06-16T14:00:00.000Z', notes: [], project: 'agentic-console' },
      { id: 'DEF-002', title: 'B', description: 'd', severity: 'low', status: 'in_progress', layer: 'component', testFile: 'b.ts', testName: 'b', error: 'err', foundAt: '2026-06-16T14:00:00.000Z', notes: [], project: 'agentic-console' },
      { id: 'DEF-003', title: 'C', description: 'd', severity: 'low', status: 'fixed', layer: 'sse', testFile: 'c.ts', testName: 'c', error: 'err', foundAt: '2026-06-16T14:00:00.000Z', notes: [], project: 'agentic-console' },
    ];
    saveDefects(defects);

    expect(getDefectsByStatus('open')).toHaveLength(1);
    expect(getDefectsByStatus('in_progress')).toHaveLength(1);
    expect(getDefectsByStatus('fixed')).toHaveLength(1);
    expect(getDefectsByStatus('verified')).toEqual([]);
  });

  it('updateDefectStatus works', () => {
    const defect: Defect = {
      id: 'DEF-001',
      title: '[UNIT] test',
      description: 'desc',
      severity: 'high',
      status: 'open',
      layer: 'unit',
      testFile: 'test.ts',
      testName: 'test',
      error: 'fail',
      foundAt: '2026-06-16T14:00:00.000Z',
      notes: [],
      project: 'agentic-console',
    };
    saveDefects([defect]);

    const updated = updateDefectStatus('DEF-001', 'in_progress', 'Assigning to developer');
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('in_progress');
    expect(updated!.notes).toHaveLength(1);
    expect(updated!.notes[0]).toBe('Assigning to developer');

    const fixed = updateDefectStatus('DEF-001', 'fixed');
    expect(fixed).not.toBeNull();
    expect(fixed!.status).toBe('fixed');
    expect(fixed!.fixedAt).toBeDefined();

    const loaded = loadDefects();
    expect(loaded[0].status).toBe('fixed');
    expect(loaded[0].fixedAt).toBeDefined();

    const none = updateDefectStatus('DEF-999', 'closed');
    expect(none).toBeNull();
  });

  it('exportToJiraFormat generates correct structure', () => {
    const defects: Defect[] = [
      {
        id: 'DEF-001',
        title: '[SSE] supervisor stream timeout',
        description: 'SSE stream fails under concurrent load',
        severity: 'critical',
        status: 'open',
        layer: 'sse',
        testFile: 'sse.test.ts',
        testName: 'handles concurrent connections',
        error: 'Timeout',
        foundAt: '2026-06-16T14:00:00.000Z',
        fixedAt: '2026-06-17T10:00:00.000Z',
        prNumber: 42,
        assignee: '07b_api_agent',
        notes: ['Fixed by adding connection pool limit'],
        project: 'agentic-console',
      },
      {
        id: 'DEF-002',
        title: '[UNIT] formatETA handles NaN',
        description: 'NaN duration crashes formatETA helper',
        severity: 'low',
        status: 'fixed',
        layer: 'unit',
        testFile: 'shared.test.tsx',
        testName: 'handles NaN input',
        error: 'toFixed on NaN',
        foundAt: '2026-06-15T10:00:00.000Z',
        notes: [],
        project: 'agentic-console',
      },
    ];

    const jira = exportToJiraFormat(defects);

    expect(jira).toHaveLength(2);
    expect(jira[0].fields.issuetype.name).toBe('Bug');
    expect(jira[0].fields.priority.name).toBe('Highest');
    expect(jira[0].fields.summary).toContain('[SSE]');
    expect(jira[0].fields.labels).toContain('project-agentic-console');
    expect(jira[0].fields.labels).toContain('layer-sse');
    expect(jira[0].fields.labels).toContain('needs-triage');
    expect(jira[0].fields.description).toContain('#42');
    expect(jira[0].fields.description).toContain('07b_api_agent');

    expect(jira[1].fields.issuetype.name).toBe('Task');
    expect(jira[1].fields.priority.name).toBe('Low');
    expect(jira[0].fields.project.key).toBe('PETEMART');
  });

  it('Multiple defects can be saved and loaded', () => {
    const defects: Defect[] = [];
    for (let i = 1; i <= 5; i++) {
      defects.push({
        id: `DEF-${String(i).padStart(3, '0')}`,
        title: `[UNIT] test ${i}`,
        description: `desc ${i}`,
        severity: i === 1 ? 'critical' : 'medium',
        status: i <= 3 ? 'open' : 'fixed',
        layer: 'unit',
        testFile: `test${i}.ts`,
        testName: `test number ${i}`,
        error: `error ${i}`,
        foundAt: '2026-06-16T14:00:00.000Z',
        notes: [],
        project: 'agentic-console',
      });
    }

    saveDefects(defects);
    const loaded = loadDefects();

    expect(loaded).toHaveLength(5);
    expect(loaded[0].id).toBe('DEF-001');
    expect(loaded[4].id).toBe('DEF-005');
    expect(loaded[0].severity).toBe('critical');
    expect(loaded[0].status).toBe('open');
    expect(loaded[4].status).toBe('fixed');

    const unitDefects = getDefectsByLayer('unit');
    expect(unitDefects).toHaveLength(5);

    const openDefects = getDefectsByStatus('open');
    expect(openDefects).toHaveLength(3);

    const fixedDefects = getDefectsByStatus('fixed');
    expect(fixedDefects).toHaveLength(2);
  });
});
