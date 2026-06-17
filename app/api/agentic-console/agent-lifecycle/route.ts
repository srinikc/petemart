import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const STATE_PATH = () => path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const LOGS_DIR = () => path.join(ROOT, 'logs');

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH(), 'utf-8')); } catch { return {}; }
}

function readVerboseLogs() {
  try {
    if (!fs.existsSync(LOGS_DIR())) return [];
    const files = fs.readdirSync(LOGS_DIR()).filter(f => f.startsWith('lifecycle-')).sort().reverse();
    if (files.length === 0) return [];
    const content = fs.readFileSync(path.join(LOGS_DIR(), files[0]), 'utf-8');
    return content.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

const CANONICAL_STEPS = [
  { id: 'queue', label: 'Queued', icon: '○' },
  { id: 'initializing', label: 'Initializing', icon: '⚙' },
  { id: 'gather_deps', label: 'Gathering Dependencies', icon: '⬇' },
  { id: 'llm', label: 'LLM Execution', icon: '🧠' },
  { id: 'processing', label: 'Processing Results', icon: '✓' },
  { id: 'writing', label: 'Writing Artifacts', icon: '💾' },
  { id: 'done', label: 'Complete', icon: '✅' },
];

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId') || '';
  const state = readState();
  const agent = state.agent_states?.[agentId];
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  const lines = readVerboseLogs();
  const agentLines = lines.filter(l => l.includes(`[${agentId}]`));

  // Group into runs bounded by "runAgent started"
  const rawRuns: any[] = [];
  let currentRun: any = null;
  for (const line of agentLines) {
    const ts = line.match(/^\[([^\]]+)\]/)?.[1] || '';
    const msg = line.replace(/^\[[^\]]+\]\s*\[RUNTIME\]\s*\[[^\]]+\]\s*/, '');
    const isStart = msg.startsWith('runAgent started');
    if (isStart) {
      if (currentRun) rawRuns.push(currentRun);
      currentRun = { started_at: ts, ended_at: null, error: null, status: 'running', events: [], total_ms: 0 };
    }
    if (currentRun) currentRun.events.push({ ts, msg, raw: line });
  }
  if (currentRun) rawRuns.push(currentRun);

  // Build timeline for up to last 2 runs
  const lastRuns = rawRuns.slice(-2);
  const runs = lastRuns.map(run => buildRunTimeline(run, agent));

  // For the latest run: if no ended_at and agent is not running, derive from agent state
  const latest = runs[runs.length - 1];
  if (latest && !latest.ended_at && agent.status !== 'in_progress' && agent.status !== 'active') {
    if (agent.last_error) latest.error = agent.last_error;
    latest.status = agent.status === 'failed' ? 'failed' : (agent.status || 'completed');
    if (agent.last_activity_timestamp) latest.ended_at = agent.last_activity_timestamp;
  }

  // Current agent-level status
  const agentStatus = agent.status === 'in_progress' || agent.status === 'active' ? 'running' : (agent.status || 'unknown');

  return NextResponse.json({
    agent_id: agentId,
    agent_status: agentStatus,
    is_running: agent.status === 'in_progress' || agent.status === 'active',
    runs,
  });
}

function buildRunTimeline(run: any, agent: any) {
  const steps: any[] = [];
  let currentStep: any = null;
  let toolCalls: any[] = [];
  let llmPhaseStart = 0;

  for (const ev of run.events) {
    const tsMs = new Date(ev.ts).getTime();
    const msg = ev.msg;

    if (msg.startsWith('Step: initializing') || msg === 'initializing') {
      closeStep(currentStep, tsMs, steps);
      currentStep = { id: 'initializing', label: 'Initializing', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [] };
    } else if (msg.startsWith('Gather dependency context — started')) {
      closeStep(currentStep, tsMs, steps);
      currentStep = { id: 'gather_deps', label: 'Gathering Dependencies', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [] };
    } else if (msg.includes('Gather dependency context — completed')) {
      if (currentStep?.id === 'gather_deps') {
        const dur = msg.match(/\((\d+)ms\)/);
        currentStep.details.push({ text: msg, duration_ms: dur ? parseInt(dur[1]) : null });
      }
    } else if (msg.includes('Build system prompt')) {
      if (currentStep?.id === 'gather_deps' || !currentStep) {
        closeStep(currentStep, tsMs, steps);
        currentStep = { id: 'gather_deps', label: 'Gathering Dependencies', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [{ text: msg }] };
      } else {
        currentStep.details.push({ text: msg });
      }
    } else if (msg.startsWith('Step: calling LLM')) {
      closeStep(currentStep, tsMs, steps);
      llmPhaseStart = tsMs;
      currentStep = { id: 'llm', label: 'LLM Execution', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [], iterations: [] };
    } else if (msg.startsWith('LLM Tool Loop started')) {
      if (currentStep?.id === 'llm') currentStep.details.push({ text: msg });
    } else if (msg.startsWith('LLM iter') && msg.includes('calling provider')) {
      const iterMatch = msg.match(/LLM iter (\d+)\/(\d+)/);
      const cpMatch = msg.match(/cp (\d+)\/(\d+)/);
      if (currentStep?.id !== 'llm') {
        closeStep(currentStep, tsMs, steps);
        currentStep = { id: 'llm', label: 'LLM Execution', started_at: ev.ts, start_ms: llmPhaseStart || tsMs, ended_at: null, end_ms: null, details: [], iterations: [] };
      }
      const iter: any = { number: iterMatch ? parseInt(iterMatch[1]) : 0, total: iterMatch ? parseInt(iterMatch[2]) : 0, started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, duration_ms: null, type: 'call', tool_calls: [], tokens: null };
      if (cpMatch) iter.checkpoint = `${cpMatch[1]}/${cpMatch[2]}`;
      currentStep.iterations.push(iter);
    } else if (msg.startsWith('LLM iter') && msg.includes('| done')) {
      const durMatch = msg.match(/duration=(\d+)ms/);
      const toolMatch = msg.match(/tool_calls=(\d+)\s*\(([^)]*)\)/);
      const tokIn = msg.match(/tokens_in=(\d+)/);
      const tokOut = msg.match(/tokens_out=(\d+)/);
      const iter = currentStep?.iterations?.[currentStep.iterations.length - 1];
      if (iter) {
        iter.ended_at = ev.ts;
        iter.end_ms = tsMs;
        iter.duration_ms = durMatch ? parseInt(durMatch[1]) : tsMs - iter.start_ms;
        iter.type = 'done';
        if (toolMatch) { iter.tool_count = parseInt(toolMatch[1]); iter.tool_names = toolMatch[2].split(', '); }
        if (tokIn) iter.tokens_input = parseInt(tokIn[1]);
        if (tokOut) iter.tokens_output = parseInt(tokOut[1]);
      }
    } else if (msg.startsWith('LLM iter') && msg.includes('ERROR')) {
      const errMsg = msg.split('ERROR: ')[1] || '';
      const iter = currentStep?.iterations?.[currentStep.iterations.length - 1];
      if (iter) {
        iter.ended_at = ev.ts;
        iter.end_ms = tsMs;
        iter.duration_ms = tsMs - iter.start_ms;
        iter.type = 'error';
        iter.error = errMsg;
      }
    } else if (msg.startsWith('Tool exec') && currentStep?.id === 'llm') {
      const tMatch = msg.match(/tool=(\S+)\s*\|\s*duration=(\d+)ms/);
      const argsMatch = msg.match(/args=(\{.*\})/);
      if (tMatch) toolCalls.push({ tool: tMatch[1], duration_ms: parseInt(tMatch[2]), args: argsMatch ? safeParseJSON(argsMatch[1]) : null });
    } else if (msg.includes('Checkpoint') && msg.includes('started:')) {
      const m = msg.match(/Checkpoint (\d+)\/(\d+) started: "([^"]+)"/);
      if (currentStep?.id === 'llm') currentStep.details.push({ text: msg, is_checkpoint: true, checkpoint_type: 'start', phase: m ? parseInt(m[1]) : 0, total_phases: m ? parseInt(m[2]) : 0, name: m?.[3] || '' });
    } else if (msg.includes('Checkpoint') && msg.includes('complete:')) {
      const m = msg.match(/Checkpoint (\d+)\/(\d+) complete: "([^"]+)"/);
      if (currentStep?.id === 'llm') currentStep.details.push({ text: msg, is_checkpoint: true, checkpoint_type: 'complete', phase: m ? parseInt(m[1]) : 0, total_phases: m ? parseInt(m[2]) : 0, name: m?.[3] || '' });
    } else if (msg.includes('Checkpoint') && msg.includes('| duration=')) {
      const m = msg.match(/Checkpoint (\d+)\/(\d+) "([^"]+)" \| duration=(\d+)ms \| artifacts=(\d+)/);
      if (currentStep?.id === 'llm') currentStep.details.push({ text: msg, is_checkpoint: true, checkpoint_type: 'timing', phase: m ? parseInt(m[1]) : 0, total_phases: m ? parseInt(m[2]) : 0, name: m?.[3] || '', duration_ms: m ? parseInt(m[4]) : 0, artifacts: m ? parseInt(m[5]) : 0 });
    } else if (msg.startsWith('LLM Tool Loop finished')) {
      if (currentStep?.id === 'llm') currentStep.details.push({ text: msg });
    } else if (msg.startsWith('Step: writing artifacts')) {
      closeStep(currentStep, tsMs, steps);
      currentStep = { id: 'writing', label: 'Writing Artifacts', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [] };
    } else if (msg.startsWith('Write |')) {
      if (currentStep?.id === 'writing') currentStep.details.push({ text: msg });
    } else if (msg.startsWith('Artifact writing complete')) {
      if (currentStep?.id === 'writing') currentStep.details.push({ text: msg });
    } else if (msg.startsWith('Compliance check')) {
      if (currentStep?.id === 'writing' || currentStep?.id === 'processing' || !currentStep) {
        closeStep(currentStep, tsMs, steps);
        currentStep = { id: 'processing', label: 'Processing Results', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [msg] };
      } else {
        currentStep.details.push({ text: msg });
      }
    } else if (msg.startsWith('State transition')) {
      if (currentStep) currentStep.details.push({ text: msg, is_transition: true });
    } else if (msg.startsWith('runAgent finished')) {
      closeStep(currentStep, tsMs, steps);
      const match = msg.match(/status=(\S+)/);
      run.status = match ? match[1] : 'completed';
      run.ended_at = ev.ts;
      const durMatch = msg.match(/total_duration=(\d+)ms/);
      if (durMatch) run.total_ms = parseInt(durMatch[1]);
    } else if (msg.startsWith('Guardrail check:') && !currentStep) {
      currentStep = { id: 'initializing', label: 'Initializing', started_at: ev.ts, start_ms: tsMs, ended_at: null, end_ms: null, details: [msg] };
    } else if (currentStep) {
      currentStep.details.push({ text: msg });
    }
  }

  if (currentStep && !currentStep.ended_at) {
    closeStep(currentStep, run.events.length > 0 ? new Date(run.events[run.events.length - 1].ts).getTime() : Date.now(), steps);
  }

  // Merge consecutive same-id steps
  const merged: any[] = [];
  for (const s of steps) {
    const prev = merged[merged.length - 1];
    if (prev && prev.id === s.id) {
      if (s.start_ms < prev.start_ms) prev.start_ms = s.start_ms;
      if (s.end_ms > prev.end_ms) prev.end_ms = s.end_ms;
      prev.duration_ms = prev.end_ms - prev.start_ms;
      prev.details = [...(prev.details || []), ...(s.details || [])];
      if (s.iterations) prev.iterations = [...(prev.iterations || []), ...s.iterations];
    } else {
      merged.push({ ...s });
    }
  }

  if (merged.length === 0) {
    merged.push({ id: 'initializing', label: 'Initializing', started_at: run.started_at || null, duration_ms: 0, details: [] });
  }

  // Derive error: check events for LLM errors
  let runError = null;
  for (const ev of run.events) {
    if (ev.msg.includes('ERROR') || ev.msg.includes('runAgent finished') && ev.msg.includes('status=failed')) {
      const errMatch = ev.msg.match(/ERROR:\s*(.+)/);
      if (errMatch) runError = errMatch[1];
    }
  }

  const totalMs = run.total_ms > 0
    ? run.total_ms
    : (run.events.length > 1
      ? new Date(run.events[run.events.length - 1].ts).getTime() - new Date(run.events[0].ts).getTime()
      : 0);

  return {
    started_at: run.started_at,
    ended_at: run.ended_at || null,
    status: run.status,
    error: runError,
    total_duration_ms: Math.max(totalMs, 0),
    steps: merged,
  };
}

function closeStep(step: any, tsMs: number, steps: any[]) {
  if (!step) return;
  step.ended_at = step.ended_at || new Date(tsMs).toISOString();
  step.end_ms = step.end_ms || tsMs;
  step.duration_ms = step.duration_ms || (step.end_ms - step.start_ms);
  if (step.iterations) {
    const completedIters = step.iterations.filter((i: any) => i.duration_ms);
    if (completedIters.length > 0) {
      step.llm_duration_ms = completedIters.reduce((s: number, i: any) => s + i.duration_ms, 0);
      step.iterations_total = step.iterations.length;
      step.iterations_success = completedIters.filter((i: any) => i.type === 'done').length;
      step.iterations_error = completedIters.filter((i: any) => i.type === 'error').length;
    }
  }
  if (step.duration_ms > 0 || step.details.length > 0 || step.iterations?.length > 0) {
    steps.push(step);
  }
}

function safeParseJSON(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
