import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';
export const dynamic = 'force-dynamic';
export async function GET() {
  const p = path.join(frameworkRoot(), '00_state_ledger/tool_registry.json');
  if (!fs.existsSync(p)) return NextResponse.json({ tools: [], tool_count: 0 });
  try { return NextResponse.json(JSON.parse(fs.readFileSync(p, 'utf-8'))); }
  catch { return NextResponse.json({ error: 'Invalid tool_registry.json' }, { status: 500 }); }
}
