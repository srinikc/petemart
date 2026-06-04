import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const historyPath = path.join(process.cwd(), 'qa-dashboard', 'run-history.json');
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
