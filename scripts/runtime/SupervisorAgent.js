const fs = require('fs');
const path = require('path');
const vlog = require('./VerboseLogger');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const EVENTS_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const DASHBOARD_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_DASHBOARD.json');

class SupervisorAgent {
  constructor() {
    this._agentId = '00_supervisor_agent';
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
            const artifacts = agent.artifacts_emitted || [];
            passed = artifacts.some(a => a.includes(match[1]));
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
      if (files.length === 0) return { logs: [] };
      const content = fs.readFileSync(path.join(logDir, files[0]), 'utf-8');
      const lines = content.split('\n').filter(l => l.includes(`[${agentId}]`)).slice(-maxLines);
      return { logs: lines };
    } catch { return { logs: [] }; }
  }

  updateAgentStatus(state, agentId, newStatus, extra = {}) {
    const agent = state.agent_states?.[agentId];
    if (!agent) return { error: `Agent ${agentId} not found` };
    agent.status = newStatus;
    agent.last_activity_timestamp = new Date().toISOString();
    Object.assign(agent, extra);
    this.saveState(state);
    this.logEvent({ type: 'agent_state_change', agent_id: agentId, from: agent.status, to: newStatus });
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
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total_agents: total + 1,
      agents_completed: completed,
      agents_in_progress: inProgress,
      agents_pending: pending,
      agents_awaiting_review: awaitingReview,
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
    try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return null; }
  }

  saveState(state) {
    try {
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
      const proj = path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');
      try { fs.writeFileSync(proj, JSON.stringify(state, null, 2), 'utf-8'); } catch {}
    } catch {}
  }

  logEvent(event) {
    try {
      const entry = { ...event, timestamp: new Date().toISOString() };
      fs.appendFileSync(EVENTS_PATH, JSON.stringify(entry) + '\n', 'utf-8');
    } catch {}
  }

  updateDashboard(state) {
    try {
      const summary = this.generateDashboardSummary(state);
      const circuitBreaker = state.supervisor_control?.loop_guardrails?.circuit_breaker || 'CLOSED';
      const dashboard = {
        pipeline_phase: state.pipeline_control?.pipeline_phase || 'idle',
        pipeline_paused: state.pipeline_control?.is_pipeline_paused || false,
        cycle_count: state.supervisor_control?.agent_00_supervisor?.cycle_count || 0,
        circuit_breaker: circuitBreaker,
        summary,
        agents: Object.entries(state.agent_states || {}).map(([id, a]) => ({
          id,
          status: a.status,
          role: a.role,
          phase: a.phase,
          execution_count: a.execution_count || 0,
        })),
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2), 'utf-8');
    } catch (e) {
      vlog.write('SUPERVISOR', this._agentId, `Dashboard update error: ${e.message}`);
    }
  }
}

module.exports = { SupervisorAgent };
