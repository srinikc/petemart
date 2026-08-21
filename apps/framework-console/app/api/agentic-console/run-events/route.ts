import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId');
  const project = req.nextUrl.searchParams.get('project');
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  const eventsPath = project
    ? path.join(ROOT, `00_state_ledger/projects/${project}/PIPELINE_EVENTS.jsonl`)
    : path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');

  if (!fs.existsSync(eventsPath)) return NextResponse.json({ runs: [] });

  const lines = fs.readFileSync(eventsPath, 'utf-8').split('\n').filter(Boolean);
  const agentEvents = [];
  for (const line of lines) {
    try {
      const ev = JSON.parse(line);
      if (ev.agent_id === agentId) agentEvents.push(ev);
    } catch {}
  }

  // Event types that START a run
  const isRunStart = (ev: any) =>
    (ev.type === 'agent_state_change' && (ev.to === 'in_progress' || ev.to === 'active'))
    || ev.type === 'daemon_dispatch'
    || ev.type === 'agent_started';

  // Event types that END a run
  const isRunEnd = (ev: any) =>
    (ev.type === 'agent_state_change' && (ev.to === 'awaiting_approval' || ev.to === 'completed' || ev.to === 'approved' || ev.to === 'failed'))
    || ev.type === 'daemon_agent_completed'
    || ev.type === 'daemon_agent_failed'
    || ev.type === 'agent_completed'
    || ev.type === 'agent_cancelled';

  // Group events into runs
  const runs: any[] = [];
  let currentRun: any = null;
  for (const ev of agentEvents) {
    if (isRunStart(ev)) {
      if (currentRun) runs.push(currentRun);
      currentRun = { started_at: ev.timestamp, from_status: ev.from || 'pending', events: [ev], ended_at: null, final_status: null, duration_ms: null, run_id: ev.run_id || null };
    } else if (isRunEnd(ev) && currentRun) {
      currentRun.ended_at = ev.timestamp;
      currentRun.final_status = ev.type === 'daemon_agent_failed' || ev.type === 'agent_cancelled' ? 'failed' : ev.to || 'completed';
      currentRun.duration_ms = new Date(ev.timestamp).getTime() - new Date(currentRun.started_at).getTime();
      currentRun.events.push(ev);
      runs.push(currentRun);
      currentRun = null;
    } else if (currentRun) {
      currentRun.events.push(ev);
    }
  }
  if (currentRun) runs.push(currentRun);

  runs.reverse(); // newest first
  return NextResponse.json({ runs: runs.slice(0, 20) });
}
