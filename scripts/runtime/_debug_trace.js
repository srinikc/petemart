// Debug trace for architect agent rerun
// Usage: node scripts/runtime/_debug_trace.js

const fs = require('fs');
const path = require('path');
const { AgentRuntime } = require('./AgentRuntime');
const vlog = require('./VerboseLogger');
const { readState: sfRead, saveStateSync } = require('./StateFile');

const ROOT = process.cwd();
const AGENT_ID = '03_architect_agent';

let stepNum = 0;
function log(label, data) {
  stepNum++;
  const ts = new Date().toISOString();
  const prefix = `[DEBUG-${String(stepNum).padStart(3, '0')} ${ts}] ${label}`;
  if (typeof data === 'string') {
    console.log(`${prefix}: ${data}`);
  } else {
    console.log(`${prefix}:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

async function debugTrace() {
  log('START', `Debug trace for ${AGENT_ID}`);

  // ── Step 1: Read state ──
  log('STEP 1: Read state', '');
  const stateBefore = sfRead();
  const agentState = stateBefore?.agent_states?.[AGENT_ID];
  log('State before launch', {
    status: agentState?.status,
    execution_count: agentState?.execution_count,
    artifacts_emitted_count: (agentState?.artifacts_emitted || []).length,
    step_label: agentState?.step_label,
    started_at: agentState?.started_at,
    last_error: agentState?.last_error,
    approved: agentState?.approved,
    requires_human_approval: agentState?.requires_human_approval,
  });

  // ── Step 2: Check getEligibleAgents logic ──
  log('STEP 2: getEligibleAgents checks', '');
  log('  status check', agentState?.status !== 'approved' && agentState?.status !== 'completed' && agentState?.status !== 'failed' && agentState?.status !== 'in_progress' && agentState?.status !== 'active' && agentState?.status !== 'awaiting_input' && agentState?.status !== 'awaiting_approval' ? 'PASS - pending is eligible' : 'FAIL');
  log('  disabled check', agentState?.disabled ? 'FAIL - disabled' : 'PASS');
  const maxExec = stateBefore?.supervisor_control?.loop_guardrails?.max_sequential_executions_per_agent || 3;
  log('  exec_count check', `exec=${agentState?.execution_count} max=${maxExec} result=${(agentState?.execution_count || 0) < maxExec ? 'PASS' : 'FAIL'}`);
  const deps = agentState?.dependencies || [];
  const depResults = deps.map(function(d) {
    const da = stateBefore?.agent_states?.[d];
    return { dep: d, status: da?.status, met: da?.status === 'approved' || da?.status === 'completed' };
  });
  log('  dep check', depResults);

  // ── Step 3: Compliance audit ──
  log('STEP 3: Compliance audit', '');
  const { SupervisorAgent } = require('./SupervisorAgent');
  const sup = new SupervisorAgent();
  const audit = sup.runComplianceAudit(stateBefore);
  const a3audit = audit[AGENT_ID];
  if (a3audit) {
    log('Audit allPassed', a3audit.allPassed);
    log('Audit items', a3audit.items.map(function(i) { return { check: i.check, passed: i.passed, type: i.type, required: i.required }; }));
    const fatal = a3audit.items.filter(function(i) { return i.required && !i.passed && i.type !== 'workflow' && i.type !== 'traceability' && !(i.type === 'artifact' && (agentState?.execution_count || 0) === 0); });
    log('Fatal failures after filter', fatal.length > 0 ? fatal : 'NONE');
  } else {
    log('Audit for agent', 'NONE - no compliance_checklist');
  }

  // ── Step 4: Read agentDef from registry ──
  log('STEP 4: Load agent definition', '');
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, '00_state_ledger/AGENT_REGISTRY.json'), 'utf-8'));
  const agentDef = reg?.agents?.[AGENT_ID];
  log('agentDef keys', agentDef ? Object.keys(agentDef) : 'NOT FOUND');
  log('checkpoints', agentDef?.checkpoints ? agentDef.checkpoints.map(function(c) { return { name: c.name, instruction_preview: (c.instruction || '').slice(0, 200) }; }) : 'NONE');
  log('requires_human_approval', agentDef?.requires_human_approval);
  log('workspace_root', agentDef?.workspace_root);

  // ── Step 5: Build system prompt ──
  log('STEP 5: Build system prompt', '');
  const runtime = new AgentRuntime();
  const depContext = runtime._gatherDependencyContext(agentDef);
  log('Dep context length', depContext.length);
  
  // Override _buildSystemPrompt to capture output
  const origBuild = runtime._buildSystemPrompt.bind(runtime);
  const capturedPrompt = {};
  runtime._buildSystemPrompt = function(agentDef, depContext, context) {
    const prompt = origBuild(agentDef, depContext, context);
    capturedPrompt.prompt = prompt;
    return prompt;
  };

  const systemPrompt = runtime._buildSystemPrompt(agentDef, depContext, { user_instruction: null });
  log('SYSTEM PROMPT FULL', systemPrompt);
  log('SYSTEM PROMPT LENGTH', systemPrompt.length);

  // ── Step 6: Set up tool call monitoring ──
  log('STEP 6: Tool monitoring setup', '');
  const origWriteArtifact = runtime._writeArtifact.bind(runtime);
  runtime._writeArtifact = async function(args, ad) {
    log('  TOOL CALL: write_artifact', { name: args.name, type: args.type, data_length: (args.data || '').length });
    const result = await origWriteArtifact(args, ad);
    log('  TOOL RESULT: write_artifact', result?.artifact ? `SUCCESS: ${result.artifact.name}` : 'FAILED');
    return result;
  };

  // ── Step 7: Run the agent ──
  log('STEP 7: Running agent', '');
  try {
    const result = await runtime.runAgent(AGENT_ID, { user_instruction: null });
    
    log('STEP 8: Agent result', {
      status: result.status,
      artifact_count: (result.artifacts || []).length,
      artifact_names: (result.artifacts || []).map(function(a) { return a.name; }),
      content_length: (result.content || '').length,
      content_preview: (result.content || '').slice(0, 500),
      error: result.error,
      usage: result.usage,
      duration: result.duration,
      complianceResult: result.complianceResult,
    });
    
    // ── Step 9: Check final state ──
    log('STEP 9: Final state', '');
    const finalState = sfRead();
    const finalAgent = finalState?.agent_states?.[AGENT_ID];
    log('Final agent state', {
      status: finalAgent?.status,
      execution_count: finalAgent?.execution_count,
      artifacts_emitted: finalAgent?.artifacts_emitted,
      last_error: finalAgent?.last_error,
      step_label: finalAgent?.step_label,
    });
    
  } catch (err) {
    log('ERROR in runAgent', err.stack || err.message);
  }

  log('DEBUG TRACE COMPLETE', '');
}

debugTrace().catch(function(err) { console.error('FATAL:', err.message, err.stack); });
