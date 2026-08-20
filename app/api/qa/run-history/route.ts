import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const project = req.nextUrl.searchParams.get('project') || 'agentic-console';
    const historyPath = path.join(frameworkRoot(), 'qa-dashboard', 'projects', project, 'run-history.json');
    if (!fs.existsSync(historyPath)) {
      return NextResponse.json([]);
    }
    const content = fs.readFileSync(historyPath, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
