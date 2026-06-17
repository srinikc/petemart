// =============================================================================
// Agentic Console — Unit Tests: API Helpers
// Tests for fetchWithTimeout, fetchProjectsIndex, withProject (from shared.tsx)
// and statePath, readState, appendTrace (from API route handlers)
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import {
  fetchWithTimeout,
  fetchProjectsIndex,
  withProject,
} from '@/app/agentic-console/shared';
import { GET as stateGet } from '@/app/api/agentic-console/state/route';
import { POST as approvePost } from '@/app/api/agentic-console/approve/route';
import {
  createMockStateMatrix,
  createMockAgentRegistry,
} from '../test-utils';
import { mockNextRequest } from '../api-test-utils';

// ── In-memory FS mock (same pattern as state-routes.test.ts) ──
const mem = vi.hoisted(() => new Map<string, string>());

vi.mock(import('node:fs'), async (importOriginal) => {
  const original = await importOriginal();
  const mocked = {
    existsSync: (p: string) => mem.has(p),
    readFileSync: (p: string, _e?: any) => {
      if (!mem.has(p)) throw Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' });
      return mem.get(p)!;
    },
    writeFileSync: (p: string, d: any) => mem.set(p, String(d)),
    appendFileSync: (p: string, d: any) => mem.set(p, (mem.get(p) || '') + String(d)),
    mkdirSync: () => {},
    readdirSync: () => [],
    unlinkSync: (p: string) => mem.delete(p),
    statSync: () => ({ isFile: () => true, isDirectory: () => false, size: 1024, mtime: new Date() }),
  };
  return {
    ...original,
    ...mocked,
    default: mocked,
  };
});

// ── Mock crypto for deterministic span IDs ──
vi.mock(import('node:crypto'), async (importOriginal) => {
  const original = await importOriginal();
  const mocked = { randomUUID: () => 'aaaaaaaa-0000-4000-8000-000000000000' };
  return { ...original, ...mocked, default: { ...original, ...mocked } };
});

// ── Path constants ──
const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

const PATHS = {
  STATE: P('00_state_ledger/STATE_MATRIX.json'),
  REGISTRY: P('00_state_ledger/AGENT_REGISTRY.json'),
  TRACES: P('00_state_ledger/traces.jsonl'),
  PROJ_STATE: P('00_state_ledger/projects/petemart/STATE_MATRIX.json'),
  PROJ_DIR: P('00_state_ledger/projects/petemart'),
};

function setMem(p: string, data: string) { mem.set(p, data); }
function delMem(p: string) { mem.delete(p); }

function bootstrapState() {
  const state = createMockStateMatrix();
  state.agent_states = {
    '01_ideation_agent': {
      agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async',
      status: 'approved', dependencies: [], requires_human_approval: true,
      approved: true, role: 'Ideation Agent', last_artifact_emitted: '',
      artifacts_emitted: ['file.md'], last_activity_timestamp: new Date().toISOString(),
      execution_count: 1, compliance_checklist: [],
    },
  };
  setMem(PATHS.STATE, JSON.stringify(state));
  setMem(PATHS.REGISTRY, JSON.stringify(createMockAgentRegistry()));
  setMem(PATHS.TRACES, '');
  setMem(P('00_state_ledger/TRACEABILITY_MATRIX.json'), JSON.stringify({ version: '1.0', entries: [] }));
  setMem(P('00_state_ledger/CHANGE_REQUEST.json'), JSON.stringify({ changes: [] }));
  setMem(P('00_state_ledger/projects_index.json'), JSON.stringify({ default_project: 'petemart', projects: {} }));
  setMem(P('context_lake/latest.json'), JSON.stringify({ latest_entry: 'lake/test', window_name: 'test' }));
}

beforeEach(() => { mem.clear(); bootstrapState(); });
afterEach(() => { mem.clear(); });

// ── Globally fetch mock (for fetchWithTimeout / fetchProjectsIndex) ──
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ═══════════════════════════════════════════════════════════════════════════
// fetchWithTimeout
// ═══════════════════════════════════════════════════════════════════════════

describe('fetchWithTimeout()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('resolves with response on successful fetch before timeout', async () => {
    const res = new Response('ok', { status: 200 });
    mockFetch.mockResolvedValue(res);
    const result = await fetchWithTimeout('http://test.com/api', 5000);
    expect(result).toBe(res);
    expect(mockFetch).toHaveBeenCalledWith('http://test.com/api', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('rejects with "timeout" when fetch exceeds specified ms', async () => {
    // Fetch never resolves — the race should be won by the timeout promise
    mockFetch.mockImplementation(() => new Promise(() => {}));
    const promise = fetchWithTimeout('http://slow.com/api', 100);
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).rejects.toBe('timeout');
  });

  it('invokes abort controller signal on timeout', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    // Fetch never resolves — allow abort to be called without side effects
    mockFetch.mockImplementation(() => new Promise(() => {}));
    const promise = fetchWithTimeout('http://test.com/api', 50);
    await vi.advanceTimersByTimeAsync(50);
    await expect(promise).rejects.toBe('timeout');
    expect(abortSpy).toHaveBeenCalledTimes(1);
    abortSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// fetchProjectsIndex
// ═══════════════════════════════════════════════════════════════════════════

describe('fetchProjectsIndex()', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('returns parsed ProjectsIndex on successful response', async () => {
    const data = { default_project: 'petemart', projects: { petemart: { id: 'petemart', name: 'PeteMart' } } };
    mockFetch.mockResolvedValue(new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const result = await fetchProjectsIndex();
    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith('/api/agentic-console/projects');
  });

  it('returns null when fetch throws network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));
    const result = await fetchProjectsIndex();
    expect(result).toBeNull();
  });

  it('returns null when server responds with non-ok status', async () => {
    mockFetch.mockResolvedValue(new Response('Server Error', { status: 500 }));
    const result = await fetchProjectsIndex();
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// withProject
// ═══════════════════════════════════════════════════════════════════════════

describe('withProject()', () => {
  it('appends ?project= for URLs without existing query string', () => {
    expect(withProject('/api/state', 'petemart')).toBe('/api/state?project=petemart');
  });

  it('appends &project= for URLs that already have a query string', () => {
    expect(withProject('/api/state?foo=bar', 'petemart')).toBe('/api/state?foo=bar&project=petemart');
  });

  it('returns URL unchanged when project is undefined', () => {
    expect(withProject('/api/state')).toBe('/api/state');
  });

  it('returns URL unchanged when project is null', () => {
    expect(withProject('/api/state', null)).toBe('/api/state');
  });

  it('returns URL unchanged when project is empty string', () => {
    expect(withProject('/api/state', '')).toBe('/api/state');
  });

  it('encodes special characters in project name', () => {
    expect(withProject('/api/state', 'my project')).toBe('/api/state?project=my%20project');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// statePath (via route side effects)
// ═══════════════════════════════════════════════════════════════════════════

describe('statePath resolution (via GET /api/agentic-console/state)', () => {
  it('reads from root STATE_MATRIX.json when no project param given', async () => {
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    const body = await res.json();
    expect(body.stateMatrix.project_metadata.project_name).toBe('PeteMart');
  });

  it('returns project-specific state when project file exists', async () => {
    const ps = createMockStateMatrix();
    ps.project_metadata.project_name = 'petemart_custom';
    setMem(PATHS.PROJ_STATE, JSON.stringify(ps));
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state', { searchParams: { project: 'petemart' } }));
    const body = await res.json();
    expect(body.stateMatrix.project_metadata.project_name).toBe('petemart_custom');
  });

  it('falls back to root state when project file is missing', async () => {
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state', { searchParams: { project: 'nonexistent' } }));
    const body = await res.json();
    expect(body.stateMatrix.project_metadata.project_name).toBe('PeteMart');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// readState (via route side effects)
// ═══════════════════════════════════════════════════════════════════════════

describe('readState() (via POST /api/agentic-console/approve)', () => {
  it('returns parsed JSON state when file exists', async () => {
    const res = await approvePost(mockNextRequest('http://localhost:3000/api/agentic-console/approve', {
      method: 'POST',
      body: { agentId: '01_ideation_agent', action: 'approve' },
    }));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.agent).toContain('01_ideation_agent');
    expect(body.newStatus).toBe('pending');
  });

  it('throws and returns 500 when state file is missing', async () => {
    delMem(PATHS.STATE);
    const res = await approvePost(mockNextRequest('http://localhost:3000/api/agentic-console/approve', {
      method: 'POST',
      body: { agentId: '01_ideation_agent', action: 'approve' },
    }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('ENOENT');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// appendTrace
// ═══════════════════════════════════════════════════════════════════════════

describe('appendTrace() (via route side effects)', () => {
  it('writes a trace entry to traces.jsonl on state read', async () => {
    expect(mem.get(PATHS.TRACES)).toBe('');
    await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    const traces = mem.get(PATHS.TRACES) || '';
    const lines = traces.trim().split('\n').filter(Boolean);
    expect(lines.length).toBe(1);
    const span = JSON.parse(lines[0]);
    expect(span.type).toBe('span');
    expect(span.operation).toBe('state_read');
    expect(span.status).toBe('completed');
    expect(span.trace_id).toBe('mock-session-trace');
    expect(span.span_id).toBeDefined();
    expect(span.started_at).toBeDefined();
    expect(span.ended_at).toBeDefined();
  });

  it('handles errors gracefully — route returns 200 even if appendTrace fails silently', async () => {
    // Remove the traces file to test clean-slate scenario
    delMem(PATHS.TRACES);
    // Calling the route should not throw; appendTrace errors are caught internally
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    expect(res.status).toBe(200);
    // The file should be created by appendFileSync mock
    expect(mem.has(PATHS.TRACES)).toBe(true);
    const body = await res.json();
    expect(body.stateMatrix).toBeDefined();
  });
});
