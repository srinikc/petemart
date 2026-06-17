import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROOT = process.cwd();
const EVENTS_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const CACHE_TTL = 5000;

let stateCache: { data: any; timestamp: number; path: string } | null = null;

function readStateCached(statePath: string): any {
  const now = Date.now();
  if (stateCache && stateCache.path === statePath && (now - stateCache.timestamp) < CACHE_TTL) {
    return stateCache.data;
  }
  const raw = fs.readFileSync(statePath, 'utf-8');
  const data = JSON.parse(raw);
  stateCache = { data, timestamp: now, path: statePath };
  return data;
}

function statePath(project?: string | null): string {
  if (project) {
    const p = path.join(ROOT, `00_state_ledger/projects/${project}/STATE_MATRIX.json`);
    if (fs.existsSync(p)) return p;
  }
  return path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
}

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since');
  const pollMs = parseInt(req.nextUrl.searchParams.get('poll') || '5000', 10);
  const project = req.nextUrl.searchParams.get('project');
  const STATE_PATH = statePath(project);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastRead = since || new Date(0).toISOString();
      let lastStuckCheck = 0;

      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Detect stuck agents
      const checkStuckAgents = () => {
        try {
          const state = readStateCached(STATE_PATH);
          const now = Date.now();
          const threshold = state.pipeline_control?.stuck_agent_timeout_ms || 300000;
          const stuck: any[] = [];
          const agents = state.agent_states || {};

          for (const [id, a] of Object.entries(agents) as [string, any][]) {
            if ((a.status === 'active' || a.status === 'in_progress') && a.started_at) {
              const elapsed = now - new Date(a.started_at).getTime();
              const timeout = a.timeout_threshold_ms || threshold;
              if (elapsed > timeout) {
                stuck.push({
                  agent_id: id,
                  elapsed_ms: elapsed,
                  timeout_ms: timeout,
                  step_label: a.step_label || null,
                });
              }
            }
          }

          if (stuck.length > 0) {
            sendEvent('stuck_agents', stuck);
          }
        } catch { /* ignore */ }
      };

      // Send initial state snapshot
      try {
        const state = readStateCached(STATE_PATH);
        sendEvent('state_snapshot', {
          stateMatrix: state,
          timestamp: new Date().toISOString(),
        });
      } catch { /* ignore */ }

      const check = () => {
        try {
          if (fs.existsSync(EVENTS_PATH)) {
            const content = fs.readFileSync(EVENTS_PATH, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            const newEvents = lines
              .map(l => { try { return JSON.parse(l); } catch { return null; } })
              .filter(e => e && e.timestamp > lastRead);

            if (newEvents.length > 0) {
              lastRead = newEvents[newEvents.length - 1].timestamp;
              sendEvent('events', newEvents);
            }
          }

          // Also send fresh state periodically (uses cache, TTL 5s)
          const state = readStateCached(STATE_PATH);
          sendEvent('state_update', {
            stateMatrix: state,
            timestamp: new Date().toISOString(),
          });

          // Check for stuck agents every 15s
          if (Date.now() - lastStuckCheck > 15000) {
            lastStuckCheck = Date.now();
            checkStuckAgents();
          }
        } catch { /* ignore */ }
      };

      const interval = setInterval(check, pollMs);

      // Send keepalive every 30s
      const keepalive = setInterval(() => {
        sendEvent('keepalive', { ts: new Date().toISOString() });
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(keepalive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
