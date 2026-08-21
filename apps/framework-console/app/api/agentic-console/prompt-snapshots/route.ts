import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const SNAP_DIR = '00_state_ledger/prompt_snapshots';

function ensureDir() {
  const dir = path.join(ROOT, SNAP_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId') || '';
  if (!agentId) return NextResponse.json({ snapshots: [], total: 0 });

  ensureDir();
  const fp = path.join(ROOT, SNAP_DIR, `${agentId}.jsonl`);
  if (!fs.existsSync(fp)) return NextResponse.json({ snapshots: [], total: 0 });

  const lines = fs.readFileSync(fp, 'utf-8').split('\n').filter(Boolean);
  const snapshots = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  return NextResponse.json({ snapshots: snapshots.reverse(), total: snapshots.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, system_prompt, config } = body;
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  ensureDir();
  const fp = path.join(ROOT, SNAP_DIR, `${agentId}.jsonl`);
  const entry = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agent_id: agentId,
    system_prompt: system_prompt || '',
    config: config || {},
    timestamp: new Date().toISOString(),
  };

  fs.appendFileSync(fp, JSON.stringify(entry) + '\n', 'utf-8');
  return NextResponse.json({ success: true, entry });
}
