import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parseVitestResults, testTypeToPattern } from '@/lib/qa/parse-vitest-results';
import { evaluateQualityGates, saveQualityGates } from '@/lib/qa/quality-gates';
import { createDefectFromFailure } from '@/lib/qa/defect-links';
import type { Defect } from '@/lib/qa/defect-links';
import { projectResultsPath, projectHistoryPath, ensureProjectDir, readProjectJSON } from '@/lib/qa/project-paths';
import http from 'http';
import { frameworkRoot } from '@productforge/framework-core';

// ---- Configuration ----

const QA_DIR = path.join(frameworkRoot(), 'qa-dashboard');
const STATUS_FILE = path.join(QA_DIR, '.run-status.json');
const DEV_SERVER_PORT = 3000;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Max timeout per tier (ms)
const TIER_TIMEOUTS: Record<string, number> = {
  sanity: 180_000,  // 3 min
  full: 300_000,     // 5 min
  release: 300_000,  // 5 min
  custom: 300_000,   // 5 min
};

// Cap at 5 min per requirements
const MAX_TIMEOUT = 300_000;

// Mapping from generic config test types to our agentic-console test type patterns
const TIER_TEST_TYPE_MAP: Record<string, string[]> = {
  sanity: ['unit', 'component', 'api-contract'],
  full: ['unit', 'component', 'api-contract', 'sse'],
  release: ['unit', 'component', 'api-contract', 'sse', 'security'],
};

// ---- Helpers ----

interface RunStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  tier: string;
  started_at: string;
  completed_at?: string;
  progress: string;
  results_url: string;
  run_id: string;
  error?: string;
}

function writeStatus(s: Partial<RunStatus>) {
  let current: RunStatus = { status: 'idle', tier: '', started_at: '', progress: '', results_url: '/api/qa/results/latest', run_id: '' };
  try { current = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8')); } catch { /* ignore */ }
  fs.writeFileSync(STATUS_FILE, JSON.stringify({ ...current, ...s }, null, 2), 'utf-8');
}

function checkDevServer(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${DEV_SERVER_URL}/api/qa/status`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

function startDevServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Dev server not running — starting on port ${DEV_SERVER_PORT}...`);
    const child = spawn('npm', ['run', 'dev'], {
      cwd: frameworkRoot(),
      env: { ...process.env, PORT: String(DEV_SERVER_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      windowsHide: true,
    });

    child.stderr?.on('data', (data: Buffer) => {
      console.log('[dev-server]', data.toString().trim());
    });

    const maxAttempts = 30;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const isUp = await checkDevServer();
      if (isUp) {
        clearInterval(poll);
        child.unref();
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(poll);
        child.kill();
        reject(new Error('Dev server failed to start within 60s'));
      }
    }, 2000);
  });
}

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function formatRunId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `run-${y}${M}${d}-${h}${m}${s}`;
}

function guessLayerFromTestFile(testFile: string): string {
  if (testFile.includes('/unit/')) return 'unit';
  if (testFile.includes('/comp/')) return 'component';
  if (testFile.includes('/api/')) return 'api-contract';
  if (testFile.includes('/sse/')) return 'sse';
  if (testFile.includes('/security/')) return 'security';
  return 'unknown';
}

function guessSeverity(error: string): Defect['severity'] {
  const low = ['cosmetic', 'style', 'typo', 'spacing', 'format'];
  const high = ['crash', 'timeout', '500', 'internal server', 'security', 'auth', 'xss', 'injection'];
  const critical = ['data loss', 'breach', 'exposure', 'deadlock', 'panic'];
  const errLower = error.toLowerCase();
  if (critical.some((k) => errLower.includes(k))) return 'critical';
  if (high.some((k) => errLower.includes(k))) return 'high';
  if (low.some((k) => errLower.includes(k))) return 'low';
  return 'medium';
}

async function runVitestWithTimeout(
  testType: string,
  pattern: string,
  timeoutMs: number
): Promise<{
  success: boolean;
  testType: string;
  results: ReturnType<typeof parseVitestResults>;
  stdout: string;
  stderr: string;
  durationMs: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const args = ['vitest', 'run', pattern, '--reporter=json'];
    const child = spawn('npx', args, {
      cwd: frameworkRoot(),
      env: { ...process.env, CI: 'false', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        testType,
        results: { results: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 } },
        stdout,
        stderr,
        durationMs: Date.now() - startTime,
        error: `Test type "${testType}" timed out after ${timeoutMs / 1000}s`,
      });
    }, timeoutMs);

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      resolve({
        success: false,
        testType,
        results: { results: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 } },
        stdout,
        stderr,
        durationMs: Date.now() - startTime,
        error: err.message,
      });
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timer);
      const parsed = parseVitestResults(stdout, stderr);
      resolve({
        success: code === 0,
        testType,
        results: parsed,
        stdout,
        stderr,
        durationMs: Date.now() - startTime,
        error: code !== 0 && !stderr ? `Exit code: ${code}` : undefined,
      });
    });
  });
}

// ---- Main POST Handler ----

export async function POST(req: NextRequest) {
  if (process.env.BLOCK_QA_API === 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Ensure dev server is running (needed for status endpoint + results page)
    const isRunning = await checkDevServer();
    if (!isRunning) {
      try {
        await startDevServer();
      } catch (err: any) {
        return NextResponse.json({ error: `Could not start dev server: ${err.message}` }, { status: 500 });
      }
    }

    const body = await req.json();
    const { tier, testTypes: rawTestTypes } = body as {
      tier?: string;
      testTypes?: string[];
    };

    const project = body.project || 'agentic-console';

    let testTypesToRun: string[] = [];
    if (tier && TIER_TEST_TYPE_MAP[tier]) {
      testTypesToRun = TIER_TEST_TYPE_MAP[tier];
    } else if (rawTestTypes && rawTestTypes.length > 0) {
      const ALL_KNOWN_TYPES = ['unit', 'component', 'api-contract', 'sse', 'security', 'e2e', 'visual-regression'];
      testTypesToRun = rawTestTypes.filter((t) => ALL_KNOWN_TYPES.includes(t));
      if (testTypesToRun.length === 0) {
        return NextResponse.json({
          error: `No valid test types specified. Valid types: ${ALL_KNOWN_TYPES.join(', ')}`,
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Specify a tier (sanity/full/release) or testTypes array' }, { status: 400 });
    }

    const RESULTS_FILE = projectResultsPath(project);
    const HISTORY_FILE = projectHistoryPath(project);
    ensureProjectDir(project);

    const timeoutMs = Math.min(TIER_TIMEOUTS[tier || 'custom'] || MAX_TIMEOUT, MAX_TIMEOUT);
    const runId = formatRunId();
    const startedAt = new Date().toISOString();

    writeStatus({
      status: 'running',
      tier: tier || 'custom',
      started_at: startedAt,
      progress: `0/${testTypesToRun.length} starting...`,
      results_url: '/api/qa/results/latest',
      run_id: runId,
    });

    // Run each test type sequentially
    const testTypeResults: Array<{
      testType: string;
      success: boolean;
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      durationMs: number;
      error?: string;
      failures?: Array<{ testFile: string; testName: string; error: string }>;
    }> = [];

    let grandTotal = 0;
    let grandPassed = 0;
    let grandFailed = 0;
    let grandDurationMs = 0;
    const allDefectsCreated: Defect[] = [];

    for (let i = 0; i < testTypesToRun.length; i++) {
      const tt = testTypesToRun[i];
      const pattern = testTypeToPattern(tt);

      // Update progress
      writeStatus({ progress: `${i}/${testTypesToRun.length} running: ${tt}...` });

      // Check if the test directory has any files; skip if not
      const testDir = path.join(frameworkRoot(), pattern);
      let hasTests = false;
      try {
        if (fs.existsSync(testDir)) {
          const entries = fs.readdirSync(testDir);
          hasTests = entries.some((e) => e.endsWith('.ts') || e.endsWith('.tsx'));
        }
      } catch { /* assume no tests */ }

      if (!hasTests) {
        testTypeResults.push({
          testType: tt,
          success: true, // skip, not a failure
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          durationMs: 0,
          error: undefined,
        });
        continue;
      }

      const result = await runVitestWithTimeout(tt, pattern, timeoutMs);
      const { summary, results } = result.results;

      // Collect failures
      const failures = results
        .filter((r) => !r.passed)
        .map((r) => ({
          testFile: r.testFile,
          testName: r.testName,
          error: r.error || 'Unknown error',
        }));

      // Auto-create defects for each failure
      for (const f of failures) {
        try {
          const layer = guessLayerFromTestFile(f.testFile);
          const severity = guessSeverity(f.error);
          const defect = createDefectFromFailure(f.testFile, f.testName, f.error, layer, severity);
          if (defect) {
            allDefectsCreated.push(defect);
          }
        } catch {
          // Continue if defect creation fails
        }
      }

      testTypeResults.push({
        testType: tt,
        success: result.success,
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        skipped: summary.skipped,
        durationMs: result.durationMs,
        error: result.error,
        failures: failures.length > 0 ? failures : undefined,
      });

      grandTotal += summary.total;
      grandPassed += summary.passed;
      grandFailed += summary.failed;
      grandDurationMs += result.durationMs;
    }

    // Compute summary
    const passRate = grandTotal > 0 ? Math.round((grandPassed / grandTotal) * 1000) / 10 : 100;
    const allPassed = grandFailed === 0;

    // Update results.json with latest counts
    const existingResults = readJSON<any>(RESULTS_FILE, null);
    if (existingResults) {
      // (defects are stored separately in per-project defects.json — not embedded here)
      existingResults.lastUpdated = new Date().toISOString();
      existingResults.summary = {
        ...existingResults.summary,
        totalTests: grandTotal,
        passed: grandPassed,
        failed: grandFailed,
        passRate,
        durationMs: grandDurationMs,
      };

      if (Array.isArray(existingResults.testTypes)) {
        for (const tr of testTypeResults) {
          const target = existingResults.testTypes.find((t: any) => t.id === tr.testType);
          if (target) {
            target.total = tr.total;
            target.passed = tr.passed;
            target.failed = tr.failed;
            target.status = tr.success ? 'implemented' : 'partial';
          }
        }
      }

      fs.writeFileSync(RESULTS_FILE, JSON.stringify(existingResults, null, 2), 'utf-8');
    }

    // Add entry to run-history.json
    const history = readJSON<any[]>(HISTORY_FILE, []);
    const testsByType: Record<string, { total: number; passed: number; failed: number; status: string }> = {};
    for (const tr of testTypeResults) {
      const existingEntry = existingResults?.testTypes?.find((t: any) => t.id === tr.testType);
      testsByType[tr.testType] = {
        total: tr.total,
        passed: tr.passed,
        failed: tr.failed,
        status: existingEntry?.status || (tr.success ? 'implemented' : 'partial'),
      };
    }

    history.unshift({
      runId,
      tier: tier || 'custom',
      tierLabel: tier ? (tier.charAt(0).toUpperCase() + tier.slice(1)) : 'Custom',
      status: allPassed ? 'passed' : 'completed',
      started: startedAt,
      completed: new Date().toISOString(),
      allPassed,
      summary: {
        total: grandTotal,
        passed: grandPassed,
        failed: grandFailed,
        passRate,
        durationMs: grandDurationMs,
        newDefects: allDefectsCreated.length,
      },
      tests: testsByType,
      metadata: {
        buildLabel: body.buildLabel || `manual-${Date.now()}`,
        triggeredBy: body.triggeredBy || 'qa-dashboard',
        commitSha: body.commitSha || '',
        branch: body.branch || '',
        durationMs: grandDurationMs,
      },
      source: body.triggeredBy === 'ci-pipeline' ? 'ci-pipeline' : 'manual',
      defectsFound: allDefectsCreated.map((d) => d.id),
    });
    // Keep max 50 entries
    if (history.length > 50) history.length = 50;
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

    // Evaluate quality gates
    const qualityGates = evaluateQualityGates(project);
    try { saveQualityGates(qualityGates, project); } catch { /* continue */ }

    writeStatus({
      status: allPassed ? 'completed' : 'completed',
      completed_at: new Date().toISOString(),
      progress: allPassed ? 'All tests passed' : `${grandFailed} test(s) failed`,
      error: allPassed ? undefined : `${grandFailed} test(s) failed across ${testTypeResults.filter((t) => !t.success).length} type(s)`,
    });

    return NextResponse.json({
      success: true,
      runId,
      tier: tier || 'custom',
      project,
      startedAt,
      completedAt: new Date().toISOString(),
      allPassed,
      summary: {
        total: grandTotal,
        passed: grandPassed,
        failed: grandFailed,
        passRate,
        durationMs: grandDurationMs,
      },
      testTypeResults: testTypeResults.map((tr) => ({
        testType: tr.testType,
        success: tr.success,
        total: tr.total,
        passed: tr.passed,
        failed: tr.failed,
        skipped: tr.skipped,
        durationMs: tr.durationMs,
        error: tr.error,
        failureCount: tr.failures?.length || 0,
        failures: tr.failures || [],
      })),
      defectsCreated: allDefectsCreated.map((d) => ({
        id: d.id,
        title: d.title,
        severity: d.severity,
        testFile: d.testFile,
        testName: d.testName,
      })),
      qualityGates: qualityGates.map((g) => ({
        gateId: g.gateId,
        name: g.name,
        status: g.status,
        description: g.description,
        metrics: g.metrics,
      })),
      runHistoryUrl: `/agentic-console/quality?tab=run-history&run=${runId}`,
    });
  } catch (err: any) {
    writeStatus({
      status: 'failed',
      error: err.message || 'Unknown error',
      completed_at: new Date().toISOString(),
    });
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error',
    }, { status: 500 });
  }
}
