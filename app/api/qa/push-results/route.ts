import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

interface PushPayload {
  tier: 'sanity' | 'full' | 'release';
  status: 'passed' | 'failed' | 'running';
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    coveragePct?: number;
  };
  testTypes?: Record<string, {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    status: string;
  }>;
  qualityGates?: Array<{
    id: string;
    name: string;
    status: string;
    description?: string;
  }>;
  defects?: Array<{
    id?: string;
    title: string;
    severity: string;
    status: string;
    component: string;
    description?: string;
  }>;
  metadata?: {
    buildLabel?: string;
    triggeredBy?: string;
    commitSha?: string;
    branch?: string;
    durationMs?: number;
  };
}

const HISTORY_FILE = path.join(process.cwd(), 'qa-dashboard', 'run-history.json');
const RESULTS_FILE = path.join(process.cwd(), 'qa-dashboard', 'results.json');

export async function POST(req: NextRequest) {
  try {
    const payload: PushPayload = await req.json();

    if (!payload.tier || !payload.status) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, status' },
        { status: 400 }
      );
    }

    const validTiers = ['sanity', 'full', 'release'];
    if (!validTiers.includes(payload.tier)) {
      return NextResponse.json(
        { error: `Invalid tier: ${payload.tier}. Must be one of: ${validTiers.join(', ')}` },
        { status: 400 }
      );
    }

    const historyEntry = {
      runId: `ci-${payload.tier}-${Date.now()}`,
      tier: payload.tier,
      tierLabel: payload.tier.charAt(0).toUpperCase() + payload.tier.slice(1),
      status: payload.status,
      started: new Date().toISOString(),
      completed: payload.status !== 'running' ? new Date().toISOString() : null,
      allPassed: payload.status === 'passed',
      summary: payload.summary,
      tests: payload.testTypes || {},
      metadata: payload.metadata || {},
      source: 'ci-pipeline',
    };

    let history: any[] = [];
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      }
    } catch { history = []; }

    if (!Array.isArray(history)) history = [];
    history.push(historyEntry);

    if (history.length > 100) {
      history = history.slice(-100);
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

    if (payload.qualityGates || payload.defects) {
      try {
        const existing = fs.existsSync(RESULTS_FILE)
          ? JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'))
          : {};
        if (payload.qualityGates) existing.qualityGates = payload.qualityGates;
        if (payload.defects) {
          existing.defects = [
            ...(payload.defects.map(d => ({
              id: d.id || `CI-DEF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              ...d,
              foundAt: new Date().toISOString(),
            }))),
            ...(existing.defects || []),
          ].slice(0, 100);
        }
        existing.lastUpdated = new Date().toISOString();
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
      } catch {}
    }

    return NextResponse.json({
      success: true,
      runId: historyEntry.runId,
      message: `Results for ${payload.tier} (${payload.status}) written successfully.`,
      entryCount: history.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
