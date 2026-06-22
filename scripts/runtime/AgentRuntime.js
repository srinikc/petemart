const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const vlog = require('./VerboseLogger');
const { getInstance: getTracer } = require('./TraceLogger');
const { LLMProvider } = require('./LLMProvider');
const { saveStateSync } = require('./StateFile');

const ROOT = process.cwd();

/**
 * Check if a file is tracked by git (committed to the repository).
 * Returns true if the file is git-tracked, false otherwise.
 * Stale agent sandbox files (old generated artifacts) are NOT tracked and will be archived.
 * Committed deliverables (specs, READMEs, etc.) ARE tracked and must NOT be moved.
 */
function isGitTracked(filePath) {
  try {
    execSync(`git -C "${ROOT}" ls-files --error-unmatch "${filePath}"`, { stdio: 'pipe', timeout: 3000, windowsHide: true });
    return true;
  } catch { return false; }
}
const STATE_PATH = () => path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const REGISTRY_PATH = () => path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json');
const EVENTS_PATH = () => path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
const CHANGE_PATH = () => path.join(ROOT, '00_state_ledger/CHANGE_REQUEST.json');
const EVAL_RULES_PATH = () => path.join(ROOT, '00_state_ledger/EVAL_RULES.json');
const MEMORY_DIR = () => path.join(ROOT, '00_state_ledger/memory_store');
const SNAPSHOT_DIR = () => path.join(ROOT, '00_state_ledger/prompt_snapshots');
const TRACES_PATH = () => path.join(ROOT, '00_state_ledger/traces.jsonl');

// Map agent IDs to their correct workspace paths (fallback if AGENT_REGISTRY is stale)
const AGENT_WORKSPACE_MAP = {
  '00_supervisor_agent': '00_state_ledger/',
  '01_ideation_agent': 'agents/01_front_office/01_ideation_agent/',
  '02_requirement_agent': 'agents/01_front_office/02_requirement_agent/',
  '03_architect_agent': 'agents/02_engineering_specs/03_architect_agent/',
  '04_prototype_agent': 'agents/02_engineering_specs/04_prototype_agent/',
  '05_program_mgmt_agent': 'agents/02_engineering_specs/05_program_mgmt_agent/',
  '06_infra_devops_agent': 'agents/03_execution_workspace/06_infra_devops_agent/',
  '07a_ui_agent': 'agents/03_execution_workspace/07a_ui_agent/',
  '07b_api_agent': 'agents/03_execution_workspace/07b_api_agent/',
  '07c_backend_db_agent': 'agents/03_execution_workspace/07c_backend_db_agent/',
  '07d_integration_agent': 'agents/03_execution_workspace/07d_integration_agent/',
  '08_qa_agent': 'agents/03_execution_workspace/08_qa_agent/',
  '09_production_agent': 'agents/03_execution_workspace/09_production_agent/',
  '10_tech_pub_agent': 'agents/03_execution_workspace/10_tech_pub_agent/',
  '11_customer_onboarding_agent': 'agents/03_execution_workspace/11_customer_onboarding_agent/',
  '12_marketing_agent': 'agents/03_execution_workspace/12_marketing_agent/',
  '13_maintenance_agent': 'agents/03_execution_workspace/13_maintenance_agent/',
  '14_finops_agent': 'agents/03_execution_workspace/14_finops_agent/',
  '15_secrets_compliance_agent': 'agents/03_execution_workspace/15_secrets_compliance_agent/',
};

function resolveWorkspaceRoot(agentDef, agentId) {
  if (agentDef) {
    if (agentDef.workspace_root) return agentDef.workspace_root;
    if (agentDef.workspaceRoot) return agentDef.workspaceRoot;
  }
  if (AGENT_WORKSPACE_MAP[agentId]) return AGENT_WORKSPACE_MAP[agentId];
  if (agentId) return `agents/03_execution_workspace/${agentId}/`;
  return '';
}

const ACTIVE_RUNS = new Map();

function localTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function dynamicLLMTimeout(promptLength) {
  const base = 120000;
  const extra = promptLength > 5000 ? Math.floor((promptLength - 5000) / 1000) * 500 : 0;
  return Math.min(base + extra, 300000);
}

class AgentRuntime {
  constructor(options = {}) {
    this.llm = options.llm || new LLMProvider({
      provider: options.provider || 'opencode-go',
      model: options.model || 'deepseek-v4-flash',
    });
    this.project = options.project || 'petemart';
    this._abortCtrl = null;
    this._abortSignal = options.abortSignal || null;
    this._agentId = null;
    this._toolHandlers = {
      write_artifact: this._writeArtifact.bind(this),
      read_dependency: this._readDependency.bind(this),
      browse_files: this._browseFiles.bind(this),
      read_file: this._readFile.bind(this),
    };
  }

  static getActiveRuns() { return ACTIVE_RUNS; }

  static abortAgent(agentId) {
    const ctrl = ACTIVE_RUNS.get(agentId);
    if (ctrl) { ctrl.abort(); ACTIVE_RUNS.delete(agentId); return true; }
    return false;
  }

  // ── Progress Label (writes to state + VLOG for lifecycle view) ──

  _updateStepLabel(agentId, label, resetCounters = false) {
    try {
      const state = this._getState();
      const agent = state.agent_states?.[agentId];
      if (!agent) return;
      agent.step_label = label;
      if (resetCounters) {
        agent.current_step = 0;
        agent.steps_total = 5;
        agent.step_started_at = new Date().toISOString();
      }
      agent.last_activity_timestamp = new Date().toISOString();
      this._saveState(state);
      vlog.write('RUNTIME', agentId, `Step: ${label}`);
      this._logEvent({ type: 'step_label', agent_id: agentId, label, timestamp: new Date().toISOString() });
    } catch {}
  }

  // ── Common Tools (available to all agents) ──

  _commonTools() {
    return [
      { type: 'function', function: { name: 'write_artifact', description: 'Write a deliverable file to the agent sandbox', parameters: { type: 'object', properties: { name: { type: 'string' }, data: { type: 'string' }, type: { type: 'string', enum: ['markdown', 'json', 'pptx', 'xlsx'] } }, required: ['name', 'data'] } } },
      { type: 'function', function: { name: 'read_dependency', description: 'Read an upstream artifact file', parameters: { type: 'object', properties: { agent_id: { type: 'string' }, artifact: { type: 'string' } }, required: ['agent_id', 'artifact'] } } },
      { type: 'function', function: { name: 'browse_files', description: 'List files in a directory', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
      { type: 'function', function: { name: 'read_file', description: 'Read a file from the project', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
    ];
  }

  // ── Public API ──

  loadAgentDef(agentId) {
    const reg = this._safeReadJSON(REGISTRY_PATH());
    if (!reg?.agents?.[agentId]) throw new Error(`Agent ${agentId} not found in AGENT_REGISTRY.json`);
    return reg.agents[agentId];
  }

  async runAgent(agentId, context = {}) {
    this._agentId = agentId;
    const traceLogger = getTracer();
    const runSpan = traceLogger.startSpan('agent_run', { agentId });
    const startTime = Date.now();
    const agentDef = this.loadAgentDef(agentId);
    agentDef.id = agentId;
    const runId = `${agentId}_${Date.now()}`;

    this._logToFile('LOG', `runAgent started, runId=${runId}`);
    vlog.write('RUNTIME', agentId, `runAgent started | runId=${runId}`);

    // Register abort controller
    const ac = new AbortController();
    this._abortCtrl = ac;
    if (this._abortSignal) {
      this._abortSignal.addEventListener('abort', () => ac.abort(), { once: true });
    }
    ACTIVE_RUNS.set(agentId, ac);
    const cleanup = () => { this._abortCtrl = null; if (ACTIVE_RUNS.get(agentId) === ac) ACTIVE_RUNS.delete(agentId); };

    try {
      // Log entry state
      try {
        const st = this._getState();
        const ag = st.agent_states?.[agentId];
        this._logToFile('LOG', `runAgent entry state: status=${ag?.status} exec=${ag?.execution_count} error=${ag?.last_error}`);
      } catch {}

      // Guardrail check
      const guardrailError = this._checkGuardrails(agentId);
      if (guardrailError) {
        vlog.write('RUNTIME', agentId, `Guardrail check: FAILED | ${guardrailError}`);
        this._logEvent({ type: 'guardrail_blocked', agent_id: agentId, run_id: runId, reason: guardrailError });
        const st = this._getState();
        const ag = st.agent_states?.[agentId];
        if (ag) {
          ag.status = 'failed'; ag.last_error = guardrailError; ag.last_activity_timestamp = new Date().toISOString();
          this._saveState(st);
        }
        runSpan.end({ status: 'failed', metadata: { error: guardrailError } });
        return { agentId, runId, status: 'failed', artifacts: [], content: '', usage: {}, error: guardrailError, complianceResult: { allPassed: false, items: [], error: guardrailError } };
      }
      vlog.write('RUNTIME', agentId, `Guardrail check: passed`);

      // Clean any stale incorrectly-named sandbox directories (wrong paths from old code)
      try {
        const correct = path.join(ROOT, resolveWorkspaceRoot(agentDef, agentId));
        const candidates = [
          path.join(ROOT, `agents/03_execution_workspace/${agentId}/`),
          path.join(ROOT, `agents/${agentId}/`),
        ];
        for (const candidate of candidates) {
          if (candidate !== correct && fs.existsSync(candidate)) {
            vlog.write('RUNTIME', agentId, `Removing stale wrong-path sandbox: ${candidate}`);
            fs.rmSync(candidate, { recursive: true, force: true });
          }
        }
      } catch {}

      // Archive stale sandbox files to oldartifacts/ before LLM regenerates them.
      // Committed (git-tracked) files are skipped — only generated artifacts from previous runs are moved.
      try {
        const ws = resolveWorkspaceRoot(agentDef, agentId);
        const sbx = path.join(ROOT, ws);
        if (fs.existsSync(sbx)) {
          const archiveDir = path.join(sbx, 'oldartifacts');
          if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
          const ts = localTimestamp();
          const files = fs.readdirSync(sbx).filter(f => !f.startsWith('oldartifacts') && f !== '.' && f !== '..');
          for (const f of files) {
            const src = path.join(sbx, f);
            if (isGitTracked(src)) { vlog.write('RUNTIME', agentId, `Skip archive: ${f} (git-tracked)`); continue; }
            const dst = path.join(archiveDir, `${ts}_${f}`);
            try { fs.renameSync(src, dst); vlog.write('RUNTIME', agentId, `Archived: ${f} → oldartifacts/${ts}_${f}`); } catch {}
          }
        }
      } catch {}

      const llmInfo = `${this.llm.provider}/${this.llm.model}`;
      this._logEvent({ type: 'agent_started', agent_id: agentId, run_id: runId, llm: llmInfo, context });
      this._updateStepLabel(agentId, 'initializing', true);
      this._logEvent({ type: 'step_label', agent_id: agentId, run_id: runId, label: 'initializing', llm: llmInfo });

      // Gather dependencies
      const depT = vlog.logDuration('RUNTIME', agentId, 'Gather dependency context');
      const depSpan = traceLogger.startSpan('gather_dependency_context', { agentId });
      const depContext = this._gatherDependencyContext(agentDef);
      depSpan.end();
      depT.end({ upstream_agents: (agentDef.dependencies || []).join(',') });

      // Build system prompt
      const promptSpan = traceLogger.startSpan('build_system_prompt', { agentId });
      const systemPrompt = this._buildSystemPrompt(agentDef, depContext, context);
      promptSpan.end();
      vlog.write('RUNTIME', agentId, `Build system prompt | prompt_total=${systemPrompt.length} chars, deps_ctx=${depContext.length} chars`);

      // Execute
      let result;
      try {
        this._updateStepLabel(agentId, 'calling LLM');
        this._logEvent({ type: 'step_label', agent_id: agentId, run_id: runId, label: 'calling LLM' });
        if (agentDef.checkpoints && agentDef.checkpoints.length > 0) {
          vlog.write('RUNTIME', agentId, `Branch: checkpointed pipeline | checkpoints=${agentDef.checkpoints.length}`);
          result = await this._runCheckpointedPipeline(agentDef, systemPrompt);
        } else {
          vlog.write('RUNTIME', agentId, `Branch: standard (no checkpoints)`);
          result = await this._llmToolLoop(agentDef, systemPrompt);
        }
      } catch (err) {
        const duration = Date.now() - startTime;
        this._logToFile('ERR', `LLM call failed: ${err.message}`);
        const isBalanceError = err.message?.includes('402') || err.message?.includes('Insufficient Balance');
        const isCancelled = err.message?.includes('cancelled') || err.message?.includes('aborted');
        this._logEvent({ type: 'agent_llm_error', agent_id: agentId, run_id: runId, llm: llmInfo, error: err.message, is_balance_error: isBalanceError });
        // Update state so agent doesn't stay stuck
        try {
          const st = this._getState();
          const ag = st.agent_states?.[agentId];
          if (ag && (ag.status === 'in_progress' || ag.status === 'active')) {
            ag.status = isCancelled ? 'cancelled' : 'failed';
            ag.last_error = isCancelled ? `CANCELLED: ${err.message}` : isBalanceError ? 'LLM provider: insufficient balance — top up and retry' : `LLM error: ${err.message}`;
            ag.last_activity_timestamp = new Date().toISOString();
            ag.consecutive_failures = (ag.consecutive_failures || 0) + 1;
            // Trip circuit breaker after 5 consecutive failures
            if (!isCancelled && (ag.consecutive_failures || 0) >= 5) {
              st.supervisor_control = st.supervisor_control || {};
              st.supervisor_control.loop_guardrails = st.supervisor_control.loop_guardrails || {};
              st.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = new Date().toISOString();
              st.supervisor_control.loop_guardrails.circuit_breaker_reason = `Agent ${agentId} failed ${ag.consecutive_failures} consecutive times`;
              this._logEvent({ type: 'circuit_breaker_tripped', agent_id: agentId, reason: `${ag.consecutive_failures} consecutive failures` });
            }
            this._saveState(st);
          }
        } catch {}
        runSpan.end({ status: isCancelled ? 'cancelled' : 'failed', error: err.message, llmModel: llmInfo });
        return { agentId, runId, status: 'failed', artifacts: [], content: '', usage: {}, duration, error: err.message, complianceResult: { allPassed: false, items: [], error: isBalanceError ? 'LLM provider: insufficient balance' : err.message } };
      }

      const duration = Date.now() - startTime;

      // Handle empty result
      if (!result.content && (!result.artifacts || result.artifacts.length === 0)) {
        this._logToFile('ERR', `LLM returned empty content`);
        const state = this._getState();
        const agent = state.agent_states?.[agentId];
        if (agent && (agent.status === 'in_progress' || agent.status === 'active')) {
          agent.status = 'failed';
          agent.last_error = 'LLM returned empty content (all providers rate-limited or timed out)';
          agent.last_activity_timestamp = new Date().toISOString();
          agent.consecutive_failures = (agent.consecutive_failures || 0) + 1;
          if ((agent.consecutive_failures || 0) >= 5) {
            state.supervisor_control = state.supervisor_control || {};
            state.supervisor_control.loop_guardrails = state.supervisor_control.loop_guardrails || {};
            state.supervisor_control.loop_guardrails.circuit_breaker_tripped_at = new Date().toISOString();
            state.supervisor_control.loop_guardrails.circuit_breaker_reason = `Agent ${agentId} failed ${agent.consecutive_failures} consecutive times (empty result)`;
            this._logEvent({ type: 'circuit_breaker_tripped', agent_id: agentId, reason: `${agent.consecutive_failures} consecutive empty results` });
          }
          this._saveState(state);
        }
        this._logEvent({ type: 'agent_empty_result', agent_id: agentId, run_id: runId, llm: llmInfo, error: 'LLM returned empty content' });
        runSpan.end({ status: 'failed', error: 'LLM returned empty content' });
        return { agentId, runId, status: 'failed', artifacts: [], content: '', usage: result.usage || {}, duration, error: 'LLM returned empty content (all providers rate-limited or timed out)', complianceResult: { allPassed: false, items: [], error: 'No output from LLM' } };
      }

      // Cross-cutting pipeline
      this._updateStepLabel(agentId, 'processing results');
      this._logEvent({ type: 'step_label', agent_id: agentId, run_id: runId, label: 'processing results' });
      await this._runPipeline(agentId, runId, agentDef, result, systemPrompt, duration, startTime);

      // Determine final status and update state
      const finalState = this._getState();
      const finalAgent = finalState.agent_states?.[agentId];
      let finalStatus = finalAgent?.status === 'failed' ? 'failed' : (finalAgent?.status || 'completed');
      // If agent requires human approval, set to awaiting_approval instead of completed
      if (finalStatus === 'completed' || finalStatus === 'approved') {
        const st = this._getState();
        const ag = st.agent_states?.[agentId];
        if (ag?.requires_human_approval) finalStatus = 'awaiting_approval';
      }
      // Empty artifact guard: if LLM returned content but ZERO artifacts, fail instead of awaiting_approval
      if (finalStatus === 'awaiting_approval' && result.content && (!result.artifacts || result.artifacts.length === 0)) {
        finalStatus = 'failed';
        if (!finalAgent.last_error) {
          finalAgent.last_error = 'LLM completed but generated no artifacts — write_artifact was not called. Ensure the system prompt includes the list of files to create.';
        }
        this._logToFile('WARN', `Empty artifact guard: ${agentId} LLM produced ${(result.content || '').length} chars of text but 0 artifacts — failing instead of pending review`);
        vlog.write('RUNTIME', agentId, `EMPTY ARTIFACT GUARD: LLM returned text-only response, no write_artifact calls`);
      }
      if (finalAgent && (finalAgent.status === 'in_progress' || finalAgent.status === 'active')) {
        finalAgent.status = finalStatus;
        finalAgent.last_activity_timestamp = new Date().toISOString();
        if ((finalStatus === 'completed' || finalStatus === 'approved') && !finalAgent.last_error) {
          finalAgent.last_error = null;
        }
        this._saveState(finalState);
      }

      this._logToFile('LOG', `runAgent completed: status=${finalStatus}, artifacts=${(result.artifacts || []).length}, duration=${duration}ms`);
      vlog.write('RUNTIME', agentId, `runAgent finished | status=${finalStatus} | artifacts=${(result.artifacts || []).length} | total_duration=${duration}ms`);
      runSpan.end({ status: finalStatus, metadata: { artifact_count: (result.artifacts || []).length, llm: llmInfo }, llmTokens: result.usage });

      return { agentId, runId, status: finalStatus, artifacts: result.artifacts || [], content: result.content || '', usage: result.usage || {}, duration, complianceResult: result.complianceResult };
    } catch (err) {
      const duration = Date.now() - startTime;
      this._logToFile('ERR', `Unhandled error: ${err.message}`);
      vlog.write('RUNTIME', agentId, `runAgent ERROR: ${err.message}`);
      this._logEvent({ type: 'agent_runtime_error', agent_id: agentId, run_id: runId, error: err.message });
      try {
        const st = this._getState();
        const ag = st.agent_states?.[agentId];
        if (ag && (ag.status === 'in_progress' || ag.status === 'active')) {
          ag.status = 'failed'; ag.last_error = `Runtime error: ${err.message}`; ag.last_activity_timestamp = new Date().toISOString();
          this._saveState(st);
        }
      } catch {}
      runSpan.end({ status: 'failed', error: err.message });
      return { agentId, runId, status: 'failed', artifacts: [], content: '', usage: {}, duration, error: err.message, complianceResult: { allPassed: false, items: [], error: err.message } };
    } finally {
      cleanup();
    }
  }

  // ── Checkpointed Pipeline ──

  async _runCheckpointedPipeline(agentDef, basePrompt) {
    const checkpointCount = agentDef.checkpoints.length;
    const allArtifacts = [];
    let allContent = '';
    const totalUsage = {};

    vlog.write('RUNTIME', agentDef.id, `Checkpointed pipeline | checkpoints=${checkpointCount}`);

    if (checkpointCount <= 1) {
      const result = await this._llmToolLoop(agentDef, basePrompt);
      return { content: result.content, artifacts: result.artifacts, usage: result.usage };
    }

    const defaultMaxIter = 15;
    const budget = Math.max(3, Math.floor(defaultMaxIter / checkpointCount));
    vlog.write('RUNTIME', agentDef.id, `Checkpoints: ${agentDef.checkpoints.map(c => c.name).join(' → ')} | budget=${budget} iter/phase`);

    let globalIter = 0;
    for (let cpIdx = 0; cpIdx < checkpointCount; cpIdx++) {
      const cp = agentDef.checkpoints[cpIdx];
      let prompt;

      if (cpIdx === 0) {
        prompt = basePrompt;
        prompt += `\n\n## Current Checkpoint (${cpIdx + 1}/${checkpointCount}): ${cp.name}\n${cp.instruction}`;
        prompt += `\n\n## Budget\nYou have ${budget} LLM iterations for this checkpoint.`;
      } else {
        prompt = `## Project Context\n\n${basePrompt}`;
        prompt += `\n\n## Previous Phase Complete (${cpIdx}/${checkpointCount}: ${agentDef.checkpoints[cpIdx - 1].name})\n`;
        prompt += `Artifacts produced so far:\n`;
        prompt += allArtifacts.map(a => `- ${a.name} (${typeof a.data === 'string' ? a.data.length.toLocaleString() + ' chars' : 'binary'})`).join('\n');
        prompt += `\n\n## Current Checkpoint (${cpIdx + 1}/${checkpointCount}): ${cp.name}\n${cp.instruction}`;
        prompt += `\n\n## Budget\nYou have ${budget} LLM iterations for this checkpoint.`;
      }

      this._logEvent({ type: 'checkpoint_start', agent_id: agentDef.id, phase: cpIdx + 1, total: checkpointCount, name: cp.name });
      vlog.write('RUNTIME', agentDef.id, `Checkpoint ${cpIdx + 1}/${checkpointCount} started: "${cp.name}"`);
      this._updateStepLabel(agentDef.id, `checkpoint ${cpIdx + 1}/${checkpointCount}: ${cp.name}`);

      const cpStart = Date.now();
      const result = await this._llmToolLoop(agentDef, prompt, budget, allArtifacts, globalIter);
      globalIter += (result._iterationsUsed || budget);
      const cpDuration = Date.now() - cpStart;

      allContent += (result.content || '') + '\n';
      if (result.usage) Object.assign(totalUsage, result.usage);
      if (result.artifacts) {
        for (const art of result.artifacts) {
          if (!allArtifacts.some(a => a.name === art.name)) allArtifacts.push(art);
        }
      }

      vlog.write('RUNTIME', agentDef.id, `Checkpoint ${cpIdx + 1}/${checkpointCount} "${cp.name}" | duration=${cpDuration}ms | artifacts=${(result.artifacts || []).length}`);
      this._logEvent({ type: 'checkpoint_complete', agent_id: agentDef.id, phase: cpIdx + 1, total: checkpointCount, name: cp.name, artifact_count: (result.artifacts || []).length, duration_ms: cpDuration });
    }

    vlog.write('RUNTIME', agentDef.id, `Checkpointed pipeline done | artifacts=${allArtifacts.length}`);
    return { content: allContent, artifacts: allArtifacts, usage: totalUsage };
  }

  // ── LLM Tool Loop ──

  async _llmToolLoop(agentDef, systemPrompt, maxIterations = 15, priorArtifacts = [], globalIterOffset = 0) {
    const messages = [];
    const artifacts = [];
    let content = '';
    let usage = {};
    let consecutiveEmpty = 0;
    let iterationsUsed = 0;
    const MAX_ITERATIONS = maxIterations;
    const checkpointCount = (agentDef.checkpoints || []).length;
    let currentCheckpoint = 1;

    // ── Loop Detection & Error Recovery (3.1-3.4, 2.2) ──
    const toolCallCache = new Map();        // "(tool,args_hash)" → result (dedup)
    const consecutiveSameTool = new Map();   // "tool" → consecutive count
    const fileEditCount = new Map();         // "filename" → edit count in this run
    let consecutiveReadOnly = 0;             // read-only iteration counter

    function toolCallKey(name, args) {
      return `${name}:${JSON.stringify(args)}`;
    }

    // Merge agent tools with common tools
    const agentTools = agentDef.tools || [];
    const commonTools = this._commonTools();
    const toolNames = new Set(agentTools.map(t => t.function?.name).filter(Boolean));
    const allTools = [...agentTools, ...commonTools.filter(t => !toolNames.has(t.function?.name))];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      iterationsUsed = i + 1;
      const globalIterNum = globalIterOffset + i + 1;
      this._updateStepLabel(agentDef.id, `LLM iteration ${globalIterNum}/${MAX_ITERATIONS}`);
      const iterInfo = { type: 'llm_iteration', agent_id: agentDef.id, iteration: globalIterNum, max_iterations: MAX_ITERATIONS, checkpoint: currentCheckpoint, checkpoint_total: checkpointCount };
      this._logEvent(iterInfo);

      if (this._abortSignal?.aborted) {
        vlog.write('RUNTIME', agentDef.id, `LLM iter ${globalIterNum}/${MAX_ITERATIONS} | ABORTED`);
        this._logEvent({ type: 'agent_cancelled', agent_id: agentDef.id });
        break;
      }

      vlog.write('RUNTIME', agentDef.id, `LLM iter ${globalIterNum}/${MAX_ITERATIONS} | cp ${currentCheckpoint}/${checkpointCount} | calling provider=${this.llm.provider}/${this.llm.model}...`);
      const iterStart = Date.now();
      const timeout = dynamicLLMTimeout(systemPrompt.length + messages.reduce((s, m) => s + (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length), 0));

      let resp;
      try {
        resp = await this.llm.complete(systemPrompt, messages, allTools, { timeout, signal: this._abortSignal || this._abortCtrl?.signal });
      } catch (err) {
        vlog.write('RUNTIME', agentDef.id, `LLM iter ${globalIterNum}/${MAX_ITERATIONS} | ERROR: ${err.message}`);
        this._logEvent({ type: 'llm_iteration_error', agent_id: agentDef.id, iteration: globalIterNum, error: err.message });
        if (i < MAX_ITERATIONS - 1) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw err;
      }

      const iterDuration = Date.now() - iterStart;
      vlog.write('RUNTIME', agentDef.id, `LLM iter ${globalIterNum}/${MAX_ITERATIONS} | done | duration=${iterDuration}ms | content=${(resp.content || '').length} chars | tool_calls=${(resp.toolCalls || []).length}`);
      if (!resp.content) {
        this._logToFile('WARN', `LLM iter ${globalIterNum}: content empty, toolCalls=${(resp.toolCalls || []).length}`);
      }

      if (resp.content) content += resp.content + '\n';
      usage = resp.usage || usage;

      // Process tool calls
      if (resp.toolCalls && resp.toolCalls.length > 0) {
        consecutiveEmpty = 0;
        consecutiveReadOnly = 0;
        for (const tc of resp.toolCalls) {
          const name = tc.function?.name || tc.function?.function;
          let args = {};
          try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
          const handler = this._toolHandlers[name];
          if (handler) {
            // 3.2: Tool Deduplication — cache identical (tool, args) calls
            const cacheK = toolCallKey(name, args);
            if (toolCallCache.has(cacheK)) {
              const cached = toolCallCache.get(cacheK);
              vlog.write('RUNTIME', agentDef.id, `Tool dedup | iter ${i + 1} | tool=${name} | cache HIT`);
              messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(cached) });
              // Track consecutive same-tool for loop detection
              const consec = (consecutiveSameTool.get(name) || 0) + 1;
              consecutiveSameTool.set(name, consec);
              // 3.4: Proactive Termination — hard stop after 5 consecutive same-tool
              if (consec >= 5) {
                throw new Error(`StuckError: Agent called ${name} 5 consecutive times — hard stop`);
              }
              continue;
            }
            // 3.1: Consecutive Same-Tool Call Detection
            const consec = (consecutiveSameTool.get(name) || 0) + 1;
            consecutiveSameTool.set(name, consec);
            if (consec === 3) {
              vlog.write('RUNTIME', agentDef.id, `Loop guard | iter ${i + 1} | tool=${name} | consec=${consec} | injecting nudge`);
              messages.push({ role: 'user', content: `You have called ${name} ${consec} times consecutively. Stop repeating the same action. Verify your work and proceed to the next step. Do NOT call ${name} again without justification.` });
            }
            if (consec >= 5) {
              vlog.write('RUNTIME', agentDef.id, `Loop guard | iter ${i + 1} | tool=${name} | consec=${consec} | HARD STOP`);
              throw new Error(`StuckError: Agent called ${name} ${consec} consecutive times — hard stop`);
            }

            try {
              // 3.3: Tool Timeout — Promise.race per tool invocation (60s)
              const toolPromise = handler(args, agentDef);
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${name} timed out after 60s`)), 60000));
              const toolResult = await Promise.race([toolPromise, timeoutPromise]);

              vlog.write('RUNTIME', agentDef.id, `Tool exec | iter ${i + 1} | tool=${name} | args=${JSON.stringify(args).slice(0, 200)} | ok`);

              // Cache the result for deduplication
              toolCallCache.set(cacheK, toolResult);

              // 2.2: Loop Detection Middleware — track per-file edit counts
              if (name === 'write_artifact' && args.name) {
                const editCount = (fileEditCount.get(args.name) || 0) + 1;
                fileEditCount.set(args.name, editCount);
                if (editCount === 3) {
                  vlog.write('RUNTIME', agentDef.id, `Loop guard | iter ${i + 1} | ${args.name} edited ${editCount}x | injecting nudge`);
                  messages.push({ role: 'user', content: `You have edited ${args.name} ${editCount} times. Verify the content is correct before making further changes.` });
                }
              }

              messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(toolResult) });
              if (name === 'write_artifact') {
                if (toolResult?.artifact) {
                  artifacts.push(toolResult.artifact);
                  vlog.write('RUNTIME', agentDef.id, `Artifact tracked: ${toolResult.artifact.name}`);
                } else {
                  vlog.write('RUNTIME', agentDef.id, `Artifact NOT tracked: toolResult.artifact is missing`);
                }
              }
            } catch (e) {
              vlog.write('RUNTIME', agentDef.id, `Tool exec | iter ${i + 1} | tool=${name} | ERROR: ${e.message}`);
              messages.push({ role: 'tool', tool_call_id: tc.id, content: `Error: ${e.message}` });
            }
          } else {
            vlog.write('RUNTIME', agentDef.id, `Tool UNKNOWN | iter ${i + 1} | name="${name}"`);
            consecutiveSameTool.set(name, (consecutiveSameTool.get(name) || 0) + 1);
            messages.push({ role: 'tool', tool_call_id: tc.id, content: `Tool ${name} not found` });
          }
        }
      } else if (resp.content) {
        // No tool calls but has content
        consecutiveSameTool.clear();
        consecutiveReadOnly++;
        if (consecutiveReadOnly >= 3) {
          vlog.write('RUNTIME', agentDef.id, `Loop guard | iter ${i + 1} | read-only x${consecutiveReadOnly} | injecting nudge`);
          messages.push({ role: 'user', content: 'You have been responding with text-only for several iterations. Call write_artifact to save your output as files.' });
        }
        const missing = this._getMissingComplianceFiles(agentDef?.id, artifacts, priorArtifacts);
        // Only re-prompt if files are STILL missing AND we have budget left
        if (missing.length > 0 && i < MAX_ITERATIONS - 1) {
          vlog.write('RUNTIME', agentDef.id, `Missing files re-prompt | ${missing.length} missing: ${missing.join(', ')}`);
          messages.push({ role: 'user', content: `You did not call write_artifact for these required files: ${missing.join(', ')}. Please use write_artifact to create each of them now. Do NOT output text — only use write_artifact tool calls.` });
          continue;
        }
        // All required files written — accept content and stop looping
        break;
      } else {
        // No content, no tool calls — allow retries up to 3 consecutive empty responses
        consecutiveEmpty++;
        if (consecutiveEmpty >= 3) {
          vlog.write('RUNTIME', agentDef.id, `Loop guard | ${consecutiveEmpty} consecutive empty responses — stopping`);
          break;
        }
        vlog.write('RUNTIME', agentDef.id, `Empty response #${consecutiveEmpty} — retrying...`);
        continue;
      }

      messages.push({ role: 'assistant', content: resp.content || '', tool_calls: resp.toolCalls });

      // Keep message window manageable (preserve first 2, keep last 30)
      if (messages.length > 32) {
        const head = messages.slice(0, 2);
        const tail = messages.slice(-30);
        messages.length = 0;
        messages.push(...head, ...tail);
      }
    }

    return { content, artifacts, usage, _iterationsUsed: iterationsUsed };
  }

  // ── Cross-Cutting Pipeline ──

  async _runPipeline(agentId, runId, agentDef, result, systemPrompt, duration, startTs) {
    // Verify artifacts were written (by _writeArtifact during tool loop)
    this._updateStepLabel(agentId, 'writing artifacts');
    this._logEvent({ type: 'artifact_generation_start', agent_id: agentId, run_id: runId, artifact_count: (result.artifacts || []).length });
    const workspaceRoot = resolveWorkspaceRoot(agentDef, agentId);
    const sandboxDir = path.join(ROOT, workspaceRoot);
    if (!fs.existsSync(sandboxDir)) fs.mkdirSync(sandboxDir, { recursive: true });

    for (const art of result.artifacts || []) {
      if (!art.name) continue;
      const fp = path.join(sandboxDir, art.name);
      if (!fs.existsSync(fp)) {
        // _writeArtifact didn't save this — write it now
        const ext = art.name.split('.').pop()?.toLowerCase();
        this._logEvent({ type: 'artifact_writing', agent_id: agentId, run_id: runId, artifact: art.name });
        if (ext === 'json') {
          fs.writeFileSync(fp, typeof art.data === 'string' ? art.data : JSON.stringify(art.data, null, 2), 'utf-8');
        } else if (ext === 'pptx' || ext === 'xlsx') {
          fs.writeFileSync(fp, typeof art.data === 'string' ? Buffer.from(art.data, 'base64') : Buffer.from(String(art.data)));
        } else {
          fs.writeFileSync(fp, String(art.data), 'utf-8');
        }
      }
    }

    this._logEvent({ type: 'artifact_generation_done', agent_id: agentId, run_id: runId, artifact_count: (result.artifacts || []).length });

    // Save memory
    try {
      const memDir = MEMORY_DIR();
      if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
      const memPath = path.join(memDir, `${agentId}.json`);
      let history = [];
      try { history = JSON.parse(fs.readFileSync(memPath, 'utf-8'))?.history || []; } catch {}
      history.push({
        runId, timestamp: new Date().toISOString(), status: 'completed',
        duration, artifacts: (result.artifacts || []).map(a => a.name),
        contentPreview: (result.content || '').slice(0, 200),
        usage: result.usage,
      });
      if (history.length > 50) history = history.slice(-50);
      fs.writeFileSync(memPath, JSON.stringify({ agentId, history }, null, 2), 'utf-8');
    } catch {}

    // Save prompt snapshot
    try {
      const snapDir = path.join(SNAPSHOT_DIR(), `${agentId}_${Date.now()}`);
      if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir, { recursive: true });
      fs.writeFileSync(path.join(snapDir, 'result.json'), JSON.stringify({
        prompt: systemPrompt?.slice(0, 10000),
        response: result.content?.slice(0, 10000),
        artifacts: (result.artifacts || []).map(a => a.name),
        usage: result.usage,
        duration,
      }, null, 2), 'utf-8');
    } catch {}

    // Update state
    const state = this._getState();
    const agent = state.agent_states?.[agentId];
    if (agent) {
      agent.step_label = 'completed';
      agent.last_run_duration_ms = duration;
      agent.last_run_id = runId;
      agent.run_id = runId;
      agent.execution_count = (agent.execution_count || 0) + 1;
      agent.last_activity_timestamp = new Date().toISOString();
      if (result.artifacts?.length > 0) {
        agent.artifacts_emitted = [...(agent.artifacts_emitted || [])];
        for (const art of result.artifacts) {
          const p = path.join(workspaceRoot, art.name).replace(/\\/g, '/');
          if (!agent.artifacts_emitted.includes(p)) agent.artifacts_emitted.push(p);
        }
      }
      // Compliance check: verify artifacts from THIS run only (not stale accumulated artifacts)
      const currentArtifacts = (result.artifacts || []).filter(a => a && a.name);
      const checkPassed = currentArtifacts.length > 0 ? this._verifyCompliance(agent, agentDef) : false;
      if (!checkPassed && currentArtifacts.length === 0) {
        if (!agent.last_error) agent.last_error = 'No artifacts produced — LLM did not call write_artifact';
        // Clear stale artifacts to prevent daemon downstream queue from re-launching
        agent.artifacts_emitted = [];
      }
      if (checkPassed) {
        agent.status = 'approved';
      } else if (agent.status !== 'failed' && agent.status !== 'cancelled') {
        agent.status = (currentArtifacts.length > 0) ? 'awaiting_approval' : 'failed';
      }
      this._saveState(state);
    }
  }

  _verifyCompliance(agent, agentDef) {
    const checklist = agent?.compliance_checklist || agentDef?.compliance_checklist || [];
    if (checklist.length === 0) return true;
    for (const item of checklist) {
      if (item.required && item.check?.startsWith('artifact_exists(')) {
        const artifactName = item.check.match(/\((.*?)\)/)?.[1];
        if (artifactName) {
          const artifacts = agent?.artifacts_emitted || [];
          const found = artifacts.some(a => a.includes(artifactName));
          if (!found) return false;
        }
      }
    }
    return true;
  }

  // ── Tool Handlers ──

  async _writeArtifact(args, agentDef) {
    let name = args.name;
    const data = args.data || '';
    const type = args.type || 'markdown';
    const sandbox = resolveWorkspaceRoot(agentDef, this._agentId);

    // Safety: strip path traversal — only bare filename allowed
    const normalized = path.normalize(name).replace(/\\/g, '/');
    if (normalized.includes('/') || normalized.includes('..')) {
      vlog.write('RUNTIME', this._agentId, `SANITIZED write_artifact name: "${name}" → "${path.basename(name)}" (path traversal blocked)`);
      name = path.basename(name);
    }

    const filePath = path.join(ROOT, sandbox, name);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(filePath)) {
      const archiveDir = path.join(dir, 'oldartifacts');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      const ts = localTimestamp();
      fs.renameSync(filePath, path.join(archiveDir, `${ts}_${name}`));
    }
    fs.writeFileSync(filePath, data, 'utf-8');
    vlog.write('RUNTIME', this._agentId || agentDef?.id, `Write | ${name} | type=${type} | size=${data.length} bytes`);
    return { success: true, artifact: { name, data, type } };
  }

  async _readDependency(args) {
    const reg = this._safeReadJSON(REGISTRY_PATH());
    const agentDef = reg?.agents?.[args.agent_id];
    if (!agentDef) throw new Error(`Upstream agent ${args.agent_id} not found`);
    const depPath = path.join(ROOT, agentDef.workspace_root || '', args.artifact);
    if (!fs.existsSync(depPath)) throw new Error(`Dependency ${depPath} not found`);
    return { text: fs.readFileSync(depPath, 'utf-8') };
  }

  async _browseFiles(args) {
    const dirPath = path.join(ROOT, args.path || '');
    if (!fs.existsSync(dirPath)) return { text: 'Directory not found' };
    return { text: fs.readdirSync(dirPath).join('\n') };
  }

  async _readFile(args) {
    const filePath = path.join(ROOT, args.path || '');
    if (!fs.existsSync(filePath)) return { text: `File not found: ${args.path}` };
    const content = fs.readFileSync(filePath, 'utf-8');
    return { text: content.slice(0, 50000) };
  }

  // ── State Management ──

  _getState() {
    return this._safeReadJSON(STATE_PATH()) || { agent_states: {} };
  }

  _saveState(state) {
    try {
      saveStateSync(state);
    } catch {}
  }

  _updateState(agentId, updates) {
    const state = this._getState();
    const agent = state.agent_states?.[agentId];
    if (!agent) {
      state.agent_states = state.agent_states || {};
      state.agent_states[agentId] = {};
    }
    Object.assign(state.agent_states[agentId], updates, { last_activity_timestamp: new Date().toISOString() });
    if (updates.execution_count === null) {
      state.agent_states[agentId].execution_count = (state.agent_states[agentId].execution_count || 0) + 1;
    }
    this._saveState(state);
  }

  // ── System Prompt Builder ──

  _buildSystemPrompt(agentDef, depContext, context) {
    let prompt = agentDef.system_prompt || '';

    // Add dependency mapping so LLM knows correct agent_id for read_dependency calls
    const depMapping = this._getDependencyMapping(agentDef);
    if (depMapping) prompt += `\n\n## Available Upstream Dependencies\n${depMapping}`;

    prompt += `\n\n## Engineering Workflow\nFollow this build-verify loop for every change:\n1. PLAN: Understand what needs to be done. List the files you need to create or modify.\n2. TEST FIRST: Write the test or assertion BEFORE implementing the logic.\n3. BUILD: Implement the logic to make the test pass.\n4. VERIFY: Confirm the output is correct. Do NOT exit without verification.\n5. NO EXIT WITHOUT VERIFICATION: Every file must be written using write_artifact and verified.`;

    prompt += `\n\n## Test-Driven Generation\nFor every deliverable:\n- Write the assertion or validation rule BEFORE implementing the logic.\n- If creating a JSON schema, define the structure first, then populate data.\n- If generating code, write the unit test signature first, then implement.`;

    // Inject checkpoint instructions so LLM knows what to produce in each phase
    if (agentDef.checkpoints && agentDef.checkpoints.length > 0) {
      prompt += `\n\n## Checkpoint Plan (Execute in Order)`;
      for (let i = 0; i < agentDef.checkpoints.length; i++) {
        const cp = agentDef.checkpoints[i];
        prompt += `\n### Phase ${i + 1}/${agentDef.checkpoints.length}: ${cp.name}\n${cp.instruction}`;
      }
      prompt += `\n\nCRITICAL: You MUST call write_artifact for EVERY file listed in the checkpoints above. Do NOT skip any file. Do NOT output file contents as text — always use write_artifact.`;
    }

    if (depContext) prompt += `\n\n## Dependency Context\n${depContext}`;
    if (context?.user_instruction) prompt += `\n\n## User Instruction\n${context.user_instruction}`;
    return prompt;
  }

  _getDependencyMapping(agentDef) {
    const deps = agentDef.dependencies || [];
    if (deps.length === 0) return '';
    const reg = this._safeReadJSON(REGISTRY_PATH());
    if (!reg?.agents) return '';
    const lines = [];
    for (const dep of deps) {
      // dep is a file path like "agents/01_front_office/02_requirement_agent/PRD_ENTERPRISE.json"
      // Extract agent ID from path: match the folder name that looks like an agent ID
      const match = dep.match(/(\d\d_\w+_agent)\//);
      const agentId = match ? match[1] : null;
      if (agentId && reg.agents[agentId]) {
        const fileName = dep.split('/').pop();
        lines.push(`- agent_id="${agentId}", artifact="${fileName}" (${reg.agents[agentId].role})`);
      }
    }
    return lines.join('\n') + '\n\nUse read_dependency({ agent_id: \"<id>\", artifact: \"<file>\" }) to read upstream files.';
  }

  _gatherDependencyContext(agentDef) {
    const deps = agentDef.dependencies || [];
    if (deps.length === 0) return '';
    const parts = [];
    for (const dep of deps) {
      try {
        const depPath = path.join(ROOT, dep);
        if (fs.existsSync(depPath)) parts.push(`--- ${dep} ---\n${fs.readFileSync(depPath, 'utf-8').slice(0, 50000)}`);
      } catch {}
    }
    return parts.join('\n\n');
  }

  // ── Compliance ──

  _checkGuardrails(agentId) {
    const state = this._getState();
    const agent = state.agent_states?.[agentId];
    if (!agent) return null;
    const maxExec = state.supervisor_control?.loop_guardrails?.max_sequential_executions_per_agent || 10;
    if ((agent.execution_count || 0) >= maxExec) {
      // Allow through if manually triggered (status already set to in_progress by rerun API)
      // This lets the human gatekeeper override the limit for re-runs
      if (agent.status === 'in_progress' || agent.status === 'active') return null;
      return `Max executions (${maxExec}) reached for ${agentId}`;
    }
    return null;
  }

  _runCompliance(agentDef, result, agentId) {
    const checklist = this._getState()?.agent_states?.[agentId]?.compliance_checklist;
    if (!checklist || checklist.length === 0) return { allPassed: true, items: [] };
    const allPassed = checklist.every(c => c.passed);
    return { allPassed, items: checklist };
  }

  _getMissingComplianceFiles(agentId, artifacts, priorArtifacts = []) {
    const state = this._getState();
    const agent = state.agent_states?.[agentId];
    if (!agent?.compliance_checklist) return [];
    const existing = new Set((artifacts || []).map(a => a.name));
    const known = new Set((priorArtifacts || []).map(a => a.name));
    const missing = [];
    for (const check of agent.compliance_checklist) {
      if (check.type !== 'artifact') continue;
      const m = check.check.match(/artifact_exists\(([^)]+)\)/) || check.check.match(/([\w-]+\.(md|json|pptx|xlsx))/);
      const fname = m?.[1];
      if (fname && !existing.has(fname) && !known.has(fname)) missing.push(fname);
    }
    return missing;
  }

  // ── Event Logging ──

  _logEvent(event) {
    try { fs.appendFileSync(EVENTS_PATH(), JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n', 'utf-8'); } catch {}
  }

  _logToFile(type, message) {
    try {
      const logDir = path.join(ROOT, '00_state_ledger');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const ts = new Date().toLocaleString();
      fs.appendFileSync(path.join(logDir, `AGENT_RUN_${this._agentId}.log`), `[${ts}] [${type}] ${message}\n`, 'utf-8');
    } catch {}
  }

  // ── Utils ──

  _safeReadJSON(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch { return null; }
  }
}

module.exports = { AgentRuntime };
