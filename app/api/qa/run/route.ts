import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const STATUS_DIR = path.join(process.cwd(), 'qa-dashboard');
const STATUS_FILE = path.join(STATUS_DIR, '.run-status.json');
const DEV_SERVER_PORT = 3000;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

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
  try { current = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8')); } catch {}
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
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(DEV_SERVER_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      windowsHide: true,
    });

    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      console.log('[dev-server]', text.trim());
    });

    // Poll until server is ready
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

export async function POST(req: NextRequest) {
  if (process.env.BLOCK_QA_API === 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Ensure dev server is running
    const isRunning = await checkDevServer();
    if (!isRunning) {
      try {
        await startDevServer();
      } catch (err: any) {
        return NextResponse.json({ error: `Could not start dev server: ${err.message}` }, { status: 500 });
      }
    }

    const body = await req.json();
    const selectedTypes: string[] = body.types || [];
    const env: string = body.env || 'sandbox';
    const tier: string = body.tier || '';

    const root = process.cwd();
    const configPath = path.join(root, 'qa-dashboard', 'test-run-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const buildLabel = body.buildLabel || `manual-${Date.now()}`;
    const triggeredBy = body.triggeredBy || 'qa-dashboard';

    let typeArg: string;
    if (tier && config.tiers?.[tier]) {
      typeArg = config.tiers[tier].testTypes.join(',');
    } else if (selectedTypes.length === 0) {
      return NextResponse.json({ error: 'No test types or tier specified' }, { status: 400 });
    } else {
      typeArg = selectedTypes.join(',');
    }

    const envConfig = config.environments[env];
    if (!envConfig) {
      return NextResponse.json({ error: `Unknown environment: ${env}` }, { status: 400 });
    }

    const runId = `${tier || 'custom'}-${Date.now()}`;
    const tierArg = tier ? `--tier=${tier}` : '';

    writeStatus({
      status: 'running',
      tier: tier || 'custom',
      started_at: new Date().toISOString(),
      progress: '0/1 starting...',
      results_url: '/api/qa/results/latest',
      run_id: runId,
    });

    const spawnArgs = ['scripts/run-tests.js', `--env=${env}`, `--type=${typeArg}`];
    if (tierArg) spawnArgs.push(tierArg);
    const child = spawn('node', spawnArgs, {
      cwd: root,
      env: { ...process.env, CI: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
      const lines = stdout.split('\n').filter(l => l.includes('Running:') || l.includes('PASSED') || l.includes('FAILED'));
      if (lines.length > 0) {
        writeStatus({ progress: `${lines.length} test types processed` });
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (err: Error) => {
      writeStatus({ status: 'failed', error: err.message, completed_at: new Date().toISOString() });
    });

    child.on('close', (code: number | null) => {
      const success = code === 0;
      writeStatus({
        status: success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        progress: success ? 'All tests completed' : `Failed with exit code ${code}`,
        error: success ? undefined : (stderr || `Exit code: ${code}`),
      });

      try {
        const historyPath = path.join(root, 'qa-dashboard', 'run-history.json');
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8') || '[]');
        if (Array.isArray(history) && history.length > 0) {
          const last = history[history.length - 1];
          if (last.started && !last.completed) {
            last.completed = new Date().toISOString();
            last.allPassed = success;
            last.runId = runId;
            fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
          }
        }
      } catch {}
    });

    child.unref();

    return NextResponse.json({
      success: true,
      status: 'started',
      run_id: runId,
      tier: tier || 'custom',
      message: 'Tests started in background. Poll /api/qa/status for updates.',
      buildLabel,
      triggeredBy,
      devServer: isRunning ? 'already_running' : 'started',
    });
  } catch (err: any) {
    writeStatus({ status: 'failed', error: err.message, completed_at: new Date().toISOString() });
    return NextResponse.json({
      success: false,
      status: 'error',
      error: err.message || 'Unknown error',
    }, { status: 500 });
  }
}
