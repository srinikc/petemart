import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const QA_DATA_DIR = path.join(ROOT, 'qa-dashboard', 'data');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const qaStorage = {
  getResults<T>(fallback: T): T {
    return readJson(path.join(QA_DATA_DIR, 'results.json'), fallback);
  },
  saveResults(data: unknown) {
    writeJson(path.join(QA_DATA_DIR, 'results.json'), data);
  },
  getRunHistory<T>(fallback: T): T {
    return readJson(path.join(QA_DATA_DIR, 'run-history.json'), fallback);
  },
  saveRunHistory(data: unknown) {
    writeJson(path.join(QA_DATA_DIR, 'run-history.json'), data);
  },
  getTraceability<T>(fallback: T): T {
    return readJson(path.join(QA_DATA_DIR, 'traceability.json'), fallback);
  },
  saveTraceability(data: unknown) {
    writeJson(path.join(QA_DATA_DIR, 'traceability.json'), data);
  },
};
