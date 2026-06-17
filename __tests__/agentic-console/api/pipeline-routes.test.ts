// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('fs', () => import('./mock-fs'));

import path from 'path';
import { mockNextRequest, setInMemoryFile, getInMemoryFile, resetInMemoryFiles } from '../api-test-utils';
import { createMockStateMatrix } from '../test-utils';

vi.mock('child_process', () => ({ spawn: vi.fn(() => ({ unref: vi.fn(), on: vi.fn() })), execSync: vi.fn() }));

import { POST as approvePost } from '@/app/api/agentic-console/approve/route';
import { POST as pipelinePost } from '@/app/api/agentic-console/pipeline/route';
import { GET as monitorGet } from '@/app/api/agentic-console/monitor/route';
import { GET as dagGet } from '@/app/api/agentic-console/dag/route';
import { GET as consensusGet, POST as consensusPost } from '@/app/api/agentic-console/consensus/route';
import { GET as escalationGet, POST as escalationPost } from '@/app/api/agentic-console/escalation/route';
import { GET as subtasksGet, POST as subtasksPost } from '@/app/api/agentic-console/subtasks/route';

const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

function primeState(overrides?: Record<string, any>) {
  const s = createMockStateMatrix(overrides);
  s.agent_states['01_ideation_agent'] = {
    agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async_pool', status: 'awaiting_approval',
    dependencies: [], requires_human_approval: true, approved: false,
    role: 'Market Researcher', last_artifact_emitted: '', artifacts_emitted: ['file.md'],
    last_activity_timestamp: new Date().toISOString(), execution_count: 1, compliance_checklist: [],
    expert_reviewer: { role_title: 'Reviewer', review_status: 'pending', sign_off_required: true, sign_off_granted: false },
  };
  s.agent_states['02_requirement_agent'] = {
    agent_id: '02_requirement_agent', phase: 'phase_one', pool: 'async_pool', status: 'pending',
    dependencies: ['01_ideation_agent'], requires_human_approval: true, approved: false,
    role: 'PM', last_artifact_emitted: '', artifacts_emitted: [],
    last_activity_timestamp: new Date().toISOString(), execution_count: 0, compliance_checklist: [],
  };
  setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(s));
}

beforeEach(() => { resetInMemoryFiles(); });
afterEach(() => { resetInMemoryFiles(); });

// ── Approve ────────────────────────────────────────────────────────────────
describe('POST /api/agentic-console/approve', () => {
  it('approves an agent', async () => {
    primeState();
    const res = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: '01_ideation_agent', action: 'approve' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
    expect(b.newStatus).toBe('pending');
  });

  it('rejects an agent', async () => {
    primeState();
    const res = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: '01_ideation_agent', action: 'reject', feedback: 'Needs more data' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
  });

  it('approves an approval gate', async () => {
    primeState();
    const res = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: 'GATE-TECH-STACK-01', action: 'open_gate' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
  });

  it('returns 400 on missing agentId or action', async () => {
    const res1 = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { action: 'approve' } }));
    expect(res1.status).toBe(400);
    const res2 = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: 'a1' } }));
    expect(res2.status).toBe(400);
  });

  it('returns 404 on unknown agent', async () => {
    primeState();
    const res = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: 'nonexistent', action: 'approve' } }));
    expect(res.status).toBe(404);
  });

  it('returns 404 on unknown gate', async () => {
    primeState();
    const res = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: 'GATE-FAKE-01', action: 'open_gate' } }));
    expect(res.status).toBe(404);
  });

  it('returns 400 on unknown action', async () => {
    primeState();
    const res = await approvePost(mockNextRequest('http://localhost/api/agentic-console/approve', { method: 'POST', body: { agentId: '01_ideation_agent', action: 'fly' } }));
    expect(res.status).toBe(400);
  });
});

// ── Pipeline ───────────────────────────────────────────────────────────────
describe('POST /api/agentic-console/pipeline', () => {
  it('pauses the pipeline', async () => {
    primeState();
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'pause' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).paused).toBe(true);
  });

  it('resumes the pipeline', async () => {
    primeState();
    await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'pause' } }));
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'resume' } }));
    expect((await res.json()).paused).toBe(false);
  });

  it('returns 400 on unknown action', async () => {
    primeState();
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'bogus' } }));
    expect(res.status).toBe(400);
  });

  it('sets supervisor prompt', async () => {
    primeState();
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'set_supervisor_prompt', prompt: 'Run faster' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 400 on rerun_agent without agentId', async () => {
    primeState();
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'rerun_agent' } }));
    expect(res.status).toBe(400);
  });

  it('returns 404 on rerun_agent for unknown agent', async () => {
    primeState();
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'rerun_agent', agentId: 'ghost' } }));
    expect(res.status).toBe(404);
  });

  it('returns 409 on rerun_agent already running', async () => {
    primeState();
    const state = JSON.parse(getInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'))!);
    state.agent_states['01_ideation_agent'].status = 'in_progress';
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(state));
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'rerun_agent', agentId: '01_ideation_agent' } }));
    expect(res.status).toBe(409);
  });

  it('resets circuit breaker', async () => {
    primeState();
    const res = await pipelinePost(mockNextRequest('http://localhost/api/agentic-console/pipeline', { method: 'POST', body: { action: 'reset_circuit_breaker' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).circuit_breaker_reset).toBe(true);
  });
});

// ── Monitor ────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/monitor', () => {
  it('returns monitor status', async () => {
    primeState();
    const body = await (await monitorGet(mockNextRequest('http://localhost/api/agentic-console/monitor?action=status'))).json();
    expect(body.supervisor).toBeDefined();
    expect(body.stuck_monitor).toBeDefined();
    expect(body.pipeline).toBeDefined();
  });

  it('returns stuck agents list', async () => {
    primeState();
    const state = JSON.parse(getInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'))!);
    state.agent_states['03_architect_agent'] = {
      agent_id: '03_architect_agent', phase: 'phase_one', status: 'in_progress',
      started_at: new Date(Date.now() - 99999999).toISOString(), timeout_threshold_ms: 1000,
      dependencies: [], role: 'Architect', last_artifact_emitted: '', artifacts_emitted: [],
      last_activity_timestamp: new Date().toISOString(), execution_count: 1, compliance_checklist: [],
    };
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(state));
    const body = await (await monitorGet(mockNextRequest('http://localhost/api/agentic-console/monitor?action=status'))).json();
    expect(body.stuck_monitor.stuck_agents.length).toBeGreaterThanOrEqual(1);
  });

  it('relaunches an agent', async () => {
    primeState();
    const state = JSON.parse(getInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'))!);
    state.agent_states['01_ideation_agent'].status = 'failed';
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(state));
    const body = await (await monitorGet(mockNextRequest('http://localhost/api/agentic-console/monitor?action=relaunch&agent_id=01_ideation_agent'))).json();
    expect(body.success).toBe(true);
    expect(body.new_status).toBe('pending');
  });

  it('returns 400 on unknown action', async () => {
    const res = await monitorGet(mockNextRequest('http://localhost/api/agentic-console/monitor?action=bogus'));
    expect(res.status).toBe(400);
  });

  it('returns DLQ entries', async () => {
    primeState();
    const body = await (await monitorGet(mockNextRequest('http://localhost/api/agentic-console/monitor?action=dlq'))).json();
    expect(body.dlq).toBeDefined();
  });
});

// ── DAG ────────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/dag', () => {
  it('returns full DAG', async () => {
    const dag = { version: '1.0', description: 'Test DAG', nodes: { a: { phase: 'phase_one', next_on_success: ['b'], forks: [] }, b: { phase: 'phase_one', next_on_success: [], forks: [] } }, edges: { validation: { entry_nodes: ['a'], terminal_nodes: ['b'], fork_points: [], conditional_points: [], acyclic: true } } };
    setInMemoryFile(P('00_state_ledger/WORKFLOW_DAG.json'), JSON.stringify(dag));
    const body = await (await dagGet(mockNextRequest('http://localhost/api/agentic-console/dag'))).json();
    expect(body.nodeCount).toBe(2);
    expect(body.walkOrder).toEqual(['a', 'b']);
  });

  it('filters by node', async () => {
    const dag = { version: '1.0', description: 'Test', nodes: { a: { phase: 'phase_one' }, b: { phase: 'phase_two' } }, edges: { validation: { entry_nodes: [], terminal_nodes: [], fork_points: [], conditional_points: [], acyclic: true } } };
    setInMemoryFile(P('00_state_ledger/WORKFLOW_DAG.json'), JSON.stringify(dag));
    const body = await (await dagGet(mockNextRequest('http://localhost/api/agentic-console/dag?node=a'))).json();
    expect(body.node).toBeDefined();
  });

  it('filters by phase', async () => {
    const dag = { version: '1.0', description: 'Test', nodes: { a: { phase: 'phase_one' }, b: { phase: 'phase_two' } }, edges: { validation: { entry_nodes: [], terminal_nodes: [], fork_points: [], conditional_points: [], acyclic: true } } };
    setInMemoryFile(P('00_state_ledger/WORKFLOW_DAG.json'), JSON.stringify(dag));
    const body = await (await dagGet(mockNextRequest('http://localhost/api/agentic-console/dag?phase=phase_one'))).json();
    expect(body.count).toBe(1);
  });

  it('returns 404 when DAG file missing', async () => {
    const res = await dagGet(mockNextRequest('http://localhost/api/agentic-console/dag'));
    expect(res.status).toBe(404);
  });
});

// ── Consensus ──────────────────────────────────────────────────────────────
describe('POST /api/agentic-console/consensus', () => {
  it('opens a debate', async () => {
    const res = await consensusPost(mockNextRequest('http://localhost/api/agentic-console/consensus', { method: 'POST', body: { action: 'open_debate', opener_agent: 'a1', responder_agent: 'a2', topic: 'Should we?', position: 'Yes', arguments: 'Because...' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 400 on missing open_debate fields', async () => {
    const res = await consensusPost(mockNextRequest('http://localhost/api/agentic-console/consensus', { method: 'POST', body: { action: 'open_debate', opener_agent: 'a1' } }));
    expect(res.status).toBe(400);
  });

  it('responds to a debate', async () => {
    setInMemoryFile(P('00_state_ledger/debates.jsonl'), JSON.stringify({ debate_id: 'debate-abc', status: 'open', opener_agent: 'a1', responder_agent: 'a2', topic: 'Test', position: 'Yes', arguments: 'Args', stake: '', requires_consensus: true, opened_at: new Date().toISOString(), responded_at: null, resolved_at: null, response: null, resolution: null }) + '\n');
    const res = await consensusPost(mockNextRequest('http://localhost/api/agentic-console/consensus', { method: 'POST', body: { action: 'respond_debate', debate_id: 'debate-abc', position: 'No', vote: 'REJECT' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.debate.status).toBe('escalated');
  });

  it('returns 404 on respond_debate unknown debate', async () => {
    const res = await consensusPost(mockNextRequest('http://localhost/api/agentic-console/consensus', { method: 'POST', body: { action: 'respond_debate', debate_id: 'nonexistent', position: 'No', vote: 'APPROVE' } }));
    expect(res.status).toBe(404);
  });

  it('resolves a debate', async () => {
    setInMemoryFile(P('00_state_ledger/debates.jsonl'), JSON.stringify({ debate_id: 'debate-xyz', status: 'responded', opener_agent: 'a1', responder_agent: 'a2', topic: 'T', position: 'Y', arguments: 'A', stake: '', requires_consensus: true, opened_at: new Date().toISOString(), responded_at: new Date().toISOString(), resolved_at: null, response: { position: 'N', counter_arguments: '', agreed_points: '', vote: 'APPROVE', vote_reason: '', suggested_compromise: '' }, resolution: null }) + '\n');
    const res = await consensusPost(mockNextRequest('http://localhost/api/agentic-console/consensus', { method: 'POST', body: { action: 'resolve_debate', debate_id: 'debate-xyz', outcome: 'CONSENSUS_REACHED', final_position: 'Y' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 400 on unknown action', async () => {
    const res = await consensusPost(mockNextRequest('http://localhost/api/agentic-console/consensus', { method: 'POST', body: { action: 'bogus' } }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/agentic-console/consensus', () => {
  it('lists debates', async () => {
    setInMemoryFile(P('00_state_ledger/debates.jsonl'), JSON.stringify({ debate_id: 'd1', status: 'open', opener_agent: 'a1', responder_agent: 'a2', topic: 'Test', position: 'Y', arguments: 'A', stake: '', requires_consensus: true, opened_at: new Date().toISOString(), responded_at: null, resolved_at: null, response: null, resolution: null }) + '\n');
    const body = await (await consensusGet(mockNextRequest('http://localhost/api/agentic-console/consensus'))).json();
    expect(body.count).toBe(1);
  });

  it('filters by agentId', async () => {
    setInMemoryFile(P('00_state_ledger/debates.jsonl'), JSON.stringify({ debate_id: 'd1', status: 'open', opener_agent: 'a1', responder_agent: 'a2', topic: 'Test', position: 'Y', arguments: 'A', stake: '', requires_consensus: true, opened_at: new Date().toISOString(), responded_at: null, resolved_at: null, response: null, resolution: null }) + '\n');
    const body = await (await consensusGet(mockNextRequest('http://localhost/api/agentic-console/consensus?agentId=other'))).json();
    expect(body.count).toBe(0);
  });
});

// ── Escalation ─────────────────────────────────────────────────────────────
describe('POST /api/agentic-console/escalation', () => {
  it('escalates an issue', async () => {
    const matrix = { severity_levels: [{ level: 'medium', paths: ['supervisor'] }], active_escalations: [], last_updated: '' };
    setInMemoryFile(P('00_state_ledger/escalation_matrix.json'), JSON.stringify(matrix));
    const res = await escalationPost(mockNextRequest('http://localhost/api/agentic-console/escalation', { method: 'POST', body: { action: 'escalate', severity: 'medium', reason: 'Help!' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).escalated).toBe(true);
  });

  it('resolves an escalation', async () => {
    const matrix = { severity_levels: [{ level: 'high', paths: ['supervisor'] }], active_escalations: [{ id: 'esc-1', severity: 'high', reason: 'Test', resolved_at: null }], last_updated: '' };
    setInMemoryFile(P('00_state_ledger/escalation_matrix.json'), JSON.stringify(matrix));
    const res = await escalationPost(mockNextRequest('http://localhost/api/agentic-console/escalation', { method: 'POST', body: { action: 'resolve', id: 'esc-1' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).resolved).toBe(true);
  });

  it('returns 400 on unknown action', async () => {
    setInMemoryFile(P('00_state_ledger/escalation_matrix.json'), JSON.stringify({ severity_levels: [], active_escalations: [], last_updated: '' }));
    const res = await escalationPost(mockNextRequest('http://localhost/api/agentic-console/escalation', { method: 'POST', body: { action: 'bogus' } }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/agentic-console/escalation', () => {
  it('returns escalation matrix', async () => {
    const matrix = { severity_levels: [{ level: 'critical' }], active_escalations: [], last_updated: '' };
    setInMemoryFile(P('00_state_ledger/escalation_matrix.json'), JSON.stringify(matrix));
    const body = await (await escalationGet()).json();
    expect(body.severity_levels).toHaveLength(1);
  });

  it('returns 500 when file missing', async () => {
    const res = await escalationGet();
    expect(res.status).toBe(500);
  });
});

// ── Subtasks ───────────────────────────────────────────────────────────────
describe('POST /api/agentic-console/subtasks', () => {
  it('spawns a subtask', async () => {
    const res = await subtasksPost(mockNextRequest('http://localhost/api/agentic-console/subtasks', { method: 'POST', body: { action: 'spawn', parent_agent_id: 'a1', child_agent_id: 'a2', task_description: 'Do the thing' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 400 on spawn missing fields', async () => {
    const res = await subtasksPost(mockNextRequest('http://localhost/api/agentic-console/subtasks', { method: 'POST', body: { action: 'spawn', parent_agent_id: 'a1' } }));
    expect(res.status).toBe(400);
  });

  it('completes a subtask', async () => {
    const id = 'subtask-test-1';
    setInMemoryFile(P('00_state_ledger/subtasks.jsonl'), JSON.stringify({ subtask_id: id, parent_agent_id: 'a1', child_agent_id: 'a2', task_description: 'Work', status: 'spawned', spawned_at: new Date().toISOString(), completed_at: null, result_summary: null, output_artifacts: [], error_details: null, duration_ms: null, depth: 0 }) + '\n');
    const res = await subtasksPost(mockNextRequest('http://localhost/api/agentic-console/subtasks', { method: 'POST', body: { action: 'complete', subtask_id: id, status: 'completed', result_summary: 'Done' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).subtask.status).toBe('completed');
  });

  it('returns 404 on complete unknown subtask', async () => {
    const res = await subtasksPost(mockNextRequest('http://localhost/api/agentic-console/subtasks', { method: 'POST', body: { action: 'complete', subtask_id: 'ghost', status: 'completed' } }));
    expect(res.status).toBe(404);
  });

  it('returns 400 on unknown action', async () => {
    const res = await subtasksPost(mockNextRequest('http://localhost/api/agentic-console/subtasks', { method: 'POST', body: { action: 'bogus' } }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/agentic-console/subtasks', () => {
  it('lists subtasks', async () => {
    setInMemoryFile(P('00_state_ledger/subtasks.jsonl'), JSON.stringify({ subtask_id: 's1', parent_agent_id: 'a1', child_agent_id: 'a2', task_description: 'Work', status: 'spawned', spawned_at: new Date().toISOString(), completed_at: null, result_summary: null, output_artifacts: [], error_details: null, duration_ms: null, depth: 0 }) + '\n');
    const body = await (await subtasksGet(mockNextRequest('http://localhost/api/agentic-console/subtasks'))).json();
    expect(body.count).toBe(1);
  });

  it('filters by parent_id with tree', async () => {
    setInMemoryFile(P('00_state_ledger/subtasks.jsonl'), JSON.stringify({ subtask_id: 's1', parent_agent_id: 'a1', child_agent_id: 'a2', task_description: 'Work', status: 'spawned', spawned_at: new Date().toISOString(), completed_at: null, result_summary: null, output_artifacts: [], error_details: null, duration_ms: null, depth: 0 }) + '\n');
    const body = await (await subtasksGet(mockNextRequest('http://localhost/api/agentic-console/subtasks?parent_id=a1&tree=true'))).json();
    expect(body.tree).toHaveLength(1);
    expect(body.parentAgentId).toBe('a1');
  });
});
