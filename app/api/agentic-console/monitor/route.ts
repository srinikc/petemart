import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STATE_PATH = path.join(process.cwd(), '00_state_ledger/STATE_MATRIX.json');
const EVENTS_PATH = path.join(process.cwd(), '00_state_ledger/PIPELINE_EVENTS.jsonl');

const STUCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min default

function readState(): any {
    try {
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    } catch { return null; }
}

function writeState(state: any): boolean {
    try {
        fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
        return true;
    } catch { return false; }
}

function appendEvent(event: any): void {
    try {
        event.timestamp = event.timestamp || new Date().toISOString();
        fs.appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n', 'utf-8');
    } catch { /* ignore */ }
}

export async function GET(req: NextRequest) {
    const action = req.nextUrl.searchParams.get('action') || 'status';

    if (action === 'status') {
        const state = readState();
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
        const state = readState();
        if (!state) return NextResponse.json({ error: 'Cannot read state' }, { status: 500 });

        const agentStates = state.agent_states || {};
        const supervisorCtrl = state.supervisor_control || {};
        const pipelineCtrl = state.pipeline_control || {};
        const now = Date.now();
        const stuckThreshold = pipelineCtrl.stuck_agent_timeout_ms || STUCK_TIMEOUT_MS;
        const detected: any[] = [];

        for (const [id, agent] of Object.entries(agentStates) as [string, any][]) {
            if (agent.status === 'active' || agent.status === 'in_progress') {
                const startedAt = agent.started_at ? new Date(agent.started_at).getTime() : null;
                const durationMs = startedAt ? now - startedAt : 0;
                if (startedAt && durationMs > (agent.timeout_threshold_ms || stuckThreshold)) {
                    detected.push({
                        agent_id: id,
                        started_at: agent.started_at,
                        duration_ms: durationMs,
                        timeout_ms: agent.timeout_threshold_ms || stuckThreshold,
                    });

                    // Auto-mark as failed
                    agent.status = 'failed';
                    agent.stuck_detected_at = new Date().toISOString();
                    agent.last_error = `STUCK_TIMEOUT: Agent stuck in ${agent.status} for ${formatDuration(durationMs)}. Auto-detected by monitor.`;

                    appendEvent({
                        type: 'stuck_agent_detected',
                        agent_id: id,
                        duration_ms: durationMs,
                        action_taken: 'marked_failed',
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }

        if (detected.length > 0) {
            // Update stuck_agent_monitor history
            if (!supervisorCtrl.stuck_agent_monitor) {
                supervisorCtrl.stuck_agent_monitor = { enabled: true, timeout_threshold_ms: stuckThreshold, check_interval_ms: 15000, auto_kill_on_stuck: true, auto_relaunch_on_stuck: false, max_relaunch_attempts: 2, stuck_agents_detected: [] };
            }
            for (const d of detected) {
                supervisorCtrl.stuck_agent_monitor.stuck_agents_detected.push({
                    agent_id: d.agent_id,
                    started_at: d.started_at,
                    detected_at: new Date().toISOString(),
                    action_taken: 'marked_failed',
                    duration_ms: d.duration_ms,
                });
            }
            // Update supervisor current_action
            if (supervisorCtrl.agent_00_supervisor) {
                supervisorCtrl.agent_00_supervisor.current_action = `Detected ${detected.length} stuck agent(s): ${detected.map(d => d.agent_id).join(', ')} — marked as failed`;
            }
            writeState(state);
        }

        return NextResponse.json({
            detected,
            count: detected.length,
            message: detected.length > 0 ? `Marked ${detected.length} stuck agent(s) as failed` : 'No stuck agents detected',
            timestamp: new Date().toISOString(),
        });
    }

    if (action === 'relaunch') {
        const agentId = req.nextUrl.searchParams.get('agent_id');
        if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

        const state = readState();
        if (!state) return NextResponse.json({ error: 'Cannot read state' }, { status: 500 });

        const agent = state.agent_states?.[agentId];
        if (!agent) return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });

        // Reset agent for relaunch
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

        writeState(state);

        return NextResponse.json({
            success: true,
            agent_id: agentId,
            new_status: 'pending',
            execution_count: agent.execution_count,
            message: `Agent ${agentId} reset and queued for relaunch`,
            timestamp: new Date().toISOString(),
        });
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
