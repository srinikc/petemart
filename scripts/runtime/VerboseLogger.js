const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'logs');

if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}

function logFile() {
  const d = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `lifecycle-${d}.log`);
}

function write(component, agentId, message) {
  try {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${component}] [${agentId}] ${message}\n`;
    fs.appendFileSync(logFile(), line, 'utf-8');
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
