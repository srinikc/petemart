const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'logs');
const MAX_LOG_FILES = 2;

if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}

// Rotate logs on load: keep only MAX_LOG_FILES most recent
try {
  const files = fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('lifecycle-') && f.endsWith('.log'))
    .sort()
    .reverse();
  for (const f of files.slice(MAX_LOG_FILES)) {
    try { fs.unlinkSync(path.join(LOG_DIR, f)); } catch {}
  }
} catch {}

function logFile() {
  const d = new Date().toISOString().slice(0, 10);
  const fp = path.join(LOG_DIR, `lifecycle-${d}.log`);
  return fp;
}

// Rotate on every write: purge files beyond MAX_LOG_FILES
function rotate() {
  try {
    const files = fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('lifecycle-') && f.endsWith('.log'))
      .sort()
      .reverse();
    for (const f of files.slice(MAX_LOG_FILES)) {
      try { fs.unlinkSync(path.join(LOG_DIR, f)); } catch {}
    }
  } catch {}
}

function write(component, agentId, message) {
  try {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${component}] [${agentId}] ${message}\n`;
    fs.appendFileSync(logFile(), line, 'utf-8');
    rotate();
  } catch {}
}

function logDuration(component, agentId, label) {
  const start = Date.now();
  write(component, agentId, `${label} — started`);
  return {
    end: (metadata = {}) => {
      const dur = Date.now() - start;
      const meta = Object.entries(metadata).map(([k, v]) => `${k}=${v}`).join(', ');
      write(component, agentId, `${label} — completed | duration=${dur}ms${meta ? ' | ' + meta : ''}`);
    },
  };
}

module.exports = { write, logDuration };
