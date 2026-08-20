import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();

function safeReadJSON(relPath: string) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

function resolveStateFile(project?: string | null): string {
  if (project) {
    const p = `00_state_ledger/projects/${project}/STATE_MATRIX.json`;
    if (fs.existsSync(path.join(ROOT, p))) return p;
  }
  return '00_state_ledger/STATE_MATRIX.json';
}

function resolveProjectsIndex(): Record<string, any> | null {
  return safeReadJSON('00_state_ledger/projects_index.json');
}

export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get('project');
  const stateFile = resolveStateFile(project);
  const stateMatrix = safeReadJSON(stateFile);
  const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');
  const traceability = safeReadJSON('00_state_ledger/TRACEABILITY_MATRIX.json');
  const changeRequest = safeReadJSON('00_state_ledger/CHANGE_REQUEST.json');

  return NextResponse.json({
    stateMatrix,
    agentRegistry,
    traceability,
    changeRequest,
    projectsIndex: resolveProjectsIndex(),
    activeProject: project || (resolveProjectsIndex()?.default_project ?? null),
    timestamp: new Date().toISOString(),
    contextLake: {
      latestEntry: safeReadJSON('context_lake/latest.json') || null,
    },
  });
}
