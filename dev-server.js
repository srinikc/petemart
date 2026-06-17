// Server entry with global error catching — prevents crashes from unhandled exceptions
require('./scripts/runtime/error-handler');

const { rmSync, existsSync } = require('fs');
const path = require('path');

// Clear stale cache
const nextDir = path.join(__dirname, '.next');
if (existsSync(nextDir)) rmSync(nextDir, { recursive: true, force: true });

// Auto-start supervisor daemon
try {
  const { startSupervisor } = require('./scripts/runtime/supervisorSingleton');
  const result = startSupervisor();
  console.log(`[dev-server] Supervisor daemon ${result.started ? 'started' : 'already running'}`);
} catch (err) {
  console.error('[dev-server] Supervisor start error:', err.message);
}

// Forward CLI arguments to Next.js
const args = process.argv.slice(2);
process.argv = [process.argv[0], path.join(__dirname, 'node_modules/next/dist/bin/next'), 'dev', ...args];

// Start Next.js dev server
require('next/dist/bin/next');
