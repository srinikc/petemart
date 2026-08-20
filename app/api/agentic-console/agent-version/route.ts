import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const STATE_FILE = '00_state_ledger/STATE_MATRIX.json';
const PROJ_FILE = '00_state_ledger/projects/petemart/STATE_MATRIX.json';
const EVENTS_FILE = '00_state_ledger/PIPELINE_EVENTS.jsonl';

function readJSON(p: string) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeJSON(p: string, data: any) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function logEvent(evt: any) {
  try {
    fs.appendFileSync(path.join(ROOT, EVENTS_FILE), JSON.stringify(evt) + '\n', 'utf-8');
  } catch {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, output_version, compatibility } = body;

    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

    const statePath = path.join(ROOT, STATE_FILE);
    const state = readJSON(statePath);
    if (!state) return NextResponse.json({ error: 'State matrix not found' }, { status: 500 });

    const agent = state.agent_states?.[agentId];
    if (!agent) return NextResponse.json({ error: `Agent '${agentId}' not found` }, { status: 404 });

    const prevVersion = agent.output_version;
    agent.output_version = output_version ?? (prevVersion || 0) + 1;
    agent.compatibility = compatibility || 'backward-compatible';
    if (!agent.cascade_history) agent.cascade_history = [];

    const cascade: { agentId: string; action: string; reason: string }[] = [];
    if (compatibility === 'breaking') {
      for (const [aid, a] of Object.entries(state.agent_states) as [string, any][]) {
        if (a.dependencies?.includes(agentId)) {
          a.status = 'pending';
          a.last_error = `Cascade reset: upstream ${agentId} v${agent.output_version} (breaking)`;
          cascade.push({ agentId: aid, action: 'reset', reason: `Upstream ${agentId} breaking change v${agent.output_version}` });
        }
      }
    }

    agent.cascade_history.push({
      version: agent.output_version,
      compatibility,
      timestamp: new Date().toISOString(),
      cascaded: cascade,
    });

    writeJSON(statePath, state);

    const projPath = path.join(ROOT, PROJ_FILE);
    if (fs.existsSync(projPath)) {
      const proj = readJSON(projPath);
      if (proj?.agent_states?.[agentId]) {
        proj.agent_states[agentId] = state.agent_states[agentId];
        writeJSON(projPath, proj);
      }
    }

    logEvent({
      type: 'version_change',
      agent_id: agentId,
      prev_version: prevVersion,
      new_version: agent.output_version,
      compatibility,
      cascaded: cascade,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      agentId,
      output_version: agent.output_version,
      compatibility: agent.compatibility,
      cascade,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  const state = readJSON(path.join(ROOT, STATE_FILE));
  const agent = state?.agent_states?.[agentId];
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const downstream = Object.entries(state.agent_states as Record<string, any>)
    .filter(([_, a]) => a.dependencies?.includes(agentId))
    .map(([id, a]) => ({ agentId: id, status: a.status, output_version: a.output_version }));

  return NextResponse.json({
    agentId,
    output_version: agent.output_version || 0,
    compatibility: agent.compatibility || 'backward-compatible',
    cascade_history: agent.cascade_history || [],
    downstream,
  });
}
