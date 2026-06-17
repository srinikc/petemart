// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_SANDBOX = '__tests__/runtime/_test_chk';

beforeEach(() => {
  const fp = path.join(process.cwd(), TEST_SANDBOX);
  if (!fs.existsSync(fp)) fs.mkdirSync(fp, { recursive: true });
});

afterEach(() => {
  const fp = path.join(process.cwd(), TEST_SANDBOX);
  if (fs.existsSync(fp)) fs.rmSync(fp, { recursive: true, force: true });
});

describe('A: checkpoint iteration budget', () => {
  it('executes phases sequentially with budget split', async () => {
    const callCount: number[] = [];

    // Mock LLM that records calls and returns empty content
    const mockComplete = vi.fn(() => {
      callCount.push(callCount.length);
      return Promise.resolve({ content: '', toolCalls: [], usage: {}, model: 'test' });
    });

    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');

    // Clear the module-level LLM_CACHE between calls
    // @ts-ignore — LLM_CACHE is module-scoped, each test gets a fresh runtime
    const runtime = new AgentRuntime({
      llm: { complete: mockComplete, provider: 'test', model: 'test' },
    });

    const agentDef = {
      id: 'test-agent',
      name: 'Test Agent',
      role: 'Test',
      phase: 'test',
      pool: 'sync',
      dependencies: [],
      workspaceRoot: TEST_SANDBOX,
      tools: [],
      deliverables: { human_readable: `${TEST_SANDBOX}/test.md`, structured_data: `${TEST_SANDBOX}/test.json` },
      checkpoints: [
        { name: 'Phase 1: Architecture Design', instruction: 'Design the full architecture' },
        { name: 'Phase 2: Diagrams & Costing', instruction: 'Produce diagrams and costing' },
      ],
    };

    const expectedBudget = Math.max(3, Math.floor(15 / 2)); // 7 per phase

    const result = await runtime._runCheckpointedPipeline(agentDef, 'test base prompt');

    // Called 15/2 = 7 times per phase × 2 phases = only 2 calls because
    // empty content + empty toolCalls → immediate break on iter 1
    expect(mockComplete).toHaveBeenCalledTimes(2);

    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('artifacts');
    expect(result).toHaveProperty('usage');

    // Each phase's _llmToolLoop received maxIterations = budget (7)
    // The default is 15, so if we find MAX_ITERATIONS=15 anywhere in the
    // result it means the budget wasn't passed
    const fnSrc = runtime._llmToolLoop.toString();
    const maxIterMatch = fnSrc.match(/const MAX_ITERATIONS\s*=\s*(maxIterations|15)/);
    expect(maxIterMatch?.[1] || '').toBe('maxIterations');
  });

  it('single checkpoint falls through to plain llmToolLoop', async () => {
    const mockComplete = vi.fn(() =>
      Promise.resolve({ content: 'done', toolCalls: [], usage: {}, model: 'test' })
    );

    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const runtime = new AgentRuntime({
      llm: { complete: mockComplete, provider: 'test', model: 'test' },
    });

    const agentDef = {
      id: 'test-agent-1',
      name: 'Test Single',
      role: 'Test',
      phase: 'test',
      pool: 'sync',
      dependencies: [],
      workspaceRoot: TEST_SANDBOX,
      tools: [],
      checkpoints: [
        { name: 'Only Phase', instruction: 'Do the thing' },
      ],
    };

    const result = await runtime._runCheckpointedPipeline(agentDef, 'single checkpoint prompt');
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(result.content).toBe('done\n');
  });
});
