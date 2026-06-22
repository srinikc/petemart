import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const TRACES_PATH = path.join(ROOT, '00_state_ledger/traces.jsonl');

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
  const p = statePath(project);
  const tmp = p + '.__tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, p);
  if (project) {
    const root = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
    if (fs.existsSync(root)) {
      const rtmp = root + '.__tmp';
      fs.writeFileSync(rtmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(rtmp, root);
    }
  }
}

function appendTrace(event: any) {
  try {
    event.timestamp = event.timestamp || new Date().toISOString();
    fs.appendFileSync(TRACES_PATH, JSON.stringify(event) + '\n', 'utf-8');
  } catch { /* ignore */ }
}

function appendEvent(event: any) {
  try {
    event.timestamp = event.timestamp || new Date().toISOString();
    const p = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
    fs.appendFileSync(p, JSON.stringify(event) + '\n', 'utf-8');
  } catch { /* ignore */ }
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
          state.supervisor_control.loop_guardrails.idle_cycles = 0;
          state.supervisor_control.loop_guardrails.circuit_breaker = 'CLOSED';
        }
        if (state.supervisor_control?.agent_00_supervisor) {
          state.supervisor_control.agent_00_supervisor.current_action = 'Reset — pipeline operational';
        }
        writeState(project, state);
        return NextResponse.json({ success: true, circuit_breaker_reset: true, idle_cycles_reset: true });

      case 'start_supervisor': {
        const { startSupervisor } = require('../../../../scripts/runtime/supervisorSingleton');
        const result = startSupervisor();
        state.supervisor_control.agent_00_supervisor.status = 'active';
        state.supervisor_control.agent_00_supervisor.last_cycle_timestamp = new Date().toISOString();
        writeState(project, state);
        return NextResponse.json({ success: true, supervisor_status: 'active', result });
      }

      case 'stop_supervisor': {
        const { stopSupervisor } = require('../../../../scripts/runtime/supervisorSingleton');
        stopSupervisor();
        state.supervisor_control.agent_00_supervisor.status = 'idle';
        state.supervisor_control.agent_00_supervisor.daemon_pid = null;
        state.supervisor_control.agent_00_supervisor.daemon_status = 'stopped';
        state.supervisor_control.agent_00_supervisor.daemon_last_heartbeat = null;
        writeState(project, state);
        return NextResponse.json({ success: true, supervisor_status: 'idle' });
      }

      case 'select_llm': {
        const { provider, model, apiKey, baseURL } = body;
        if (!state.supervisor_control.agent_00_supervisor) {
          state.supervisor_control.agent_00_supervisor = {};
        }
        state.supervisor_control.agent_00_supervisor.llm_override = { provider, model };
        if (apiKey) state.supervisor_control.agent_00_supervisor.llm_override.apiKey = apiKey;
        if (baseURL) state.supervisor_control.agent_00_supervisor.llm_override.baseURL = baseURL;
        writeState(project, state);
        return NextResponse.json({ success: true, llm: { provider, model, apiKey: !!apiKey, baseURL } });
      }

      case 'set_supervisor_prompt': {
        const prompt = body.prompt || '';
        const cmdPath = path.join(ROOT, '00_state_ledger/SUPERVISOR_COMMANDS.jsonl');
        fs.appendFileSync(cmdPath, JSON.stringify({
          type: 'set_prompt', prompt, timestamp: new Date().toISOString(),
        }) + '\n', 'utf-8');
        return NextResponse.json({ success: true, prompt });
      }

      case 'rerun_agent': {
        const agentId = body.agentId;
        const instruction = body.feedback || '';
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        const agentKey = Object.keys(state.agent_states).find(k => k.includes(agentId));
        if (!agentKey) {
          return NextResponse.json({ error: `Agent ${agentKey || agentId} not found` }, { status: 404 });
        }
        const agent = state.agent_states[agentKey];
        if (agent.status === 'in_progress' || agent.status === 'active') {
          return NextResponse.json({ error: `Agent ${agentKey} is already running (${agent.status})` }, { status: 409 });
        }
        // Store rollback snapshot
        const rollbackSnapshot = JSON.parse(JSON.stringify(agent));
        state._rollback = state._rollback || {};
        state._rollback[agentKey] = rollbackSnapshot;
        // Archive old artifacts
        if (agent.artifacts_emitted && agent.artifacts_emitted.length > 0) {
          try {
            const baseDir = path.join(ROOT, 'agents');
            const oldDir = path.join(ROOT, `agents/${agentKey}/oldartifacts`);
            if (!fs.existsSync(oldDir)) fs.mkdirSync(oldDir, { recursive: true });
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const manifest = { archived_at: ts, artifacts: agent.artifacts_emitted };
            fs.writeFileSync(path.join(oldDir, `${ts}-manifest.json`), JSON.stringify(manifest, null, 2), 'utf-8');
          } catch { /* ignore */ }
        }
        const now = new Date().toISOString();
        agent.status = 'pending';
        agent.approved = false;
        agent.last_error = null;
        agent.started_at = now;
        agent.stuck_detected_at = null;
        agent.dlq_entry = null;
        agent.last_activity_timestamp = now;
        // Reset execution count so daemon eligibility check (maxExec) doesn't block re-launch
        agent.execution_count = 0;
        // Don't increment execution_count here — runAgent() does it internally
        // Deduplicate user_instructions (keep last 20)
        if (instruction) {
          const existing = agent.user_instruction || '';
          const entries = existing ? existing.split('\\n') : [];
          entries.push(`[${now}] ${instruction}`);
          agent.user_instruction = entries.slice(-20).join('\\n');
        }
        if (agent.expert_reviewer) {
          agent.expert_reviewer.review_status = 'pending';
          agent.expert_reviewer.reviewed_by = null;
          agent.expert_reviewer.reviewed_at = null;
          agent.expert_reviewer.sign_off_granted = false;
        }
        // Reset circuit breaker
        if (state.supervisor_control?.loop_guardrails) {
          state.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = null;
          state.supervisor_control.loop_guardrails.circuit_breaker_reason = null;
        }
        // Cascade downstream recursively
        const cascaded: string[] = [];
        const toReset = new Set<string>();
        const walkDownstream = (targetKey: string) => {
          for (const [id, a] of Object.entries(state.agent_states) as [string, any][]) {
            if (id === targetKey || toReset.has(id)) continue;
            const deps: string[] = a.dependencies || [];
            if (deps.some((d: string) => d === targetKey || d.startsWith(targetKey.split('_')[0]))) {
              toReset.add(id);
              walkDownstream(id);
            }
          }
        };
        walkDownstream(agentKey);
        for (const id of toReset) {
          const a = state.agent_states[id];
          if (a.status === 'approved' || a.status === 'completed' || a.status === 'awaiting_approval') {
            a.status = 'pending';
            a.approved = false;
            a.last_error = `DOWNSTREAM_RESET: Upstream ${agentKey} re-queued — reset to pending`;
            a.started_at = null;
            a.stuck_detected_at = null;
            a.dlq_entry = null;
            cascaded.push(id);
          }
        }
        writeState(project, state);
        appendEvent({
          type: 'rerun_agent', agent_id: agentKey,
          status: 'pending', cascaded_count: cascaded.length,
          timestamp: now,
        });
        appendTrace({
          type: 'action', action: 'rerun_agent', agent_id: agentKey,
          cascaded, instruction, timestamp: now,
        });
        // Daemon will pick up pending status in next cycle — no direct runAgent call
        return NextResponse.json({ success: true, agentId: agentKey, newStatus: 'pending', cascaded });
      }

      case 'cancel_agent': {
        const agentId = body.agentId;
        if (!agentId) {
          return NextResponse.json({ error: 'agentId required' }, { status: 400 });
        }
        const agentKey = Object.keys(state.agent_states).find(k => k.includes(agentId));
        if (!agentKey) {
          return NextResponse.json({ error: `Agent ${agentKey || agentId} not found` }, { status: 404 });
        }
        // Abort via runtime
        const { AgentRuntime } = require('../../../../scripts/runtime/AgentRuntime');
        const aborted = AgentRuntime.abortAgent(agentKey);
        // Restore rollback if available
        const snapshot = state._rollback?.[agentKey];
        if (snapshot) {
          state.agent_states[agentKey] = snapshot;
          state.agent_states[agentKey].last_error = 'CANCELLED_BY_USER';
          state.agent_states[agentKey].status = 'failed';
          state.agent_states[agentKey].started_at = null;
          state.agent_states[agentKey].step_label = null;
          delete state._rollback[agentKey];
        } else {
          const agent = state.agent_states[agentKey];
          agent.status = 'failed';
          agent.last_error = 'CANCELLED_BY_USER';
          agent.started_at = null;
          agent.step_label = null;
        }
        writeState(project, state);
        appendEvent({
          type: 'agent_cancelled', agent_id: agentKey,
          aborted, timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ success: true, agentId: agentKey, newStatus: 'cancelled', aborted });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}