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

  if (state.pipeline_control?.is_pipeline_paused) {
    return { skipped: true, reason: 'Pipeline paused' };
  }

  const supCtrl = state.supervisor_control?.agent_00_supervisor || {};
  const cycleCount = (supCtrl.cycle_count || 0) + 1;
  const maxCycles = supCtrl.max_cycles_before_break || 100;

  if (cycleCount > maxCycles) {
    logEvent({ type: 'max_cycles_reached', cycle_count: cycleCount });
    return { skipped: true, reason: 'Max cycles reached' };
  }

  state.supervisor_control = state.supervisor_control || {};
  state.supervisor_control.agent_00_supervisor = {
    ...state.supervisor_control.agent_00_supervisor,
    cycle_count: cycleCount,
    last_cycle_timestamp: new Date().toISOString(),
  };

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

  supervisor.updateDashboard(state);
  saveState(state);

  return { launched, cycle_count: cycleCount };
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
      const result = await runCycle();
      if (result.skipped) {
        vlog.write('DAEMON', '00_supervisor_agent', `Skipped: ${result.reason}`);
        if (result.complete) {
          vlog.write('DAEMON', '00_supervisor_agent', 'Pipeline complete, daemon exiting');
          process.exit(0);
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

module.exports = { runCycle, getEligibleAgents, dependenciesMet, supervisor };
