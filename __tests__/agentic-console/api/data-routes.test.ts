// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('fs', () => import('./mock-fs'));

import path from 'path';
import { mockNextRequest, setInMemoryFile, resetInMemoryFiles } from '../api-test-utils';
import { createMockStateMatrix } from '../test-utils';

const execMock = vi.hoisted(() => vi.fn(() => '[]'));
vi.mock('child_process', () => ({ execSync: execMock }));

import { GET as healthGet } from '@/app/api/agentic-console/health/route';
import { GET as slaGet } from '@/app/api/agentic-console/sla/route';
import { GET as logsGet } from '@/app/api/agentic-console/logs/route';
import { GET as codeReviewsGet } from '@/app/api/agentic-console/code-reviews/route';
import { GET as evalRulesGet } from '@/app/api/agentic-console/eval-rules/route';
import { GET as runEventsGet } from '@/app/api/agentic-console/run-events/route';
import { GET as tracesGet, POST as tracesPost } from '@/app/api/agentic-console/traces/route';

const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

function primeState() {
  const s = createMockStateMatrix();
  s.agent_states['01_ideation_agent'] = {
    agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async_pool', status: 'approved',
    dependencies: [], requires_human_approval: true, approved: true,
    role: 'Market Researcher', last_artifact_emitted: '', artifacts_emitted: [],
    last_activity_timestamp: new Date().toISOString(), execution_count: 2, compliance_checklist: [],
  };
  s.agent_states['02_requirement_agent'] = {
    agent_id: '02_requirement_agent', phase: 'phase_one', pool: 'async_pool', status: 'failed',
    dependencies: [], requires_human_approval: true, approved: false,
    role: 'PM', last_artifact_emitted: '', artifacts_emitted: [],
    last_activity_timestamp: new Date().toISOString(), execution_count: 1, compliance_checklist: [],
    last_error: 'Failed to parse PRD',
  };
  setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(s));
}

beforeEach(() => { resetInMemoryFiles(); });
afterEach(() => { resetInMemoryFiles(); });

// ── Health ─────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/health', () => {
  it('returns health metrics', async () => {
    primeState();
    const body = await (await healthGet(mockNextRequest('http://localhost/api/agentic-console/health'))).json();
    expect(body.metrics).toBeDefined();
    expect(body.aggregate).toBeDefined();
    expect(body.aggregate.total_agents).toBe(2);
    expect(body.aggregate.failed_agents).toBe(1);
  });

  it('returns 404 when state file missing', async () => {
    const res = await healthGet(mockNextRequest('http://localhost/api/agentic-console/health'));
    expect(res.status).toBe(404);
  });

  it('returns 500 on corrupt state file', async () => {
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), '{ invalid }');
    const res = await healthGet(mockNextRequest('http://localhost/api/agentic-console/health'));
    expect(res.status).toBe(500);
  });

  it('reads project-scoped state', async () => {
    primeState();
    const ps = createMockStateMatrix();
    ps.agent_states['03_architect_agent'] = { agent_id: '03_architect_agent', phase: 'phase_one', status: 'in_progress', dependencies: [], role: 'Architect', last_artifact_emitted: '', artifacts_emitted: [], last_activity_timestamp: new Date().toISOString(), execution_count: 1, compliance_checklist: [] };
    setInMemoryFile(P('00_state_ledger/projects/petemart/STATE_MATRIX.json'), JSON.stringify(ps));
    const body = await (await healthGet(mockNextRequest('http://localhost/api/agentic-console/health?project=petemart'))).json();
    expect(body.metrics['03_architect_agent']).toBeDefined();
  });

  it('sets Cache-Control no-cache header', async () => {
    primeState();
    const res = await healthGet(mockNextRequest('http://localhost/api/agentic-console/health'));
    expect(res.headers.get('Cache-Control')).toContain('no-cache');
  });
});

// ── SLA ────────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/sla', () => {
  it('returns SLA data', async () => {
    primeState();
    const body = await (await slaGet(mockNextRequest('http://localhost/api/agentic-console/sla'))).json();
    expect(body.sla).toBeDefined();
    expect(body.aggregate).toBeDefined();
    expect(body.aggregate.total_agents).toBe(2);
  });

  it('returns 404 when state file missing', async () => {
    const res = await slaGet(mockNextRequest('http://localhost/api/agentic-console/sla'));
    expect(res.status).toBe(404);
  });

  it('returns 500 on corrupt state', async () => {
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), 'corrupt');
    const res = await slaGet(mockNextRequest('http://localhost/api/agentic-console/sla'));
    expect(res.status).toBe(500);
  });

  it('reports overdue agents based on events', async () => {
    primeState();
    setInMemoryFile(P('00_state_ledger/PIPELINE_EVENTS.jsonl'), JSON.stringify({ agent_id: '01_ideation_agent', type: 'agent_state_change', from: 'in_progress', to: 'completed', timestamp: new Date(Date.now() - 200000).toISOString() }) + '\n');
    const body = await (await slaGet(mockNextRequest('http://localhost/api/agentic-console/sla'))).json();
    expect(body.sla['01_ideation_agent'].expected_duration_ms).toBeGreaterThan(0);
  });
});

// ── Logs ───────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/logs', () => {
  it('returns events source', async () => {
    setInMemoryFile(P('00_state_ledger/PIPELINE_EVENTS.jsonl'), JSON.stringify({ type: 'test', agent_id: 'a1', timestamp: new Date().toISOString() }) + '\n');
    const body = await (await logsGet(mockNextRequest('http://localhost/api/agentic-console/logs?source=events'))).json();
    expect(body.source).toBe('events');
    expect(body.logs).toHaveLength(1);
  });

  it('returns traces source', async () => {
    setInMemoryFile(P('00_state_ledger/traces.jsonl'), JSON.stringify({ trace_id: 't1', agent_id: 'a1', operation: 'test', started_at: new Date().toISOString() }) + '\n');
    const body = await (await logsGet(mockNextRequest('http://localhost/api/agentic-console/logs?source=traces'))).json();
    expect(body.source).toBe('traces');
    expect(body.logs).toHaveLength(1);
  });

  it('returns token_usage source', async () => {
    setInMemoryFile(P('agent_token_usage_log.csv'), 'session_id,agent,model\ns1,a1,test\n');
    const body = await (await logsGet(mockNextRequest('http://localhost/api/agentic-console/logs?source=token_usage'))).json();
    expect(body.source).toBe('token_usage');
    expect(body.header).toContain('session_id');
  });

  it('returns agent_run source', async () => {
    setInMemoryFile(P('00_state_ledger/AGENT_RUN_a1.log'), 'line1\nline2\n');
    const body = await (await logsGet(mockNextRequest('http://localhost/api/agentic-console/logs?source=agent_run&agentId=a1'))).json();
    expect(body.source).toBe('agent_run');
    expect(body.logs).toHaveLength(2);
  });

  it('returns all source', async () => {
    primeState();
    setInMemoryFile(P('00_state_ledger/PIPELINE_EVENTS.jsonl'), JSON.stringify({ type: 'ev', agent_id: 'a1', timestamp: new Date().toISOString() }) + '\n');
    setInMemoryFile(P('00_state_ledger/traces.jsonl'), JSON.stringify({ trace_id: 't1' }) + '\n');
    const body = await (await logsGet(mockNextRequest('http://localhost/api/agentic-console/logs?source=all'))).json();
    expect(body.source).toBe('all');
    expect(body.events).toBeDefined();
    expect(body.agent_states).toBeDefined();
  });

  it('returns 400 for unknown source', async () => {
    const res = await logsGet(mockNextRequest('http://localhost/api/agentic-console/logs?source=bogus'));
    expect(res.status).toBe(400);
  });
});

// ── Code Reviews ───────────────────────────────────────────────────────────
describe('GET /api/agentic-console/code-reviews', () => {
  it('returns 400 when pr_number missing', async () => {
    const res = await codeReviewsGet(mockNextRequest('http://localhost/api/agentic-console/code-reviews'));
    expect(res.status).toBe(400);
  });

  it('falls back on gh failure', async () => {
    execMock.mockImplementation(() => { throw new Error('gh not available'); });
    const res = await codeReviewsGet(mockNextRequest('http://localhost/api/agentic-console/code-reviews?pr_number=1'));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.source).toBe('fallback');
  });
});

// ── Eval Rules ─────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/eval-rules', () => {
  it('returns all eval rules', async () => {
    const rules = { version: '1.0', description: 'Eval rules', rules: { '01_ideation_agent': [{ id: 'r1', name: 'Check output', weight: 10 }] } };
    setInMemoryFile(P('00_state_ledger/EVAL_RULES.json'), JSON.stringify(rules));
    const body = await (await evalRulesGet(mockNextRequest('http://localhost/api/agentic-console/eval-rules'))).json();
    expect(body.totalRules).toBe(1);
    expect(body.agents['01_ideation_agent'].totalWeight).toBe(10);
  });

  it('filters by agentId', async () => {
    const rules = { version: '1.0', description: '', rules: { 'a1': [{ id: 'r1', weight: 5 }], 'a2': [{ id: 'r2', weight: 3 }] } };
    setInMemoryFile(P('00_state_ledger/EVAL_RULES.json'), JSON.stringify(rules));
    const body = await (await evalRulesGet(mockNextRequest('http://localhost/api/agentic-console/eval-rules?agentId=a1'))).json();
    expect(body.agentId).toBe('a1');
    expect(body.ruleCount).toBe(1);
  });

  it('returns 404 when file missing', async () => {
    const res = await evalRulesGet(mockNextRequest('http://localhost/api/agentic-console/eval-rules'));
    expect(res.status).toBe(404);
  });
});

// ── Run Events ─────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/run-events', () => {
  it('returns runs for agent', async () => {
    setInMemoryFile(P('00_state_ledger/PIPELINE_EVENTS.jsonl'), JSON.stringify({ agent_id: 'a1', type: 'agent_state_change', from: 'pending', to: 'in_progress', timestamp: new Date(Date.now() - 10000).toISOString() }) + '\n' + JSON.stringify({ agent_id: 'a1', type: 'agent_state_change', from: 'in_progress', to: 'completed', timestamp: new Date().toISOString() }) + '\n');
    const body = await (await runEventsGet(mockNextRequest('http://localhost/api/agentic-console/run-events?agentId=a1'))).json();
    expect(body.runs.length).toBeGreaterThanOrEqual(1);
    expect(body.runs[0].final_status).toBe('completed');
  });

  it('returns 400 when agentId missing', async () => {
    const res = await runEventsGet(mockNextRequest('http://localhost/api/agentic-console/run-events'));
    expect(res.status).toBe(400);
  });

  it('returns empty runs when file missing', async () => {
    const body = await (await runEventsGet(mockNextRequest('http://localhost/api/agentic-console/run-events?agentId=a1'))).json();
    expect(body.runs).toEqual([]);
  });
});

// ── Traces ─────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/traces', () => {
  it('returns traces', async () => {
    setInMemoryFile(P('00_state_ledger/traces.jsonl'), JSON.stringify({ trace_id: 't1', agent_id: 'a1', operation: 'run', started_at: new Date().toISOString() }) + '\n');
    const body = await (await tracesGet(mockNextRequest('http://localhost/api/agentic-console/traces'))).json();
    expect(body.traces).toHaveLength(1);
  });

  it('filters by agentId', async () => {
    setInMemoryFile(P('00_state_ledger/traces.jsonl'), JSON.stringify({ trace_id: 't1', agent_id: 'a1', operation: 'run', started_at: new Date().toISOString() }) + '\n' + JSON.stringify({ trace_id: 't2', agent_id: 'a2', operation: 'run', started_at: new Date().toISOString() }) + '\n');
    const body = await (await tracesGet(mockNextRequest('http://localhost/api/agentic-console/traces?agentId=a2'))).json();
    expect(body.traces).toHaveLength(1);
    expect(body.traces[0].agent_id).toBe('a2');
  });

  it('returns empty when file missing', async () => {
    const body = await (await tracesGet(mockNextRequest('http://localhost/api/agentic-console/traces'))).json();
    expect(body.traces).toEqual([]);
  });
});

describe('POST /api/agentic-console/traces', () => {
  it('creates a trace span', async () => {
    const res = await tracesPost(mockNextRequest('http://localhost/api/agentic-console/traces', { method: 'POST', body: { agent_id: 'a1', operation: 'test_op', metadata: { key: 'val' } } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
    expect(b.trace.agent_id).toBe('a1');
    expect(b.trace.operation).toBe('test_op');
  });

  it('returns 400 when agent_id or operation missing', async () => {
    const res1 = await tracesPost(mockNextRequest('http://localhost/api/agentic-console/traces', { method: 'POST', body: { operation: 'op' } }));
    expect(res1.status).toBe(400);
    const res2 = await tracesPost(mockNextRequest('http://localhost/api/agentic-console/traces', { method: 'POST', body: { agent_id: 'a1' } }));
    expect(res2.status).toBe(400);
  });
});
