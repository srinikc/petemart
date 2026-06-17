#!/usr/bin/env node
/**
 * Runtime CLI — start/run/stop/status/dashboard for the PeteMart Agent Runtime.
 *
 * Usage:
 *   node scripts/start-runtime.js start          — start supervisor in-process
 *   node scripts/start-runtime.js stop           — stop supervisor
 *   node scripts/start-runtime.js status         — check supervisor status
 *   node scripts/start-runtime.js run <agentId>  — run a specific agent
 *   node scripts/start-runtime.js dashboard      — show pipeline summary
 *   node scripts/start-runtime.js --help         — show this help
 */

const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const DASHBOARD_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_DASHBOARD.json');
const PID_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_DAEMON.pid');
const EVENTS_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return null; }
}

function help() {
  console.log(`
PeteMart Agent Runtime CLI

Commands:
  start                     Start supervisor (in-process, fire-and-forget)
  stop                      Stop supervisor
  status                    Check if supervisor is running
  run <agentId>             Run a specific agent once
  dashboard                 Show pipeline summary dashboard
  --help                    Show this help
`);
}

async function main() {
  const cmd = process.argv[2];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    help();
    process.exit(0);
  }

  switch (cmd) {
    case 'start': {
      const { SupervisorSingleton } = require('./runtime/supervisorSingleton');
      const singleton = new SupervisorSingleton();
      const result = await singleton.runOnce();
      console.log(JSON.stringify({ action: 'start', result }));
      break;
    }

    case 'stop': {
      // Kill supervisor daemon process
      if (fs.existsSync(PID_PATH)) {
        try {
          const pid = parseInt(fs.readFileSync(PID_PATH, 'utf-8').trim(), 10);
          try { process.kill(pid); } catch {}
          fs.unlinkSync(PID_PATH);
          console.log(JSON.stringify({ action: 'stop', success: true }));
        } catch (err) {
          console.log(JSON.stringify({ action: 'stop', success: false, error: err.message }));
        }
      } else {
        console.log(JSON.stringify({ action: 'stop', success: true, note: 'No PID file found' }));
      }

      // Update state
      try {
        const state = readState();
        if (state) {
          state.supervisor_control.agent_00_supervisor = state.supervisor_control.agent_00_supervisor || {};
          state.supervisor_control.agent_00_supervisor.status = 'idle';
          state.supervisor_control.agent_00_supervisor.daemon_pid = null;
          fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
        }
      } catch {}
      break;
    }

    case 'status': {
      const running = fs.existsSync(PID_PATH);
      let pid = null;
      if (running) {
        try {
          pid = parseInt(fs.readFileSync(PID_PATH, 'utf-8').trim(), 10);
          process.kill(pid, 0); // Check if alive
        } catch {
          pid = null; // Stale PID
        }
      }
      const state = readState();
      const sup = state?.supervisor_control?.agent_00_supervisor || {};
      console.log(JSON.stringify({
        running: !!pid,
        pid: pid || null,
        status: sup.status || 'unknown',
        cycle_count: sup.cycle_count || 0,
        last_cycle: sup.last_cycle_timestamp || null,
        error: sup.last_error || null,
      }));
      break;
    }

    case 'run': {
      const agentId = process.argv[3];
      if (!agentId) {
        console.error('Usage: node scripts/start-runtime.js run <agentId>');
        process.exit(1);
      }
      const { AgentRuntime } = require('./runtime/AgentRuntime');
      const { LLMProvider } = require('./runtime/LLMProvider');
      const runtime = new AgentRuntime({ llm: LLMProvider.fromEnv() });
      const result = await runtime.runAgent(agentId);
      console.log(JSON.stringify({
        agentId,
        status: result.status,
        artifacts: (result.artifacts || []).length,
        duration_ms: result.duration || 0,
        error: result.error || null,
      }));
      process.exit(result.status === 'failed' ? 1 : 0);
      break;
    }

    case 'dashboard': {
      try {
        if (fs.existsSync(DASHBOARD_PATH)) {
          const data = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf-8'));
          console.log(JSON.stringify(data, null, 2));
        } else {
          const state = readState();
          if (!state) { console.log('{}'); break; }
          const agents = Object.entries(state.agent_states || {}).filter(([k]) => k !== '00_supervisor_agent');
          const total = agents.length;
          const completed = agents.filter(([, a]) => a.status === 'approved' || a.status === 'completed').length;
          const inProgress = agents.filter(([, a]) => a.status === 'in_progress' || a.status === 'active').length;
          const pending = agents.filter(([, a]) => a.status === 'pending' || a.status === 'idle').length;
          const awaiting = agents.filter(([, a]) => a.status === 'awaiting_approval').length;
          const failed = agents.filter(([, a]) => a.status === 'failed' && !a.disabled).length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          console.log(JSON.stringify({
            summary: { total_agents: total, completed, in_progress: inProgress, pending, awaiting_review: awaiting, failed, pct },
            cycle_count: state.supervisor_control?.agent_00_supervisor?.cycle_count || 0,
            circuit_breaker: state.supervisor_control?.loop_guardrails?.circuit_breaker || 'CLOSED',
            pipeline_paused: state.pipeline_control?.is_pipeline_paused || false,
          }, null, 2));
        }
      } catch (err) {
        console.error('Dashboard error:', err.message);
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${cmd}`);
      help();
      process.exit(1);
  }
}

main().catch(err => {
  console.error('Runtime error:', err);
  process.exit(1);
});
