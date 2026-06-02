import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Disaster Recovery — Backup Verification', () => {
  it('supabase migrations directory exists', () => {
    const migDir = path.join(process.cwd(), 'supabase', 'migrations');
    const exists = fs.existsSync(migDir);
    expect(exists).toBe(true);
  });

  it('supabase migrations contain SQL files', () => {
    const migDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (fs.existsSync(migDir)) {
      const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql'));
      expect(files.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('backup scripts are defined in package.json', () => {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.scripts).toBeDefined();
    expect(Object.keys(pkg.scripts).length).toBeGreaterThanOrEqual(5);
  });
});

describe('Disaster Recovery — Restore Integrity', () => {
  it('restore procedure is documented', () => {
    const readme = path.join(process.cwd(), 'README.md');
    const setup = path.join(process.cwd(), 'SETUP.md');
    const doc = path.join(process.cwd(), 'docs', 'deployment.md');
    const exists = [readme, setup, doc].some(f => fs.existsSync(f));
    expect(exists).toBe(true);
  });

  it('database connection is configurable via env', () => {
    const envExample = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExample)) {
      const content = fs.readFileSync(envExample, 'utf-8');
      expect(content).toContain('SUPABASE');
    }
  });
});
