import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

export async function GET() {
  const mcpPath = path.join(ROOT, '00_state_ledger/MCP_SERVERS.json');
  let data = null;
  if (fs.existsSync(mcpPath)) {
    try {
      data = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
    } catch { /* ignore */ }
  }

  return NextResponse.json({
    servers: data?.servers || [],
    agentToMcpMapping: data?.agent_to_mcp_mapping || {},
    timestamp: new Date().toISOString(),
  });
}
