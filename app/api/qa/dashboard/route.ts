import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { evaluateQualityGates, saveQualityGates } from '@/lib/qa/quality-gates';
import { projectDir, projectResultsPath, projectHistoryPath, readProjectJSON } from '@/lib/qa/project-paths';
import { loadDefects } from '@/app/api/qa/defect-tracker';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get('project') || 'agentic-console';
  const projDir = projectDir(project);

  async function readJson(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch { return null; }
  }

  const [results, traceability, runHistory] = await Promise.all([
    readJson(projectResultsPath(project)),
    readJson(path.join(projDir, 'traceability.json')),
    readJson(projectHistoryPath(project)),
  ]);

  const summary = results?.summary ?? {
    totalTests: 0, passed: 0, failed: 0, passRate: 0,
    testTypesImplemented: 0, testTypesTotal: 0, openDefects: 0,
  };

  const trend = results?.trend ?? { passRate: [], totalTests: [], dates: [] };

  const testTypes = (results?.testTypes ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? '',
    status: t.status ?? 'not-implemented',
    total: t.total ?? 0,
    passed: t.passed ?? 0,
    failed: t.failed ?? 0,
    blocked: t.blocked ?? 0,
    coverageActual: t.coverageActual ?? 0,
    coverageTarget: t.coverageTarget ?? 0,
  }));

  // Auto-evaluate quality gates against current results
  const evaluatedGates = evaluateQualityGates(project);
  try { saveQualityGates(evaluatedGates, project); } catch { /* continue */ }

  const qualityGates = evaluatedGates.map((g) => ({
    id: g.gateId,
    name: g.name,
    category: g.gateId.split('-').pop() || 'general',
    status: g.status,
    description: g.description,
  }));

  const defects = loadDefects(project).map((d) => ({
    id: d.id, title: d.title,
    severity: d.severity, status: d.status,
    testFile: d.testFile, foundAt: d.foundAt,
    layer: d.layer,
  }));

  const features = (traceability?.features ?? []).map((f: any) => ({
    id: f.id,
    name: f.name,
    status: f.status ?? 'not-tested',
    testTypes: f.test_types ?? [],
    tests: f.tests ?? [],
    lastRunResult: 'unknown',
  }));

  const history = (runHistory ?? []).slice(-10).map((r: any) => ({
    runId: r.runId ?? r.id ?? '',
    tier: r.tier ?? '',
    status: r.status ?? r.allPassed === true ? 'passed' : r.allPassed === false ? 'failed' : 'unknown',
    startedAt: r.started ?? r.startedAt ?? '',
    completedAt: r.completed ?? r.completedAt ?? '',
    totalTests: r.summary?.total ?? r.totalTests ?? 0,
    passed: r.summary?.passed ?? r.passed ?? 0,
    failed: r.summary?.failed ?? r.failed ?? 0,
    passRate: r.summary?.passRate ?? r.passRate ?? 0,
    durationMs: r.summary?.durationMs ?? r.durationMs ?? r.metadata?.durationMs ?? 0,
    triggeredBy: r.metadata?.triggeredBy ?? r.triggeredBy ?? '',
  }));

  return NextResponse.json({
    metrics: {
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failed,
      passRate: summary.passRate,
      testTypesImplemented: summary.testTypesImplemented,
      testTypesTotal: summary.testTypesTotal,
      openDefects: summary.openDefects,
      trend,
    },
    testTypes,
    features,
    qualityGates,
    defects,
    runHistory: history,
  });
}
