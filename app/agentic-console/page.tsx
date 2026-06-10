import fs from 'fs';
import path from 'path';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

function safeReadJSON(relPath: string) {
  try {
    const p = path.join(process.cwd(), relPath);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

export default function AgenticConsolePage() {
  const stateMatrix = safeReadJSON('00_state_ledger/STATE_MATRIX.json');
  const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');
  const traceability = safeReadJSON('00_state_ledger/TRACEABILITY_MATRIX.json');
  const changeRequest = safeReadJSON('00_state_ledger/CHANGE_REQUEST.json');

  const initialState = stateMatrix ? {
    stateMatrix,
    agentRegistry,
    traceability,
    changeRequest,
    timestamp: new Date().toISOString(),
  } : null;

  return <DashboardClient initialState={initialState} />;
}
