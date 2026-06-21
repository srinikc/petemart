// Server entry with global error catching — prevents crashes from unhandled exceptions
require('./scripts/runtime/error-handler');

const { appendFileSync, createWriteStream } = require('fs');
const path = require('path');

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

// Forward CLI arguments to Next.js
const args = process.argv.slice(2);
process.argv = [process.argv[0], path.join(__dirname, 'node_modules/next/dist/bin/next'), 'dev', ...args];

// Redirect stdout/stderr to log files for server logs tab
const logStream = createWriteStream(path.join(__dirname, 'dev-server.log'), { flags: 'a' });
const errStream = createWriteStream(path.join(__dirname, 'dev-err.log'), { flags: 'a' });
const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);
process.stdout.write = function(chunk) {
  logStream.write(typeof chunk === 'string' ? chunk : chunk.toString());
  return origStdoutWrite(chunk);
};
process.stderr.write = function(chunk) {
  errStream.write(typeof chunk === 'string' ? chunk : chunk.toString());
  return origStderrWrite(chunk);
};

// Start Next.js dev server
require('next/dist/bin/next');
