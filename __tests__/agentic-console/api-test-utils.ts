// ── Agentic Console API Test Utilities ──────────────────────────────────
import { vi } from 'vitest';
import type { StateMatrix } from './test-utils';

// ── In-Memory File System (global, shared from setup.ts) ──────────────
function getFsMap(): Map<string, string> {
  if (!(globalThis as any).__mockFsMap) {
    (globalThis as any).__mockFsMap = new Map<string, string>();
  }
  return (globalThis as any).__mockFsMap;
}

export function resetInMemoryFiles(): void {
  getFsMap().clear();
}

export function setInMemoryFile(path: string, data: string): void {
  getFsMap().set(path, data);
}

export function getInMemoryFile(path: string): string | undefined {
  return getFsMap().get(path);
}

export function deleteInMemoryFile(path: string): void {
  getFsMap().delete(path);
}

// ── Mock fs Helpers ────────────────────────────────────────────────────
export function readJSONSync<T = any>(path: string): T {
  const content = getFsMap().get(path);
  if (content === undefined) throw new Error(`ENOENT: ${path}`);
  return JSON.parse(content) as T;
}

export function writeJSONSync(path: string, data: unknown): void {
  getFsMap().set(path, JSON.stringify(data, null, 2));
}

export function fileExistsSync(path: string): boolean {
  return getFsMap().has(path);
}

// ── Mock Request Helpers ────────────────────────────────────────────────
export interface MockRequestInit {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
}

export function mockNextRequest(url: string, init?: MockRequestInit): Request {
  const parsedUrl = new URL(url, 'http://localhost:3000');
  if (init?.searchParams) {
    Object.entries(init.searchParams).forEach(([k, v]) => parsedUrl.searchParams.set(k, v));
  }
  const req = new Request(parsedUrl.toString(), {
    method: init?.method ?? 'GET',
    body: init?.body ? JSON.stringify(init.body) : undefined,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  Object.defineProperties(req, {
    nextUrl: { value: parsedUrl, writable: false },
    params: { value: init?.params ?? {}, writable: true },
  });
  return req;
}

export interface MockRouteContext {
  params: Promise<Record<string, string>> | Record<string, string>;
}

export function mockRouteContext(
  params: Record<string, string>,
  _project?: string
): MockRouteContext {
  return {
    params: Promise.resolve(params),
  };
}

// ── Temp State File Helpers ────────────────────────────────────────────
export interface WithTempStateFileOptions {
  stateData?: Partial<StateMatrix>;
  statePath?: string;
}

export function withTempStateFile<T>(
  fn: (statePath: string) => Promise<T> | T,
  options?: WithTempStateFileOptions
): Promise<T> {
  const statePath = options?.statePath ?? '__tests__/temp-state-matrix.json';
  const defaultState: StateMatrix = {
    project_metadata: { project_name: 'PeteMart', version: '2.0', factory_root: '/mock', total_agents: 16, supervisor_agent_version: '1.0' },
    supervisor_control: {
      agent_00_supervisor: { status: 'active', current_action: 'Mock', next_agent_to_dispatch: '', dispatch_queue: [], last_cycle_timestamp: new Date().toISOString(), cycle_count: 0, max_cycles_before_break: 100, cool_down_seconds: 5, last_error: null, llm_provider: 'opencode', llm_model: 'deepseek-v4-flash', budget_exceeded: false },
      stuck_agent_monitor: { enabled: true, timeout_threshold_ms: 600000, check_interval_ms: 15000, auto_kill_on_stuck: true, auto_relaunch_on_stuck: true, max_relaunch_attempts: 2, stuck_agents_detected: [] },
      workflow_enforcement: {},
    },
    approval_gates: [],
    pipeline_control: {
      current_phase: 'phase_one', active_agents: [], is_pipeline_paused: false, stuck_agent_check_enabled: true, stuck_agent_timeout_ms: 600000, last_sync_timestamp: new Date().toISOString(),
      dashboard_summary: { total_agents: 19, agents_completed: 0, agents_in_progress: 0, agents_pending: 0, agents_awaiting_review: 0, agents_failed: 0, overall_progress_pct: 0, last_milestone: '', last_updated: new Date().toISOString() },
      session_trace_id: 'mock',
    },
    agent_states: {},
    ...options?.stateData,
  };
  writeJSONSync(statePath, defaultState);
  try {
    return Promise.resolve(fn(statePath));
  } finally {
    getFsMap().delete(statePath);
  }
}

// ── Setup/Teardown Helpers ─────────────────────────────────────────────
export function setupMockFs(): void {
  // mock is already set up in setup.ts - just ensure clean state
  getFsMap().clear();
}

export function teardownMockFs(): void {
  getFsMap().clear();
}
