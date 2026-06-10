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
    const { agentId, action, feedback, inputs } = await req.json();
    if (!agentId || !action) {
      return NextResponse.json({ error: 'agentId and action required' }, { status: 400 });
    }

    const state = readState();
    const agentKey = Object.keys(state.agent_states).find(k => k.includes(agentId));
    if (!agentKey) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    const agent = state.agent_states[agentKey];

    if (action === 'approve') {
      agent.approved = true;
      agent.status = 'approved';
      agent.approved_by = 'Human Gatekeeper (via Agentic Console)';
      agent.approved_at = new Date().toISOString();
      if (agent.expert_reviewer) {
        agent.expert_reviewer.review_status = 'completed';
        agent.expert_reviewer.reviewed_by = 'Human Gatekeeper (via Agentic Console)';
        agent.expert_reviewer.reviewed_at = new Date().toISOString();
        agent.expert_reviewer.sign_off_required = true;
        agent.expert_reviewer.sign_off_granted = true;
        if (feedback) {
          agent.expert_reviewer.review_feedback = [
            ...(agent.expert_reviewer.review_feedback || []),
            feedback,
          ];
        }
      }
      agent.last_activity_timestamp = new Date().toISOString();
    } else if (action === 'reject') {
      agent.approved = false;
      agent.status = 'failed';
      agent.last_error = feedback || 'Rejected by human gatekeeper';
      if (agent.expert_reviewer) {
        agent.expert_reviewer.review_status = 'completed';
        agent.expert_reviewer.reviewed_by = 'Human Gatekeeper (via Agentic Console)';
        agent.expert_reviewer.reviewed_at = new Date().toISOString();
        agent.expert_reviewer.sign_off_granted = false;
        if (feedback) {
          agent.expert_reviewer.review_feedback = [
            ...(agent.expert_reviewer.review_feedback || []),
            feedback,
          ];
        }
      }
      agent.last_activity_timestamp = new Date().toISOString();
    } else if (action === 'open_gate') {
      const gate = state.supervisor_control.approval_gates.find(
        (g: any) => g.gate_id === agentId
      );
      if (!gate) {
        return NextResponse.json({ error: `Gate ${agentId} not found` }, { status: 404 });
      }
      gate.status = 'approved';
      gate.approved = true;
      gate.approved_by = 'Human Gatekeeper (via Agentic Console)';
      gate.approved_at = new Date().toISOString();
      gate.notes = feedback || gate.notes;
    } else if (action === 'provide-input') {
      agent.pending_inputs = [];
      agent.provided_inputs = { ...(agent.provided_inputs || {}), ...(inputs || {}) };
      agent.status = 'pending';
      agent.last_error = null;
      agent.last_activity_timestamp = new Date().toISOString();
      agent.inputs_provided_at = new Date().toISOString();
    } else if (action === 'disable') {
      agent.disabled = true;
      agent.status = 'blocked';
      agent.last_error = 'Disabled by human gatekeeper via Dashboard';
      agent.last_activity_timestamp = new Date().toISOString();
    } else if (action === 'enable') {
      agent.disabled = false;
      agent.status = 'pending';
      agent.last_error = null;
      agent.last_activity_timestamp = new Date().toISOString();
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    state.pipeline_control.last_sync_timestamp = new Date().toISOString();
    writeState(state);

    return NextResponse.json({ success: true, agent: agentKey, action, newStatus: agent.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
