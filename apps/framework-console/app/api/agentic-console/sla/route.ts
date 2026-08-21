import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();

// Expected durations per agent in ms (SLA targets)
const DEFAULT_SLA: Record<string, number> = {
    '00_supervisor_agent': 30000,       // 30s — orchestrator
    '01_ideation_agent': 120000,       // 2m — market research
    '02_requirement_agent': 180000,    // 3m — PRD generation
    '03_architect_agent': 300000,      // 5m — architecture design
    '04_prototype_agent': 600000,      // 10m — POC build
    '05_program_mgmt_agent': 180000,   // 3m — sprint planning
    '06_infra_devops_agent': 300000,   // 5m — CI/CD setup
    '07a_ui_agent': 600000,            // 10m — UI implementation
    '07b_api_agent': 300000,           // 5m — API implementation
    '07c_backend_db_agent': 300000,    // 5m — DB schemas
    '07d_integration_agent': 300000,   // 5m — system integration
    '08_qa_agent': 600000,             // 10m — QA automation
    '09_production_agent': 180000,     // 3m — production deployment
    '10_tech_pub_agent': 180000,       // 3m — documentation
    '11_customer_onboarding_agent': 180000, // 3m
    '12_marketing_agent': 180000,      // 3m — marketing assets
    '13_maintenance_agent': 300000,    // 5m
    '14_finops_agent': 120000,         // 2m — cost check
    '15_secrets_compliance_agent': 120000, // 2m — security scan
};

function statePath(project?: string | null): string {
    if (project) {
        const p = path.join(ROOT, `00_state_ledger/projects/${project}/STATE_MATRIX.json`);
        if (fs.existsSync(p)) return p;
    }
    return path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
}

function readEvents(agentId: string): { durations: number[]; stateChanges: any[] } {
    const eventsPath = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
    if (!fs.existsSync(eventsPath)) return { durations: [], stateChanges: [] };

    const durations: number[] = [];
    const stateChanges: any[] = [];

    const lines = fs.readFileSync(eventsPath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
        try {
            const ev = JSON.parse(line);
            if (ev.agent_id === agentId) {
                stateChanges.push(ev);
            }
        } catch { }
    }

    for (let i = 0; i < stateChanges.length; i++) {
        const ev = stateChanges[i];
        if (ev.from === 'in_progress' || ev.from === 'active') {
            for (let j = i + 1; j < stateChanges.length; j++) {
                const next = stateChanges[j];
                if (next.type === 'agent_state_change' && next.agent_id === agentId) {
                    const start = new Date(ev.timestamp).getTime();
                    const end = new Date(next.timestamp).getTime();
                    if (end > start) durations.push(end - start);
                    break;
                }
            }
        }
    }

    return { durations, stateChanges };
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

    const slaResults: Record<string, {
        expected_duration_ms: number;
        avg_duration_ms: number;
        execution_count: number;
        status: string;
        role: string;
        overdue: boolean;
        pct_of_sla: number;
        last_started_at: string | null;
    }> = {};

    let overdueCount = 0;
    let onTrackCount = 0;

    for (const agentId of agentIds) {
        const a = agents[agentId];
        const expected = DEFAULT_SLA[agentId] || 300000; // default 5min
        const execCount = a.execution_count || 0;
        const status = a.status || 'unknown';

        const { durations } = readEvents(agentId);
        const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
            : 0;

        const pctOfSla = expected > 0 ? Math.round((avgDuration / expected) * 100) : 0;
        const overdue = avgDuration > 0 && pctOfSla > 100;

        if (avgDuration > 0) {
            if (overdue) overdueCount++;
            else onTrackCount++;
        }

        slaResults[agentId] = {
            expected_duration_ms: expected,
            avg_duration_ms: avgDuration,
            execution_count: execCount,
            status,
            role: a.role || '',
            overdue,
            pct_of_sla: pctOfSla,
            last_started_at: a.started_at || null,
        };
    }

    return NextResponse.json({
        sla: slaResults,
        aggregate: {
            total_agents: agentIds.length,
            agents_with_data: overdueCount + onTrackCount,
            overdue_count: overdueCount,
            on_track_count: onTrackCount,
        },
        timestamp: new Date().toISOString(),
    }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
}