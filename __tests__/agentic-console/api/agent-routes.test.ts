// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('fs', () => import('./mock-fs'));

import path from 'path';
import { mockNextRequest, setInMemoryFile, resetInMemoryFiles } from '../api-test-utils';
import { createMockStateMatrix } from '../test-utils';

const execMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({ execSync: execMock }));

import { GET as agentsGet, POST as agentsPost } from '@/app/api/agentic-console/agents/route';
import { GET as memoryGet, POST as memoryPost } from '@/app/api/agentic-console/agent-memory/route';
import { GET as messagesGet, POST as messagesPost } from '@/app/api/agentic-console/agent-messages/route';
import { GET as versionGet, POST as versionPost } from '@/app/api/agentic-console/agent-version/route';

const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

beforeEach(() => {
  resetInMemoryFiles();
  execMock.mockReset();
});

afterEach(() => { resetInMemoryFiles(); });

function primeState() {
  const state = createMockStateMatrix();
  state.agent_states['01_ideation_agent'] = {
    agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async_pool', status: 'approved',
    dependencies: [], requires_human_approval: true, approved: true,
    role: 'Market Researcher', last_artifact_emitted: '', artifacts_emitted: ['file.md'],
    last_activity_timestamp: new Date().toISOString(), execution_count: 2, compliance_checklist: [],
  };
  state.agent_states['02_requirement_agent'] = {
    agent_id: '02_requirement_agent', phase: 'phase_one', pool: 'async_pool', status: 'pending',
    dependencies: ['01_ideation_agent'], requires_human_approval: true, approved: false,
    role: 'Product Manager', last_artifact_emitted: '', artifacts_emitted: [],
    last_activity_timestamp: new Date().toISOString(), execution_count: 0, compliance_checklist: [],
  };
  setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(state));
}

// ── Agents ─────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/agents', () => {
  it('returns templates list', async () => {
    const templates = { templates: [{ id: 'gen_ai', name: 'GenAI Agent', phase: 'custom' }] };
    setInMemoryFile(P('00_state_ledger/AGENT_TEMPLATES.json'), JSON.stringify(templates));
    const body = await (await agentsGet()).json();
    expect(body.templates).toHaveLength(1);
    expect(body.templates[0].id).toBe('gen_ai');
  });

  it('returns empty templates when file missing', async () => {
    const body = await (await agentsGet()).json();
    expect(body.templates).toEqual([]);
  });
});

describe('POST /api/agentic-console/agents', () => {
  it('creates a custom agent from template', async () => {
    primeState();
    const templates = { templates: [{ id: 'gen_ai', name: 'GenAI Agent', phase: 'custom', pool: 'async_pool', default_role: 'AI Engineer', default_guardrails: { code_quality: true }, requires_human_approval: true }] };
    setInMemoryFile(P('00_state_ledger/AGENT_TEMPLATES.json'), JSON.stringify(templates));
    const res = await agentsPost(mockNextRequest('http://localhost/api/agentic-console/agents', { method: 'POST', body: { template_id: 'gen_ai', agent_name: 'My Agent' } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.agent_id).toContain('custom');
    expect(body.agent.role).toBe('AI Engineer');
  });

  it('returns 400 when template_id missing', async () => {
    const res = await agentsPost(mockNextRequest('http://localhost/api/agentic-console/agents', { method: 'POST', body: {} }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('template_id');
  });

  it('returns 404 for unknown template', async () => {
    primeState();
    setInMemoryFile(P('00_state_ledger/AGENT_TEMPLATES.json'), JSON.stringify({ templates: [] }));
    const res = await agentsPost(mockNextRequest('http://localhost/api/agentic-console/agents', { method: 'POST', body: { template_id: 'nonexistent' } }));
    expect(res.status).toBe(404);
  });

  it('returns 500 when STATE_MATRIX missing', async () => {
    setInMemoryFile(P('00_state_ledger/AGENT_TEMPLATES.json'), JSON.stringify({ templates: [{ id: 'gen_ai', name: 'GenAI Agent' }] }));
    const res = await agentsPost(mockNextRequest('http://localhost/api/agentic-console/agents', { method: 'POST', body: { template_id: 'gen_ai' } }));
    expect(res.status).toBe(500);
  });
});

// ── Agent Memory ───────────────────────────────────────────────────────────
describe('GET /api/agentic-console/agent-memory', () => {
  it('returns memory entries for agent', async () => {
    setInMemoryFile(P('00_state_ledger/memory_store/01_ideation_agent.jsonl'), JSON.stringify({ id: 'mem-1', agent_id: '01_ideation_agent', content: 'test', source: 'human', timestamp: new Date().toISOString() }) + '\n');
    const body = await (await memoryGet(mockNextRequest('http://localhost/api/agentic-console/agent-memory?agentId=01_ideation_agent'))).json();
    expect(body.total).toBe(1);
    expect(body.entries[0].content).toBe('test');
  });

  it('returns empty when agentId missing', async () => {
    const body = await (await memoryGet(mockNextRequest('http://localhost/api/agentic-console/agent-memory'))).json();
    expect(body.entries).toEqual([]);
  });

  it('returns empty when file missing', async () => {
    const body = await (await memoryGet(mockNextRequest('http://localhost/api/agentic-console/agent-memory?agentId=unknown'))).json();
    expect(body.total).toBe(0);
  });

  it('handles corrupt JSON lines gracefully', async () => {
    setInMemoryFile(P('00_state_ledger/memory_store/01_ideation_agent.jsonl'), '"valid"\n{ invalid\nblah\n');
    const body = await (await memoryGet(mockNextRequest('http://localhost/api/agentic-console/agent-memory?agentId=01_ideation_agent'))).json();
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0]).toBe('valid');
  });
});

describe('POST /api/agentic-console/agent-memory', () => {
  it('creates memory entry', async () => {
    const res = await memoryPost(mockNextRequest('http://localhost/api/agentic-console/agent-memory', { method: 'POST', body: { agentId: '01_ideation_agent', content: 'Remember this' } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.entry.agent_id).toBe('01_ideation_agent');
    expect(body.entry.content).toBe('Remember this');
  });

  it('returns 400 when agentId missing', async () => {
    const res = await memoryPost(mockNextRequest('http://localhost/api/agentic-console/agent-memory', { method: 'POST', body: { content: 'test' } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('agentId');
  });

  it('returns 400 when content missing', async () => {
    const res = await memoryPost(mockNextRequest('http://localhost/api/agentic-console/agent-memory', { method: 'POST', body: { agentId: '01_ideation_agent' } }));
    expect(res.status).toBe(400);
  });
});

// ── Agent Messages ─────────────────────────────────────────────────────────
describe('GET /api/agentic-console/agent-messages', () => {
  it('returns messages list', async () => {
    const msg = { type: 'message', message_id: 'msg-1', from_agent: '01_ideation_agent', to_agent: '02_requirement_agent', subject: 'Data ready', body: 'Here', timestamp: new Date().toISOString(), status: 'sent', read_at: null };
    setInMemoryFile(P('00_state_ledger/AGENT_MESSAGES.jsonl'), JSON.stringify(msg) + '\n');
    const body = await (await messagesGet(mockNextRequest('http://localhost/api/agentic-console/agent-messages'))).json();
    expect(body.total).toBe(1);
    expect(body.messages[0].subject).toBe('Data ready');
  });

  it('filters by agentId and type=incoming', async () => {
    const msgs = [
      { message_id: 'm1', from_agent: 'a1', to_agent: 'a2', subject: 's1', timestamp: '2026-01-01T00:00:00Z', status: 'sent', read_at: null },
      { message_id: 'm2', from_agent: 'a2', to_agent: 'a1', subject: 's2', timestamp: '2026-01-02T00:00:00Z', status: 'sent', read_at: null },
    ];
    setInMemoryFile(P('00_state_ledger/AGENT_MESSAGES.jsonl'), msgs.map(m => JSON.stringify(m)).join('\n') + '\n');
    const body = await (await messagesGet(mockNextRequest('http://localhost/api/agentic-console/agent-messages?agentId=a1&type=incoming'))).json();
    expect(body.total).toBe(1);
    expect(body.messages[0].from_agent).toBe('a2');
  });

  it('returns empty when file missing', async () => {
    const body = await (await messagesGet(mockNextRequest('http://localhost/api/agentic-console/agent-messages'))).json();
    expect(body.messages).toEqual([]);
  });
});

describe('POST /api/agentic-console/agent-messages', () => {
  it('sends a message', async () => {
    const res = await messagesPost(mockNextRequest('http://localhost/api/agentic-console/agent-messages', { method: 'POST', body: { from_agent: 'a1', to_agent: 'a2', subject: 'Hello', body: 'World' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
    expect(b.message.message_id).toContain('msg-');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await messagesPost(mockNextRequest('http://localhost/api/agentic-console/agent-messages', { method: 'POST', body: { from_agent: 'a1' } }));
    expect(res.status).toBe(400);
  });

  it('validates A2A type fields when a2a_type provided', async () => {
    const a2aTypes = { types: [{ id: 'DebateOpen', fields: { topic: { required: true } } }] };
    setInMemoryFile(P('00_state_ledger/A2A_TYPES.json'), JSON.stringify(a2aTypes));
    const res = await messagesPost(mockNextRequest('http://localhost/api/agentic-console/agent-messages', { method: 'POST', body: { from_agent: 'a1', to_agent: 'a2', subject: 'Debate', a2a_type: 'DebateOpen', a2a_payload: {} } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('topic');
  });
});

// ── Agent Version ──────────────────────────────────────────────────────────
describe('GET /api/agentic-console/agent-version', () => {
  it('returns version info for agent', async () => {
    primeState();
    const body = await (await versionGet(mockNextRequest('http://localhost/api/agentic-console/agent-version?agentId=01_ideation_agent'))).json();
    expect(body.agentId).toBe('01_ideation_agent');
    expect(body.output_version).toBeDefined();
  });

  it('returns 400 when agentId missing', async () => {
    const res = await versionGet(mockNextRequest('http://localhost/api/agentic-console/agent-version'));
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown agent', async () => {
    primeState();
    const res = await versionGet(mockNextRequest('http://localhost/api/agentic-console/agent-version?agentId=nonexistent'));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/agentic-console/agent-version', () => {
  it('updates agent version', async () => {
    primeState();
    const res = await versionPost(mockNextRequest('http://localhost/api/agentic-console/agent-version', { method: 'POST', body: { agentId: '01_ideation_agent', output_version: 2, compatibility: 'backward-compatible' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
    expect(b.output_version).toBe(2);
  });

  it('returns 400 when agentId missing', async () => {
    const res = await versionPost(mockNextRequest('http://localhost/api/agentic-console/agent-version', { method: 'POST', body: {} }));
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown agent', async () => {
    primeState();
    const res = await versionPost(mockNextRequest('http://localhost/api/agentic-console/agent-version', { method: 'POST', body: { agentId: 'nonexistent' } }));
    expect(res.status).toBe(404);
  });

  it('cascades downstream on breaking change', async () => {
    const state = createMockStateMatrix();
    state.agent_states['01_ideation_agent'] = { agent_id: '01_ideation_agent', phase: 'phase_one', status: 'approved', dependencies: [], role: 'Market Researcher', last_artifact_emitted: '', artifacts_emitted: [], last_activity_timestamp: new Date().toISOString(), execution_count: 1, compliance_checklist: [] };
    state.agent_states['02_requirement_agent'] = { agent_id: '02_requirement_agent', phase: 'phase_one', status: 'approved', dependencies: ['01_ideation_agent'], role: 'PM', last_artifact_emitted: '', artifacts_emitted: [], last_activity_timestamp: new Date().toISOString(), execution_count: 1, compliance_checklist: [] };
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(state));
    const res = await versionPost(mockNextRequest('http://localhost/api/agentic-console/agent-version', { method: 'POST', body: { agentId: '01_ideation_agent', compatibility: 'breaking' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.cascade.length).toBeGreaterThanOrEqual(1);
    expect(b.cascade[0].agentId).toBe('02_requirement_agent');
  });

  it('increments version when not specified', async () => {
    primeState();
    const res = await versionPost(mockNextRequest('http://localhost/api/agentic-console/agent-version', { method: 'POST', body: { agentId: '01_ideation_agent' } }));
    const b = await res.json();
    expect(b.output_version).toBe(1);
  });
});
