// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('fs', () => import('./mock-fs'));

import path from 'path';
import { mockNextRequest, setInMemoryFile, getInMemoryFile, deleteInMemoryFile, resetInMemoryFiles, writeJSONSync } from '../api-test-utils';
import {
  createMockStateMatrix, createMockAgentRegistry, createMockAgentState,
} from '../test-utils';

import { GET as stateGet } from '@/app/api/agentic-console/state/route';
import { GET as allStateGet } from '@/app/api/agentic-console/all-state/route';
import { GET as projectsGet } from '@/app/api/agentic-console/projects/route';
import { GET as agentDetailGet } from '@/app/api/agentic-console/agent-detail/route';

const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

const PATHS = {
  STATE: P('00_state_ledger/STATE_MATRIX.json'),
  REGISTRY: P('00_state_ledger/AGENT_REGISTRY.json'),
  TRACEABILITY: P('00_state_ledger/TRACEABILITY_MATRIX.json'),
  CHANGE_REQ: P('00_state_ledger/CHANGE_REQUEST.json'),
  PROJ_INDEX: P('00_state_ledger/projects_index.json'),
  PROJ_STATE: P('00_state_ledger/projects/petemart/STATE_MATRIX.json'),
  CONTEXT_LAKE: P('context_lake/latest.json'),
  TRACES: P('00_state_ledger/traces.jsonl'),
};

function setMem(p: string, data: string) { setInMemoryFile(p, data); }

function createState() {
  const base = createMockStateMatrix();
  const agents = base.agent_states as Record<string, any>;
  agents['00_supervisor_agent'] = {
    agent_id: '00_supervisor_agent', phase: 'system', pool: 'system', status: 'idle',
    dependencies: [], requires_human_approval: false, approved: true,
    role: 'Senior Program Manager', last_artifact_emitted: '', artifacts_emitted: [],
    last_activity_timestamp: new Date().toISOString(), execution_count: 56, compliance_checklist: [],
  };
  agents['01_ideation_agent'] = {
    agent_id: '01_ideation_agent', phase: 'phase_one', pool: 'async_pool', status: 'approved',
    dependencies: [], requires_human_approval: true, approved: true,
    role: 'Product Marketing Manager', last_artifact_emitted: 'file.json',
    artifacts_emitted: ['file.md', 'file.json', 'slide.pptx'],
    last_activity_timestamp: new Date().toISOString(), execution_count: 2, compliance_checklist: [],
  };
  setMem(PATHS.STATE, JSON.stringify(base));
  setMem(PATHS.REGISTRY, JSON.stringify(createMockAgentRegistry()));
  setMem(PATHS.TRACEABILITY, JSON.stringify({ version: '1.0', entries: [] }));
  setMem(PATHS.CHANGE_REQ, JSON.stringify({ changes: [] }));
  setMem(PATHS.PROJ_INDEX, JSON.stringify({
    default_project: 'petemart',
    projects: { petemart: { name: 'PeteMart', created_at: '2026-06-01' } },
  }));
  setMem(PATHS.CONTEXT_LAKE, JSON.stringify({
    latest_entry: 'lake/2026-06-09/test', window_name: 'cockpit-redesign-analysis',
    captured_at: '2026-06-09T17:47:00.000000+00:00',
  }));
  setMem(PATHS.TRACES, '');
}

beforeEach(() => { resetInMemoryFiles(); createState(); });
afterEach(() => { resetInMemoryFiles(); });

// ── GET /api/agentic-console/state ─────────────────────────────────────────

describe('GET /api/agentic-console/state', () => {
  it('returns complete state payload with all ledger files', async () => {
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stateMatrix.project_metadata.project_name).toBe('PeteMart');
    expect(body.agentRegistry.agents['01_ideation_agent']).toBeDefined();
    expect(body.traceability.version).toBe('1.0');
    expect(body.changeRequest.changes).toEqual([]);
    expect(body.projectsIndex.default_project).toBe('petemart');
    expect(body.activeProject).toBe('petemart');
    expect(body.contextLake.latestEntry.window_name).toBe('cockpit-redesign-analysis');
    expect(body.timestamp).toBeDefined();
  });

  it('reads project state when project param provided', async () => {
    const ps = createMockStateMatrix({ project_metadata: { ...createMockStateMatrix().project_metadata, project_name: 'petemart' } });
    setMem(PATHS.PROJ_STATE, JSON.stringify(ps));
    const res = await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state', { searchParams: { project: 'petemart' } }));
    const body = await res.json();
    expect(body.stateMatrix.project_metadata.project_name).toBe('petemart');
  });

  it('falls back to root when project file missing', async () => {
    const body = await (await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state', { searchParams: { project: 'nonexistent' } }))).json();
    expect(body.stateMatrix.project_metadata.project_name).toBe('PeteMart');
  });

  it('nulls stateMatrix on corrupt JSON', async () => {
    setMem(PATHS.STATE, '{ invalid }');
    const body = await (await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'))).json();
    expect(body.stateMatrix).toBeNull();
    expect(body.agentRegistry).toBeDefined();
  });

  it('nulls stateMatrix when file missing', async () => {
    deleteInMemoryFile(PATHS.STATE);
    const body = await (await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'))).json();
    expect(body.stateMatrix).toBeNull();
  });

  it('nulls optional files when missing', async () => {
    for (const k of [PATHS.REGISTRY, PATHS.TRACEABILITY, PATHS.CHANGE_REQ, PATHS.PROJ_INDEX, PATHS.CONTEXT_LAKE]) deleteInMemoryFile(k);
    const body = await (await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'))).json();
    expect(body.agentRegistry).toBeNull();
    expect(body.traceability).toBeNull();
    expect(body.changeRequest).toBeNull();
    expect(body.projectsIndex).toBeNull();
    expect(body.activeProject).toBeNull();
    expect(body.contextLake.latestEntry).toBeNull();
  });

  it('survives corrupt context lake', async () => {
    setMem(PATHS.CONTEXT_LAKE, '{ invalid }');
    const body = await (await stateGet(mockNextRequest('http://localhost:3000/api/agentic-console/state'))).json();
    expect(body.contextLake.latestEntry).toBeNull();
  });
});

// ── GET /api/agentic-console/all-state ─────────────────────────────────────

describe('GET /api/agentic-console/all-state', () => {
  it('returns all-state payload', async () => {
    const body = await (await allStateGet()).json();
    expect(body.projects).toBeDefined();
    expect(body.agentRegistry).toBeDefined();
    expect(body.traceability).toBeDefined();
    expect(body.projectsIndex).toBeDefined();
  });

  it('includes project state matrices', async () => {
    const ps = createMockStateMatrix({ project_metadata: { ...createMockStateMatrix().project_metadata, project_name: 'petemart' } });
    setMem(PATHS.PROJ_STATE, JSON.stringify(ps));
    const body = await (await allStateGet()).json();
    expect(body.projects.petemart.stateMatrix.project_metadata.project_name).toBe('petemart');
  });

  it('omits projects without state files', async () => {
    setMem(PATHS.PROJ_INDEX, JSON.stringify({ default_project: 'petemart', projects: { petemart: { name: 'PeteMart' }, ghost: { name: 'Ghost' } } }));
    setMem(PATHS.PROJ_STATE, JSON.stringify(createMockStateMatrix({ project_metadata: { ...createMockStateMatrix().project_metadata, project_name: 'petemart' } })));
    const body = await (await allStateGet()).json();
    expect(body.projects.petemart).toBeDefined();
    expect(body.projects.ghost).toBeUndefined();
  });

  it('returns empty projects on empty index', async () => {
    setMem(PATHS.PROJ_INDEX, JSON.stringify({ default_project: 'petemart', projects: {} }));
    const body = await (await allStateGet()).json();
    expect(body.projects).toEqual({});
  });

  it('nulls missing registry/traceability', async () => {
    deleteInMemoryFile(PATHS.REGISTRY); deleteInMemoryFile(PATHS.TRACEABILITY);
    const body = await (await allStateGet()).json();
    expect(body.agentRegistry).toBeNull();
    expect(body.traceability).toBeNull();
  });

  it('nulls missing projectsIndex', async () => {
    deleteInMemoryFile(PATHS.PROJ_INDEX);
    const body = await (await allStateGet()).json();
    expect(body.projectsIndex).toBeNull();
    expect(body.projects).toEqual({});
  });
});

// ── GET /api/agentic-console/projects ──────────────────────────────────────

describe('GET /api/agentic-console/projects', () => {
  it('returns project index data', async () => {
    const body = await (await projectsGet()).json();
    expect(body.default_project).toBe('petemart');
    expect(body.projects.petemart).toBeDefined();
  });

  it('returns fallback on missing index', async () => {
    deleteInMemoryFile(PATHS.PROJ_INDEX);
    const body = await (await projectsGet()).json();
    expect(body.default_project).toBe('petemart');
    expect(body.projects).toEqual({});
  });

  it('returns 500 on corrupt index', async () => {
    setMem(PATHS.PROJ_INDEX, '{ invalid }');
    const res = await projectsGet();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Invalid');
  });
});

// ── GET /api/agentic-console/agent-detail ──────────────────────────────────

describe('GET /api/agentic-console/agent-detail', () => {
  it('returns agent detail for known agentId', async () => {
    const body = await (await agentDetailGet(mockNextRequest('http://localhost:3000/api/agentic-console/agent-detail?agentId=01_ideation_agent'))).json();
    expect(body.agentState.status).toBe('approved');
    expect(body.registryEntry.role).toBe('Product Marketing & Market Knowledge Expert');
    expect(body.consumedArtifacts).toEqual([]);
    expect(Array.isArray(body.artifactStatus)).toBe(true);
    expect(Array.isArray(body.agentEvents)).toBe(true);
  });

  it('returns 400 when agentId missing', async () => {
    const res = await agentDetailGet(mockNextRequest('http://localhost:3000/api/agentic-console/agent-detail'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('agentId required');
  });

  it('returns null for unknown agentId', async () => {
    const body = await (await agentDetailGet(mockNextRequest('http://localhost:3000/api/agentic-console/agent-detail?agentId=unknown'))).json();
    expect(body.agentState).toBeNull();
    expect(body.registryEntry).toBeNull();
  });

  it('reads project-specific state', async () => {
    const ps = createMockStateMatrix();
    ps.agent_states['01_ideation_agent'] = createMockAgentState('01_ideation_agent', { status: 'in_progress' });
    setMem(PATHS.PROJ_STATE, JSON.stringify(ps));
    const body = await (await agentDetailGet(mockNextRequest('http://localhost:3000/api/agentic-console/agent-detail?agentId=01_ideation_agent&project=petemart'))).json();
    expect(body.agentState.status).toBe('in_progress');
  });

  it('lists consumed artifacts', async () => {
    const s = JSON.parse(getInMemoryFile(PATHS.STATE)!);
    (s.agent_states as Record<string, any>)['01_ideation_agent'].dependencies = ['00_supervisor_agent'];
    setMem(PATHS.STATE, JSON.stringify(s));
    const body = await (await agentDetailGet(mockNextRequest('http://localhost:3000/api/agentic-console/agent-detail?agentId=01_ideation_agent'))).json();
    expect(body.consumedArtifacts.length).toBe(1);
    expect(body.consumedArtifacts[0].depId).toBe('00_supervisor_agent');
  });

  it('returns 200 with null state when file missing', async () => {
    deleteInMemoryFile(PATHS.STATE);
    const body = await (await agentDetailGet(mockNextRequest('http://localhost:3000/api/agentic-console/agent-detail?agentId=01_ideation_agent'))).json();
    expect(body.agentState).toBeNull();
  });
});
