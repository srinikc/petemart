import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export function projectDir(project: string): string {
  return path.join(frameworkRoot(), 'qa-dashboard', 'projects', project);
}

export function projectResultsPath(project: string): string {
  return path.join(projectDir(project), 'results.json');
}

export function projectHistoryPath(project: string): string {
  return path.join(projectDir(project), 'run-history.json');
}

export function projectDefectsPath(project: string): string {
  return path.join(projectDir(project), 'defects.json');
}

export function ensureProjectDir(project: string): void {
  const dir = projectDir(project);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readProjectJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}
