const fs = require('fs');
const path = require('path');
const { SupervisorAgent } = require('./SupervisorAgent');
const { runAgentProcess } = require('./runAgentProcess');
const vlog = require('./VerboseLogger');
const { readState: sfRead, saveStateSync } = require('./StateFile');

const ROOT = process.cwd();
const STATE_PATH = () => path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const EVENTS_PATH = () => path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const PROJ_PATH = () => path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');
const REGISTRY_PATH = () => path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json');
const DOWNSTREAM_QUEUE_PATH = () => path.join(ROOT, '00_state_ledger/DOWNSTREAM_QUEUE.json');

const supervisor = new SupervisorAgent();

// ── I/O ──

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH(), 'utf-8')); } catch { return null; }
}

function saveState(state) {
  try { saveStateSync(state); } catch {}
}

function logEvent(event) {
  try {
    const entry = { ...event, timestamp: new Date().toISOString() };
    fs.appendFileSync(EVENTS_PATH(), JSON.stringify(entry) + '\n', 'utf-8');
  } catch {}
}

function readRegistry() {
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH(), 'utf-8')); } catch { return null; }
}

function readDownstreamQueue() {
  try { return JSON.parse(fs.readFileSync(DOWNSTREAM_QUEUE_PATH(), 'utf-8')); } catch { return []; }
}

function saveDownstreamQueue(queue) {
  try { fs.writeFileSync(DOWNSTREAM_QUEUE_PATH(), JSON.stringify(queue, null, 2), 'utf-8'); } catch {}
}

// ── Dependency helpers ──

function dependenciesMet(state, agent) {
  if (!agent.dependencies || agent.dependencies.length === 0) return true;
  return agent.dependencies.every(dep => {
    const depAgent = state.agent_states?.[dep];
    return depAgent && (depAgent.status === 'approved' || depAgent.status === 'completed');
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
    if (agent.status === 'awaiting_input' || agent.status === 'awaiting_approval') continue;
    if ((agent.execution_count || 0) >= maxExec) continue;
    // Don't auto-re-launch agents that have run but produced zero artifacts
    // (prevents infinite re-launch loop when LLM returns empty/error responses)
    if ((agent.execution_count || 0) > 0 && (!agent.artifacts_emitted || agent.artifacts_emitted.length === 0)) continue;
    if (!dependenciesMet(state, agent)) continue;

    eligible.push({ id, ...agent });
  }

  return { eligible, circuitBreaker };
}

// Find all agents that depend on a given agentId
function findDownstreamAgents(state, agentId) {
  const downstream = [];
  for (const [id, agent] of Object.entries(state.agent_states || {})) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status === 'approved' || agent.status === 'completed') continue;
    if (agent.disabled) continue;
    const deps = agent.dependencies || [];
    if (deps.includes(agentId) || deps.some(d => d.includes(agentId))) {
      downstream.push(id);
    }
  }
  return downstream;
}

// ── Cycle ──

async function runCycle() {
  const state = readState();
  if (!state) return { skipped: true, reason: 'No state' };

  const cycleStart = Date.now();

  // ── 1. Heartbeat ──
  state.supervisor_control = state.supervisor_control || {};
  state.supervisor_control.agent_00_supervisor = state.supervisor_control.agent_00_supervisor || {};
  const daemonInfo = state.supervisor_control.agent_00_supervisor;
  daemonInfo.daemon_last_heartbeat = Date.now();
  daemonInfo.daemon_status = 'running';
  daemonInfo.last_cycle_timestamp = new Date().toISOString();
  daemonInfo.cycle_count = (daemonInfo.cycle_count || 0) + 1;

  logEvent({ type: 'cycle_start', detail: `Cycle #${daemonInfo.cycle_count}` });

  // ── 2. Run comprehensive health audit ──
  let healthAudit = null;
  let unhealthyCount = 0;
  try {
    healthAudit = await supervisor.runHealthAudit(state);
    daemonInfo.last_health_audit_at = new Date().toISOString();
    const unhealthyAgents = Object.entries(healthAudit).filter(([, r]) => !r.allHealthy);
    unhealthyCount = unhealthyAgents.length;
    if (unhealthyAgents.length > 0) {
      vlog.write('DAEMON', '00_supervisor_agent', `Health audit: ${unhealthyAgents.length} agent(s) unhealthy`);
      for (const [id, r] of unhealthyAgents) {
        const failing = r.checks.filter(c => !c.healthy).map(c => c.check);
        vlog.write('DAEMON', id, `Health: ${failing.join(', ')}`);
        logEvent({ type: 'health_check_failed', agent_id: id, detail: failing.join(', ') });
        const ag = state.agent_states?.[id];
        if (ag) ag._health_flags = failing;
      }
    } else {
      daemonInfo.current_action = 'All agents healthy — monitoring';
    }
    logEvent({ type: 'cycle_health_audit', detail: `${unhealthyAgents.length} agent(s) unhealthy out of ${Object.keys(healthAudit).length}` });
  } catch (err) {
    vlog.write('DAEMON', '00_supervisor_agent', `Health audit error: ${err.message}`);
  }

  // ── 3. Upstream change detection — flag agents whose upstream artifacts changed ──
  let upstreamChangedCount = 0;
  if (healthAudit) {
    for (const [id, result] of Object.entries(healthAudit)) {
      const upstreamCheck = result.checks.find(c => c.check === 'upstream_changes');
      if (upstreamCheck?.upstreamChanged) {
        const agent = state.agent_states?.[id];
        if (agent && (agent.status === 'approved' || agent.status === 'completed')) {
          agent.status = 'pending';
          agent.approved = false;
          agent.last_error = `UPSTREAM_CHANGED: ${upstreamCheck.changed.map(c => `${c.agentId}:${c.artifact}`).join(', ')}`;
          agent._upstream_changed_at = new Date().toISOString();
          logEvent({ type: 'upstream_change_detected', agent_id: id, changes: upstreamCheck.changed });
          vlog.write('DAEMON', id, `Upstream changed — reset to pending: ${upstreamCheck.changed.map(c => c.artifact).join(', ')}`);
          // Also re-queue downstream of this agent
          const cascaded = findDownstreamAgents(state, id);
          for (const depId of cascaded) {
            const depAgent = state.agent_states?.[depId];
            if (depAgent && (depAgent.status === 'approved' || depAgent.status === 'completed' || depAgent.status === 'awaiting_approval')) {
              depAgent.status = 'pending';
              depAgent.approved = false;
              depAgent.last_error = `CASCADED_UPSTREAM_CHANGE: ${id} had upstream changes`;
              logEvent({ type: 'upstream_cascade_reset', agent_id: depId, source: id });
            }
          }
        }
      }
    }
  }

  // ── 4. Downstream trigger — check if any agent just completed, queue its dependents ──
  const downstreamQueue = readDownstreamQueue();
  for (const [id, agent] of Object.entries(state.agent_states || {})) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status === 'approved' || agent.status === 'completed') {
      const downstream = findDownstreamAgents(state, id);
      for (const depId of downstream) {
        if (downstreamQueue.includes(depId)) continue;
        const depAgent = state.agent_states?.[depId];
        // Don't queue agents that ran but produced zero artifacts (prevents re-launch loop)
        if (depAgent && (depAgent.execution_count || 0) > 0 && (!depAgent.artifacts_emitted || depAgent.artifacts_emitted.length === 0)) continue;
        downstreamQueue.push(depId);
        vlog.write('DAEMON', depId, `Downstream dependency of ${id} — queued for launch`);
        logEvent({ type: 'downstream_queued', agent_id: depId, depends_on: id });
      }
    }
  }
  // Process downstream queue: set eligible agents to pending
  let activatedCount = 0;
  let removedCount = 0;
  for (const depId of downstreamQueue) {
    const depAgent = state.agent_states?.[depId];
    if (!depAgent) continue;
    if (depAgent.status === 'pending' || depAgent.status === 'idle') continue;
    if (depAgent.status === 'approved' || depAgent.status === 'completed') continue;
    if (depAgent.status === 'in_progress' || depAgent.status === 'active') continue;
    // Don't re-activate agents that have already run (prevents re-launch loops)
    if (depAgent.status === 'failed' && (depAgent.execution_count || 0) > 0) {
      removedCount++;
      continue;
    }
    if (dependenciesMet(state, depAgent)) {
      depAgent.status = 'pending';
      depAgent.last_error = null;
      depAgent.started_at = null;
      logEvent({ type: 'downstream_activated', agent_id: depId });
      vlog.write('DAEMON', depId, 'Downstream dependencies met — set to pending');
      activatedCount++;
    }
  }
  saveDownstreamQueue(downstreamQueue.filter(id => {
    const a = state.agent_states?.[id];
    if (!a) return false;
    // Remove agents that can never be auto-dispatched (ran with zero artifacts)
    if (a.status === 'failed' && (a.execution_count || 0) > 0 && (!a.artifacts_emitted || a.artifacts_emitted.length === 0)) return false;
    return a.status !== 'approved' && a.status !== 'completed' && a.status !== 'failed';
  }));
  if (activatedCount > 0) {
    logEvent({ type: 'cycle_downstream', detail: `Activated ${activatedCount} downstream agent(s)` });
  }

  // ── 5. Dependency chain validation ──
  let cascadeCount = 0;
  for (const [id, agent] of Object.entries(state.agent_states || {})) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status === 'approved' || agent.status === 'completed' || agent.status === 'awaiting_approval' || agent.status === 'active' || agent.status === 'in_progress') {
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
        }).join(',')} not completed`;
        agent.started_at = null;
        logEvent({ type: 'dependency_cascade_reset', agent_id: id, detail: agent.last_error });
        cascadeCount++;
      }
    }
  }
  if (cascadeCount > 0) {
    logEvent({ type: 'cycle_dep_validation', detail: `${cascadeCount} agent(s) reset due to dependency chain` });
  }

  // ── 6. Check pipeline pause ──
  if (state.pipeline_control?.is_pipeline_paused) {
    supervisor.updateDashboard(state, healthAudit);
    saveState(state);
    return { skipped: true, reason: 'Pipeline paused' };
  }

  const idleCycles = (state.supervisor_control?.loop_guardrails?.idle_cycles || 0);
  const maxIdle = state.supervisor_control?.loop_guardrails?.max_idle_cycles || 50;
  const launched = [];

  // ── 7. Auto-approve non-HITL agents that pass compliance ──
  const audit = supervisor.runComplianceAudit(state);
  for (const [id, agent] of Object.entries(state.agent_states || {})) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status !== 'awaiting_approval') continue;
    if (agent.disabled) continue;
    if (agent.requires_human_approval) continue;
    const agentAudit = audit[id];
    if (agentAudit?.allPassed) {
      agent.status = 'in_progress';
      agent.approved = true;
      vlog.write('DAEMON', id, `Auto-launched: compliance audit passed`);
      logEvent({ type: 'auto_launched', agent_id: id });
      const manifest = launchAgentTask(id, state);
      launched.push({ id, manifest });
    } else if (agentAudit) {
      vlog.write('DAEMON', id, `Compliance audit: not all passed — not launching`);
      logEvent({ type: 'compliance_blocked', agent_id: id });
    }
  }

  // ── 8. Check circuit breaker ──
  const { eligible, circuitBreaker } = getEligibleAgents(state);
  if (circuitBreaker === 'TRIPPED') {
    vlog.write('DAEMON', '00_supervisor_agent', 'Circuit breaker is TRIPPED');
    logEvent({ type: 'circuit_breaker_blocked', reason: 'breaker tripped' });
    logEvent({ type: 'cycle_result', detail: `Skipped: circuit breaker tripped (${Date.now() - cycleStart}ms)` });
    daemonInfo.current_action = 'CIRCUIT BREAKER TRIPPED — click Reset to clear';
    supervisor.updateDashboard(state, healthAudit);
    saveState(state);
    return { skipped: true, reason: 'Circuit breaker tripped' };
  }

  // ── 9. Launch eligible agents ──
  if (eligible.length === 0) {
    const allDone = Object.entries(state.agent_states || {}).every(([k, a]) =>
      k === '00_supervisor_agent' || a.status === 'approved' || a.status === 'completed' || a.status === 'failed' || a.disabled
    );
    if (allDone) {
      logEvent({ type: 'pipeline_complete' });
      logEvent({ type: 'cycle_result', detail: `Pipeline complete (${Date.now() - cycleStart}ms)` });
      daemonInfo.current_action = 'Pipeline complete — all agents processed';
      supervisor.updateDashboard(state, healthAudit);
      saveState(state);
      return { skipped: true, reason: 'All agents processed', complete: true };
    }
    daemonInfo.current_action = eligible.length === 0 && launched.length === 0
      ? 'No eligible agents — waiting for approvals or dependencies'
      : `${eligible.length} agent(s) eligible`;
    logEvent({ type: 'cycle_result', detail: `Idle: ${daemonInfo.current_action} (${Date.now() - cycleStart}ms)` });
    supervisor.updateDashboard(state, healthAudit);
    saveState(state);
    return { skipped: true, reason: 'No eligible agents' };
  }

  const maxConcurrent = state.supervisor_control?.loop_guardrails?.max_concurrent_agents || 3;
  for (const agent of eligible.slice(0, maxConcurrent)) {
    const actualAgent = state.agent_states[agent.id];
    if (!actualAgent) continue;
    const needsApproval = actualAgent.requires_human_approval;
    const agentAudit = audit[agent.id];
    // Only fail on artifact-type compliance if the agent already ran (not a fresh pending launch)
    // Pending agents haven't generated their artifacts yet — the audit will run AFTER they complete
    const fatalFailures = (agentAudit?.items || []).filter(i => i.required && !i.passed && i.type !== 'workflow' && i.type !== 'traceability' && !(i.type === 'artifact' && (actualAgent.execution_count || 0) === 0));

    if (fatalFailures.length > 0) {
      actualAgent.status = 'failed';
      actualAgent.last_error = `Compliance audit failed — ${fatalFailures.map(i => i.check).join(', ')}`;
      actualAgent.consecutive_failures = (actualAgent.consecutive_failures || 0) + 1;
      logEvent({ type: 'compliance_failed', agent_id: agent.id });
      const threshold = state.supervisor_control?.loop_guardrails?.circuit_breaker_threshold || 5;
      if (actualAgent.consecutive_failures >= threshold) {
        state.supervisor_control.loop_guardrails.circuit_breaker = 'TRIPPED';
        state.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = new Date().toISOString();
        state.supervisor_control.loop_guardrails.circuit_breaker_reason = `${agent.id} exceeded ${threshold} consecutive failures`;
        logEvent({ type: 'circuit_breaker_tripped', agent_id: agent.id, consecutive: actualAgent.consecutive_failures, threshold });
      }
      continue;
    }

    actualAgent.status = 'in_progress';
    actualAgent.started_at = new Date().toISOString();
    const manifest = launchAgentTask(agent.id, state);
    launched.push({ id: agent.id, manifest });
    daemonInfo.current_action = `Launched ${agent.id}`;
    logEvent({ type: 'agent_launched', agent_id: agent.id });
  }

  // ── 10. Idle cycle tracking ──
  if (launched.length === 0 && eligible.filter(e => !e.disabled).length === 0) {
    const newIdle = (idleCycles || 0) + 1;
    state.supervisor_control.loop_guardrails = state.supervisor_control.loop_guardrails || {};
    state.supervisor_control.loop_guardrails.idle_cycles = newIdle;
    daemonInfo.current_action = `Waiting — ${newIdle} idle cycles`;
    if (newIdle >= maxIdle) {
      logEvent({ type: 'max_idle_cycles_reached', idle_cycles: newIdle });
      daemonInfo.current_action = `Idle timeout — ${maxIdle} cycles. Click Reset if stuck.`;
    }
  } else if (launched.length > 0) {
    state.supervisor_control.loop_guardrails = state.supervisor_control.loop_guardrails || {};
    state.supervisor_control.loop_guardrails.idle_cycles = 0;
    daemonInfo.current_action = `Launched ${launched.length} agent(s)`;
  } else {
    state.supervisor_control.loop_guardrails = state.supervisor_control.loop_guardrails || {};
    state.supervisor_control.loop_guardrails.idle_cycles = 0;
    daemonInfo.current_action = `${eligible.length} eligible — awaiting HITL or deps`;
  }

  logEvent({ type: 'cycle_result', detail: `${launched.length} agent(s) launched, ${eligible.length} eligible, ${unhealthyCount} unhealthy (${Date.now() - cycleStart}ms)` });

  // Re-read state before save — merge external changes from API handlers (cancel/rerun/approve)
  // that may have modified state during async yields in this cycle.
  // For agents we just launched, keep our snapshot (status=in_progress).
  // For all others, use external state — our cycle-level decisions will be re-evaluated next cycle.
  try {
    const latest = sfRead();
    if (latest?.agent_states) {
      const launchedIds = new Set((launched || []).map(l => l.id));
      for (const [id, ext] of Object.entries(latest.agent_states)) {
        if (!launchedIds.has(id)) {
          state.agent_states[id] = ext;
        }
      }
    }
  } catch {}

  supervisor.updateDashboard(state, healthAudit);
  saveState(state);

  return { launched, idle_cycles: state.supervisor_control?.loop_guardrails?.idle_cycles || 0, healthAudit };
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

// Rate limiter: only log the same message once per N seconds
const _logCache = new Map();
function rateLimitedLog(component, agentId, message, cooldownMs = 10000) {
  const key = `${agentId}:${message}`;
  const last = _logCache.get(key) || 0;
  if (Date.now() - last < cooldownMs) return;
  _logCache.set(key, Date.now());
  vlog.write(component, agentId, message);
}

async function daemonLoop() {
  vlog.write('DAEMON', '00_supervisor_agent', 'Daemon started');
  let lastAction = '';
  while (true) {
    try {
      // Cycle timeout: if runCycle takes >60s, treat as stuck
      const result = await Promise.race([
        runCycle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cycle timeout (>60s)')), 60000)),
      ]);
      if (result.skipped) {
        rateLimitedLog('DAEMON', '00_supervisor_agent', `Skipped: ${result.reason}`, 15000);
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
