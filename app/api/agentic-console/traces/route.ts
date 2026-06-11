import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const TRACES_FILE = '00_state_ledger/traces.jsonl';

function readTraces(): any[] {
  const fp = path.join(ROOT, TRACES_FILE);
  try {
    if (!fs.existsSync(fp)) return [];
    const raw = fs.readFileSync(fp, 'utf-8').trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch { return []; }
}

function appendTrace(t: any) {
  const fp = path.join(ROOT, TRACES_FILE);
  try {
    const dir = path.dirname(fp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(fp, JSON.stringify(t) + '\n', 'utf-8');
  } catch {}
}

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId');
    let traces = readTraces();
    if (agentId) {
      traces = traces.filter(t => t.agent_id === agentId);
    }
    return NextResponse.json({ traces });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, operation, metadata } = body;

    if (!agent_id || !operation) {
      return NextResponse.json({ error: 'agent_id and operation required' }, { status: 400 });
    }

    const now = new Date();
    const trace_id = crypto.randomUUID();
    const span_id = crypto.randomUUID().split('-')[0];
    const trace = {
      trace_id,
      span_id,
      parent_span_id: null,
      agent_id,
      operation,
      started_at: now.toISOString(),
      ended_at: null,
      duration_ms: null,
      status: 'started',
      metadata: metadata || {},
    };

    appendTrace(trace);
    return NextResponse.json({ success: true, trace });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
