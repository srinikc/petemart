import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

function safeReadJSON(relPath: string) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

export async function GET() {
  const stateMatrix = safeReadJSON('00_state_ledger/STATE_MATRIX.json');
  const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');
  const traceability = safeReadJSON('00_state_ledger/TRACEABILITY_MATRIX.json');
  const changeRequest = safeReadJSON('00_state_ledger/CHANGE_REQUEST.json');

  return NextResponse.json({
    stateMatrix,
    agentRegistry,
    traceability,
    changeRequest,
    timestamp: new Date().toISOString(),
    contextLake: {
      latestEntry: safeReadJSON('context_lake/latest.json') || null,
    },
  });
}
