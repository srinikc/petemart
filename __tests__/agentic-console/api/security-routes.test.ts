// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('fs', () => import('./mock-fs'));

import path from 'path';
import { mockNextRequest, setInMemoryFile, resetInMemoryFiles } from '../api-test-utils';

import { GET as rbacGet, POST as rbacPost } from '@/app/api/agentic-console/rbac/route';
import { GET as snapshotsGet, POST as snapshotsPost } from '@/app/api/agentic-console/prompt-snapshots/route';

const CWD = process.cwd();
const P = (rel: string) => path.join(CWD, rel);

beforeEach(() => { resetInMemoryFiles(); });
afterEach(() => { resetInMemoryFiles(); });

// ── RBAC ───────────────────────────────────────────────────────────────────
describe('GET /api/agentic-console/rbac', () => {
  it('returns full RBAC config when no params', async () => {
    const body = await (await rbacGet(mockNextRequest('http://localhost/api/agentic-console/rbac'))).json();
    expect(body.roles).toBeDefined();
    expect(body.roles.admin).toBeDefined();
    expect(body.roles.gatekeeper).toBeDefined();
    expect(body.roles.viewer).toBeDefined();
    expect(body.userCount).toBe(0);
  });

  it('looks up user by user_id', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { admin: { label: 'Admin', color: '', description: '', permissions: { all: { actions: ['*'], projects: ['*'] } }, max_sessions: 10 } },
      users: { 'john': { role: 'admin', projects: ['petemart'], display_name: 'John', email: 'john@test.com', last_login: null } },
      session_store: {}, project_access: {}, audit_log: [],
    }));
    const body = await (await rbacGet(mockNextRequest('http://localhost/api/agentic-console/rbac?user_id=john'))).json();
    expect(body.user_id).toBe('john');
    expect(body.role).toBe('admin');
  });

  it('validates session token', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const config = {
      version: '1.0', description: '', roles: { viewer: { label: 'Viewer', color: '', description: '', permissions: { default: { actions: ['read'], projects: ['*'] } }, max_sessions: 20 } },
      users: { 'jane': { role: 'viewer', projects: ['petemart'], display_name: 'Jane', email: 'j@t.com', last_login: null } },
      session_store: { 'rbac-token123': { user_id: 'jane', role: 'viewer', projects: ['petemart'], created_at: new Date().toISOString(), expires_at: future } },
      project_access: {}, audit_log: [],
    };
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify(config));
    const body = await (await rbacGet(mockNextRequest('http://localhost/api/agentic-console/rbac?token=rbac-token123'))).json();
    expect(body.authenticated).toBe(true);
    expect(body.user_id).toBe('jane');
  });

  it('returns 401 for invalid token', async () => {
    const res = await rbacGet(mockNextRequest('http://localhost/api/agentic-console/rbac?token=bad-token'));
    expect(res.status).toBe(401);
    expect((await res.json()).authenticated).toBe(false);
  });
});

describe('POST /api/agentic-console/rbac', () => {
  it('logs in a user (auto-creates viewer)', async () => {
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'login', user_id: 'new_user', password: 'any' } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
    expect(b.token).toContain('rbac-');
    expect(b.user.role).toBe('viewer');
  });

  it('returns 400 for login missing fields', async () => {
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'login', user_id: 'u' } }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when max sessions reached', async () => {
    const config = {
      version: '1.0', description: '', roles: { viewer: { label: 'Viewer', color: '', description: '', permissions: { default: { actions: ['read'], projects: ['*'] } }, max_sessions: 0 } },
      users: { 'u1': { role: 'viewer', projects: ['petemart'], display_name: 'U1', email: '', last_login: null } },
      session_store: {}, project_access: {}, audit_log: [],
    };
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify(config));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'login', user_id: 'u1', password: 'p' } }));
    expect(res.status).toBe(429);
  });

  it('logs out a user', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: {}, users: {}, session_store: { 'tok1': { user_id: 'u1' } },
      project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'logout', token: 'tok1' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('sets role for user', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { admin: { label: 'Admin', color: '', description: '', permissions: { all: { actions: ['*'], projects: ['*'] } }, max_sessions: 10 }, viewer: { label: 'Viewer', color: '', description: '', permissions: { default: { actions: ['read'], projects: ['*'] } }, max_sessions: 20 } },
      users: { 'u1': { role: 'viewer', projects: ['petemart'], display_name: 'U1', email: '', last_login: null } },
      session_store: {}, project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'set_role', target_user_id: 'u1', role: 'admin' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).user.role).toBe('admin');
  });

  it('returns 400 for set_role with invalid role', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { admin: { label: 'Admin', color: '', description: '', permissions: { all: { actions: ['*'], projects: ['*'] } }, max_sessions: 10 } },
      users: { 'u1': { role: 'admin', projects: [], display_name: '', email: '', last_login: null } },
      session_store: {}, project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'set_role', target_user_id: 'u1', role: 'superadmin' } }));
    expect(res.status).toBe(400);
  });

  it('returns 404 for set_role on unknown user', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { admin: { label: 'Admin', color: '', description: '', permissions: { all: { actions: ['*'], projects: ['*'] } }, max_sessions: 10 } },
      users: {}, session_store: {}, project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'set_role', target_user_id: 'ghost', role: 'admin' } }));
    expect(res.status).toBe(404);
  });

  it('adds a new user', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { admin: { label: 'Admin', color: '', description: '', permissions: { all: { actions: ['*'], projects: ['*'] } }, max_sessions: 10 } },
      users: {}, session_store: {}, project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'add_user', user_id: 'newbie', role: 'admin' } }));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('returns 409 for add_user duplicate', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { admin: { label: 'Admin', color: '', description: '', permissions: { all: { actions: ['*'], projects: ['*'] } }, max_sessions: 10 } },
      users: { 'existing': { role: 'admin', projects: ['petemart'], display_name: 'Existing', email: '', last_login: null } },
      session_store: {}, project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'add_user', user_id: 'existing', role: 'admin' } }));
    expect(res.status).toBe(409);
  });

  it('sets project access for user', async () => {
    setInMemoryFile(P('00_state_ledger/rbac_config.json'), JSON.stringify({
      version: '1.0', description: '', roles: { viewer: { label: 'Viewer', color: '', description: '', permissions: { default: { actions: ['read'], projects: ['*'] } }, max_sessions: 20 } },
      users: { 'u1': { role: 'viewer', projects: ['petemart'], display_name: 'U1', email: '', last_login: null } },
      session_store: {}, project_access: {}, audit_log: [],
    }));
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'set_project_access', target_user_id: 'u1', projects: ['petemart', 'other'] } }));
    expect(res.status).toBe(200);
  });

  it('returns 400 for unknown action', async () => {
    const res = await rbacPost(mockNextRequest('http://localhost/api/agentic-console/rbac', { method: 'POST', body: { action: 'bogus' } }));
    expect(res.status).toBe(400);
  });
});

// ── Prompt Snapshots ───────────────────────────────────────────────────────
describe('GET /api/agentic-console/prompt-snapshots', () => {
  it('returns snapshots for agent', async () => {
    setInMemoryFile(P('00_state_ledger/prompt_snapshots/01_ideation_agent.jsonl'), JSON.stringify({ id: 'snap-1', agent_id: '01_ideation_agent', system_prompt: 'Be a PM', config: {}, timestamp: new Date().toISOString() }) + '\n');
    const body = await (await snapshotsGet(mockNextRequest('http://localhost/api/agentic-console/prompt-snapshots?agentId=01_ideation_agent'))).json();
    expect(body.total).toBe(1);
    expect(body.snapshots[0].system_prompt).toBe('Be a PM');
  });

  it('returns empty when agentId missing', async () => {
    const body = await (await snapshotsGet(mockNextRequest('http://localhost/api/agentic-console/prompt-snapshots'))).json();
    expect(body.snapshots).toEqual([]);
  });

  it('returns empty when file missing', async () => {
    const body = await (await snapshotsGet(mockNextRequest('http://localhost/api/agentic-console/prompt-snapshots?agentId=unknown'))).json();
    expect(body.total).toBe(0);
  });
});

describe('POST /api/agentic-console/prompt-snapshots', () => {
  it('creates a snapshot', async () => {
    const res = await snapshotsPost(mockNextRequest('http://localhost/api/agentic-console/prompt-snapshots', { method: 'POST', body: { agentId: '01_ideation_agent', system_prompt: 'You are a PM', config: { temperature: 0.7 } } }));
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.success).toBe(true);
    expect(b.entry.system_prompt).toBe('You are a PM');
  });

  it('returns 400 when agentId missing', async () => {
    const res = await snapshotsPost(mockNextRequest('http://localhost/api/agentic-console/prompt-snapshots', { method: 'POST', body: { system_prompt: 'test' } }));
    expect(res.status).toBe(400);
  });
});
