import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

function safeReadJSON(relPath: string) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

export async function GET() {
  const index = safeReadJSON('00_state_ledger/projects_index.json');
  const projects: Record<string, any> = {};
  if (index?.projects) {
    for (const [id, info] of Object.entries(index.projects) as [string, any][]) {
      const state = safeReadJSON(info.state_path);
      if (state) {
        projects[id] = { info, stateMatrix: state };
      }
    }
  }
  const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');
  const traceability = safeReadJSON('00_state_ledger/TRACEABILITY_MATRIX.json');

  return NextResponse.json({
    projects,
    agentRegistry,
    traceability,
    projectsIndex: index,
    timestamp: new Date().toISOString(),
  });
}
