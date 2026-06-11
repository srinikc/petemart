import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), '00_state_ledger/escalation_matrix.json');

function readMatrix() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')); } catch { return null; }
}
function writeMatrix(d: any) {
  try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf-8'); return true; } catch { return false; }
}

export async function GET() {
  const m = readMatrix();
  if (!m) return NextResponse.json({ error: 'No escalation matrix' }, { status: 500 });
  return NextResponse.json(m);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const m = readMatrix();
    if (!m) return NextResponse.json({ error: 'No matrix' }, { status: 500 });
    const { action, severity, agent_id, reason } = body;
    if (action === 'escalate') {
      const sev = m.severity_levels.find((s: any) => s.level === (severity || 'medium'));
      const entry = {
        id: `esc-${Date.now()}`,
        severity: sev?.level || 'medium',
        agent_id: agent_id || null,
        reason: reason || 'No reason provided',
        paths: sev?.paths || ['agent_00_supervisor'],
        created_at: new Date().toISOString(),
        resolved_at: null,
      };
      m.active_escalations.push(entry);
      m.last_updated = new Date().toISOString();
      writeMatrix(m);
      return NextResponse.json({ escalated: true, entry });
    }
    if (action === 'resolve') {
      const id = body.id;
      m.active_escalations = (m.active_escalations || []).map((e: any) => e.id === id ? { ...e, resolved_at: new Date().toISOString() } : e);
      m.last_updated = new Date().toISOString();
      writeMatrix(m);
      return NextResponse.json({ resolved: true, id });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
}
