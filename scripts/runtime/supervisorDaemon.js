const fs = require('fs');
const path = require('path');
const { SupervisorAgent } = require('./SupervisorAgent');
const { runAgentProcess } = require('./runAgentProcess');
const vlog = require('./VerboseLogger');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const EVENTS_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const PROJ_PATH = path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');

const supervisor = new SupervisorAgent();

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

function dependenciesMet(state, agent) {
  if (!agent.dependencies || agent.dependencies.length === 0) return true;
  return agent.dependencies.every(dep => {
    const depAgent = Object.entries(state.agent_states || {}).find(([, a]) =>
      (a.artifacts_emitted || []).some(art => art.includes(dep) || dep.includes(a.agent_id))
    );
    if (depAgent) {
      return depAgent[1].status === 'approved' || depAgent[1].status === 'completed';
    }
    return false;
  });
}

function getEligibleAgents(state) {
  const agents = state.agent_states || {};
  const loopGuard = state.supervisor_control?.loop_guardrails || {};
  const maxExec = loopGuard.max_sequential_executions_per_agent || 3;
  const circuitBreaker = loopGuard.circuit_breaker || 'CLOSED';
  const eligible = [];

  for (const [id, agent] of Object.entries(agents)) {
    if (id === '00_supervisor_agent') continue;
    if (agent.disabled) continue;
    if (agent.status === 'approved' || agent.status === 'completed') continue;
    if (agent.status === 'failed') continue;
    if (agent.status === 'in_progress' || agent.status === 'active') continue;
    if ((agent.execution_count || 0) >= maxExec) continue;
    if (!dependenciesMet(state, agent)) continue;

    eligible.push({ id, ...agent });
  }

  return { eligible, circuitBreaker };
}

async function runCycle() {
  const state = readState();
  if (!state) return { skipped: true, reason: 'No state' };

  // Write daemon heartbeat at START of cycle (before any blocking work)
  state.supervisor_control = state.supervisor_control || {};
  state.supervisor_control.agent_00_supervisor = state.supervisor_control.agent_00_supervisor || {};
  state.supervisor_control.agent_00_supervisor.daemon_last_heartbeat = Date.now();
  state.supervisor_control.agent_00_supervisor.daemon_status = 'running';
  state.supervisor_control.agent_00_supervisor.last_cycle_timestamp = new Date().toISOString();

  // Validate dependency chain: any agent whose upstream dep isn't approved/completed → reset to pending
  for (const [id, agent] of Object.entries(state.agent_states || {})) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status === 'approved' || agent.status === 'completed' || agent.status === 'awaiting_approval') {
      const depUnmet = (agent.dependencies || []).some(dep => {
        const depAgent = state.agent_states?.[dep];
        return !depAgent || (depAgent.status !== 'approved' && depAgent.status !== 'completed');
      });
      if (depUnmet) {
        agent.status = 'pending';
        agent.approved = false;
        agent.last_error = `DOWNSTREAM_CASCADE: upstream ${agent.dependencies.filter(d => {
          const da = state.agent_states?.[d];
          return !da || (da.status !== 'approved' && da.status !== 'completed');
        }).join(',')} not completed — reset to pending`;
        agent.started_at = null;
        logEvent({ type: 'dependency_cascade_reset', agent_id: id });
      }
    }
  }
  saveState(state);

  if (state.pipeline_control?.is_pipeline_paused) {
    return { skipped: true, reason: 'Pipeline paused' };
  }

  const idleCycles = (state.supervisor_control?.loop_guardrails?.idle_cycles || 0);
  const maxIdle = state.supervisor_control?.loop_guardrails?.max_idle_cycles || 50;

  const launched = [];

  // Auto-approve agents that pass compliance
  const audit = supervisor.runComplianceAudit(state);
  for (const [id, agent] of Object.entries(state.agent_states || {})) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status !== 'awaiting_approval') continue;
    if (agent.disabled) continue;
    const agentAudit = audit[id];
    if (agentAudit?.allPassed) {
      agent.status = 'in_progress';
      agent.approved = true;
      logEvent({ type: 'auto_launched', agent_id: id });
      const manifest = launchAgentTask(id, state);
      launched.push({ id, manifest });
    }
  }

  const { eligible, circuitBreaker } = getEligibleAgents(state);

  if (circuitBreaker === 'TRIPPED') {
    logEvent({ type: 'circuit_breaker_active' });
    return { skipped: true, reason: 'Circuit breaker tripped' };
  }

  if (eligible.length === 0) {
    const allDone = Object.entries(state.agent_states || {}).every(([k, a]) =>
      k === '00_supervisor_agent' || a.status === 'approved' || a.status === 'completed' || a.status === 'failed' || a.disabled
    );
    if (allDone) {
      logEvent({ type: 'pipeline_complete' });
      saveState(state);
      return { skipped: true, reason: 'All agents processed', complete: true };
    }
    logEvent({ type: 'no_eligible_agents' });
    saveState(state);
    return { skipped: true, reason: 'No eligible agents' };
  }

  const maxConcurrent = state.supervisor_control?.loop_guardrails?.max_concurrent_agents || 3;
  for (const agent of eligible.slice(0, maxConcurrent)) {
    const needsApproval = agent.requires_human_approval;
    const agentAudit = audit[agent.id];
    const fatalFailures = (agentAudit?.items || []).filter(i => i.required && !i.passed && i.type !== 'workflow' && i.type !== 'traceability');

    if (fatalFailures.length > 0) {
      agent.status = 'failed';
      agent.last_error = `Compliance audit failed — ${fatalFailures.map(i => i.check).join(', ')}`;
      agent.consecutive_failures = (agent.consecutive_failures || 0) + 1;
      logEvent({ type: 'compliance_failed', agent_id: agent.id });
      // Check circuit breaker
      const threshold = state.supervisor_control?.loop_guardrails?.circuit_breaker_threshold || 5;
      if (agent.consecutive_failures >= threshold) {
        state.supervisor_control.loop_guardrails.circuit_breaker = 'TRIPPED';
        state.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = new Date().toISOString();
        state.supervisor_control.loop_guardrails.circuit_breaker_reason = `${agent.id} exceeded ${threshold} consecutive failures`;
        logEvent({ type: 'circuit_breaker_tripped', agent_id: agent.id, consecutive: agent.consecutive_failures, threshold });
      }
      continue;
    }

    if (needsApproval) {
      agent.status = 'awaiting_approval';
      logEvent({ type: 'agent_awaiting_approval', agent_id: agent.id });
      continue;
    }

    agent.status = 'in_progress';
    const manifest = launchAgentTask(agent.id, state);
    launched.push({ id: agent.id, manifest });
    logEvent({ type: 'agent_launched', agent_id: agent.id });
  }

  // Track consecutive idle cycles — reset when something launched, increment when idle
  if (launched.length === 0 && eligible.filter(e => !e.disabled).length === 0) {
    const newIdle = (idleCycles || 0) + 1;
    state.supervisor_control.loop_guardrails = state.supervisor_control.loop_guardrails || {};
    state.supervisor_control.loop_guardrails.idle_cycles = newIdle;
    state.supervisor_control.agent_00_supervisor.current_action = `Waiting — ${newIdle} idle cycles`;
    if (newIdle >= maxIdle) {
      logEvent({ type: 'max_idle_cycles_reached', idle_cycles: newIdle });
      state.supervisor_control.agent_00_supervisor.current_action = `Idle timeout — ${maxIdle} cycles with no activity. Click Reset if stuck.`;
    }
  } else if (launched.length > 0 || eligible.length > 0) {
    state.supervisor_control.loop_guardrails = state.supervisor_control.loop_guardrails || {};
    state.supervisor_control.loop_guardrails.idle_cycles = 0;
    state.supervisor_control.agent_00_supervisor.current_action = launched.length > 0
      ? `Launched ${launched.length} agent(s)`
      : `${eligible.length} eligible agent(s) — awaiting HITL or dependencies`;
  }

  supervisor.updateDashboard(state);
  saveState(state);

  return { launched, idle_cycles: state.supervisor_control?.loop_guardrails?.idle_cycles || 0 };
}

function launchAgentTask(agentId, state) {
  const agent = state.agent_states?.[agentId];
  const regPath = path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json');
  let registryDef = {};
  try { registryDef = JSON.parse(fs.readFileSync(regPath, 'utf-8'))?.agents?.[agentId] || {}; } catch {}

  const taskManifest = {
    agent_id: agentId,
    role: agent?.role,
    phase: agent?.phase,
    dependencies_artifacts: [],
    deliverables: registryDef.deliverables || {},
    sandbox_dir: registryDef.workspace_root || `agents/03_execution_workspace/${agentId}/`,
    prompt_source: `.opencode/agents/${agentId}.md`,
    user_instruction: agent?.user_instruction || null,
    compliance_checks: agent?.compliance_checklist || [],
    launched_at: new Date().toISOString(),
    status: 'launched',
  };

  const manifestPath = path.join(ROOT, '00_state_ledger', `TASK_${agentId}.json`);
  try { fs.writeFileSync(manifestPath, JSON.stringify(taskManifest, null, 2), 'utf-8'); } catch {}

  return taskManifest;
}

async function daemonLoop() {
  vlog.write('DAEMON', '00_supervisor_agent', 'Daemon started');
  while (true) {
    try {
      // Cycle timeout: if runCycle takes >60s, treat as stuck
      const result = await Promise.race([
        runCycle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cycle timeout (>60s)')), 60000)),
      ]);
      if (result.skipped) {
        vlog.write('DAEMON', '00_supervisor_agent', `Skipped: ${result.reason}`);
        if (result.complete) {
          vlog.write('DAEMON', '00_supervisor_agent', 'Pipeline complete, daemon idle');
          await new Promise(r => setTimeout(r, 30000));
          continue;
        }
      } else {
        vlog.write('DAEMON', '00_supervisor_agent', `Cycle: ${result.launched.length} agent(s) launched`);
        for (const agent of result.launched || []) {
          try {
            const manifest = path.join(ROOT, '00_state_ledger', `TASK_${agent.id}.json`);
            const taskData = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf-8')) : null;
            const agentResult = await runAgentProcess(agent.id, taskData);
            vlog.write('DAEMON', agent.id, `Agent completed: status=${agentResult.status}`);
          } catch (err) {
            vlog.write('DAEMON', agent.id, `Agent error: ${err.message}`);
            // Track consecutive failures for circuit breaker
            const currState = readState();
            if (currState?.agent_states?.[agent.id]) {
              const ag = currState.agent_states[agent.id];
              ag.consecutive_failures = (ag.consecutive_failures || 0) + 1;
              ag.last_error = err.message;
              const threshold = currState.supervisor_control?.loop_guardrails?.circuit_breaker_threshold || 5;
              if (ag.consecutive_failures >= threshold) {
                currState.supervisor_control = currState.supervisor_control || {};
                currState.supervisor_control.loop_guardrails = currState.supervisor_control.loop_guardrails || {};
                currState.supervisor_control.loop_guardrails.circuit_breaker = 'TRIPPED';
                currState.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = new Date().toISOString();
                currState.supervisor_control.loop_guardrails.circuit_breaker_reason = `${agent.id}: ${err.message}`;
                logEvent({ type: 'circuit_breaker_tripped', agent_id: agent.id, consecutive: ag.consecutive_failures, threshold });
              }
              saveState(currState);
            }
          }
        }
      }
    } catch (err) {
      vlog.write('DAEMON', '00_supervisor_agent', `Cycle error: ${err.message}`);
    }
    const state = readState();
    const cd = (state?.supervisor_control?.loop_guardrails?.cooldown_between_cycles_s || 2) * 1000;
    await new Promise(r => setTimeout(r, cd));
  }
}

if (require.main === module) {
  daemonLoop().catch(err => {
    console.error('Daemon fatal:', err);
    process.exit(1);
  });
}

module.exports = { runCycle, getEligibleAgents, dependenciesMet, supervisor, daemonLoop };
