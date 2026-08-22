import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';
import { AGENT_ROSTER, agentRosterEntry, inferFromIdea } from '@productforge/shared';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const INDEX_PATH = path.join(ROOT, '00_state_ledger/projects_index.json');
const PROJECTS_STATE_DIR = path.join(ROOT, '00_state_ledger/projects');
const DEFAULT_WORKSPACE_DIR = path.join(ROOT, 'projects');

// ── Helpers ────────────────────────────────────────────────────────────────

function readIndex(): any {
  if (!fs.existsSync(INDEX_PATH)) {
    return { _version: '1.0', default_project: 'petemart', last_updated: new Date().toISOString(), projects: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  } catch {
    throw new Error('Invalid projects_index.json');
  }
}

function writeIndex(index: any) {
  index.last_updated = new Date().toISOString();
  const tmp = INDEX_PATH + '.__tmp';
  fs.writeFileSync(tmp, JSON.stringify(index, null, 2), 'utf-8');
  fs.renameSync(tmp, INDEX_PATH);
}

function writeJSON(fp: string, data: any) {
  const tmp = fp + '.__tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, fp);
}

function slugify(name: string): string {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (slug) return slug;
  return `project-${Date.now()}`;
}

function resolveFolderPath(folderPath: string | undefined, projectId: string): string {
  if (folderPath && folderPath.trim()) {
    const p = path.resolve(ROOT, folderPath.trim());
    return p;
  }
  return path.join(DEFAULT_WORKSPACE_DIR, projectId);
}

function projectConfigPath(projectId: string): string {
  return path.join(PROJECTS_STATE_DIR, projectId, 'project_config.json');
}

function llmConfigPath(projectId: string): string {
  return path.join(PROJECTS_STATE_DIR, projectId, 'llm_config.json');
}

function stateMatrixPath(projectId: string): string {
  return path.join(PROJECTS_STATE_DIR, projectId, 'STATE_MATRIX.json');
}

function sanitizeLlmOverride(llm: any) {
  return {
    provider: llm?.provider || '',
    model: llm?.model || '',
    ...(llm?.baseURL ? { baseURL: llm.baseURL } : {}),
  };
}

function seedAgentStates(enabledAgents: string[]): Record<string, any> {
  const states: Record<string, any> = {};
  for (const id of enabledAgents) {
    const meta = agentRosterEntry(id);
    states[id] = {
      agent_id: id,
      phase: meta?.phase || 'phase_one',
      pool: meta?.pool || 'async',
      status: 'pending',
      dependencies: meta?.dependencies || [],
      requires_human_approval: true,
      approved: false,
      role: meta?.role || '',
      execution_count: 0,
      compliance_checklist: [],
      artifacts_emitted: [],
      notes: meta?.description || '',
      last_activity_timestamp: null,
      last_error: null,
      expert_reviewer: null,
      ...(meta ? { llm_override: { provider: meta.recommended.provider, model: meta.recommended.model } } : {}),
    };
  }
  return states;
}

function scaffoldProject(opts: {
  projectId: string;
  name: string;
  body: any;
  agents: Record<string, any>;
  enabledAgents: string[];
  folderAbs: string;
}) {
  const { projectId, name, body, agents, enabledAgents, folderAbs } = opts;
  const now = new Date().toISOString();

  // 1. Framework state dir
  const stateDir = path.join(PROJECTS_STATE_DIR, projectId);
  fs.mkdirSync(stateDir, { recursive: true });

  // 2. Workspace folder (user-facing: agents, assets, deliverables)
  fs.mkdirSync(path.join(folderAbs, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(folderAbs, 'assets'), { recursive: true });
  for (const id of enabledAgents) {
    fs.mkdirSync(path.join(folderAbs, 'agents', id), { recursive: true });
  }

  // 3. STATE_MATRIX.json with seeded agent states + per-agent llm_override
  const agentStates = seedAgentStates(enabledAgents);
  for (const id of Object.keys(agentStates)) {
    const cfg = agents[id];
    if (cfg) agentStates[id].llm_override = sanitizeLlmOverride(cfg);
  }
  const supervisorOverride =
    (agents['00_supervisor_agent'] && sanitizeLlmOverride(agents['00_supervisor_agent'])) ||
    (body.llm_defaults && sanitizeLlmOverride(body.llm_defaults)) ||
    agentStates['00_supervisor_agent']?.llm_override || { provider: 'openrouter', model: 'deepseek/deepseek-reasoner' };
  const state = {
    project_metadata: {
      project_name: name,
      version: '1.0',
      factory_root: ROOT,
      total_agents: enabledAgents.length,
      supervisor_agent_version: '1.0',
    },
    supervisor_control: {
      agent_00_supervisor: {
        status: 'idle',
        current_action: 'Awaiting first dispatch',
        llm_override: supervisorOverride,
      },
    },
    pipeline_control: {
      is_pipeline_paused: false,
      last_sync_timestamp: now,
    },
    agent_states: agentStates,
  };
  writeJSON(stateMatrixPath(projectId), state);

  // 4. project_config.json (no API keys) — full project configuration
  const projectConfig = {
    project_id: projectId,
    name,
    description: body.description || '',
    idea_prompt: body.idea_prompt || body.description || '',
    folder_path: folderAbs,
    folder_path_relative: folderAbs.startsWith(ROOT) ? path.relative(ROOT, folderAbs).replace(/\\/g, '/') : folderAbs,
    logo: body.logo || null,
    logo_path: body.logo_path || null,
    platforms: body.platforms || ['web'],
    complexity: body.complexity || 'standard',
    market_scope: body.market_scope || 'regional',
    monetization: body.monetization || ['subscription'],
    tech_stack: body.tech_stack || { frontend: 'Next.js/React', backend: 'Node.js/Next API', database: 'PostgreSQL', deploy: 'Vercel' },
    billing_model: body.billing_model || 'byok',
    llm_defaults: body.llm_defaults || { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', baseURL: 'https://openrouter.ai/api/v1' },
    budget: {
      status: 'pending_architecture', // confirmed after Agent 03 cost models (GATE-COSTING-01)
      poc_monthly_inr: 0,
      production_monthly_inr: body.budget_production_monthly_inr ?? null,
      constraint_note: 'Budget is confirmed after architecture & tech-stack derivation (Agent 03 cost models).',
    },
    agents: Object.fromEntries(
      enabledAgents.map((id) => {
        const cfg = agents[id] || {};
        return [id, { provider: cfg.provider || '', model: cfg.model || '', baseURL: cfg.baseURL || '' }];
      })
    ),
    agent_roster: enabledAgents,
    created_at: now,
    version: '1.0',
  };
  writeJSON(projectConfigPath(projectId), projectConfig);

  // 5. llm_config.json (gitignored) — per-agent API keys + defaults
  const llmConfig = {
    provider_default: body.llm_defaults || {},
    agents: Object.fromEntries(
      enabledAgents.map((id) => {
        const cfg = agents[id] || {};
        return [id, {
          provider: cfg.provider || '',
          model: cfg.model || '',
          baseURL: cfg.baseURL || '',
          apiKey: cfg.apiKey || '',
        }];
      })
    ),
    updated_at: now,
  };
  writeJSON(llmConfigPath(projectId), llmConfig);

  // 6. Logo handling
  if (body.logo) saveLogo(folderAbs, projectId, body.logo);
}

function saveLogo(folderAbs: string, projectId: string, logo: any) {
  try {
    const assetsDir = path.join(folderAbs, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    if (logo.type === 'upload' && logo.data) {
      const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(logo.data);
      if (m) {
        const ext = m[1].split('/')[1].replace('+', '/').split('/')[0] || 'png';
        const fp = path.join(assetsDir, `logo.${ext}`);
        fs.writeFileSync(fp, Buffer.from(m[2], 'base64'));
        return;
      }
    }
    if (logo.type === 'url' && logo.url) return;
    // Fallback: generated SVG from initials
    const initials = (logo?.initials || projectId.slice(0, 2).toUpperCase());
    const color = logo?.color || '#6366F1';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="24" fill="${color}"/><text x="64" y="80" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
    fs.writeFileSync(path.join(assetsDir, 'logo.svg'), svg, 'utf-8');
  } catch { /* logo is optional */ }
}

// ── Routes ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      const cfgPath = projectConfigPath(id);
      if (!fs.existsSync(cfgPath)) {
        return NextResponse.json({ error: `Project "${id}" not found` }, { status: 404 });
      }
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
      // Never expose API keys
      if (cfg.agents) {
        for (const k of Object.keys(cfg.agents)) {
          delete cfg.agents[k].apiKey;
        }
      }
      return NextResponse.json({ success: true, project_config: cfg });
    }
    return NextResponse.json(readIndex());
  } catch {
    return NextResponse.json({ error: 'Invalid projects_index.json' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, id } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const index = readIndex();
    const projectId = (id && id.trim()) ? slugify(id) : slugify(name);
    if (index.projects[projectId]) {
      return NextResponse.json({ error: `Project "${projectId}" already exists` }, { status: 409 });
    }

    // Backward-compatible llm_defaults
    body.llm_defaults = body.llm_defaults || body.llm_override;

    // Resolve enabled agents: explicit list, else base 19 + idea-suggested
    const agents: Record<string, any> = body.agents || {};
    const suggested = Array.isArray(body.suggested_agents) && body.suggested_agents.length > 0
      ? body.suggested_agents
      : (body.idea_prompt || body.description)
        ? inferFromIdea(body.idea_prompt || body.description).suggested_agents
        : [];
    const rosterIds = AGENT_ROSTER.map((a) => a.id);
    const requestedEnabled: string[] = Array.isArray(body.enabled_agents) ? body.enabled_agents : [];
    const enabledAgents = (requestedEnabled.length > 0
      ? requestedEnabled
      : [...AGENT_ROSTER.filter((a) => a.base).map((a) => a.id), ...suggested])
      .filter((id: string) => rosterIds.includes(id));
    if (!enabledAgents.includes('00_supervisor_agent')) enabledAgents.unshift('00_supervisor_agent');

    const now = new Date().toISOString();
    const folderAbs = resolveFolderPath(body.folder_path, projectId);

    scaffoldProject({ projectId, name: name.trim(), body, agents, enabledAgents, folderAbs });

    const project = {
      id: projectId,
      name: name.trim(),
      description: description || '',
      state_path: `00_state_ledger/projects/${projectId}/STATE_MATRIX.json`,
      created_at: now,
      agent_count: enabledAgents.length,
      completed_pct: typeof body.completed_pct === 'number' ? body.completed_pct : 0,
      folder_path: folderAbs,
      ...(body.platforms ? { platforms: body.platforms } : {}),
      ...(body.llm_defaults ? { llm_override: { provider: body.llm_defaults.provider, model: body.llm_defaults.model, baseURL: body.llm_defaults.baseURL } } : {}),
      logo_path: body.logo_path || (body.logo ? `${path.relative(ROOT, folderAbs).replace(/\\/g, '/')}/assets/logo.svg` : undefined),
    };

    index.projects[projectId] = project;
    if (!index.default_project) index.default_project = projectId;

    writeIndex(index);
    return NextResponse.json({ success: true, project, default_project: index.default_project });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, state_path, completed_pct, llm_override } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const index = readIndex();
    const project = index.projects[id];
    if (!project) {
      return NextResponse.json({ error: `Project "${id}" not found` }, { status: 404 });
    }

    if (name !== undefined && name.trim()) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (state_path !== undefined) project.state_path = state_path;
    if (completed_pct !== undefined) project.completed_pct = typeof completed_pct === 'number' ? completed_pct : Number(completed_pct) || 0;
    if (llm_override !== undefined) {
      project.llm_override = {
        provider: llm_override.provider || project.llm_override?.provider || '',
        model: llm_override.model || project.llm_override?.model || '',
        ...(llm_override.baseURL !== undefined ? { baseURL: llm_override.baseURL } : {}),
      };
      // Sync to STATE_MATRIX supervisor + agent 00, and project_config defaults
      const smPath = stateMatrixPath(id);
      if (fs.existsSync(smPath)) {
        const sm = JSON.parse(fs.readFileSync(smPath, 'utf-8'));
        const ov = sanitizeLlmOverride(llm_override);
        if (sm.supervisor_control?.agent_00_supervisor) sm.supervisor_control.agent_00_supervisor.llm_override = ov;
        if (sm.agent_states?.['00_supervisor_agent']) sm.agent_states['00_supervisor_agent'].llm_override = ov;
        writeJSON(smPath, sm);
      }
      const cfgPath2 = projectConfigPath(id);
      if (fs.existsSync(cfgPath2)) {
        try {
          const cfg2 = JSON.parse(fs.readFileSync(cfgPath2, 'utf-8'));
          cfg2.llm_defaults = project.llm_override;
          if (cfg2.agents?.['00_supervisor_agent']) cfg2.agents['00_supervisor_agent'] = project.llm_override;
          writeJSON(cfgPath2, cfg2);
        } catch {}
      }
    }

    // Full-config updates (new fields)
    const cfgPath = projectConfigPath(id);
    let cfg: any = null;
    if (fs.existsSync(cfgPath)) {
      try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8')); } catch { cfg = null; }
    }
    const patchables: (keyof any)[] = [
      'idea_prompt', 'platforms', 'complexity', 'market_scope', 'monetization',
      'tech_stack', 'billing_model', 'llm_defaults', 'logo', 'budget_production_monthly_inr',
    ];
    if (cfg) {
      for (const k of patchables) {
        if (body[k] !== undefined) cfg[k] = body[k];
      }
      if (body.logo) { saveLogo(cfg.folder_path || path.join(DEFAULT_WORKSPACE_DIR, id), id, body.logo); cfg.logo = body.logo; }
      if (body.agents) {
        for (const [agentId, agentCfg] of Object.entries<any>(body.agents)) {
          if (!cfg.agents[agentId]) cfg.agents[agentId] = {};
          cfg.agents[agentId] = sanitizeLlmOverride(agentCfg);
          const smPath = stateMatrixPath(id);
          if (fs.existsSync(smPath)) {
            const sm = JSON.parse(fs.readFileSync(smPath, 'utf-8'));
            if (sm.agent_states?.[agentId]) sm.agent_states[agentId].llm_override = sanitizeLlmOverride(agentCfg);
            if (agentId === '00_supervisor_agent' && sm.supervisor_control?.agent_00_supervisor) {
              sm.supervisor_control.agent_00_supervisor.llm_override = sanitizeLlmOverride(agentCfg);
            }
            writeJSON(smPath, sm);
          }
          const lcPath = llmConfigPath(id);
          if (fs.existsSync(lcPath)) {
            try {
              const lc = JSON.parse(fs.readFileSync(lcPath, 'utf-8'));
              lc.agents = lc.agents || {};
              lc.agents[agentId] = { ...sanitizeLlmOverride(agentCfg), apiKey: agentCfg.apiKey || lc.agents[agentId]?.apiKey || '' };
              writeJSON(lcPath, lc);
            } catch {}
          }
        }
      }
      writeJSON(cfgPath, cfg);
    }

    writeIndex(index);
    return NextResponse.json({ success: true, project });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id') || (await req.json().catch(() => ({}))).id;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const index = readIndex();
    const existing = index.projects[id];
    if (!existing) {
      return NextResponse.json({ error: `Project "${id}" not found` }, { status: 404 });
    }
    const folder = existing.folder_path;

    delete index.projects[id];
    if (index.default_project === id) {
      const remaining = Object.keys(index.projects);
      index.default_project = remaining[0] || '';
    }

    const dir = path.join(PROJECTS_STATE_DIR, id);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    if (folder && fs.existsSync(folder) && path.resolve(folder).startsWith(path.resolve(DEFAULT_WORKSPACE_DIR))) {
      fs.rmSync(folder, { recursive: true, force: true });
    }

    writeIndex(index);
    return NextResponse.json({ success: true, deleted: id, default_project: index.default_project });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}