// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_SANDBOX = '__tests__/runtime/_test_tmp';

beforeAll(() => {
  const fp = path.join(process.cwd(), TEST_SANDBOX);
  if (!fs.existsSync(fp)) fs.mkdirSync(fp, { recursive: true });
});

afterAll(() => {
  const fp = path.join(process.cwd(), TEST_SANDBOX);
  if (fs.existsSync(fp)) fs.rmSync(fp, { recursive: true, force: true });
});

function loadToolHandler() {
  const { AgentRuntime } = require('../../scripts/runtime/AgentRuntime');
  const rt = new AgentRuntime({
    llm: { complete: () => Promise.resolve({}), provider: 'test', model: 'test' },
  });
  return rt._toolHandlers;
}

describe('B: file path doubling fix', () => {
  it('strips directory prefix from write_artifact name', async () => {
    const tools = loadToolHandler();
    const result = await tools.write_artifact(
      { name: 'agents/foo/bar/test.md', data: '# Hello', type: 'markdown' },
      { workspaceRoot: TEST_SANDBOX }
    );
    expect(result.success).toBe(true);

    const root = process.cwd();
    const correctPath = path.join(root, TEST_SANDBOX, 'test.md');
    const doubledPath = path.join(root, TEST_SANDBOX, 'agents/foo/bar/test.md');

    // Must NOT write to doubled path
    expect(fs.existsSync(doubledPath)).toBe(false);
    // Must write to basename-only path
    expect(fs.existsSync(correctPath)).toBe(true);
    expect(fs.readFileSync(correctPath, 'utf-8')).toBe('# Hello');
  });

  it('preserves simple filenames unchanged', async () => {
    const tools = loadToolHandler();
    const result = await tools.write_artifact(
      { name: 'simple.md', data: '# Simple', type: 'markdown' },
      { workspaceRoot: TEST_SANDBOX }
    );
    expect(result.success).toBe(true);

    const fp = path.join(process.cwd(), TEST_SANDBOX, 'simple.md');
    expect(fs.existsSync(fp)).toBe(true);
    expect(fs.readFileSync(fp, 'utf-8')).toBe('# Simple');
  });
});
