// Multi-port dev server for ProductForge monorepo.
// Spawns all three Next.js apps as child processes:
//   - apps/framework-console -> port 3000 (console) + port 3458 (QA dashboard, separate dist dir)
//   - apps/petemart          -> port 3001 (product)
// Boots the supervisor daemon once and logs each app to its own file.
// Usage:
//   node dev-server.js            -> start all three apps
//   node dev-server.js -p 3000    -> start only the console app
//   node dev-server.js -p 3001    -> start only the product app
//   node dev-server.js -p 3458    -> start only the QA dashboard
require('./scripts/runtime/error-handler');

const { spawn } = require('child_process');
const { createWriteStream, appendFileSync } = require('fs');
const path = require('path');

const ROOT = __dirname;
const NEXT_BIN = path.join(ROOT, 'node_modules/next/dist/bin/next');

// Load .env.local before anything else so LLMProvider gets API keys (HTTP mode, not CLI)
try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(process.cwd());
} catch {}

// Auto-start supervisor daemon
try {
  const { startSupervisor } = require('./scripts/runtime/supervisorSingleton');
  const result = startSupervisor();
  console.log(`[dev-server] Supervisor daemon ${result.started ? 'started' : 'already running'}`);
} catch (err) {
  console.error('[dev-server] Supervisor start error:', err.message);
}

const APPS = {
  3000: {
    name: 'console',
    appDir: path.join(ROOT, 'apps/framework-console'),
    health: '/api/agentic-console/health',
    distDir: '.next',
  },
  3001: {
    name: 'product',
    appDir: path.join(ROOT, 'apps/petemart'),
    health: '/api/v1/health',
    distDir: '.next',
  },
  3458: {
    name: 'qa',
    appDir: path.join(ROOT, 'apps/framework-console'),
    health: '/qa-dashboard',
    distDir: '.next-qa',
  },
};

function parsePort() {
  const args = process.argv.slice(2);
  const idx = args.indexOf('-p');
  if (idx !== -1 && args[idx + 1]) {
    const port = parseInt(args[idx + 1], 10);
    if (APPS[port]) return port;
    console.error(`[dev-server] Unknown port ${port}. Valid ports: ${Object.keys(APPS).join(', ')}`);
    process.exit(1);
  }
  return null;
}

function startApp(port, cfg) {
  const logStream = createWriteStream(path.join(ROOT, `dev-${cfg.name}.log`), { flags: 'a' });
  const errStream = createWriteStream(path.join(ROOT, `dev-${cfg.name}-err.log`), { flags: 'a' });

  const child = spawn(
    process.execPath,
    [NEXT_BIN, 'dev', cfg.appDir, '-p', String(port)],
    {
      cwd: ROOT,
      env: { ...process.env, NEXT_DIST_DIR: cfg.distDir },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );

  child.stdout.on('data', (d) => {
    logStream.write(d);
    process.stdout.write(`[${cfg.name}:${port}] ${d}`);
  });
  child.stderr.on('data', (d) => {
    errStream.write(d);
    process.stderr.write(`[${cfg.name}:${port}] ${d}`);
  });

  child.on('error', (err) => {
    console.error(`[dev-server] ${cfg.name} spawn error:`, err.message);
  });
  child.on('exit', (code) => {
    console.log(`[dev-server] ${cfg.name} (port ${port}) exited with code ${code}`);
  });

  console.log(`[dev-server] ${cfg.name} starting on http://localhost:${port}${cfg.health}`);
  return child;
}

const onlyPort = parsePort();

if (onlyPort) {
  const cfg = APPS[onlyPort];
  startApp(onlyPort, cfg);
} else {
  console.log('[dev-server] Starting all apps: console (:3000), product (:3001), QA dashboard (:3458)');
  for (const [port, cfg] of Object.entries(APPS)) {
    startApp(Number(port), cfg);
  }
}
