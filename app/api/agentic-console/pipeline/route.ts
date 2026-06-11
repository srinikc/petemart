import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

function statePath(project?: string | null): string {
  if (project) {
    const p = path.join(ROOT, `00_state_ledger/projects/${project}/STATE_MATRIX.json`);
    if (fs.existsSync(p)) return p;
  }
  return path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
}

function readState(project?: string | null): any {
  return JSON.parse(fs.readFileSync(statePath(project), 'utf-8'));
}

function writeState(project: string | null | undefined, data: any) {
  fs.writeFileSync(statePath(project), JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, project: projectParam } = body;
    const project = projectParam || req.nextUrl.searchParams.get('project');
    const state = readState(project);

    switch (action) {
      case 'pause':
        state.pipeline_control.is_pipeline_paused = true;
        writeState(project, state);
        return NextResponse.json({ success: true, paused: true });

      case 'resume':
        state.pipeline_control.is_pipeline_paused = false;
        writeState(project, state);
        return NextResponse.json({ success: true, paused: false });

      case 'reset_circuit_breaker':
        if (state.supervisor_control?.loop_guardrails) {
          state.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = null;
          state.supervisor_control.loop_guardrails.circuit_breaker_reason = null;
        }
        writeState(project, state);
        return NextResponse.json({ success: true, circuit_breaker_reset: true });

      case 'rerun_agent': {
        const agentId = body.agentId;
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        const agentKey = Object.keys(state.agent_states).find(k => k.includes(agentId));
        if (!agentKey) {
          return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
        }
        const agent = state.agent_states[agentKey];
        agent.status = 'pending';
        agent.approved = false;
        agent.last_error = null;
        agent.last_activity_timestamp = new Date().toISOString();
        if (agent.expert_reviewer) {
          agent.expert_reviewer.review_status = 'pending';
          agent.expert_reviewer.reviewed_by = null;
          agent.expert_reviewer.reviewed_at = null;
          agent.expert_reviewer.sign_off_granted = false;
        }
        writeState(project, state);
        return NextResponse.json({ success: true, agentId: agentKey, newStatus: 'pending' });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
