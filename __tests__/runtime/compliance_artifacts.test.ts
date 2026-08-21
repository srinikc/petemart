// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');

// Backup and restore real state file
let backupState: string | null = null;

beforeEach(() => {
  backupState = fs.existsSync(STATE_PATH) ? fs.readFileSync(STATE_PATH, 'utf-8') : null;
});

afterEach(() => {
  if (backupState !== null) {
    fs.writeFileSync(STATE_PATH, backupState, 'utf-8');
  }
});

function writeTestState(overrides = {}) {
  const base = {
    project_metadata: {
      project_name: 'test', version: '1.0', factory_root: ROOT, total_agents: 1, supervisor_agent_version: '1.0',
    },
    supervisor_control: {},
    pipeline_control: { last_sync_timestamp: new Date().toISOString() },
    agent_states: {
      'test_compliance_agent': {
        agent_id: 'test_compliance_agent',
        phase: 'test',
        pool: 'sync',
        status: 'in_progress',
        dependencies: [],
        requires_human_approval: false,
        approved: false,
        role: 'Test',
        last_artifact_emitted: '',
        artifacts_emitted: [],
        last_activity_timestamp: new Date().toISOString(),
        execution_count: 1,
        consecutive_failures: 0,
        compliance_checklist: [
          { check: 'artifact_exists(missing_file.md)', type: 'artifact', required: true, id: 'TEST-MISSING' },
        ],
        ...overrides,
      },
    },
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(base, null, 2), 'utf-8');
}

describe('C/D: artifacts + duration on compliance failure', () => {
  it('sets artifacts_emitted and duration even when compliance fails', async () => {
    writeTestState();

    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const mockComplete = vi.fn(() =>
      Promise.resolve({ content: '', toolCalls: [], usage: {}, model: 'test' })
    );
    const runtime = new AgentRuntime({
      llm: { complete: mockComplete, provider: 'test', model: 'test' },
    });

    const result = {
      artifacts: [{ name: 'produced_output.md', data: '# Done', type: 'markdown' }],
      content: 'Some output',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    };

    const agentDef = {
      id: 'test_compliance_agent',
      name: 'Test Agent',
      role: 'Test',
      phase: 'test',
      pool: 'sync',
      dependencies: [],
      workspaceRoot: '__tests__/runtime/_test_comp',
      tools: [],
    };

    await runtime._runPipeline(
      'test_compliance_agent', 'test-run-001', agentDef,
      result, 'system prompt', 12345, Date.now()
    );

    // Read state from disk and verify
    const saved = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    const agent = saved.agent_states['test_compliance_agent'];
    expect(agent).toBeDefined();

    // C: artifacts_emitted set despite compliance failure
    expect(agent.artifacts_emitted).toHaveLength(1);
    expect(agent.artifacts_emitted[0]).toContain('produced_output.md');
    expect(agent.last_artifact_emitted).toHaveLength(1);

    // D: duration set despite compliance failure
    expect(agent.last_run_duration_ms).toBe(12345);
    expect(agent.last_run_id).toBe('test-run-001');

    // Status should be 'failed' (compliance failed)
    expect(agent.status).toBe('failed');
  });

  it('records artifacts on compliance pass', async () => {
    writeTestState({ compliance_checklist: [] });

    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const mockComplete = vi.fn(() =>
      Promise.resolve({ content: 'done', toolCalls: [], usage: {}, model: 'test' })
    );
    const runtime = new AgentRuntime({
      llm: { complete: mockComplete, provider: 'test', model: 'test' },
    });

    const result = {
      artifacts: [{ name: 'good_output.md', data: '# Success', type: 'markdown' }],
      content: 'All good',
      usage: { prompt_tokens: 5, completion_tokens: 3 },
    };

    const agentDef = {
      id: 'test_compliance_agent',
      name: 'Test Agent',
      role: 'Test',
      phase: 'test',
      pool: 'sync',
      dependencies: [],
      workspaceRoot: '__tests__/runtime/_test_comp',
      tools: [],
    };

    await runtime._runPipeline(
      'test_compliance_agent', 'test-run-002', agentDef,
      result, 'system prompt', 67890, Date.now()
    );

    const saved = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    const agent = saved.agent_states['test_compliance_agent'];
    expect(agent).toBeDefined();

    expect(agent.artifacts_emitted).toHaveLength(1);
    expect(agent.last_run_duration_ms).toBe(67890);
    expect(agent.status).toBe('approved');
  });
});
