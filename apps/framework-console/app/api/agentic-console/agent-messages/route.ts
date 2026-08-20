import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const MESSAGES_FILE = '00_state_ledger/AGENT_MESSAGES.jsonl';
const A2A_TYPES_FILE = '00_state_ledger/A2A_TYPES.json';

function getA2aTypes(): Record<string, any> {
  const p = path.join(ROOT, A2A_TYPES_FILE);
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return {}; }
}

function validateA2aMessage(a2aType: string, payload: any): string | null {
  const types = getA2aTypes();
  const typeDef = types.types?.find((t: any) => t.id === a2aType);
  if (!typeDef) return null;
  for (const [field, def] of Object.entries(typeDef.fields) as [string, any][]) {
    if (def.required && (payload[field] === undefined || payload[field] === null || payload[field] === '')) {
      return `Missing required field '${field}' for A2A type '${a2aType}'`;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
    const agentId = request.nextUrl.searchParams.get('agentId') || '';
    const type = request.nextUrl.searchParams.get('type') || 'all';
    const a2aType = request.nextUrl.searchParams.get('a2aType') || 'all';
    const messagesPath = path.join(ROOT, MESSAGES_FILE);

    if (!fs.existsSync(messagesPath)) {
        return NextResponse.json({ messages: [], total: 0 });
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
    if (a2aType !== 'all') {
        filtered = filtered.filter((m: any) => m.a2a_type === a2aType);
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
    const { from_agent, to_agent, subject, body: msgBody, artifact_ref, a2a_type, a2a_payload } = body;

    if (!from_agent || !to_agent || !subject) {
        return NextResponse.json({ error: 'from_agent, to_agent, subject required' }, { status: 400 });
    }

    if (a2a_type) {
        const validationError = validateA2aMessage(a2a_type, a2a_payload || {});
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }
    }

    const messagesPath = path.join(ROOT, MESSAGES_FILE);
    const message: Record<string, any> = {
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

    if (a2a_type) {
        message.a2a_type = a2a_type;
        message.a2a_payload = a2a_payload || {};
    }

    fs.appendFileSync(messagesPath, JSON.stringify(message) + '\n', 'utf-8');

    return NextResponse.json({ success: true, message });
}