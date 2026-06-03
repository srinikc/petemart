import { NextResponse } from 'next/server';
import { qaStorage } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const root = process.cwd();

  try {
    const resultsPath = path.join(root, 'qa-dashboard', 'results.json');
    const typesPath = path.join(root, 'qa-dashboard', 'test-types.json');
    const runConfigPath = path.join(root, 'qa-dashboard', 'test-run-config.json');

    const results = fs.existsSync(resultsPath)
      ? JSON.parse(fs.readFileSync(resultsPath, 'utf-8'))
      : null;
    const testTypes = fs.existsSync(typesPath)
      ? JSON.parse(fs.readFileSync(typesPath, 'utf-8'))
      : [];
    const runConfig = fs.existsSync(runConfigPath)
      ? JSON.parse(fs.readFileSync(runConfigPath, 'utf-8'))
      : {};

    return NextResponse.json({
      results,
      testTypes,
      runConfig,
      lastUpdated: new Date().toISOString(),
      environment: process.env.VERCEL ? 'vercel' : 'local',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
