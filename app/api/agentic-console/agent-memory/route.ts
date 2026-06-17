import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const MEM_DIR = '00_state_ledger/memory_store';

function ensureMemDir() {
  const dir = path.join(ROOT, MEM_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId') || '';
  if (!agentId) return NextResponse.json({ entries: [], total: 0 });

  ensureMemDir();
  const filePath = path.join(ROOT, MEM_DIR, `${agentId}.jsonl`);

  if (!fs.existsSync(filePath)) return NextResponse.json({ entries: [], total: 0 });

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  const entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  return NextResponse.json({
    entries: entries.reverse(),
    total: entries.length,
    file: `${MEM_DIR}/${agentId}.jsonl`,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, content, source } = body;

  if (!agentId || !content) {
    return NextResponse.json({ error: 'agentId and content required' }, { status: 400 });
  }

  ensureMemDir();
  const filePath = path.join(ROOT, MEM_DIR, `${agentId}.jsonl`);

  const entry = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agent_id: agentId,
    content,
    source: source || 'human_gatekeeper',
    timestamp: new Date().toISOString(),
  };

  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf-8');

  return NextResponse.json({ success: true, entry });
}
