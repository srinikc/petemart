import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();

export async function GET() {
  const indexPath = path.join(ROOT, '00_state_ledger/projects_index.json');
  if (!fs.existsSync(indexPath)) {
    return NextResponse.json({ default_project: 'petemart', projects: {} });
  }
  try {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid projects_index.json' }, { status: 500 });
  }
}
