const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TRACE_PATH = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');

class TraceLogger {
  constructor() {
    this._activeSpans = new Map();
    this._spanIdCounter = 0;
  }

  _nextId() {
    return `span_${Date.now()}_${++this._spanIdCounter}`;
  }

  startSpan(operation, metadata = {}) {
    const spanId = this._nextId();
    const parentSpanId = metadata.parentSpanId || null;
    const span = {
      type: 'span',
      span_id: spanId,
      parent_span_id: parentSpanId,
      trace_id: metadata.traceId || `trace_${Date.now()}`,
      operation,
      agent_id: metadata.agentId || '',
      status: 'started',
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_ms: null,
      metadata: { ...metadata },
      error: null,
    };
    this._activeSpans.set(spanId, span);
    this._persist(span);
    return {
      spanId,
      end: (endMeta = {}) => {
        const s = this._activeSpans.get(spanId);
        if (!s) return;
        s.ended_at = new Date().toISOString();
        s.duration_ms = Date.now() - new Date(s.started_at).getTime();
        s.status = endMeta.status || 'completed';
        if (endMeta.error) s.error = endMeta.error;
        Object.assign(s.metadata, endMeta);
        this._persist(s);
        this._activeSpans.delete(spanId);
      },
      recordError: (error) => {
        const s = this._activeSpans.get(spanId);
        if (!s) return;
        s.error = error;
        s.status = 'failed';
      },
    };
  }

  _persist(span) {
    try {
      fs.appendFileSync(TRACE_PATH, JSON.stringify(span) + '\n', 'utf-8');
    } catch {}
  }
}

let _instance = null;
function getInstance() {
  if (!_instance) _instance = new TraceLogger();
  return _instance;
}

module.exports = { TraceLogger, getInstance };
