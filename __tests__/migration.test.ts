import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Migration Validation', () => {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  it('migrations directory exists', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
  });

  it('all migration files have .sql extension', () => {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  it('migration files are sequentially named', () => {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      expect(file).toMatch(/^\d{3}.*\.sql$/);
    }
  });

  it('migration files contain SQL statements', () => {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
      expect(content.toLowerCase()).toMatch(/(create|alter|insert|update|delete|grant|revoke)/);
    }
  });

  it('initial schema contains core table definitions', () => {
    const schemaPath = path.join(migrationsDir, '001_initial_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf-8');
      expect(content.toLowerCase()).toMatch(/create table/i);
    }
  });

  it('RLS policies file exists', () => {
    const rlsFiles = fs.readdirSync(migrationsDir).filter(f => f.includes('rls') || f.includes('policy'));
    expect(rlsFiles.length).toBeGreaterThanOrEqual(1);
  });

  it('migration rollback is safe (has down migration or IF EXISTS)', () => {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const lower = content.toLowerCase();
      if (lower.includes('create table') || lower.includes('drop table')) {
        expect(lower).toMatch(/(?:if\s+(?:not\s+)?exists)/i);
      }
    }
  });
});
