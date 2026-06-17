const fs = require('fs');
const path = require('path');
const { AgentRuntime } = require('./AgentRuntime');
const vlog = require('./VerboseLogger');

const ROOT = process.cwd();

async function runAgentProcess(agentId, taskManifest) {
  vlog.write('PROCESS', agentId, `Process started | task=${taskManifest?.agent_id}`);

  // Read state and set in_progress
  const statePath = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
  const projPath = path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');

  function readState() {
    try { return JSON.parse(fs.readFileSync(statePath, 'utf-8')); } catch { return null; }
  }

  function saveState(state) {
    try {
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
      try { fs.writeFileSync(projPath, JSON.stringify(state, null, 2), 'utf-8'); } catch {}
    } catch {}
  }

  const state = readState();
  if (state?.agent_states?.[agentId]) {
    state.agent_states[agentId].status = 'in_progress';
    state.agent_states[agentId].started_at = new Date().toISOString();
    saveState(state);
  }

  // Run agent
  const runtime = new AgentRuntime();
  const context = { ...(taskManifest || {}), user_instruction: taskManifest?.user_instruction || null };

  try {
    const result = await runtime.runAgent(agentId, context);

    // Update state with result
    const finalState = readState();
    if (finalState?.agent_states?.[agentId]) {
      const ag = finalState.agent_states[agentId];

      // Only update if not already set by runtime
      if (!ag.last_run_id || ag.last_run_id !== result.runId) {
        ag.status = result.status || 'completed';
        ag.last_error = result.error || null;
        ag.last_run_id = result.runId;
        ag.run_id = result.runId;
        ag.last_run_duration_ms = result.duration || 0;
        ag.last_activity_timestamp = new Date().toISOString();
        ag.step_label = 'completed';

        if (result.artifacts?.length > 0) {
          ag.artifacts_emitted = [...(ag.artifacts_emitted || [])];
          for (const art of result.artifacts) {
            const artifactPath = art._fullPath || art.name;
            if (!ag.artifacts_emitted.includes(artifactPath)) {
              ag.artifacts_emitted.push(artifactPath);
            }
          }
          ag.last_artifact_emitted = ag.artifacts_emitted;
        }
      }
      saveState(finalState);
    }

    vlog.write('PROCESS', agentId, `Process completed | status=${result.status} | artifacts=${(result.artifacts || []).length}`);
    return result;
  } catch (err) {
    vlog.write('PROCESS', agentId, `Process error: ${err.message}`);
    const errorState = readState();
    if (errorState?.agent_states?.[agentId]) {
      errorState.agent_states[agentId].status = 'failed';
      errorState.agent_states[agentId].last_error = err.message;
      errorState.agent_states[agentId].last_activity_timestamp = new Date().toISOString();
      saveState(errorState);
    }
    return { agentId, status: 'failed', error: err.message, artifacts: [], content: '', usage: {} };
  }
}

if (require.main === module) {
  const agentId = process.argv[2];
  const taskPath = process.argv[3];
  if (!agentId) { console.error('Usage: node runAgentProcess.js <agentId> [taskManifestPath]'); process.exit(1); }
  let taskManifest = null;
  if (taskPath && fs.existsSync(taskPath)) {
    try { taskManifest = JSON.parse(fs.readFileSync(taskPath, 'utf-8')); } catch {}
  }
  runAgentProcess(agentId, taskManifest).then(result => {
    console.log(JSON.stringify(result));
    process.exit(result.status === 'failed' ? 1 : 0);
  }).catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  });
}

module.exports = { runAgentProcess };
