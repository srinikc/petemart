import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { createDefect, loadDefects, saveDefects } from '@/app/api/qa/defect-tracker';
import type { TestFailure, Defect } from '@/app/api/qa/defect-tracker';
import { projectResultsPath, projectHistoryPath, ensureProjectDir, readProjectJSON } from '@/lib/qa/project-paths';

export const dynamic = 'force-dynamic';

interface TestResultItem {
  testFile: string;
  testName: string;
  layer: TestFailure['layer'];
  passed: boolean;
  error?: string;
  agentId?: string;
  featureId?: string;
  prNumber?: number;
  screenshotPath?: string;
}

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
  testResults?: TestResultItem[];
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
    project?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload: PushPayload = await req.json();
    const project = payload.metadata?.project || 'agentic-console';
    ensureProjectDir(project);

    if (!payload.tier || !payload.status) {
      return NextResponse.json({ error: 'Missing required fields: tier, status' }, { status: 400 });
    }

    const validTiers = ['sanity', 'full', 'release'];
    if (!validTiers.includes(payload.tier)) {
      return NextResponse.json({ error: `Invalid tier: ${payload.tier}. Must be one of: ${validTiers.join(', ')}` }, { status: 400 });
    }

    const HISTORY_FILE = projectHistoryPath(project);
    const RESULTS_FILE = projectResultsPath(project);
    const existingResults = readProjectJSON<any>(RESULTS_FILE, null);

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
    if (history.length > 100) history = history.slice(-100);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');

    // ── Auto-create defects from test failures (per-project) ───────────────
    const newDefects: Defect[] = [];
    if (payload.testResults && Array.isArray(payload.testResults)) {
      try {
        for (const tr of payload.testResults) {
          if (tr.passed === false) {
            const failure: TestFailure = {
              testFile: tr.testFile, testName: tr.testName,
              layer: tr.layer, error: tr.error || 'Unknown failure',
              timestamp: new Date().toISOString(), agentId: tr.agentId,
              featureId: tr.featureId, prNumber: tr.prNumber,
              screenshotPath: tr.screenshotPath, project,
            };
            const defect = createDefect(failure, project);
            newDefects.push(defect);
          }
        }
        const existingDefects = loadDefects(project);
        if (newDefects.length > 0) {
          saveDefects([...newDefects, ...existingDefects], project);
        }
      } catch (e) {
        console.error('[push-results] Error auto-creating defects:', e);
      }
    }

    // ── Update results.json (summary only, no embedded defects) ────────────
    if (existingResults || payload.qualityGates) {
      const existing = existingResults || {};
      if (payload.qualityGates) existing.qualityGates = payload.qualityGates;

      if (payload.testResults) {
        existing.summary = existing.summary || {};
        existing.summary.totalTests = payload.summary.total;
        existing.summary.passed = payload.summary.passed;
        existing.summary.failed = payload.summary.failed;
        existing.summary.blocked = payload.summary.blocked || 0;
        existing.summary.passRate = payload.summary.total > 0
          ? Math.round((payload.summary.passed / payload.summary.total) * 1000) / 10 : 0;
      }
      existing.lastUpdated = new Date().toISOString();
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    }

    return NextResponse.json({
      success: true, runId: historyEntry.runId,
      message: `Results for ${payload.tier} (${payload.status}) written successfully.`,
      entryCount: history.length, defectsCreated: newDefects.length, defects: newDefects, project,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
