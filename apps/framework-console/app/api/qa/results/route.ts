import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { projectResultsPath } from '@/lib/qa/project-paths';
import { loadDefects } from '@/app/api/qa/defect-tracker';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get('project') || 'agentic-console';
  const filePath = projectResultsPath(project);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ summary: null, testTypes: [], qualityGates: [], defects: [] });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    // Return defects from per-project defects.json instead of embedded results
    data.defects = loadDefects(project);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ summary: null, testTypes: [], qualityGates: [], defects: [] });
  }
}
