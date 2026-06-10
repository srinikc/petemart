#!/usr/bin/env node
/**
 * Pipeline Starter — Launches the autonomous supervisor loop for PeteMart.
 *
 * Usage:
 *   node scripts/start-pipeline.js          # single cycle
 *   node scripts/start-pipeline.js --watch  # continuous autonomous mode
 *   node scripts/start-pipeline.js --agent 07a  # force-queue agent 07a for re-run
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');

function readState() {
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
}

function printBanner() {
  const state = readState();
  const ds = state.pipeline_control?.dashboard_summary || {};
  const gates = state.supervisor_control?.approval_gates || [];
  const pendingGates = gates.filter(g => !g.approved).map(g => g.gate_id).join(', ');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║           PeteMart Pipeline Control v2.0            ║');
  console.log('╟──────────────────────────────────────────────────────╢');
  console.log(`║  Progress: ${String(ds.overall_progress_pct || 0).padStart(3)}%  (${ds.agents_completed || 0}/${ds.total_agents || 16} agents)`);
  console.log(`║  Status:   ${ds.agents_awaiting_review || 0} awaiting review · ${ds.agents_failed || 0} failed`);
  console.log(`║  Gates:    ${pendingGates || 'All approved'}`);
  console.log('╟──────────────────────────────────────────────────────╢');
  console.log('║  http://localhost:3000/agentic-console               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  if (ds.agents_awaiting_review > 0) {
    console.log(`⚠ ${ds.agents_awaiting_review} agent(s) awaiting your approval.`);
    console.log('  → Go to Agentic Console > Agent Pipeline to review & approve');
    console.log('');
  }
}

function printHelp() {
  console.log('Commands:');
  console.log('  --watch           Run supervisor loop continuously (autonomous mode)');
  console.log('  --once            Run one supervisor cycle then exit');
  console.log('  --status          Show pipeline status and exit');
  console.log('  --agent=<id>      Force-queue a specific agent for re-execution');
  console.log('  --help            Show this help');
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printBanner();
    printHelp();
    process.exit(0);
  }

  if (args.includes('--status')) {
    printBanner();
    process.exit(0);
  }

  printBanner();

  if (args.includes('--watch')) {
    console.log('▶ Supervisor loop starting in WATCH mode (continuous)...');
    console.log('  Press Ctrl+C to stop.\n');
    const sl = require('./supervisor_loop');
    // Run continuously
    const run = async () => {
      while (true) {
        try {
          const state = sl.getState();
          await sl.runCycle(state);
        } catch (err) {
          console.error('Cycle error:', err.message);
        }
        // Read cooldown from state
        try {
          const st = sl.getState();
          const cd = (st.supervisor_control?.loop_guardrails?.cooldown_between_cycles_s || 5) * 1000;
          await new Promise(r => setTimeout(r, cd));
        } catch { await new Promise(r => setTimeout(r, 5000)); }
      }
    };
    run().catch(err => { console.error('Fatal:', err); process.exit(1); });
    return;
  }

  if (args.includes('--once')) {
    console.log('▶ Running single supervisor cycle...\n');
    const sl = require('./supervisor_loop');
    const state = sl.getState();
    const result = await sl.runCycle(state);
    if (result.skipped) {
      console.log(`⏭ ${result.reason}`);
    } else {
      console.log(`✅ Cycle complete. ${result.launched.length} agent(s) processed.`);
    }
    process.exit(0);
  }

  const agentArg = args.find(a => a.startsWith('--agent='));
  if (agentArg) {
    const agentId = agentArg.split('=')[1];
    console.log(`▶ Force-queueing agent ${agentId}...\n`);
    const sl = require('./supervisor_loop');
    const state = sl.getState();
    const agentKey = Object.keys(state.agent_states).find(k => k.startsWith(agentId));
    if (!agentKey) { console.error(`Agent ${agentId} not found`); process.exit(1); }
    sl.transitionAgent(state, agentKey, 'pending');
    sl.saveState(state);
    console.log(`✅ Agent ${agentKey} queued for re-execution.`);
    console.log('  Run `node scripts/start-pipeline.js --once` to trigger.');
    process.exit(0);
  }

  // Default: show status
  printHelp();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
