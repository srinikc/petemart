import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LEDGER = '00_state_ledger';
const ROOT = () => process.cwd();

function readJson(rel: string) {
  const p = path.join(ROOT(), rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeJson(rel: string, data: unknown) {
  fs.writeFileSync(path.join(ROOT(), rel), JSON.stringify(data, null, 2), 'utf-8');
}

function nextAgentId(agents: Record<string, unknown>): string {
  const existing = Object.keys(agents)
    .filter(k => k.startsWith('custom_'))
    .map(k => {
      const n = parseInt(k.replace('custom_', ''), 10);
      return isNaN(n) ? 0 : n;
    })
    .sort((a, b) => b - a);
  const nextNum = existing.length > 0 ? existing[0] + 1 : 1;
  const padded = String(nextNum).padStart(2, '0');
  return `custom_${padded}_agent`;
}

export async function GET() {
  const templates = readJson(`${LEDGER}/AGENT_TEMPLATES.json`);
  if (!templates) return NextResponse.json({ templates: [] });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { template_id, agent_name, dependencies, input_artifacts, output_artifacts, guardrails_overrides } = body;

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    const templates = readJson(`${LEDGER}/AGENT_TEMPLATES.json`);
    const template = templates?.templates?.find((t: { id: string }) => t.id === template_id);
    if (!template) {
      return NextResponse.json({ error: `Template '${template_id}' not found` }, { status: 404 });
    }

    const state = readJson(`${LEDGER}/STATE_MATRIX.json`);
    if (!state) {
      return NextResponse.json({ error: 'STATE_MATRIX.json not found' }, { status: 500 });
    }

    const agentId = nextAgentId(state);
    const finalName = agent_name || `${template.name}`;
    const now = new Date().toISOString();

    const mergedGuardrails = { ...template.default_guardrails, ...(guardrails_overrides || {}) };

    const complianceChecklist = Object.entries(mergedGuardrails).map(([key, val]) => ({
      id: `${agentId.toUpperCase()}-${key}`,
      check: `${key}: ${val}`,
      type: 'guardrail',
      required: val === true,
      passed: val !== true,
    }));

    const depArtifacts: string[] = [];
    if (dependencies?.length) {
      depArtifacts.push(...dependencies);
    }
    if (input_artifacts?.length) {
      depArtifacts.push(...input_artifacts);
    }

    const agentEntry = {
      phase: template.phase || 'custom',
      pool: template.pool || 'async_pool',
      status: 'pending',
      dependencies: depArtifacts,
      requires_human_approval: template.requires_human_approval ?? true,
      approved: false,
      role: template.default_role,
      expert_reviewer: {
        role_title: `Expert Reviewer for ${finalName}`,
        industry_jd_reference: 'Custom agent — expert review TBD.',
        review_status: 'not_started',
        review_triggered_by: null,
        review_feedback: [],
        reviewed_by: null,
        reviewed_at: null,
        sign_off_required: template.requires_human_approval ?? true,
        sign_off_granted: false,
      },
      last_artifact_emitted: null,
      artifacts_emitted: output_artifacts?.length ? [...output_artifacts] : [],
      last_activity_timestamp: now,
      execution_count: 0,
      compliance_checklist: complianceChecklist,
      notes: `Custom agent created from template '${template_id}' at ${now}. Manually assign to a phase/pool as needed.`,
    };

    const agentKey = `${agentId}_${template_id}`;
    state[agentKey] = agentEntry;
    state.project_metadata.total_agents = Object.keys(state).filter(k => k !== 'project_metadata' && k !== 'supervisor_control' && k !== 'stuck_agent_monitor' && k !== 'workflow_enforcement' && !k.startsWith('SUP-')).length;

    writeJson(`${LEDGER}/STATE_MATRIX.json`, state);

    const perProjectPath = `${LEDGER}/projects/petemart/STATE_MATRIX.json`;
    if (fs.existsSync(path.join(ROOT(), perProjectPath))) {
      const projState = readJson(perProjectPath);
      if (projState) {
        projState[agentKey] = agentEntry;
        projState.project_metadata.total_agents = state.project_metadata.total_agents;
        writeJson(perProjectPath, projState);
      }
    }

    return NextResponse.json({
      success: true,
      agent_id: agentKey,
      agent: agentEntry,
      message: `Agent '${finalName}' created with id ${agentKey}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
