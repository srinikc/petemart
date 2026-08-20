import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const COMMANDS_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_COMMANDS.jsonl');
const RESPONSES_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_RESPONSES.jsonl');
const DASHBOARD_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_DASHBOARD.json');

// ── GET endpoint: returns supervisor dashboard JSON (plain) or SSE stream ──

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format');

  // Plain JSON snapshot (used by Logs page Supervisor tab)
  if (format === 'json') {
    try {
      if (fs.existsSync(DASHBOARD_PATH)) {
        const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf-8'));
        return NextResponse.json(dashboard, {
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
      }
      return NextResponse.json({ error: 'No dashboard data' }, { status: 404 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // SSE stream (real-time, used by Supervisor Chat)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastRead = new Date(0).toISOString();
      let dashboardInterval: NodeJS.Timeout | null = null;

      const send = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Send initial status
      send('connected', { timestamp: new Date().toISOString() });

      // Poll for responses and dashboard every 2s
      const poll = setInterval(async () => {
        try {
          // Check supervisor status (in-process singleton)
          let running = false;
          try {
            const { isRunning } = require('../../../../scripts/runtime/supervisorSingleton');
            running = isRunning();
          } catch {}
          send('status', { running });

          // Check for new responses
          if (fs.existsSync(RESPONSES_PATH)) {
            const content = fs.readFileSync(RESPONSES_PATH, 'utf-8');
            const lines = content.split('\n').filter(Boolean);
            const newLines = lines.filter(l => {
              try { return JSON.parse(l).timestamp > lastRead; } catch { return false; }
            });
            if (newLines.length > 0) {
              lastRead = new Date().toISOString();
              for (const line of newLines) {
                try { send('response', JSON.parse(line)); } catch {}
              }
            }
          }

          // Send dashboard update
          if (fs.existsSync(DASHBOARD_PATH)) {
            try {
              const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf-8'));
              send('dashboard', dashboard);
            } catch {}
          }
        } catch {}
      }, 2000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(poll);
        if (dashboardInterval) clearInterval(dashboardInterval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ── POST endpoint: send commands to supervisor ──

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, agent_id, instruction } = body;

    // Write command to commands log
    const command = {
      action,
      agent_id,
      instruction,
      timestamp: new Date().toISOString(),
    };

    try {
      fs.appendFileSync(COMMANDS_PATH, JSON.stringify(command) + '\n', 'utf-8');
    } catch {}

    // Handle commands directly
    switch (action) {
      case 'start': {
        try {
          const { startSupervisor } = require('../../../../scripts/runtime/supervisorSingleton');
          const result = startSupervisor();
          return NextResponse.json({ success: true, running: true, result });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }
      }

      case 'stop': {
        try {
          const { stopSupervisor } = require('../../../../scripts/runtime/supervisorSingleton');
          stopSupervisor();
          return NextResponse.json({ success: true, running: false });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }
      }

      case 'status': {
        try {
          const { isRunning } = require('../../../../scripts/runtime/supervisorSingleton');
          return NextResponse.json({ running: isRunning() });
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      }

      case 'run_agent': {
        try {
          const { AgentRuntime } = require('../../../../scripts/runtime/AgentRuntime');
          const { LLMProvider } = require('../../../../scripts/runtime/LLMProvider');
          const runtime = new AgentRuntime({ llm: LLMProvider.fromEnv() });
          runtime.runAgent(agent_id, { userInstruction: instruction }).catch((err: any) => {
            console.error(`[AgentRuntime] ${agent_id} failed:`, err.message);
          });
          return NextResponse.json({ success: true, agent_id, status: 'in_progress' });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
