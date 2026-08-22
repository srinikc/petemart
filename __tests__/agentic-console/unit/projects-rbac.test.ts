// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── In-memory FS mock (mirrors defect-tracker.test.ts pattern + renameSync) ──
const { mem, mockImpl } = vi.hoisted(() => {
  const mem = new Map<string, string>();
  const mockImpl = {
    existsSync: (p: string) => mem.has(p) || Array.from(mem.keys()).some(k => k.startsWith(String(p).replace(/[\\/]$/, '') + '\\') || k.startsWith(String(p).replace(/[\\/]$/, '') + '/')),
    readFileSync: (p: string, _e?: any) => {
      if (!mem.has(p as string)) throw Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' });
      return mem.get(p)!;
    },
    writeFileSync: (p: string, d: any) => mem.set(p, String(d)),
    appendFileSync: (p: string, d: any) => mem.set(p, (mem.get(p) || '') + String(d)),
    renameSync: (a: string, b: string) => {
      const v = mem.get(a);
      if (v !== undefined) { mem.set(b, v); mem.delete(a); }
    },
    mkdirSync: () => {},
    readdirSync: () => [],
    rmSync: (p: string) => {
      for (const k of Array.from(mem.keys())) {
        if (k.startsWith(p)) mem.delete(k);
      }
    },
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

import { NextRequest } from 'next/server';
import path from 'path';
import { GET as projectsGet, POST as projectsPost, PATCH as projectsPatch, DELETE as projectsDelete } from '@/app/api/agentic-console/projects/route';
import { GET as rbacGet, POST as rbacPost } from '@/app/api/agentic-console/rbac/route';

const ROOT = process.cwd();
const INDEX = path.join(ROOT, '00_state_ledger/projects_index.json');
const RBAC = path.join(ROOT, '00_state_ledger/rbac_config.json');
const stateFor = (id: string) => path.join(ROOT, `00_state_ledger/projects/${id}/STATE_MATRIX.json`);

function mockRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init as any);
}

async function body(res: Response) {
  return res.json();
}

describe('Project API (POST/PATCH/DELETE)', () => {
  beforeEach(() => { mem.clear(); });

  it('GET returns empty index when no file exists', async () => {
    const res = await projectsGet(mockRequest('http://localhost:3000/api/agentic-console/projects'));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.projects).toEqual({});
    expect(data.default_project).toBe('petemart');
  });

  it('POST creates a project, scaffolds STATE_MATRIX.json and registers in index', async () => {
    const res = await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({
        name: 'Bangalore Silk Marketplace', description: 'A marketplace', completed_pct: 10,
        llm_override: { provider: 'openrouter', model: 'deepseek/deepseek-r1', baseURL: 'https://openrouter.ai/api/v1' },
      }),
    }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.success).toBe(true);
    expect(data.project.id).toBe('bangalore-silk-marketplace');
    expect(data.project.completed_pct).toBe(10);
    expect(data.project.llm_override.provider).toBe('openrouter');

    const index = JSON.parse(mem.get(INDEX)!);
    expect(index.projects['bangalore-silk-marketplace']).toBeDefined();
    expect(index.projects['bangalore-silk-marketplace'].state_path).toContain('00_state_ledger/projects/bangalore-silk-marketplace/STATE_MATRIX.json');

    const statePath = stateFor('bangalore-silk-marketplace');
    expect(mem.has(statePath)).toBe(true);
    const state = JSON.parse(mem.get(statePath)!);
    expect(state.project_metadata.project_name).toBe('Bangalore Silk Marketplace');
    expect(state.supervisor_control.agent_00_supervisor.llm_override.provider).toBe('openrouter');
  });

  it('POST rejects a duplicate id with 409', async () => {
    await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ name: 'First Project' }),
    }));
    const res = await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ name: 'First Project' }),
    }));
    expect(res.status).toBe(409);
  });

  it('POST rejects missing name with 400', async () => {
    const res = await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ description: 'no name' }),
    }));
    expect(res.status).toBe(400);
  });

  it('PATCH updates fields and syncs llm_override into STATE_MATRIX', async () => {
    await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ name: 'Test Project', completed_pct: 5 }),
    }));
    const res = await projectsPatch(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'PATCH', body: JSON.stringify({
        id: 'test-project', name: 'Test Project v2', description: 'updated', completed_pct: 42,
        llm_override: { provider: 'ollama', model: 'llama3', baseURL: 'http://localhost:11434/v1' },
      }),
    }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.project.name).toBe('Test Project v2');
    expect(data.project.completed_pct).toBe(42);
    expect(data.project.description).toBe('updated');

    const statePath = stateFor('test-project');
    const state = JSON.parse(mem.get(statePath)!);
    expect(state.supervisor_control.agent_00_supervisor.llm_override.provider).toBe('ollama');
    expect(state.supervisor_control.agent_00_supervisor.llm_override.model).toBe('llama3');
  });

  it('PATCH returns 404 for a missing project', async () => {
    const res = await projectsPatch(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'PATCH', body: JSON.stringify({ id: 'nope', name: 'X' }),
    }));
    expect(res.status).toBe(404);
  });

  it('DELETE removes the project from index and deletes its state directory', async () => {
    await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ name: 'Doomed Project' }),
    }));
    const statePath = stateFor('doomed-project');
    expect(mem.has(statePath)).toBe(true);

    const res = await projectsDelete(mockRequest('http://localhost:3000/api/agentic-console/projects?id=doomed-project'));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.deleted).toBe('doomed-project');

    const index = JSON.parse(mem.get(INDEX)!);
    expect(index.projects['doomed-project']).toBeUndefined();
    expect(mem.has(statePath)).toBe(false);
  });

  it('DELETE returns 404 for a missing project', async () => {
    const res = await projectsDelete(mockRequest('http://localhost:3000/api/agentic-console/projects?id=ghost'));
    expect(res.status).toBe(404);
  });
});

describe('RBAC API (delete_user + list_sessions)', () => {
  beforeEach(() => { mem.clear(); });

  async function seedConfig() {
    mem.set(RBAC, JSON.stringify({
      version: '1.0',
      description: 'test',
      roles: {
        admin: { label: 'Administrator', color: '#DC2626', description: 'Full access', permissions: {}, max_sessions: 10 },
        gatekeeper: { label: 'Gatekeeper', color: '#F59E0B', description: 'Approve', permissions: {}, max_sessions: 5 },
        viewer: { label: 'Viewer', color: '#3B82F6', description: 'Read only', permissions: {}, max_sessions: 20 },
      },
      users: {
        alice: { role: 'admin', projects: ['petemart'], display_name: 'Alice', email: 'a@x.com', last_login: null },
        bob: { role: 'viewer', projects: ['petemart'], display_name: 'Bob', email: 'b@x.com', last_login: null },
      },
      session_store: {
        'rbac-token-alice': { user_id: 'alice', role: 'admin', projects: ['petemart'], created_at: '2026-08-22T00:00:00.000Z', expires_at: '2026-08-23T00:00:00.000Z' },
      },
      project_access: { alice: ['petemart'], bob: ['petemart'] },
      audit_log: [],
    }));
  }

  it('delete_user removes user, project_access and their sessions', async () => {
    await seedConfig();
    const res = await rbacPost(mockRequest('http://localhost:3000/api/agentic-console/rbac', {
      method: 'POST', body: JSON.stringify({ action: 'delete_user', target_user_id: 'alice' }),
    }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.success).toBe(true);
    expect(data.deleted).toBe('alice');

    const config = JSON.parse(mem.get(RBAC)!);
    expect(config.users.alice).toBeUndefined();
    expect(config.project_access.alice).toBeUndefined();
    expect(config.session_store['rbac-token-alice']).toBeUndefined();
  });

  it('delete_user returns 404 for missing user', async () => {
    await seedConfig();
    const res = await rbacPost(mockRequest('http://localhost:3000/api/agentic-console/rbac', {
      method: 'POST', body: JSON.stringify({ action: 'delete_user', target_user_id: 'ghost' }),
    }));
    expect(res.status).toBe(404);
  });

  it('list_sessions returns sessions with active flag', async () => {
    await seedConfig();
    const res = await rbacPost(mockRequest('http://localhost:3000/api/agentic-console/rbac', {
      method: 'POST', body: JSON.stringify({ action: 'list_sessions' }),
    }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.success).toBe(true);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].user_id).toBe('alice');
    expect(data.sessions[0].active).toBe(true);
  });

  it('list_sessions filters by user_id', async () => {
    await seedConfig();
    const res = await rbacPost(mockRequest('http://localhost:3000/api/agentic-console/rbac', {
      method: 'POST', body: JSON.stringify({ action: 'list_sessions', user_id: 'bob' }),
    }));
    const data = await body(res);
    expect(data.sessions).toHaveLength(0);
  });
});

describe('Project API (full configuration)', () => {
  beforeEach(() => { mem.clear(); });

  const FULL_BODY = {
    name: 'Fitness Tracker App',
    description: 'Fitness tracker for delivery riders with offline mode',
    idea_prompt: 'Fitness tracker app for delivery riders with offline mode and push notifications, used on the go',
    folder_path: 'projects/fitness-tracker',
    platforms: ['mobile', 'web'],
    complexity: 'standard',
    market_scope: 'local',
    monetization: ['subscription'],
    tech_stack: { frontend: 'Next.js/React', backend: 'Node.js/Next API', database: 'PostgreSQL', deploy: 'Vercel' },
    billing_model: 'byok',
    enabled_agents: ['00_supervisor_agent', '01_ideation_agent', '02_requirement_agent', '18_mobile_engineer_agent'],
    agents: {
      '00_supervisor_agent': { provider: 'openrouter', model: 'deepseek/deepseek-reasoner', baseURL: 'https://openrouter.ai/api/v1', apiKey: 'sk-supervisor-secret' },
      '01_ideation_agent': { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-6', apiKey: 'sk-ideation-secret' },
      '02_requirement_agent': { provider: 'deepseek', model: 'deepseek-chat', baseURL: 'https://api.deepseek.com/v1' },
      '18_mobile_engineer_agent': { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash' },
    },
  };

  it('POST scaffolds project_config.json, gitignored llm_config.json and per-agent STATE_MATRIX', async () => {
    const res = await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify(FULL_BODY),
    }));
    expect(res.status).toBe(200);
    const data = await body(res);
    expect(data.success).toBe(true);
    expect(data.project.platforms).toEqual(['mobile', 'web']);
    expect(data.project.folder_path).toContain('fitness-tracker');
    expect(data.project.agent_count).toBe(4);

    // project_config.json — full config, no API keys
    const cfgPath = path.join(ROOT, '00_state_ledger/projects/fitness-tracker-app/project_config.json');
    expect(mem.has(cfgPath)).toBe(true);
    const cfg = JSON.parse(mem.get(cfgPath)!);
    expect(cfg.platforms).toEqual(['mobile', 'web']);
    expect(cfg.complexity).toBe('standard');
    expect(cfg.market_scope).toBe('local');
    expect(cfg.agent_roster).toContain('18_mobile_engineer_agent');
    expect(cfg.agents['00_supervisor_agent'].provider).toBe('openrouter');
    expect(cfg.agents['00_supervisor_agent'].apiKey).toBeUndefined();
    expect(cfg.budget.status).toBe('pending_architecture');

    // llm_config.json — gitignored keys present
    const lcPath = path.join(ROOT, '00_state_ledger/projects/fitness-tracker-app/llm_config.json');
    expect(mem.has(lcPath)).toBe(true);
    const lc = JSON.parse(mem.get(lcPath)!);
    expect(lc.agents['00_supervisor_agent'].apiKey).toBe('sk-supervisor-secret');
    expect(lc.agents['01_ideation_agent'].apiKey).toBe('sk-ideation-secret');

    // STATE_MATRIX seeded agent states with per-agent llm_override (no keys)
    const smPath = stateFor('fitness-tracker-app');
    expect(mem.has(smPath)).toBe(true);
    const sm = JSON.parse(mem.get(smPath)!);
    expect(sm.agent_states['18_mobile_engineer_agent'].status).toBe('pending');
    expect(sm.agent_states['01_ideation_agent'].llm_override.model).toBe('anthropic/claude-sonnet-4-6');
    expect(sm.agent_states['01_ideation_agent'].llm_override.apiKey).toBeUndefined();
    expect(sm.supervisor_control.agent_00_supervisor.llm_override.model).toBe('deepseek/deepseek-reasoner');
  });

  it('POST default-enabled agents when none given = base roster + idea suggestions', async () => {
    const res = await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ name: 'Idea Project', description: 'A fitness tracker mobile app for delivery riders' }),
    }));
    expect(res.status).toBe(200);
    const data = await body(res);
    const cfg = JSON.parse(mem.get(path.join(ROOT, '00_state_ledger/projects/idea-project/project_config.json'))!);
    // base 19 + suggested (18_mobile_engineer_agent) enabled
    expect(cfg.agent_roster.length).toBeGreaterThanOrEqual(19);
    expect(cfg.agent_roster).toContain('18_mobile_engineer_agent');
    expect(cfg.agent_roster).toContain('00_supervisor_agent');
    expect(data.project.agent_count).toBe(cfg.agent_roster.length);
  });

  it('GET ?id= returns project_config without API keys', async () => {
    await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify(FULL_BODY),
    }));
    const res = await projectsGet(mockRequest('http://localhost:3000/api/agentic-console/projects?id=fitness-tracker-app'));
    expect(res.status).toBe(200);
    const json = await body(res);
    expect(json.project_config.platforms).toEqual(['mobile', 'web']);
    expect(json.project_config.agents['00_supervisor_agent'].apiKey).toBeUndefined();
  });

  it('PATCH updates per-agent llm_override in project_config + STATE_MATRIX', async () => {
    await projectsPost(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'POST', body: JSON.stringify({ name: 'Patch Me', enabled_agents: ['00_supervisor_agent', '01_ideation_agent'] }),
    }));
    const res = await projectsPatch(mockRequest('http://localhost:3000/api/agentic-console/projects', {
      method: 'PATCH', body: JSON.stringify({
        id: 'patch-me',
        agents: { '01_ideation_agent': { provider: 'deepseek', model: 'deepseek-reasoner' } },
      }),
    }));
    expect(res.status).toBe(200);
    const sm = JSON.parse(mem.get(stateFor('patch-me'))!);
    expect(sm.agent_states['01_ideation_agent'].llm_override.model).toBe('deepseek-reasoner');
    const cfg = JSON.parse(mem.get(path.join(ROOT, '00_state_ledger/projects/patch-me/project_config.json'))!);
    expect(cfg.agents['01_ideation_agent'].model).toBe('deepseek-reasoner');
  });
});