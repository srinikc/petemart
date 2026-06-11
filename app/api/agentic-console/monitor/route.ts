import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROOT = process.cwd();
const STUCK_TIMEOUT_MS = 5 * 60 * 1000;

function statePath(project?: string | null): string {
  if (project) {
    const p = path.join(ROOT, `00_state_ledger/projects/${project}/STATE_MATRIX.json`);
    if (fs.existsSync(p)) return p;
  }
  return path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
}

function readState(project?: string | null): any {
  try { return JSON.parse(fs.readFileSync(statePath(project), 'utf-8')); } catch { return null; }
}

function writeState(project: string | null | undefined, state: any): boolean {
  try { fs.writeFileSync(statePath(project), JSON.stringify(state, null, 2), 'utf-8'); return true; } catch { return false; }
}

function appendEvent(event: any): void {
  try {
    event.timestamp = event.timestamp || new Date().toISOString();
    fs.appendFileSync(path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl'), JSON.stringify(event) + '\n', 'utf-8');
  } catch { /* ignore */ }
}

function cascadeDownstream(agentId: string, state: any): string[] {
  const cascaded: string[] = [];
  const agents = state.agent_states || {};
  for (const [id, a] of Object.entries(agents) as [string, any][]) {
    if ((a.dependencies || []).includes(agentId) && a.status === 'pending') {
      a.status = 'pending';
      a.last_error = `DOWNSTREAM_CASCADE: Upstream ${agentId} failed — reset to pending`;
      cascaded.push(id);
    }
  }
  return cascaded;
}

export async function GET(req: NextRequest) {
    const action = req.nextUrl.searchParams.get('action') || 'status';
    const project = req.nextUrl.searchParams.get('project') || null;

    if (action === 'status') {
        const state = readState(project);
        if (!state) return NextResponse.json({ error: 'Cannot read state' }, { status: 500 });

        const agentStates = state.agent_states || {};
        const supervisorCtrl = state.supervisor_control || {};
        const pipelineCtrl = state.pipeline_control || {};

        // Detect stuck agents
        const now = Date.now();
        const stuckThreshold = pipelineCtrl.stuck_agent_timeout_ms || STUCK_TIMEOUT_MS;
        const stuck: any[] = [];
        const running: any[] = [];

        for (const [id, agent] of Object.entries(agentStates) as [string, any][]) {
            if (agent.status === 'active' || agent.status === 'in_progress') {
                const startedAt = agent.started_at ? new Date(agent.started_at).getTime() : null;
                const durationMs = startedAt ? now - startedAt : 0;
                const isStuck = startedAt && durationMs > (agent.timeout_threshold_ms || stuckThreshold);

                const entry = {
                    agent_id: id,
                    status: agent.status,
                    started_at: agent.started_at || null,
                    duration_ms: durationMs,
                    duration_label: formatDuration(durationMs),
                    timeout_ms: agent.timeout_threshold_ms || stuckThreshold,
                    is_stuck: isStuck,
                    step_label: agent.step_label || null,
                    current_step: agent.current_step || 0,
                    steps_total: agent.steps_total || 0,
                    estimated_remaining_ms: agent.estimated_remaining_ms || null,
                };

                if (isStuck) stuck.push(entry);
                else running.push(entry);
            }
        }

        return NextResponse.json({
            supervisor: {
                status: supervisorCtrl?.agent_00_supervisor?.status || 'unknown',
                current_action: supervisorCtrl?.agent_00_supervisor?.current_action || null,
                next_dispatch: supervisorCtrl?.agent_00_supervisor?.next_agent_to_dispatch || null,
                dispatch_queue: supervisorCtrl?.agent_00_supervisor?.dispatch_queue || [],
                cycle_count: supervisorCtrl?.agent_00_supervisor?.cycle_count || 0,
                last_cycle: supervisorCtrl?.agent_00_supervisor?.last_cycle_timestamp || null,
            },
            stuck_monitor: {
                enabled: !!pipelineCtrl.stuck_agent_check_enabled,
                timeout_ms: stuckThreshold,
                stuck_agents: stuck,
                running_agents: running,
                detected_history: supervisorCtrl?.stuck_agent_monitor?.stuck_agents_detected || [],
            },
            pipeline: {
                paused: !!pipelineCtrl.is_pipeline_paused,
                current_phase: pipelineCtrl.current_phase || null,
            },
            timestamp: new Date().toISOString(),
        });
    }

    if (action === 'detect-stuck') {
        const state = readState(project);
        if (!state) return NextResponse.json({ error: 'Cannot read state' }, { status: 500 });

        const agentStates = state.agent_states || {};
        const supervisorCtrl = state.supervisor_control || {};
        const pipelineCtrl = state.pipeline_control || {};
        const now = Date.now();
        const stuckThreshold = pipelineCtrl.stuck_agent_timeout_ms || STUCK_TIMEOUT_MS;
        const monitorCfg = supervisorCtrl.stuck_agent_monitor || {};
        const relayCounts: Record<string, number> = {};
        const cascadedAgents: string[] = [];
        const dlqEntries: any[] = [];

        for (const [id, agent] of Object.entries(agentStates) as [string, any][]) {
            if (agent.status === 'active' || agent.status === 'in_progress') {
                const startedAt = agent.started_at ? new Date(agent.started_at).getTime() : null;
                const durationMs = startedAt ? now - startedAt : 0;
                if (startedAt && durationMs > (agent.timeout_threshold_ms || stuckThreshold)) {
                    const execCount = agent.execution_count || 0;
                    const maxRelay = monitorCfg.max_relaunch_attempts || 2;
                    const shouldAutoRelay = monitorCfg.auto_relaunch_on_stuck && execCount < maxRelay;
                    const backoffSec = Math.min(30 * Math.pow(2, execCount), 300);

                    // RCA log
                    const rcaEntry = {
                        agent_id: id, detected_at: new Date().toISOString(),
                        duration_ms: durationMs, execution_count: execCount,
                        action: shouldAutoRelay ? 'auto_relaunch' : 'marked_failed_with_dlq',
                        backoff_seconds: shouldAutoRelay ? backoffSec : 0,
                        reason: `Stuck for ${formatDuration(durationMs)} (timeout: ${formatDuration(agent.timeout_threshold_ms || stuckThreshold)})`,
                    };

                    if (shouldAutoRelay) {
                        agent.status = 'pending';
                        agent.last_error = null;
                        agent.stuck_detected_at = null;
                        agent.started_at = null;
                        agent.execution_count = execCount + 1;
                        agent.estimated_remaining_ms = null;
                        relayCounts[id] = execCount + 1;

                        appendEvent({
                            type: 'stuck_agent_auto_relaunched',
                            agent_id: id, duration_ms: durationMs,
                            attempt: execCount + 1, backoff_seconds: backoffSec,
                            max_attempts: maxRelay, timestamp: new Date().toISOString(),
                        });
                    } else {
                        // Mark failed, cascade downstream, write DLQ
                        agent.status = 'failed';
                        agent.stuck_detected_at = new Date().toISOString();
                        agent.last_error = `STUCK_EXHAUSTED: Agent stuck for ${formatDuration(durationMs)} after ${execCount} attempt(s). Auto-detected by monitor.`;
                        if (!agent.dlq_entry) {
                            agent.dlq_entry = { failed_at: new Date().toISOString(), reason: agent.last_error, attempts: execCount, cascade_downstream: true };
                        }
                        dlqEntries.push(id);
                        const cascaded = cascadeDownstream(id, state);
                        cascadedAgents.push(...cascaded);

                        appendEvent({
                            type: 'stuck_agent_failed',
                            agent_id: id, duration_ms: durationMs,
                            attempts: execCount, cascaded_downstream: cascaded,
                            dlq_written: true, timestamp: new Date().toISOString(),
                        });
                    }

                    // Update stuck_agent_monitor history
                    if (!supervisorCtrl.stuck_agent_monitor) {
                        supervisorCtrl.stuck_agent_monitor = { enabled: true, timeout_threshold_ms: stuckThreshold, check_interval_ms: 15000, auto_kill_on_stuck: true, auto_relaunch_on_stuck: false, max_relaunch_attempts: 2, stuck_agents_detected: [] };
                    }
                    supervisorCtrl.stuck_agent_monitor.stuck_agents_detected.push(rcaEntry);
                }
            }
        }

        if (dlqEntries.length > 0 || Object.keys(relayCounts).length > 0) {
            if (supervisorCtrl.agent_00_supervisor) {
                const parts: string[] = [];
                if (Object.keys(relayCounts).length > 0) parts.push(`Auto-relaunched: ${Object.entries(relayCounts).map(([k, v]) => `${k} (attempt ${v})`).join(', ')}`);
                if (dlqEntries.length > 0) parts.push(`DLQ: ${dlqEntries.join(', ')}`);
                if (cascadedAgents.length > 0) parts.push(`Cascaded: ${cascadedAgents.join(', ')}`);
                supervisorCtrl.agent_00_supervisor.current_action = `Monitor — ${parts.join('; ')}`;
            }
            writeState(project, state);
        }

        return NextResponse.json({
            auto_relaunched: Object.keys(relayCounts).length,
            relaunch_details: relayCounts,
            dlq_written: dlqEntries,
            cascaded_downstream: cascadedAgents,
            timestamp: new Date().toISOString(),
        });
    }

    if (action === 'relaunch') {
        const agentId = req.nextUrl.searchParams.get('agent_id');
        if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

        const state = readState(project);
        if (!state) return NextResponse.json({ error: 'Cannot read state' }, { status: 500 });

        const agent = state.agent_states?.[agentId];
        if (!agent) return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });

        agent.status = 'pending';
        agent.last_error = null;
        agent.stuck_detected_at = null;
        agent.started_at = null;
        agent.execution_count = (agent.execution_count || 0) + 1;

        appendEvent({
            type: 'agent_relaunched',
            agent_id: agentId,
            reason: 'Manual relaunch from monitor',
            timestamp: new Date().toISOString(),
        });

        writeState(project, state);

        return NextResponse.json({
            success: true,
            agent_id: agentId,
            new_status: 'pending',
            execution_count: agent.execution_count,
            message: `Agent ${agentId} reset and queued for relaunch`,
            timestamp: new Date().toISOString(),
        });
    }

    // DLQ list
    if (action === 'dlq') {
        const state = readState(project);
        if (!state) return NextResponse.json({ error: 'Cannot read state' }, { status: 500 });
        const agents = state.agent_states || {};
        const dlq: any[] = [];
        for (const [id, a] of Object.entries(agents) as [string, any][]) {
            if (a.dlq_entry || (a.status === 'failed' && a.stuck_detected_at && (a.execution_count || 0) >= 2)) {
                dlq.push({ agent_id: id, status: a.status, execution_count: a.execution_count, dlq_entry: a.dlq_entry, last_error: a.last_error, stuck_detected_at: a.stuck_detected_at });
            }
        }
        return NextResponse.json({ dlq, count: dlq.length, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

function formatDuration(ms: number): string {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}m ${s}s`;
}
