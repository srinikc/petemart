import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

function safeReadJSON(relPath: string) {
  try {
    const p = path.join(ROOT, relPath);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId');
  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }

  const stateMatrix = safeReadJSON('00_state_ledger/STATE_MATRIX.json');
  const agentRegistry = safeReadJSON('00_state_ledger/AGENT_REGISTRY.json');
  const mcpServers = safeReadJSON('00_state_ledger/MCP_SERVERS.json');

  const agentState = stateMatrix?.agent_states?.[agentId] || null;
  const registryEntry = agentRegistry?.agents?.[agentId] || null;

  // Build upstream artifact list (consumed inputs)
  const consumedArtifacts: { depId: string; files: string[]; status: string }[] = [];
  if (agentState?.dependencies) {
    for (const depId of agentState.dependencies) {
      const depState = stateMatrix?.agent_states?.[depId];
      const depRegistry = agentRegistry?.agents?.[depId];
      const depFiles = depState?.artifacts_emitted || [];
      consumedArtifacts.push({
        depId,
        files: depFiles,
        status: depState?.status || 'unknown',
      });
    }
  }

  // Get MCP servers for this agent
  const agentMcpIds = mcpServers?.agent_to_mcp_mapping?.[agentId] || [];
  const agentMcpServers = (mcpServers?.servers || []).filter((s: any) =>
    agentMcpIds.includes(s.id) || s.used_by?.includes('all')
  );

  // Read system prompt from registry
  const systemPrompt = registryEntry?.system_prompt || '';

  // Last error from state
  const lastError = agentState?.last_error || null;

  // Get all upstream artifact contents for quick preview
  const upstreamArtifactPreviews: { file: string; exists: boolean; size: number }[] = [];
  for (const dep of consumedArtifacts) {
    for (const file of dep.files) {
      const fullPath = path.join(ROOT, file);
      const exists = fs.existsSync(fullPath);
      upstreamArtifactPreviews.push({
        file,
        exists,
        size: exists ? fs.statSync(fullPath).size : 0,
      });
    }
  }

  // Verify agent's own artifacts exist on disk
  const artifactStatus = (agentState?.artifacts_emitted || []).map((file: string) => {
    const fullPath = path.join(ROOT, file);
    const exists = fs.existsSync(fullPath);
    return { file, exists, size: exists ? fs.statSync(fullPath).size : 0 };
  });

  return NextResponse.json({
    agentState,
    registryEntry,
    consumedArtifacts,
    agentMcpServers,
    systemPrompt,
    lastError,
    artifactStatus,
    upstreamArtifactPreviews,
    timestamp: new Date().toISOString(),
  });
}
