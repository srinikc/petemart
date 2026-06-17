import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROOT = process.cwd();

function safeReadDir(dirPath: string): { name: string; size: number; isDir: boolean; mtime: string }[] {
  try {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath, { withFileTypes: true }).map(d => {
      const full = path.join(dirPath, d.name);
      try {
        const stat = fs.statSync(full);
        return { name: d.name, size: stat.size, isDir: d.isDirectory(), mtime: stat.mtime.toISOString() };
      } catch { return { name: d.name, size: 0, isDir: d.isDirectory(), mtime: '' }; }
    }).sort((a, b) => a.name.localeCompare(b.name));
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId');
  const file = req.nextUrl.searchParams.get('file');
  const dir = req.nextUrl.searchParams.get('dir');
  const action = req.nextUrl.searchParams.get('action') || 'list';

  // Action: read file content
  if (action === 'read' && file) {
    const safePath = path.join(ROOT, file);
    if (!safePath.startsWith(ROOT)) {
      return NextResponse.json({ error: 'Path traversal blocked' }, { status: 403 });
    }
    if (!fs.existsSync(safePath)) {
      return NextResponse.json({ error: 'File not found', file }, { status: 404 });
    }
    const stat = fs.statSync(safePath);
    const ext = path.extname(file).toLowerCase();
    const content = fs.readFileSync(safePath, 'utf-8');
    return NextResponse.json({
      name: path.basename(file),
      path: file,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      ext,
      content: ext === '.json' ? JSON.parse(content) : content,
    });
  }

  // Action: list directory
  if (action === 'list' && dir) {
    const safePath = path.join(ROOT, dir);
    if (!safePath.startsWith(ROOT)) {
      return NextResponse.json({ error: 'Path traversal blocked' }, { status: 403 });
    }
    const entries = safeReadDir(safePath);
    return NextResponse.json({ path: dir, entries });
  }

  // Default: list all agent sandbox directories
  const agentDirs: Record<string, { path: string; files: { name: string; size: number; mtime: string }[] }> = {};
  const agentPrefixes = ['01_front_office', '02_engineering_specs', '03_execution_workspace'];
  for (const prefix of agentPrefixes) {
    const baseDir = path.join(ROOT, 'agents', prefix);
    if (!fs.existsSync(baseDir)) continue;
    const agentFolders = fs.readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const folder of agentFolders) {
      const agentPath = path.join(baseDir, folder.name);
      const files = safeReadDir(agentPath).filter(f => !f.isDir);
      if (files.length > 0) {
        agentDirs[folder.name] = { path: `agents/${prefix}/${folder.name}`, files };
      }
    }
  }
  return NextResponse.json({ agents: agentDirs });
}
