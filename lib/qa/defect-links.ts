import type { Defect, TestFailure } from '@/app/api/qa/defect-tracker';
import { createDefect, loadDefects, saveDefects } from '@/app/api/qa/defect-tracker';

export type { Defect };

export function findDefectForTest(testFile: string, testName: string, project?: string, defects?: Defect[]): Defect | null {
  const list = defects || loadDefects(project);
  return list.find((d) => d.testFile === testFile && d.testName === testName) || null;
}

export function generateDefectLink(defectId: string): string {
  return `#defect-${defectId}`;
}

export function getDefectsByTestFile(testFile: string, project?: string): Defect[] {
  return loadDefects(project).filter((d) => d.testFile === testFile);
}

export function getDefectByStatus(project?: string): { open: number; in_progress: number; fixed: number; verified: number; closed: number } {
  const defects = loadDefects(project);
  return {
    open: defects.filter((d) => d.status === 'open').length,
    in_progress: defects.filter((d) => d.status === 'in_progress').length,
    fixed: defects.filter((d) => d.status === 'fixed').length,
    verified: defects.filter((d) => d.status === 'verified').length,
    closed: defects.filter((d) => d.status === 'closed').length,
  };
}

export function defectReportUrl(defectId?: string): string {
  const base = '/agentic-console/quality?tab=defects';
  return defectId ? `${base}&defect=${defectId}` : base;
}

export function createDefectFromFailure(
  testFile: string, testName: string, errorMessage: string,
  layer: string = 'unknown', severity: Defect['severity'] = 'medium', project?: string
): Defect | null {
  const existing = findDefectForTest(testFile, testName, project);
  if (existing) return null;
  const failure: TestFailure = {
    testFile, testName,
    layer: layer as TestFailure['layer'],
    error: errorMessage,
    timestamp: new Date().toISOString(),
    project,
  };
  const defect = createDefect(failure, project);
  const all = loadDefects(project);
  all.push(defect);
  saveDefects(all, project);
  return defect;
}
