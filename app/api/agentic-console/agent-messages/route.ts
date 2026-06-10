import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const MESSAGES_FILE = '00_state_ledger/AGENT_MESSAGES.jsonl';

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId') || '';
  const type = request.nextUrl.searchParams.get('type') || 'all'; // 'incoming' | 'outgoing' | 'all'
  const messagesPath = path.join(ROOT, MESSAGES_FILE);

  if (!fs.existsSync(messagesPath)) {
    return NextResponse.json({ messages: [] });
  }

  const lines = fs.readFileSync(messagesPath, 'utf-8').split('\n').filter(Boolean);
  const messages = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  let filtered = messages;
  if (agentId) {
    filtered = messages.filter((m: any) => {
      if (type === 'incoming') return m.to_agent === agentId;
      if (type === 'outgoing') return m.from_agent === agentId;
      return m.from_agent === agentId || m.to_agent === agentId;
    });
  }

  return NextResponse.json({
    messages: filtered.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    total: filtered.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { from_agent, to_agent, subject, body: msgBody, artifact_ref } = body;

  if (!from_agent || !to_agent || !subject) {
    return NextResponse.json({ error: 'from_agent, to_agent, subject required' }, { status: 400 });
  }

  const messagesPath = path.join(ROOT, MESSAGES_FILE);
  const message = {
    type: 'message',
    message_id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from_agent,
    to_agent,
    subject,
    body: msgBody || '',
    artifact_ref: artifact_ref || null,
    timestamp: new Date().toISOString(),
    status: 'sent',
    read_at: null,
  };

  fs.appendFileSync(messagesPath, JSON.stringify(message) + '\n', 'utf-8');

  return NextResponse.json({ success: true, message });
}
