import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const root = process.cwd();
  const filePath = path.join(root, 'qa-dashboard', 'agentic-console', 'reviews.json');

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ reviews: [] });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const reviews = Array.isArray(data) ? data : data.reviews || [];
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
