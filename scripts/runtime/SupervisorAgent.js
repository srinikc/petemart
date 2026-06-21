const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vlog = require('./VerboseLogger');

const ROOT = process.cwd();
const STATE_PATH = () => path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const REGISTRY_PATH = () => path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json');
const EVENTS_PATH = () => path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const DASHBOARD_PATH = () => path.join(ROOT, '00_state_ledger/SUPERVISOR_DASHBOARD.json');
const EVENTS_CACHE_PATH = () => path.join(ROOT, '00_state_ledger/EVENTS_CACHE.json');
const ARTIFACT_HASHES_PATH = () => path.join(ROOT, '00_state_ledger/ARTIFACT_HASHES.json');

class SupervisorAgent {
  constructor() {
    this._agentId = '00_supervisor_agent';
    this._llmProvider = null;
    this._llmModel = null;
    this._artifactHashes = {};
    this._eventsCache = [];
    this._loadCaches();
  }

  _loadCaches() {
    try { this._artifactHashes = JSON.parse(fs.readFileSync(ARTIFACT_HASHES_PATH(), 'utf-8')); } catch { this._artifactHashes = {}; }
    try { this._eventsCache = JSON.parse(fs.readFileSync(EVENTS_CACHE_PATH(), 'utf-8')); } catch { this._eventsCache = []; }
  }

  _saveCaches() {
    try { fs.writeFileSync(ARTIFACT_HASHES_PATH(), JSON.stringify(this._artifactHashes, null, 2), 'utf-8'); } catch {}
    try { fs.writeFileSync(EVENTS_CACHE_PATH(), JSON.stringify(this._eventsCache.slice(-5000), null, 2), 'utf-8'); } catch {}
  }

  // ─────────────────────────────────────────────
  //  COMPREHENSIVE HEALTH AUDIT (runs every cycle)
  // ─────────────────────────────────────────────

  async runHealthAudit(state) {
    const results = {};
    const registry = this._readRegistry();

    for (const [id, agent] of Object.entries(state.agent_states || {})) {
      if (id === this._agentId) continue;
      const checks = [];

      // 1. Artifact files on disk — exist, non-empty, recent
      checks.push(this._checkArtifactFiles(id, agent));

      // 2. Agent run log errors
      checks.push(this._checkAgentRunLog(id));

      // 3. Checkpoint completeness from PIPELINE_EVENTS.jsonl
      checks.push(this._checkCheckpointCompleteness(id, agent));

      // 4. LLM provider health
      checks.push(await this._checkLLMHealth());

      // 5. Tools availability from registry
      checks.push(this._checkToolsAvailable(id, registry));

      // 6. Dependency integrity
      checks.push(this._checkDependencyIntegrity(id, agent, state));

      // 7. Stuck detection for active agents
      checks.push(this._checkStuck(id, agent));

      // 8. Execution limit
      checks.push(this._checkExecutionLimit(id, agent, state));

      // 9. Upstream change detection — artifact mtime delta
      checks.push(this._checkUpstreamChanges(id, agent, state));

      const allHealthy = checks.every(c => c.healthy !== false);
      results[id] = { agent_id: id, status: agent.status, allHealthy, checks, checked_at: new Date().toISOString() };
    }

    // Store in artifact hashes cache for change detection
    this._saveCaches();

    return results;
  }

  _checkArtifactFiles(id, agent) {
    const emitted = agent.artifacts_emitted || [];
    const missing = [];
    const empty = [];
    const stale = [];
    const now = Date.now();

    for (const art of emitted) {
      const fp = path.join(ROOT, art);
      try {
        const stat = fs.statSync(fp);
        if (stat.size === 0) empty.push(art);
        // Stale if > 24h and agent is in_progress
        if (agent.status === 'in_progress' || agent.status === 'active') {
          if (now - stat.mtimeMs > 86400000) stale.push(art);
        }
      } catch {
        missing.push(art);
      }
    }

    // Track artifact hashes for upstream change detection
    const currentHashes = {};
    for (const art of emitted) {
      const fp = path.join(ROOT, art);
      try {
        const content = fs.readFileSync(fp);
        currentHashes[art] = crypto.createHash('md5').update(content).digest('hex');
      } catch {
        currentHashes[art] = null;
      }
    }
    this._artifactHashes[id] = currentHashes;

    const healthy = missing.length === 0 && empty.length === 0;
    return {
      check: 'artifacts_on_disk',
      healthy,
      detail: `${emitted.length} tracked, ${missing.length} missing, ${empty.length} empty, ${stale.length} stale`,
      artifacts: { total: emitted.length, missing, empty, stale },
    };
  }

  _checkAgentRunLog(id) {
    const logPath = path.join(ROOT, '00_state_ledger', `AGENT_RUN_${id}.log`);
    let errorCount = 0;
    let lastError = null;
    try {
      if (!fs.existsSync(logPath)) {
        const recentRun = this._eventsCache.filter(e => e.agent_id === id && e.type === 'agent_started').length;
        return {
          check: 'agent_run_log',
          healthy: recentRun === 0, // healthy if never run yet
          detail: recentRun > 0 ? `No log file — ${recentRun} runs exist in events` : 'No runs recorded',
          errorCount: 0,
          lastError: null,
        };
      }
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n');
      const errorLines = lines.filter(l => l.includes('[ERR]') || l.includes('[ERROR]'));
      errorCount = errorLines.length;
      if (errorLines.length > 0) {
        lastError = errorLines.slice(-1)[0]?.slice(0, 200) || null;
      }
      // Also scan verbose lifecycle log for agent errors
      const lifecycleDir = path.join(ROOT, 'logs');
      if (fs.existsSync(lifecycleDir)) {
        const files = fs.readdirSync(lifecycleDir).filter(f => f.startsWith('lifecycle-')).sort().reverse().slice(0, 3);
        for (const f of files) {
          const lc = fs.readFileSync(path.join(lifecycleDir, f), 'utf-8');
          const matches = lc.split('\n').filter(l => l.includes(`[${id}]`) && (l.includes('ERROR') || l.includes('error') || l.includes('Failed')));
          errorCount += matches.length;
          if (matches.length > 0 && !lastError) lastError = matches.slice(-1)[0]?.slice(0, 200);
        }
      }
    } catch { errorCount = -1; }

    return {
      check: 'agent_run_log',
      healthy: errorCount === 0,
      detail: errorCount > 0 ? `${errorCount} error(s) found` : 'No errors',
      errorCount,
      lastError,
    };
  }

  _checkCheckpointCompleteness(id, agent) {
    const events = this._eventsCache.filter(e => e.agent_id === id);
    const started = events.filter(e => e.type === 'checkpoint_start').length;
    const completed = events.filter(e => e.type === 'checkpoint_complete').length;
    const llmIters = events.filter(e => e.type === 'llm_iteration').length;
    const errors = events.filter(e => e.type === 'llm_iteration_error' || e.type === 'agent_llm_error').length;
    const lastRun = events.filter(e => e.type === 'agent_completed' || e.type === 'agent_started').slice(-1)[0];

    const healthy = started === 0 || (started > 0 && started === completed);
    return {
      check: 'checkpoint_completeness',
      healthy,
      detail: `${completed}/${started} checkpoints done, ${llmIters} LLM iters, ${errors} errors`,
      checkpoints: { started, completed, llmIterations: llmIters, errors },
      lastRun: lastRun?.timestamp || null,
    };
  }

  async _checkLLMHealth() {
    try {
      const { LLMProvider } = require('./LLMProvider');
      if (!this._llmProvider) {
        this._llmProvider = LLMProvider.fromEnv();
        const init = await this._llmProvider.initialize();
        this._llmModel = init.model || 'unknown';
      }
      return {
        check: 'llm_health',
        healthy: true,
        detail: `Provider: ${this._llmProvider.provider || 'opencode'}, Model: ${this._llmModel}`,
        provider: this._llmProvider.provider,
        model: this._llmModel,
      };
    } catch (err) {
      return {
        check: 'llm_health',
        healthy: false,
        detail: `LLM check failed: ${err.message}`,
        provider: null,
        model: null,
        error: err.message,
      };
    }
  }

  _checkToolsAvailable(id, registry) {
    const agentTools = registry?.agents?.[id]?.tools || [];
    const expectedTools = ['write_artifact', 'read_dependency', 'browse_files', 'read_file'];
    const defined = agentTools.map(t => t.function?.name).filter(Boolean);
    const common = expectedTools.filter(t => t !== 'read_dependency' || id !== '01_ideation_agent'); // all agents get read_dependency
    const missing = common.filter(t => !defined.includes(t) && !agentTools.some(at => at.function?.name === t));

    // Read dependency tool is provided by _commonTools() in AgentRuntime — not missing if not in agent-def
    const realMissing = missing.filter(t => t !== 'read_dependency' && t !== 'browse_files' && t !== 'read_file');

    return {
      check: 'tools_available',
      healthy: realMissing.length === 0,
      detail: `${defined.length} tool(s) defined in registry, ${realMissing.length} missing`,
      defined,
      missing: realMissing,
    };
  }

  _checkDependencyIntegrity(id, agent, state) {
    const deps = agent.dependencies || [];
    if (deps.length === 0) {
      return { check: 'dependency_integrity', healthy: true, detail: 'No dependencies', dependencyStatus: {} };
    }

    const depStatus = {};
    let allHealthy = true;
    for (const dep of deps) {
      const depAgent = state.agent_states?.[dep];
      if (!depAgent) {
        depStatus[dep] = { resolved: false, status: 'not_found' };
        allHealthy = false;
      } else if (depAgent.status === 'approved' || depAgent.status === 'completed') {
        depStatus[dep] = { resolved: true, status: depAgent.status };
      } else if (depAgent.status === 'failed') {
        depStatus[dep] = { resolved: false, status: 'failed' };
        allHealthy = false;
      } else {
        depStatus[dep] = { resolved: false, status: depAgent.status };
        allHealthy = false;
      }
    }

    return {
      check: 'dependency_integrity',
      healthy: allHealthy,
      detail: `${Object.values(depStatus).filter(d => d.resolved).length}/${deps.length} deps resolved`,
      dependencyStatus: depStatus,
      allDepsResolved: allHealthy,
    };
  }

  _checkStuck(id, agent) {
    if (agent.status !== 'in_progress' && agent.status !== 'active') {
      return { check: 'stuck_detection', healthy: true, detail: 'Agent not active', stuck: false };
    }

    const startedAt = agent.started_at || agent.last_activity_timestamp;
    if (!startedAt) {
      return { check: 'stuck_detection', healthy: true, detail: 'No start time recorded', stuck: false };
    }

    const elapsed = Date.now() - new Date(startedAt).getTime();
    const timeout = agent.timeout_threshold_ms || 300000; // 5 min default
    const isStuck = elapsed > timeout;
    const stepStuck = agent.step_label && agent.last_activity_timestamp
      ? (Date.now() - new Date(agent.last_activity_timestamp).getTime()) > 120000 // 2 min on same step
      : false;

    return {
      check: 'stuck_detection',
      healthy: !isStuck && !stepStuck,
      detail: isStuck
        ? `Running for ${Math.round(elapsed / 1000)}s (timeout: ${timeout / 1000}s)`
        : `${Math.round(elapsed / 1000)}s elapsed`,
      stuck: isStuck || stepStuck,
      elapsedMs: elapsed,
      timeoutMs: timeout,
      currentStep: agent.step_label || null,
      stepStuck,
    };
  }

  _checkExecutionLimit(id, agent, state) {
    const maxExec = state.supervisor_control?.loop_guardrails?.max_sequential_executions_per_agent || 3;
    const current = agent.execution_count || 0;
    const healthy = current < maxExec;
    return {
      check: 'execution_limit',
      healthy,
      detail: `${current}/${maxExec} executions used`,
      executionCount: current,
      maxExecutions: maxExec,
      exceeded: current >= maxExec,
    };
  }

  _checkUpstreamChanges(id, agent, state) {
    const deps = agent.dependencies || [];
    if (deps.length === 0) {
      return { check: 'upstream_changes', healthy: true, detail: 'No upstream deps', changed: false };
    }

    const changed = [];
    const prevHashes = { ...(this._artifactHashes || {}) };

    // Re-hash current artifacts for upstream agents
    for (const depId of deps) {
      const depAgent = state.agent_states?.[depId];
      if (!depAgent) continue;
      const currentDepHashes = {};
      for (const art of (depAgent.artifacts_emitted || [])) {
        const fp = path.join(ROOT, art);
        try {
          const content = fs.readFileSync(fp);
          currentDepHashes[art] = crypto.createHash('md5').update(content).digest('hex');
        } catch {
          currentDepHashes[art] = null;
        }
      }
      const prev = prevHashes[depId] || {};
      for (const [artPath, hash] of Object.entries(currentDepHashes)) {
        if (prev[artPath] && prev[artPath] !== hash) {
          changed.push({ agentId: depId, artifact: artPath, from: prev[artPath]?.slice(0, 8), to: hash?.slice(0, 8) });
        }
      }
    }

    return {
      check: 'upstream_changes',
      healthy: changed.length === 0,
      detail: changed.length > 0 ? `${changed.length} upstream artifact(s) changed` : 'No changes detected',
      changed,
      upstreamChanged: changed.length > 0,
    };
  }

  // ── Compliance Audit ──

  runComplianceAudit(state) {
    return this._auditAll(state);
  }

  _auditAll(state) {
    const auditResults = {};
    for (const [id, agent] of Object.entries(state.agent_states || {})) {
      if (!agent.compliance_checklist) continue;
      const results = [];
      let allPassed = true;
      for (const check of agent.compliance_checklist) {
        let passed = false;
        if (check.type === 'artifact' && check.check.startsWith('artifact_exists(')) {
          const match = check.check.match(/artifact_exists\(([^)]+)\)/);
          if (match) {
            // Pending agents haven't run yet — skip artifact check
            if (agent.status === 'pending' && (agent.execution_count || 0) === 0) {
              passed = true;
            } else {
              const artifacts = agent.artifacts_emitted || [];
              passed = artifacts.some(a => a.includes(match[1]));
            }
          }
        } else if (check.type === 'workflow') {
          passed = false;
        } else if (check.type === 'traceability') {
          passed = false;
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

  // ── Supervisor Tools ──

  getDashboard(state) {
    return this.generateDashboardSummary(state);
  }

  async runAgent(agentId, instruction) {
    const { AgentRuntime } = require('./AgentRuntime');
    const { LLMProvider } = require('./LLMProvider');
    const runtime = new AgentRuntime({ llm: LLMProvider.fromEnv() });
    return runtime.runAgent(agentId, { userInstruction: instruction });
  }

  pausePipeline(state) {
    state.pipeline_control = state.pipeline_control || {};
    state.pipeline_control.is_pipeline_paused = true;
    state.pipeline_control.paused_at = new Date().toISOString();
    this.saveState(state);
    this.logEvent({ type: 'pipeline_paused' });
    return { paused: true, timestamp: state.pipeline_control.paused_at };
  }

  resumePipeline(state) {
    state.pipeline_control = state.pipeline_control || {};
    state.pipeline_control.is_pipeline_paused = false;
    state.pipeline_control.resumed_at = new Date().toISOString();
    this.saveState(state);
    this.logEvent({ type: 'pipeline_resumed' });
    return { resumed: true, timestamp: state.pipeline_control.resumed_at };
  }

  getAgentLogs(agentId, maxLines = 50) {
    try {
      const logDir = path.join(ROOT, 'logs');
      const files = fs.readdirSync(logDir).filter(f => f.startsWith('lifecycle-')).sort().reverse();
      if (files.length === 0) {
        // Fallback: read AGENT_RUN_<id>.log
        const runLog = path.join(ROOT, '00_state_ledger', `AGENT_RUN_${agentId}.log`);
        if (fs.existsSync(runLog)) {
          const lines = fs.readFileSync(runLog, 'utf-8').split('\n').filter(Boolean).slice(-maxLines);
          return { logs: lines, source: 'agent_run_log' };
        }
        return { logs: [] };
      }
      const content = fs.readFileSync(path.join(logDir, files[0]), 'utf-8');
      const lines = content.split('\n').filter(l => l.includes(`[${agentId}]`)).slice(-maxLines);
      return { logs: lines, source: 'lifecycle' };
    } catch { return { logs: [] }; }
  }

  updateAgentStatus(state, agentId, newStatus, extra = {}) {
    const agent = state.agent_states?.[agentId];
    if (!agent) return { error: `Agent ${agentId} not found` };
    const prevStatus = agent.status;
    agent.status = newStatus;
    agent.last_activity_timestamp = new Date().toISOString();
    Object.assign(agent, extra);
    this.saveState(state);
    this.logEvent({ type: 'agent_state_change', agent_id: agentId, from: prevStatus, to: newStatus });
    return { success: true, agentId, newStatus };
  }

  sendResponse(state, message) {
    this.logEvent({ type: 'supervisor_response', message });
    return { sent: true, timestamp: new Date().toISOString() };
  }

  // ── State Validation ──

  validateState(state) {
    const errors = [];
    if (!state.project_metadata) errors.push('Missing project_metadata');
    if (!state.agent_states) errors.push('Missing agent_states');
    if (!state.supervisor_control) errors.push('Missing supervisor_control');
    return { valid: errors.length === 0, errors };
  }

  // ── Dashboard Summary ──

  generateDashboardSummary(state) {
    const agents = Object.entries(state.agent_states || {}).filter(([k]) => k !== this._agentId);
    const total = agents.length;
    const completed = agents.filter(([, a]) => a.status === 'approved' || a.status === 'completed').length;
    const inProgress = agents.filter(([, a]) => a.status === 'in_progress' || a.status === 'active').length;
    const pending = agents.filter(([, a]) => a.status === 'pending' || a.status === 'idle').length;
    const awaitingReview = agents.filter(([, a]) => a.status === 'awaiting_approval').length;
    const failed = agents.filter(([, a]) => a.status === 'failed' && !a.disabled).length;
    const awaitingInput = agents.filter(([, a]) => a.status === 'awaiting_input').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total_agents: total + 1,
      agents_completed: completed,
      agents_in_progress: inProgress,
      agents_pending: pending,
      agents_awaiting_review: awaitingReview,
      agents_awaiting_input: awaitingInput,
      agents_failed: failed,
      overall_progress_pct: pct,
      last_updated: new Date().toISOString(),
    };
  }

  // ── Approval Gate Check ──

  checkApprovalGates(state) {
    const gates = state.supervisor_control?.approval_gates || [];
    const pending = gates.filter(g => !g.approved).map(g => g.gate_id);
    return { allApproved: pending.length === 0, pendingGates: pending };
  }

  // ── State I/O ──

  readState() {
    try { return JSON.parse(fs.readFileSync(STATE_PATH(), 'utf-8')); } catch { return null; }
  }

  saveState(state) {
    try {
      fs.writeFileSync(STATE_PATH(), JSON.stringify(state, null, 2), 'utf-8');
      const proj = path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');
      try { fs.writeFileSync(proj, JSON.stringify(state, null, 2), 'utf-8'); } catch {}
    } catch {}
  }

  logEvent(event) {
    try {
      const entry = { ...event, timestamp: new Date().toISOString() };
      fs.appendFileSync(EVENTS_PATH(), JSON.stringify(entry) + '\n', 'utf-8');
      this._eventsCache.push(entry);
      if (this._eventsCache.length > 5000) this._eventsCache = this._eventsCache.slice(-5000);
    } catch {}
  }

  updateDashboard(state, healthAudit = null) {
    try {
      const summary = this.generateDashboardSummary(state);
      const circuitBreaker = state.supervisor_control?.loop_guardrails?.circuit_breaker || 'CLOSED';
      const daemonInfo = state.supervisor_control?.agent_00_supervisor || {};
      const dashboard = {
        pipeline_phase: state.pipeline_control?.pipeline_phase || 'idle',
        pipeline_paused: state.pipeline_control?.is_pipeline_paused || false,
        cycle_count: daemonInfo.cycle_count || 0,
        circuit_breaker: circuitBreaker,
        daemon: {
          status: daemonInfo.daemon_status || 'stopped',
          heartbeat: daemonInfo.daemon_last_heartbeat || null,
          last_cycle: daemonInfo.last_cycle_timestamp || null,
          current_action: daemonInfo.current_action || null,
        },
        summary,
        agents: Object.entries(state.agent_states || {}).map(([id, a]) => ({
          id,
          status: a.status,
          role: a.role,
          phase: a.phase,
          execution_count: a.execution_count || 0,
          step_label: a.step_label || null,
          last_error: a.last_error || null,
          requires_human_approval: a.requires_human_approval || false,
          artifacts_emitted: (a.artifacts_emitted || []).length,
          compliance_passed: a.compliance_checklist ? a.compliance_checklist.filter(c => c.passed).length : 0,
          compliance_total: a.compliance_checklist ? a.compliance_checklist.length : 0,
        })),
        health_audit: healthAudit || null,
        events_last_minute: this._eventsCache.filter(e => Date.now() - new Date(e.timestamp).getTime() < 60000).length,
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(DASHBOARD_PATH(), JSON.stringify(dashboard, null, 2), 'utf-8');
    } catch (e) {
      vlog.write('SUPERVISOR', this._agentId, `Dashboard update error: ${e.message}`);
    }
  }

  // ── Helpers ──

  _readRegistry() {
    try { return JSON.parse(fs.readFileSync(REGISTRY_PATH(), 'utf-8')); } catch { return null; }
  }
}

module.exports = { SupervisorAgent };
