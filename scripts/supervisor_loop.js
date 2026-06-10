#!/usr/bin/env node
/**
 * Supervisor Loop — Autonomous Pipeline Orchestrator
 *
 * Reads STATE_MATRIX.json, computes eligible agents based on dependency graph,
 * launches agents (or flags them for HITL), runs compliance audits, updates state.
 *
 * Usage:
 *   node scripts/supervisor_loop.js              # single cycle
 *   node scripts/supervisor_loop.js --watch       # continuous loop
 *   node scripts/supervisor_loop.js --once        # one cycle, exit
 *   node scripts/supervisor_loop.js --agent 07a   # force-run specific agent
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const REGISTRY_PATH = path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json');
const TRACEABILITY_PATH = path.join(ROOT, '00_state_ledger/TRACEABILITY_MATRIX.json');
const EVENTS_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const AGENTS_DIR = path.join(ROOT, '.opencode/agents');

// ── Helpers ──

function readJSON(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function getState() {
  const raw = readJSON(STATE_PATH);
  if (!raw) throw new Error('STATE_MATRIX.json not found or invalid');
  return raw;
}

function saveState(state) {
  state.pipeline_control.last_sync_timestamp = new Date().toISOString();
  writeJSON(STATE_PATH, state);
}

function logEvent(event) {
  const entry = { ...event, timestamp: new Date().toISOString() };
  fs.appendFileSync(EVENTS_PATH, JSON.stringify(entry) + '\n', 'utf-8');
}

function artifactExists(relPath) {
  const p = path.join(ROOT, relPath);
  return fs.existsSync(p) && fs.statSync(p).size > 0;
}

// ── Agent Definitions ──

function getAgentDefs() {
  const registry = readJSON(REGISTRY_PATH);
  return registry?.agents || {};
}

function getAgentPrompt(agentId) {
  const agentFile = path.join(AGENTS_DIR, `${agentId}.md`);
  if (!fs.existsSync(agentFile)) return null;
  return fs.readFileSync(agentFile, 'utf-8');
}

// ── Eligibility Engine ──

function getDependencyArtifacts(state, agentState) {
  if (!agentState.dependencies || agentState.dependencies.length === 0) return [];
  return agentState.dependencies
    .map(depId => {
      const dep = state.agent_states[depId];
      return dep?.artifacts_emitted || [];
    })
    .flat();
}

function dependenciesMet(state, agentState) {
  if (!agentState.dependencies || agentState.dependencies.length === 0) return true;
  return agentState.dependencies.every(depId => {
    const dep = state.agent_states[depId];
    return dep && (dep.status === 'approved' || dep.status === 'completed');
  });
}

function compliancePassed(agentState) {
  if (!agentState.compliance_checklist) return true;
  const failed = agentState.compliance_checklist.filter(c => c.required && c.passed === false);
  return failed.length === 0;
}

function getEligibleAgents(state) {
  const agents = state.agent_states;
  const loopGuard = state.supervisor_control?.loop_guardrails || {};
  const maxExec = loopGuard.max_sequential_executions_per_agent || 3;
  const circuitBreakerTripped = !!loopGuard.circuit_breaker_tripped_at;

  const eligible = [];

  for (const [id, agent] of Object.entries(agents)) {
    if (id === '00_supervisor_agent') continue;
    if (agent.status === 'approved' || agent.status === 'completed') continue;
    if (agent.status === 'failed') continue;
    if (agent.status === 'in_progress') continue;
    if (agent.status === 'active') continue;
    if ((agent.execution_count || 0) >= maxExec) continue;
    if (!dependenciesMet(state, agent)) continue;

    eligible.push({ id, ...agent });
  }

  return { eligible, circuitBreakerTripped };
}

// ── Compliance Audit ──

function runComplianceAudit(state) {
  const auditResults = {};
  for (const [id, agent] of Object.entries(state.agent_states)) {
    if (!agent.compliance_checklist) continue;
    const results = [];
    let allPassed = true;
    for (const check of agent.compliance_checklist) {
      let passed = false;
      if (check.type === 'artifact' && check.check.startsWith('artifact_exists(')) {
        const match = check.check.match(/artifact_exists\(([^)]+)\)/);
        if (match) {
          const agentKey = Object.keys(state.agent_states).find(k => k.includes(id.replace('_agent','')));
          if (!agentKey) { passed = false; }
          else {
            const artifacts = state.agent_states[agentKey]?.artifacts_emitted || [];
            passed = artifacts.some(a => a.includes(match[1]));
          }
        }
      } else if (check.type === 'workflow' && (check.check.includes('feature_branch_used') || check.check.includes('pr_created') || check.check.includes('ci_pipeline'))) {
        passed = false; // Requires human verification
      } else if (check.type === 'traceability') {
        passed = false; // Requires verification
      } else {
        passed = check.passed;
      }
      if (check.required && !passed) allPassed = false;
      results.push({ ...check, passed, audited_at: new Date().toISOString() });
    }
    auditResults[id] = { allPassed, items: results };
  }
  return auditResults;
}

// ── Agent Launcher ──

function shouldAutoRunAgent(agentId, state) {
  const agent = state.agent_states[agentId];
  if (!agent) return false;
  if (agent.requires_human_approval) return false;
  const registry = getAgentDefs();
  const def = registry[agentId];
  if (def?.human_in_the_loop_gate) return false;
  return true;
}

function launchAgentTask(agentId, state) {
  const agent = state.agent_states[agentId];
  const prompt = getAgentPrompt(agentId);
  const artifacts = getDependencyArtifacts(state, agent);
  const registryDef = getAgentDefs()[agentId];

  const taskManifest = {
    agent_id: agentId,
    role: agent.role,
    phase: agent.phase,
    dependencies_artifacts: artifacts,
    deliverables: registryDef?.deliverables || {},
    sandbox_dir: registryDef?.workspace_root || `agents/03_execution_workspace/${agentId}/`,
    prompt_source: `.opencode/agents/${agentId}.md`,
    compliance_checks: agent.compliance_checklist || [],
    launched_at: new Date().toISOString(),
    status: 'launched',
  };

  const manifestPath = path.join(ROOT, '00_state_ledger', `TASK_${agentId}.json`);
  writeJSON(manifestPath, taskManifest);

  return taskManifest;
}

// ── State Transitions ──

function transitionAgent(state, agentId, newStatus, extra = {}) {
  const agent = state.agent_states[agentId];
  if (!agent) return;
  agent.status = newStatus;
  agent.last_activity_timestamp = new Date().toISOString();
  Object.assign(agent, extra);
  logEvent({ type: 'agent_state_change', agent_id: agentId, from: agent.status, to: newStatus, ...extra });
}

function updateDashboardSummary(state) {
  const agents = Object.values(state.agent_states).filter(a => a.agent_id !== '00_supervisor_agent');
  const total = agents.length;
  const completed = agents.filter(a => a.status === 'approved' || a.status === 'completed').length;
  const inProgress = agents.filter(a => a.status === 'in_progress' || a.status === 'active').length;
  const pending = agents.filter(a => a.status === 'pending' || a.status === 'idle').length;
  const awaitingReview = agents.filter(a => a.status === 'awaiting_approval').length;
  const failed = agents.filter(a => a.status === 'failed').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  state.pipeline_control.dashboard_summary = {
    total_agents: total + 1,
    agents_completed: completed,
    agents_in_progress: inProgress,
    agents_pending: pending,
    agents_awaiting_review: awaitingReview,
    agents_failed: failed,
    overall_progress_pct: pct,
    last_milestone: state.pipeline_control.dashboard_summary?.last_milestone || '',
    last_updated: new Date().toISOString(),
  };
}

// ── Core Cycle ──

async function runCycle(state) {
  const loopGuard = state.supervisor_control?.loop_guardrails || {};
  const maxConcurrent = loopGuard.max_concurrent_agents || 3;
  const cooldown = (loopGuard.cooldown_between_cycles_s || 5) * 1000;

  if (state.pipeline_control?.is_pipeline_paused) {
    return { skipped: true, reason: 'Pipeline paused' };
  }

  const cycleCount = (state.supervisor_control?.agent_00_supervisor?.cycle_count || 0) + 1;
  const maxCycles = state.supervisor_control?.agent_00_supervisor?.max_cycles_before_break || 100;

  if (cycleCount > maxCycles) {
    logEvent({ type: 'max_cycles_reached', cycle_count: cycleCount, max_cycles: maxCycles });
    return { skipped: true, reason: `Max cycles (${maxCycles}) reached` };
  }

  if (!state.supervisor_control.agent_00_supervisor) {
    state.supervisor_control.agent_00_supervisor = {};
  }
  state.supervisor_control.agent_00_supervisor.cycle_count = cycleCount;
  state.supervisor_control.agent_00_supervisor.last_cycle_timestamp = new Date().toISOString();

  const { eligible, circuitBreakerTripped } = getEligibleAgents(state);

  if (circuitBreakerTripped) {
    logEvent({ type: 'circuit_breaker_active', cycle_count: cycleCount });
    return { skipped: true, reason: 'Circuit breaker tripped' };
  }

  if (eligible.length === 0) {
    const allDone = Object.values(state.agent_states).every(a =>
      a.agent_id === '00_supervisor_agent' || a.status === 'approved' || a.status === 'completed' || a.status === 'failed'
    );
    if (allDone) {
      logEvent({ type: 'pipeline_complete', cycle_count: cycleCount });
      return { skipped: true, reason: 'All agents processed', complete: true };
    }
    logEvent({ type: 'no_eligible_agents', cycle_count: cycleCount, pending: Object.values(state.agent_states).filter(a => a.status !== 'approved' && a.status !== 'completed' && a.status !== 'failed').map(a => a.agent_id) });
    return { skipped: true, reason: 'No eligible agents (probably waiting on dependencies or HITL)' };
  }

  const launched = [];

  for (const agent of eligible.slice(0, maxConcurrent)) {
    const needsApproval = agent.requires_human_approval;
    const needsHITL = agent.status !== 'approved';

    // Run compliance audit
    const audit = runComplianceAudit(state);
    const agentAudit = audit[agent.id];
    const auditPassed = agentAudit?.allPassed !== false;

    // Non-fatal compliance types: workflow, traceability — these require human review, not auto-fail
    const fatalFailures = (agentAudit?.items || []).filter(i =>
      i.required && !i.passed && i.type !== 'workflow' && i.type !== 'traceability'
    );
    const nonFatalFailures = (agentAudit?.items || []).filter(i =>
      i.required && !i.passed && (i.type === 'workflow' || i.type === 'traceability')
    );
    const hasFatalFailure = fatalFailures.length > 0;

    if (hasFatalFailure) {
      transitionAgent(state, agent.id, 'failed', {
        last_error: `Compliance audit failed — ${fatalFailures.map(i => i.check).join(', ')}`,
      });
      logEvent({ type: 'compliance_failed', agent_id: agent.id, fatal: fatalFailures.map(i => i.id) });
      continue;
    }

    if (needsApproval || needsHITL) {
      const extraNotes = nonFatalFailures.length > 0
        ? { notes: `Non-fatal compliance gaps: ${nonFatalFailures.map(i => i.check).join('; ')}. Review and approve if acceptable.` }
        : {};
      transitionAgent(state, agent.id, 'awaiting_approval', extraNotes);
      logEvent({ type: 'agent_awaiting_approval', agent_id: agent.id });
      continue;
    }

    // Auto-launch agent
    transitionAgent(state, agent.id, 'in_progress');
    const manifest = launchAgentTask(agent.id, state);
    launched.push({ id: agent.id, manifest });
    logEvent({ type: 'agent_launched', agent_id: agent.id });
  }

  updateDashboardSummary(state);
  saveState(state);

  return { launched, pending: eligible.length - launched.length, cycle_count: cycleCount };
}

// ── CLI ──

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');
  const once = args.includes('--once');
  const forceAgent = args.find(a => a.startsWith('--agent='))?.split('=')[1];

  if (forceAgent) {
    const state = getState();
    const agentId = Object.keys(state.agent_states).find(k => k.startsWith(forceAgent));
    if (!agentId) { console.error(`Agent ${forceAgent} not found`); process.exit(1); }
    const agent = state.agent_states[agentId];
    if (agent.status === 'in_progress' || agent.status === 'active') {
      console.log(`Agent ${agentId} is already ${agent.status}. Skipping.`);
      process.exit(0);
    }
    transitionAgent(state, agentId, 'pending');
    saveState(state);
    console.log(`Force-queued ${agentId} for re-execution. Run supervisor loop to pick it up.`);
    process.exit(0);
  }

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  PeteMart Supervisor Loop v2.0           ║');
  console.log('║  Autonomous Pipeline Orchestrator         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  let cycleCount = 0;

  const runNext = async () => {
    cycleCount++;
    const state = getState();
    const result = await runCycle(state);

    if (result.skipped) {
      console.log(`[Cycle ${cycleCount}] ⏭ ${result.reason}`);
      if (result.complete) {
        console.log('\n✅ Pipeline complete! All agents processed.');
        process.exit(0);
      }
    } else {
      console.log(`[Cycle ${cycleCount}] 🚀 Launched ${result.launched.length} agent(s), ${result.pending} pending queue`);
      result.launched.forEach(l => console.log(`  → ${l.id}`));
    }

    // Print compliance-augmented dashboard
    const current = getState();
    const ds = current.pipeline_control?.dashboard_summary;
    if (ds) {
      console.log(`\n📊 Pipeline: ${ds.agents_completed}/${ds.total_agents} done | ` +
        `${ds.agents_in_progress} running | ${ds.agents_awaiting_review} awaiting review | ` +
        `${ds.agents_failed} failed | ${ds.overall_progress_pct}%\n`);
    }

    if (watch) {
      const cooldown = (current.supervisor_control?.loop_guardrails?.cooldown_between_cycles_s || 5) * 1000;
      console.log(`⏳ Cooldown ${cooldown/1000}s...\n`);
      await new Promise(r => setTimeout(r, cooldown));
      setImmediate(runNext);
    } else if (once) {
      process.exit(0);
    }
  };

  await runNext();
}

if (require.main === module) {
  main().catch(err => {
    console.error('Supervisor loop error:', err);
    process.exit(1);
  });
}

module.exports = { runCycle, getEligibleAgents, runComplianceAudit, dependenciesMet, compliancePassed, transitionAgent, updateDashboardSummary, getState, saveState };
