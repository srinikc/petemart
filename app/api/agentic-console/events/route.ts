import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EVENTS_PATH = path.join(process.cwd(), '00_state_ledger/PIPELINE_EVENTS.jsonl');
const STATE_PATH = path.join(process.cwd(), '00_state_ledger/STATE_MATRIX.json');

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since');
  const pollMs = parseInt(req.nextUrl.searchParams.get('poll') || '3000', 10);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastRead = since || new Date(0).toISOString();

      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial state snapshot
      try {
        const stateRaw = fs.readFileSync(STATE_PATH, 'utf-8');
        const state = JSON.parse(stateRaw);
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

          // Also send fresh state periodically
          const stateRaw = fs.readFileSync(STATE_PATH, 'utf-8');
          const state = JSON.parse(stateRaw);
          sendEvent('state_update', {
            stateMatrix: state,
            timestamp: new Date().toISOString(),
          });
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
