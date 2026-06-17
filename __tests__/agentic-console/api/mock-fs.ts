// ── In-Memory FS Mock (synchronous, no vi.importActual) ──────────────
// This module returns a factory for vi.mock('fs', () => import('./mock-fs'))
// The factory creates a self-contained fs mock using globalThis bridge.

const _files = new Map<string, string>();
if (!(globalThis as any).__mockFsMap) {
  (globalThis as any).__mockFsMap = _files;
}

const _sep = '\\';

function _normalize(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

function _hasDir(p: string): boolean {
  const prefix = _normalize(p);
  const ps = prefix.endsWith('/') ? prefix : prefix + '/';
  for (const fp of _files.keys()) {
    if (_normalize(fp).startsWith(ps)) return true;
  }
  return false;
}

function _readDirEntries(p: string): { name: string; isDir: boolean; isFile: boolean }[] {
  const prefix = _normalize(p);
  const ps = prefix.endsWith('/') ? prefix : prefix + '/';
  const entries = new Map<string, { name: string; isDir: boolean; isFile: boolean }>();
  for (const fp of _files.keys()) {
    const fn = _normalize(fp);
    if (!fn.startsWith(ps)) continue;
    const relative = fn.slice(ps.length);
    const slash = relative.indexOf('/');
    if (slash === -1) {
      if (!entries.has(relative)) {
        entries.set(relative, { name: relative, isDir: false, isFile: true });
      }
    } else {
      const childDir = relative.slice(0, slash);
      if (!entries.has(childDir)) {
        entries.set(childDir, { name: childDir, isDir: true, isFile: false });
      }
    }
  }
  return Array.from(entries.values());
}

export default {
  existsSync: (p: string) => _files.has(p) || _hasDir(p),
  readFileSync: (p: string, _e?: any) => {
    if (!_files.has(p)) {
      const err: any = new Error(`ENOENT: ${p}`);
      err.code = 'ENOENT';
      throw err;
    }
    return _files.get(p)!;
  },
  writeFileSync: (p: string, d: any) => _files.set(p, String(d)),
  appendFileSync: (p: string, d: any) => _files.set(p, (_files.get(p) || '') + String(d)),
  mkdirSync: () => {},
  readdirSync: (p: string, opts?: any) => {
    const entries = _readDirEntries(p);
    if (opts?.withFileTypes) {
      return entries.map(e => ({
        name: e.name,
        isDirectory: () => e.isDir,
        isFile: () => e.isFile,
      }));
    }
    return entries.map(e => e.name);
  },
  unlinkSync: (p: string) => _files.delete(p),
  renameSync: () => {},
  statSync: (p: string) => {
    const isDir = _hasDir(p);
    return { isFile: () => !isDir, isDirectory: () => isDir, size: 1024, mtime: new Date() };
  },
};
