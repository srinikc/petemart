// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MEM_DIR = path.join(ROOT, '00_state_ledger/memory_store');
const MEM_FILE = path.join(MEM_DIR, 'test_memory_agent.json');

// Backup and restore the real memory file
let backup: string | null = null;

beforeEach(() => {
  backup = fs.existsSync(MEM_FILE) ? fs.readFileSync(MEM_FILE, 'utf-8') : null;
});

afterEach(() => {
  if (backup !== null) {
    fs.writeFileSync(MEM_FILE, backup, 'utf-8');
  } else if (fs.existsSync(MEM_FILE)) {
    fs.unlinkSync(MEM_FILE);
  }
});

function writeMemory(history: unknown[]) {
  fs.mkdirSync(MEM_DIR, { recursive: true });
  fs.writeFileSync(MEM_FILE, JSON.stringify({ agentId: 'test_memory_agent', history }, null, 2), 'utf-8');
}

describe('AgentRuntime episodic memory read-back (_getMemoryContext)', () => {
  it('returns empty string when no memory file exists', () => {
    if (fs.existsSync(MEM_FILE)) fs.unlinkSync(MEM_FILE);
    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const runtime = new AgentRuntime({ llm: { complete: async () => ({ content: '', toolCalls: [], usage: {}, model: 'test' }), provider: 'test', model: 'test' } });
    expect(runtime._getMemoryContext('test_memory_agent')).toBe('');
  });

  it('returns empty string when memory file has empty history', () => {
    writeMemory([]);
    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const runtime = new AgentRuntime({ llm: { complete: async () => ({ content: '', toolCalls: [], usage: {}, model: 'test' }), provider: 'test', model: 'test' } });
    expect(runtime._getMemoryContext('test_memory_agent')).toBe('');
  });

  it('summarizes the most recent runs (max 5) with artifacts and output preview', () => {
    writeMemory([
      { runId: 'r1', timestamp: '2026-08-20T10:00:00.000Z', status: 'completed', artifacts: ['a.md'], contentPreview: 'First output' },
      { runId: 'r2', timestamp: '2026-08-20T11:00:00.000Z', status: 'completed', artifacts: ['b.md', 'c.xlsx'], contentPreview: 'Second output here' },
      { runId: 'r3', timestamp: '2026-08-20T12:00:00.000Z', status: 'approved', artifacts: [], contentPreview: 'Third' },
    ]);
    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const runtime = new AgentRuntime({ llm: { complete: async () => ({ content: '', toolCalls: [], usage: {}, model: 'test' }), provider: 'test', model: 'test' } });
    const ctx = runtime._getMemoryContext('test_memory_agent');

    expect(ctx).toContain('Previous Runs');
    expect(ctx).toContain('3 time(s)');
    expect(ctx).toContain('a.md');
    expect(ctx).toContain('b.md, c.xlsx');
    expect(ctx).toContain('Second output here');
    // Caps at maxEntries
    const lines = (ctx.match(/- Run #/g) || []).length;
    expect(lines).toBe(3);
  });

  it('caps at maxEntries and shows correct run numbers', () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      runId: `r${i}`,
      timestamp: `2026-08-20T1${i}:00:00.000Z`,
      status: 'completed',
      artifacts: [`f${i}.md`],
      contentPreview: `out${i}`,
    }));
    writeMemory(history);
    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const runtime = new AgentRuntime({ llm: { complete: async () => ({ content: '', toolCalls: [], usage: {}, model: 'test' }), provider: 'test', model: 'test' } });
    const ctx = runtime._getMemoryContext('test_memory_agent');

    expect(ctx).toContain('8 time(s)');
    const lines = (ctx.match(/- Run #/g) || []).length;
    expect(lines).toBe(5);
    // Last 5 of 8 => run numbers 4..8
    expect(ctx).toContain('Run #4');
    expect(ctx).toContain('Run #8');
    expect(ctx).not.toContain('Run #3');
  });

  it('returns empty string on corrupt JSON', () => {
    fs.mkdirSync(MEM_DIR, { recursive: true });
    fs.writeFileSync(MEM_FILE, '{ not valid json', 'utf-8');
    const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
    const runtime = new AgentRuntime({ llm: { complete: async () => ({ content: '', toolCalls: [], usage: {}, model: 'test' }), provider: 'test', model: 'test' } });
    expect(runtime._getMemoryContext('test_memory_agent')).toBe('');
  });
});
