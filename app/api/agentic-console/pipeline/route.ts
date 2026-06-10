import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const STATE_PATH = path.join(process.cwd(), '00_state_ledger/STATE_MATRIX.json');

function readState(): any {
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
}

function writeState(data: any) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    const state = readState();

    switch (action) {
      case 'pause':
        state.pipeline_control.is_pipeline_paused = true;
        writeState(state);
        return NextResponse.json({ success: true, paused: true });

      case 'resume':
        state.pipeline_control.is_pipeline_paused = false;
        writeState(state);
        return NextResponse.json({ success: true, paused: false });

      case 'reset_circuit_breaker':
        if (state.supervisor_control?.loop_guardrails) {
          state.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = null;
          state.supervisor_control.loop_guardrails.circuit_breaker_reason = null;
        }
        writeState(state);
        return NextResponse.json({ success: true, circuit_breaker_reset: true });

      case 'rerun_agent': {
        const { agentId } = await req.json();
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
        writeState(state);
        return NextResponse.json({ success: true, agentId: agentKey, newStatus: 'pending' });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
