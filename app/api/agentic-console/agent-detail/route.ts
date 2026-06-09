import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

function safeReadJSON(relPath: string) {
    try {
        const p = path.join(ROOT, relPath);
        if (!fs.existsSync(p)) return null;
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch { return null; }
}

export async function GET(request: NextRequest) {
    const agentId = request.nextUrl.searchParams.get('agentId');
    if (!agentId) {
        return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    const stateMatrix = safeReadJSON('00_state_ledger/STATE_MATRIX.json');
    const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');

    const agentState = stateMatrix?.agent_states?.[agentId] || null;
    const registryEntry = agentRegistry?.agents?.[agentId] || null;

    // Build upstream artifact list (consumed inputs)
    const consumedArtifacts: { depId: string; files: string[]; status: string }[] = [];
    if (agentState?.dependencies) {
        for (const depId of agentState.dependencies) {
            const depState = stateMatrix?.agent_states?.[depId];
            const depFiles = depState?.artifacts_emitted || [];
            consumedArtifacts.push({
                depId,
                files: depFiles,
                status: depState?.status || 'unknown',
            });
        }
    }

    // Read system prompt from registry
    const systemPrompt = registryEntry?.system_prompt || '';

    // Last error from state
    const lastError = agentState?.last_error || null;

    // Verify agent's own artifacts exist on disk
    const artifactStatus = (agentState?.artifacts_emitted || []).map((file: string) => {
        const fullPath = path.join(ROOT, file);
        const exists = fs.existsSync(fullPath);
        return { file, exists, size: exists ? fs.statSync(fullPath).size : 0 };
    });

    // Read relevant pipeline events for this agent
    const eventsPath = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
    let agentEvents: any[] = [];
    try {
        if (fs.existsSync(eventsPath)) {
            const content = fs.readFileSync(eventsPath, 'utf-8');
            agentEvents = content.trim().split('\n')
                .filter(Boolean)
                .map(l => { try { return JSON.parse(l); } catch { return null; } })
                .filter(e => e && (e.agent_id === agentId || e.agent_ids?.includes(agentId)));
        }
    } catch { /* ignore */ }

    return NextResponse.json({
        agentState,
        registryEntry,
        consumedArtifacts,
        systemPrompt,
        lastError,
        artifactStatus,
        agentEvents,
        timestamp: new Date().toISOString(),
    });
}