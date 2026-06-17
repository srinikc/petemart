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

export default async function AgenticConsolePage({
  searchParams,
}: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const project = params?.project || null;
  const projectsIndex = safeReadJSON('00_state_ledger/projects_index.json');

  // Global mode: no project selected — show mini trains for all projects
  if (!project) {
    return <DashboardClient initialState={null} />;
  }

  // Per-project mode: show detailed view
  const stateFile = `00_state_ledger/projects/${project}/STATE_MATRIX.json`;
  const stateMatrix = safeReadJSON(stateFile) || safeReadJSON('00_state_ledger/STATE_MATRIX.json');
  const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');
  const traceability = safeReadJSON('00_state_ledger/TRACEABILITY_MATRIX.json');
  const changeRequest = safeReadJSON('00_state_ledger/CHANGE_REQUEST.json');

  const initialState = stateMatrix ? {
    stateMatrix,
    agentRegistry,
    traceability,
    changeRequest,
    projectsIndex,
    activeProject: project,
    timestamp: new Date().toISOString(),
  } : null;

  return <DashboardClient initialState={initialState} />;
}
