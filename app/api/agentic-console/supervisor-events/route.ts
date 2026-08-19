import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

const SUPERVISOR_EVENT_PREFIXES = [
  'agent_launched', 'auto_launched', 'agent_awaiting_approval',
  'compliance_failed', 'compliance_blocked', 'circuit_breaker',
  'pipeline_', 'agent_state_change', 'dependency_cascade_reset',
  'upstream_change_detected', 'upstream_cascade_reset',
  'downstream_queued', 'downstream_activated', 'health_check_failed',
  'max_idle_cycles_reached', 'checkpoint_start', 'checkpoint_complete',
  'step_label', 'cycle_',
];

export async function GET() {
  try {
    const eventsPath = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
    if (!fs.existsSync(eventsPath)) {
      return NextResponse.json({ events: [] });
    }

    const content = fs.readFileSync(eventsPath, 'utf-8');
    const allLines = content.split('\n').filter(Boolean);
    const events = [];

    for (const line of allLines) {
      try {
        const ev = JSON.parse(line);
        // Filter: supervisor agent events OR known supervisor prefixes
        if (ev.agent_id === '00_supervisor_agent' || SUPERVISOR_EVENT_PREFIXES.some(p => ev.type?.startsWith(p))) {
          events.push({
            type: ev.type,
            agent_id: ev.agent_id,
            label: ev.label,
            detail: ev.detail || ev.reason || ev.name || '',
            phase: ev.phase,
            total: ev.total,
            duration_ms: ev.duration_ms || ev.duration,
            error: ev.error || null,
            timestamp: ev.timestamp,
          });
        }
      } catch {}
    }

    // Newest first
    events.reverse();

    return NextResponse.json({
      events: events.slice(0, 500),
      total: events.length,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, events: [] }, { status: 500 });
  }
}
