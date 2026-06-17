// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('fs', () => import('./mock-fs'));

import path from 'path';
import { mockNextRequest, setInMemoryFile, resetInMemoryFiles } from '../api-test-utils';

const execMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({ execSync: execMock }));

import { GET as jiraGet, POST as jiraPost } from '@/app/api/agentic-console/jira/route';
import { GET as pullRequestsGet } from '@/app/api/agentic-console/pull-requests/route';
import { GET as branchesGet } from '@/app/api/agentic-console/branches/route';
import { GET as artifactsGet } from '@/app/api/agentic-console/artifacts/route';
import { GET as toolsGet } from '@/app/api/agentic-console/tools/route';
import { GET as mcpServersGet } from '@/app/api/agentic-console/mcp-servers/route';

const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

beforeEach(() => {
  resetInMemoryFiles();
  execMock.mockReset();
  vi.stubEnv('JIRA_BASE_URL', '');
  vi.stubEnv('JIRA_TOKEN', '');
  vi.stubEnv('JIRA_PROJECT', 'PETEMART');
});

afterEach(() => {
  resetInMemoryFiles();
  vi.unstubAllEnvs();
});

// ── Jira ───────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/jira', () => {
  it('returns unconfigured state when env vars missing', async () => {
    const body = await (await jiraGet()).json();
    expect(body.configured).toBe(false);
    expect(body.issues).toEqual([]);
  });

  it('returns mapping even when unconfigured', async () => {
    setInMemoryFile(P('00_state_ledger/jira_agent_mapping.json'), JSON.stringify({ '01_ideation_agent': 'PET-1' }));
    const body = await (await jiraGet()).json();
    expect(body.mapping['01_ideation_agent']).toBe('PET-1');
  });
});

describe('POST /api/agentic-console/jira', () => {
  it('maps agent to issue key', async () => {
    const res = await jiraPost(mockNextRequest('http://localhost/api/agentic-console/jira', { method: 'POST', body: { action: 'map_agent', agentId: '01_ideation_agent', issueKey: 'PET-1' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.mapping['01_ideation_agent']).toBe('PET-1');
  });

  it('returns 400 for map_agent missing fields', async () => {
    const res = await jiraPost(mockNextRequest('http://localhost/api/agentic-console/jira', { method: 'POST', body: { action: 'map_agent', agentId: 'a1' } }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for transition missing fields', async () => {
    const res = await jiraPost(mockNextRequest('http://localhost/api/agentic-console/jira', { method: 'POST', body: { action: 'transition', issueKey: 'PET-1' } }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown action', async () => {
    const res = await jiraPost(mockNextRequest('http://localhost/api/agentic-console/jira', { method: 'POST', body: { action: 'bogus' } }));
    expect(res.status).toBe(400);
  });

  it('syncs with state matrix', async () => {
    const state = { agent_states: { '01_ideation_agent': { status: 'approved' } } };
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify(state));
    setInMemoryFile(P('00_state_ledger/jira_agent_mapping.json'), JSON.stringify({ '01_ideation_agent': 'PET-1' }));
    const res = await jiraPost(mockNextRequest('http://localhost/api/agentic-console/jira', { method: 'POST', body: { action: 'sync' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    // No Jira env configured so transitions skipped, but routes returns success
    expect(b.success).toBe(true);
    expect(b.configured).toBe(false);
  });

  it('returns 404 for sync when state missing', async () => {
    const res = await jiraPost(mockNextRequest('http://localhost/api/agentic-console/jira', { method: 'POST', body: { action: 'sync' } }));
    expect(res.status).toBe(404);
  });
});

// ── Pull Requests ──────────────────────────────────────────────────────────
describe('GET /api/agentic-console/pull-requests', () => {
  it('falls back when gh CLI unavailable', async () => {
    execMock.mockImplementation(() => { throw new Error('gh not found'); });
    const body = await (await pullRequestsGet()).json();
    expect(body.pull_requests).toBeDefined();
    expect(body.source).toBe('fallback');
  });

  it('parses gh output when available', async () => {
    execMock.mockReturnValue(JSON.stringify([{ number: 1, title: 'Fix', headRefName: 'fix-1', baseRefName: 'develop', state: 'OPEN', createdAt: '2026-01-01T00:00:00Z', mergedAt: null, reviews: [], latestChecks: [] }]));
    const body = await (await pullRequestsGet()).json();
    expect(body.pull_requests).toHaveLength(1);
    expect(body.pull_requests[0].number).toBe(1);
  });
});

// ── Branches ───────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/branches', () => {
  it('falls back when git command fails', async () => {
    execMock.mockImplementation(() => { throw new Error('git not available'); });
    const body = await (await branchesGet()).json();
    expect(body.branches).toBeDefined();
    expect(body.branches.length).toBeGreaterThanOrEqual(3);
    expect(body.error).toBeDefined();
  });

  it('parses git output when available', async () => {
    execMock.mockReturnValue('main|origin/main|Initial commit\ndevelop||Active dev\nfeature/foo||New feature\n');
    const body = await (await branchesGet()).json();
    expect(body.branches.length).toBeGreaterThanOrEqual(2);
    const names = body.branches.map((b: any) => b.name);
    expect(names).toContain('main');
    expect(names).toContain('develop');
  });
});

// ── Artifacts ──────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/artifacts', () => {
  it('lists all agent artifact directories', async () => {
    setInMemoryFile(P('agents/01_front_office/01_ideation_agent/file.json'), '{}');
    setInMemoryFile(P('agents/01_front_office/01_ideation_agent/report.md'), '# Report');
    setInMemoryFile(P('agents/02_engineering_specs/03_architect_agent/arch.json'), '{}');
    const body = await (await artifactsGet(mockNextRequest('http://localhost/api/agentic-console/artifacts'))).json();
    expect(body.agents).toBeDefined();
    expect(Object.keys(body.agents).length).toBeGreaterThanOrEqual(2);
  });

  it('reads a file by action=read', async () => {
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), JSON.stringify({ project_name: 'PeteMart' }));
    const body = await (await artifactsGet(mockNextRequest('http://localhost/api/agentic-console/artifacts?action=read&file=00_state_ledger/STATE_MATRIX.json'))).json();
    expect(body.name).toBe('STATE_MATRIX.json');
    expect(body.content.project_name).toBe('PeteMart');
  });

  it('blocks path traversal on read', async () => {
    const res = await artifactsGet(mockNextRequest('http://localhost/api/agentic-console/artifacts?action=read&file=../.env'));
    expect(res.status).toBe(403);
  });

  it('returns 404 when file not found on read', async () => {
    const res = await artifactsGet(mockNextRequest('http://localhost/api/agentic-console/artifacts?action=read&file=00_state_ledger/nonexistent.json'));
    expect(res.status).toBe(404);
  });

  it('lists directory by action=list', async () => {
    setInMemoryFile(P('00_state_ledger/STATE_MATRIX.json'), '{}');
    setInMemoryFile(P('00_state_ledger/AGENT_REGISTRY.json'), '{}');
    const body = await (await artifactsGet(mockNextRequest('http://localhost/api/agentic-console/artifacts?action=list&dir=00_state_ledger'))).json();
    expect(body.entries.length).toBeGreaterThanOrEqual(1);
    expect(body.path).toBe('00_state_ledger');
  });

  it('blocks path traversal on list', async () => {
    const res = await artifactsGet(mockNextRequest('http://localhost/api/agentic-console/artifacts?action=list&dir=../etc'));
    expect(res.status).toBe(403);
  });
});

// ── Tools ──────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/tools', () => {
  it('returns tool registry', async () => {
    setInMemoryFile(P('00_state_ledger/tool_registry.json'), JSON.stringify({ tools: [{ name: 'read_file', description: 'Read files' }], tool_count: 1 }));
    const body = await (await toolsGet()).json();
    expect(body.tools).toHaveLength(1);
    expect(body.tool_count).toBe(1);
  });

  it('returns empty when file missing', async () => {
    const body = await (await toolsGet()).json();
    expect(body.tools).toEqual([]);
    expect(body.tool_count).toBe(0);
  });

  it('returns 500 on corrupt JSON', async () => {
    setInMemoryFile(P('00_state_ledger/tool_registry.json'), '{ broken }');
    const res = await toolsGet();
    expect(res.status).toBe(500);
  });
});

// ── MCP Servers ────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/mcp-servers', () => {
  it('returns server list', async () => {
    setInMemoryFile(P('00_state_ledger/MCP_SERVERS.json'), JSON.stringify({ servers: [{ name: 'filesystem', status: 'connected' }], agent_to_mcp_mapping: { a1: ['filesystem'] } }));
    const body = await (await mcpServersGet()).json();
    expect(body.servers).toHaveLength(1);
    expect(body.servers[0].name).toBe('filesystem');
    expect(body.agentToMcpMapping.a1).toEqual(['filesystem']);
  });

  it('returns empty when file missing', async () => {
    const body = await (await mcpServersGet()).json();
    expect(body.servers).toEqual([]);
    expect(body.agentToMcpMapping).toEqual({});
  });
});
