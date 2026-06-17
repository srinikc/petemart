// =============================================================================
// Agentic Console — Unit Tests: Trace Pattern (appendTrace)
// Tests the span creation pattern used across API routes:
//   - Reads trace_id from STATE_MATRIX.json
//   - Generates span_id via crypto.randomUUID
//   - Appends structured span to traces.jsonl
//   - Handles errors silently
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import { GET as stateGet } from '@/app/api/agentic-console/state/route';
import { POST as approvePost } from '@/app/api/agentic-console/approve/route';
import { GET as tracesGet, POST as tracesPost } from '@/app/api/agentic-console/traces/route';
import {
  createMockStateMatrix,
  createMockAgentRegistry,
} from '../test-utils';
import { mockNextRequest } from '../api-test-utils';

// ── In-memory FS mock ──
const mem = vi.hoisted(() => new Map<string, string>());
const hoisted = vi.hoisted(() => ({ uuidCounter: 0 }));

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

// ── Mock crypto for deterministic + unique span IDs ──
// The span_id is derived as crypto.randomUUID().split('-')[0] (first 8 hex chars).
// We vary the first segment so each call produces a unique span_id.
vi.mock(import('node:crypto'), async (importOriginal) => {
  const original = await importOriginal();
  const mocked = {
    randomUUID: () => `${String(++hoisted.uuidCounter).padStart(8, '0')}-0000-4000-8000-000000000000`,
  };
  return { ...original, ...mocked, default: { ...original, ...mocked } };
});

// ── Path constants ──
const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

const PATHS = {
  STATE: P('00_state_ledger/STATE_MATRIX.json'),
  REGISTRY: P('00_state_ledger/AGENT_REGISTRY.json'),
  TRACES: P('00_state_ledger/traces.jsonl'),
  TRACES_DIR: P('00_state_ledger'),
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
  // Ensure predictable trace ID for assertions
  state.pipeline_control.session_trace_id = 'test-session-trace-abc123';
  setMem(PATHS.STATE, JSON.stringify(state));
  setMem(PATHS.REGISTRY, JSON.stringify(createMockAgentRegistry()));
  setMem(P('00_state_ledger/TRACEABILITY_MATRIX.json'), JSON.stringify({ version: '1.0', entries: [] }));
  setMem(P('00_state_ledger/CHANGE_REQUEST.json'), JSON.stringify({ changes: [] }));
  setMem(P('00_state_ledger/projects_index.json'), JSON.stringify({ default_project: 'petemart', projects: {} }));
  setMem(P('context_lake/latest.json'), JSON.stringify({ latest_entry: 'lake/test', window_name: 'test' }));
}

function readTraces(): any[] {
  const raw = mem.get(PATHS.TRACES);
  if (!raw || !raw.trim()) return [];
  return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

function readState(): any {
  return JSON.parse(mem.get(PATHS.STATE)!);
}

beforeEach(() => {
  hoisted.uuidCounter = 0;
  mem.clear();
  bootstrapState();
});

afterEach(() => {
  mem.clear();
  hoisted.uuidCounter = 0;
});

// ═══════════════════════════════════════════════════════════════════════════
// Trace span structure and creation
// ═══════════════════════════════════════════════════════════════════════════

describe('Trace span creation', () => {
  it('creates a span with correct structure (type, span_id, operation, timestamps)', async () => {
    await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    const traces = readTraces();
    expect(traces.length).toBe(1);
    const span = traces[0];
    expect(span.type).toBe('span');
    expect(span.span_id).toBeDefined();
    expect(typeof span.span_id).toBe('string');
    expect(span.span_id.length).toBeGreaterThan(0);
    expect(span.operation).toBe('state_read');
    expect(span.started_at).toBeDefined();
    expect(span.ended_at).toBeDefined();
    expect(span.duration_ms).toBe(0);
    expect(span.parent_span_id).toBeNull();
    expect(span.error).toBeNull();
  });

  it('includes trace_id from the pipeline control session_trace_id in state', async () => {
    await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    const traces = readTraces();
    expect(traces.length).toBe(1);
    const state = readState();
    expect(traces[0].trace_id).toBe(state.pipeline_control.session_trace_id);
    expect(traces[0].trace_id).toBe('test-session-trace-abc123');
  });

  it('handles missing state file gracefully by falling back to "unknown" trace_id', async () => {
    delMem(PATHS.STATE);
    // state/route.ts appendTrace reads STATE inside a try/catch, so it shouldn't crash
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    expect(res.status).toBe(200); // state route still works because safeReadJSON returns null
    const traces = readTraces();
    expect(traces.length).toBe(1);
    expect(traces[0].trace_id).toBe('unknown');
  });

  it('appends to existing traces.jsonl preserving previous entries', async () => {
    await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    const traces = readTraces();
    expect(traces.length).toBe(2);
    expect(traces[0].operation).toBe('state_read');
    expect(traces[1].operation).toBe('state_read');
    // Each span should have a unique span_id (counter increments)
    expect(traces[0].span_id).not.toBe(traces[1].span_id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Directory creation
// ═══════════════════════════════════════════════════════════════════════════

describe('Trace directory creation', () => {
  it('creates the 00_state_ledger directory if missing when appending (approve route)', async () => {
    // The approve/route.ts appendTrace creates the directory if missing
    // Remove traces.jsonl to simulate first-ever write
    delMem(PATHS.TRACES);
    const writeSpy = vi.spyOn(mem.constructor.prototype, 'set');
    const res = await approvePost(mockNextRequest('http://localhost:3000/api/agentic-console/approve', {
      method: 'POST',
      body: { agentId: '01_ideation_agent', action: 'approve' },
    }));
    expect(res.status).toBe(200);
    // Verify the traces file was created
    expect(mem.has(PATHS.TRACES)).toBe(true);
    const traces = readTraces();
    expect(traces.length).toBe(1);
    expect(traces[0].operation).toBe('approve_agent');
    writeSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Span statuses
// ═══════════════════════════════════════════════════════════════════════════

describe('Trace span statuses', () => {
  it('records "completed" status for a successful state read', async () => {
    await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    const traces = readTraces();
    expect(traces[0].status).toBe('completed');
  });

  it('records "started" status via the traces API POST endpoint', async () => {
    const res = await tracesPost(mockNextRequest('http://localhost:3000/api/agentic-console/traces', {
      method: 'POST',
      body: { agent_id: '01_ideation_agent', operation: 'custom_op', metadata: { key: 'val' } },
    }));
    expect(res.status).toBe(200);
    const traces = readTraces();
    expect(traces.length).toBe(1);
    expect(traces[0].status).toBe('started');
    expect(traces[0].operation).toBe('custom_op');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Metadata inclusion
// ═══════════════════════════════════════════════════════════════════════════

describe('Trace span metadata', () => {
  it('includes action metadata when calling approve route with action parameter', async () => {
    const res = await approvePost(mockNextRequest('http://localhost:3000/api/agentic-console/approve', {
      method: 'POST',
      body: { agentId: '01_ideation_agent', action: 'approve' },
    }));
    expect(res.status).toBe(200);
    const traces = readTraces();
    expect(traces.length).toBe(1);
    expect(traces[0].metadata).toBeDefined();
    expect(traces[0].metadata.action).toBe('approve');
  });

  it('includes custom metadata from traces POST endpoint', async () => {
    const meta = { source: 'test', priority: 1, tags: ['regression', 'smoke'] };
    const res = await tracesPost(mockNextRequest('http://localhost:3000/api/agentic-console/traces', {
      method: 'POST',
      body: { agent_id: '02_requirement_agent', operation: 'validate', metadata: meta },
    }));
    expect(res.status).toBe(200);
    const traces = readTraces();
    expect(traces[0].metadata).toEqual(meta);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Agent ID inclusion
// ═══════════════════════════════════════════════════════════════════════════

describe('Trace span agent_id', () => {
  it('includes the agent_id when approve route is called for a specific agent', async () => {
    const res = await approvePost(mockNextRequest('http://localhost:3000/api/agentic-console/approve', {
      method: 'POST',
      body: { agentId: '01_ideation_agent', action: 'approve' },
    }));
    expect(res.status).toBe(200);
    const traces = readTraces();
    expect(traces[0].agent_id).toBeTruthy();
    expect(traces[0].agent_id).toContain('01_ideation_agent');
  });

  it('includes the agent_id when creating a trace via traces POST', async () => {
    const res = await tracesPost(mockNextRequest('http://localhost:3000/api/agentic-console/traces', {
      method: 'POST',
      body: { agent_id: '05_program_mgmt_agent', operation: 'sprint_plan' },
    }));
    expect(res.status).toBe(200);
    const traces = readTraces();
    expect(traces[0].agent_id).toBe('05_program_mgmt_agent');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Large content handling
// ═══════════════════════════════════════════════════════════════════════════

describe('Large content handling', () => {
  it('handles spans with large metadata payloads without truncation', async () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => `item_${i}`);
    const largeMeta = { data: largeArray, description: 'x'.repeat(5000) };
    const res = await tracesPost(mockNextRequest('http://localhost:3000/api/agentic-console/traces', {
      method: 'POST',
      body: { agent_id: 'test_agent', operation: 'large_payload', metadata: largeMeta },
    }));
    expect(res.status).toBe(200);
    const traces = readTraces();
    expect(traces[0].metadata.data.length).toBe(1000);
    expect(traces[0].metadata.data[0]).toBe('item_0');
    expect(traces[0].metadata.data[999]).toBe('item_999');
    expect(traces[0].metadata.description.length).toBe(5000);
    // Verify the traces entry is a single well-formed JSON line
    const raw = mem.get(PATHS.TRACES)!;
    const lines = raw.trim().split('\n');
    expect(lines.length).toBe(1);
    expect(() => JSON.parse(lines[0])).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Concurrent appends
// ═══════════════════════════════════════════════════════════════════════════

describe('Concurrent trace appends', () => {
  it('correctly appends all traces when multiple state reads happen concurrently', async () => {
    const count = 5;
    const requests = Array.from({ length: count }, () =>
      stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'))
    );
    const results = await Promise.all(requests);
    results.forEach(r => expect(r.status).toBe(200));
    const traces = readTraces();
    expect(traces.length).toBe(count);
    // All spans should have unique span_ids (counter increments per mock)
    const spanIds = traces.map((t: any) => t.span_id);
    expect(new Set(spanIds).size).toBe(count);
    // All should reference the same trace_id
    traces.forEach((t: any) => {
      expect(t.trace_id).toBe('test-session-trace-abc123');
      expect(t.operation).toBe('state_read');
    });
  });
});
