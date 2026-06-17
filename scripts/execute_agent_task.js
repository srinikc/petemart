#!/usr/bin/env node
/**
 * Agent Task Executor
 *
 * Reads a TASK_{agentId}.json manifest and executes the agent.
 * Invoked by supervisor_loop.js or standalone.
 *
 * Usage:
 *   node scripts/execute_agent_task.js <agentId> [taskManifestPath]
 *
 * If taskManifestPath is omitted, reads from 00_state_ledger/TASK_{agentId}.json
 */

const fs = require('fs');
const path = require('path');
const { AgentRuntime } = require('./runtime/AgentRuntime');
const vlog = require('./runtime/VerboseLogger');
const traceLogger = require('./runtime/TraceLogger');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const PROJ_PATH = path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');
const EVENTS_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return null; }
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    try { fs.writeFileSync(PROJ_PATH, JSON.stringify(state, null, 2), 'utf-8'); } catch {}
  } catch {}
}

function logEvent(event) {
  try {
    const entry = { ...event, timestamp: new Date().toISOString() };
    fs.appendFileSync(EVENTS_PATH, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {}
}

async function main() {
  const agentId = process.argv[2];
  let taskManifest = null;

  if (!agentId) {
    console.error('Usage: node scripts/execute_agent_task.js <agentId> [taskManifestPath]');
    process.exit(1);
  }

  // Load task manifest
  const taskPath = process.argv[3] || path.join(ROOT, '00_state_ledger', `TASK_${agentId}.json`);
  if (fs.existsSync(taskPath)) {
    try { taskManifest = JSON.parse(fs.readFileSync(taskPath, 'utf-8')); } catch {}
  }

  vlog.write('EXECUTOR', agentId, `Starting task execution | manifest=${taskPath}`);

  // Set state to in_progress
  const initialState = readState();
  if (initialState?.agent_states?.[agentId]) {
    initialState.agent_states[agentId].status = 'in_progress';
    initialState.agent_states[agentId].started_at = new Date().toISOString();
    initialState.agent_states[agentId].step_label = 'initializing';
    saveState(initialState);
    logEvent({ type: 'agent_started', agent_id: agentId });
  }

  // Build context from task manifest
  const context = {
    user_instruction: taskManifest?.user_instruction || null,
    task_source: 'supervisor',
  };

  // Run agent
  const runtime = new AgentRuntime();
  let result;

  try {
    result = await runtime.runAgent(agentId, context);
  } catch (err) {
    vlog.write('EXECUTOR', agentId, `Fatal error: ${err.message}`);
    result = { agentId, status: 'failed', error: err.message, artifacts: [], content: '', usage: {} };
  }

  // Update state with result
  const finalState = readState();
  if (finalState?.agent_states?.[agentId]) {
    const ag = finalState.agent_states[agentId];
    ag.status = result.status || 'completed';
    ag.last_error = result.error || null;
    ag.last_run_id = result.runId || `${agentId}_${Date.now()}`;
    ag.run_id = ag.last_run_id;
    ag.last_run_duration_ms = result.duration || 0;
    ag.last_activity_timestamp = new Date().toISOString();
    ag.step_label = 'completed';
    ag.execution_count = (ag.execution_count || 0) + 1;

    if (result.artifacts?.length > 0) {
      const regPath = path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json');
      let workspaceRoot = `agents/03_execution_workspace/${agentId}/`;
      try {
        const reg = JSON.parse(fs.readFileSync(regPath, 'utf-8'));
        if (reg?.agents?.[agentId]?.workspace_root) workspaceRoot = reg.agents[agentId].workspace_root;
      } catch {}

      ag.artifacts_emitted = ag.artifacts_emitted || [];
      for (const art of result.artifacts) {
        const fullPath = path.join(workspaceRoot, art.name).replace(/\\/g, '/');
        if (!ag.artifacts_emitted.includes(fullPath)) {
          ag.artifacts_emitted.push(fullPath);
        }
      }
      ag.last_artifact_emitted = ag.artifacts_emitted;
    }

    // Run compliance audit
    const audit = _runComplianceCheck(finalState, agentId);
    if (!audit.passed) {
      vlog.write('EXECUTOR', agentId, `Compliance check: ${audit.failures.length} failures`);
      logEvent({ type: 'compliance_failed', agent_id: agentId, items: audit.failures });
      if (audit.hasFatal) {
        ag.status = 'failed';
        ag.last_error = `Compliance: ${audit.failures.map(f => f.check).join(', ')}`;
      }
    }

    saveState(finalState);
    logEvent({ type: 'agent_completed', agent_id: agentId, status: ag.status, artifacts: (result.artifacts || []).length });
  }

  // Cleanup task manifest
  try { fs.unlinkSync(taskPath); } catch {}

  // Output result as JSON for parent process
  const output = {
    agentId: result.agentId,
    status: result.status,
    error: result.error || null,
    artifacts: (result.artifacts || []).map(a => a.name),
    duration_ms: result.duration || 0,
  };

  console.log(JSON.stringify(output));
  process.exit(result.status === 'failed' ? 1 : 0);
}

function _runComplianceCheck(state, agentId) {
  const agent = state.agent_states?.[agentId];
  if (!agent?.compliance_checklist) return { passed: true, failures: [], hasFatal: false };
  const failures = [];
  let hasFatal = false;
  for (const check of agent.compliance_checklist) {
    if (check.type === 'artifact' && check.check.startsWith('artifact_exists(')) {
      const match = check.check.match(/artifact_exists\(([^)]+)\)/);
      if (match) {
        const exists = (agent.artifacts_emitted || []).some(a => a.includes(match[1]));
        if (!exists) {
          failures.push(check);
          if (check.required && check.type !== 'workflow' && check.type !== 'traceability') hasFatal = true;
        }
      }
    }
  }
  return { passed: failures.length === 0, failures, hasFatal };
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
