import fs from 'fs';
import path from 'path';

let cachedRoot: string | null = null;

export const ROOT_MARKER = '00_state_ledger';

/**
 * Resolve the ProductForge repository root regardless of the running process cwd.
 * Walks up from process.cwd() until a directory containing the ROOT_MARKER
 * (00_state_ledger) is found. Falls back to process.cwd().
 * Result is cached for the lifetime of the process.
 */
export function frameworkRoot(): string {
  if (cachedRoot) return cachedRoot;
  let dir = process.cwd();
  while (dir && dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ROOT_MARKER))) {
      cachedRoot = dir;
      return dir;
    }
    dir = path.dirname(dir);
  }
  cachedRoot = process.cwd();
  return cachedRoot;
}

/**
 * Resolve a path relative to the framework root.
 */
export function frameworkPath(rel: string): string {
  return path.join(frameworkRoot(), rel);
}

export function frameworkReadJSON<T = unknown>(relPath: string): T | null {
  const p = frameworkPath(relPath);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
  } catch {
    return null;
  }
}