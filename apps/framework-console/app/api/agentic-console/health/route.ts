import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROOT = frameworkRoot();

function statePath(project?: string | null): string {
    if (project) {
        const p = path.join(ROOT, `00_state_ledger/projects/${project}/STATE_MATRIX.json`);
        if (fs.existsSync(p)) return p;
    }
    return path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
}

function readAllEvents(): Map<string, { durations: number[]; stateChanges: any[] }> {
    const eventsPath = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
    const result = new Map<string, { durations: number[]; stateChanges: any[] }>();

    if (!fs.existsSync(eventsPath)) return result;

    const raw = fs.readFileSync(eventsPath, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);

    // If > 10000 lines, only parse the last 10000 (recent events suffice for health)
    const tail = lines.length > 10000 ? lines.slice(-10000) : lines;

    const perAgent: Record<string, any[]> = {};
    for (const line of tail) {
        try {
            const ev = JSON.parse(line);
            const aid = ev.agent_id;
            if (!aid) continue;
            if (!perAgent[aid]) perAgent[aid] = [];
            perAgent[aid].push(ev);
        } catch { }
    }

    for (const [agentId, events] of Object.entries(perAgent)) {
        const durations: number[] = [];
        const stateChanges: any[] = [];
        for (const ev of events) {
            stateChanges.push(ev);
        }
        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            if (ev.from === 'in_progress' || ev.from === 'active') {
                for (let j = i + 1; j < events.length; j++) {
                    const next = events[j];
                    if (next.type === 'agent_state_change' && next.agent_id === agentId) {
                        const start = new Date(ev.timestamp).getTime();
                        const end = new Date(next.timestamp).getTime();
                        if (end > start) {
                            durations.push(end - start);
                        }
                        break;
                    }
                }
            }
        }
        result.set(agentId, { durations, stateChanges });
    }

    return result;
}

export async function GET(req: NextRequest) {
    const project = req.nextUrl.searchParams.get('project');
    const sp = statePath(project);

    if (!fs.existsSync(sp)) {
        return NextResponse.json({ error: 'State file not found' }, { status: 404 });
    }

    const stateRaw = fs.readFileSync(sp, 'utf-8');
    let state: any;
    try {
        state = JSON.parse(stateRaw);
    } catch {
        return NextResponse.json({ error: 'Invalid state file' }, { status: 500 });
    }

    const agents = state.agent_states || {};
    const agentIds = Object.keys(agents);

    // Read events file ONCE
    const eventsMap = readAllEvents();

    const metrics: Record<string, {
        error_rate: number;
        avg_duration_ms: number;
        success_rate: number;
        execution_count: number;
        last_error: string | null;
        status: string;
        role: string;
    }> = {};

    let totalFailed = 0;
    let totalSuccessRateSum = 0;
    let successRateCount = 0;

    for (const agentId of agentIds) {
        const a = agents[agentId];
        const execCount = a.execution_count || 0;
        const status = a.status || 'unknown';
        const isFailed = status === 'failed';
        const isSuccess = status === 'approved' || status === 'completed';
        const isActive = status === 'active' || status === 'in_progress' || status === 'awaiting_approval';

        const errorRate = execCount > 0 ? (isFailed ? 1 : 0) : 0;
        const successRate = execCount > 0 ? (isSuccess ? 1 : 0) : 1;

        if (status === 'failed') totalFailed++;

        const agentEvents = eventsMap.get(agentId);
        const durations = agentEvents?.durations || [];
        const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
            : 0;

        const last_error = a.last_error || null;

        metrics[agentId] = {
            error_rate: parseFloat(errorRate.toFixed(4)),
            avg_duration_ms: avgDuration,
            success_rate: parseFloat(successRate.toFixed(4)),
            execution_count: execCount,
            last_error,
            status,
            role: a.role || '',
        };

        if (execCount > 0) {
            totalSuccessRateSum += successRate;
            successRateCount++;
        }
    }

    const totalAgents = agentIds.length;
    const activeAgents = agentIds.filter(id => {
        const s = agents[id].status;
        return s === 'active' || s === 'in_progress' || s === 'awaiting_approval';
    }).length;

    const aggregate = {
        total_agents: totalAgents,
        active_agents: activeAgents,
        failed_agents: totalFailed,
        avg_success_rate: successRateCount > 0
            ? parseFloat((totalSuccessRateSum / successRateCount).toFixed(4))
            : 1,
    };

    return NextResponse.json({
        metrics,
        aggregate,
        timestamp: new Date().toISOString(),
    }, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
