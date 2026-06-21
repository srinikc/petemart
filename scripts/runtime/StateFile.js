const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const PROJ_PATH = path.join(ROOT, '00_state_ledger/projects/petemart/STATE_MATRIX.json');

// Promise queue — serializes all state read/write operations within the process
let _queue = Promise.resolve();

function enqueue(fn) {
  const result = _queue.then(fn, fn);
  _queue = result.catch(() => {});
  return result;
}

// Atomic write: write to .tmp then rename (prevents torn reads on all platforms)
function atomicWrite(filePath, data) {
  const tmp = filePath + '.__tmp';
  fs.writeFileSync(tmp, data, 'utf-8');
  fs.renameSync(tmp, filePath);
}

// Run fn inside the serialized queue. fn receives a fresh parsed state object.
function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')); } catch { return null; }
}

function saveState(state) {
  enqueue(() => {
    atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
    try { atomicWrite(PROJ_PATH, JSON.stringify(state, null, 2)); } catch {}
  });
}

// Synchronous version for callers that need immediate durability
function saveStateSync(state) {
  atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
  try { atomicWrite(PROJ_PATH, JSON.stringify(state, null, 2)); } catch {}
}

module.exports = { readState, saveState, saveStateSync, enqueue, STATE_PATH, PROJ_PATH };
