import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REPORTS_CONFIG = [
  {
    id: 'vitest',
    name: 'Vitest',
    desc: 'Unit/integration/component tests',
    path: 'qa-dashboard/reports/vitest/index.html',
    command: 'npx vitest run --reporter=html --output-file=qa-dashboard/reports/vitest/index.html',
  },
  {
    id: 'playwright',
    name: 'Playwright',
    desc: 'E2E test report with traces & screenshots',
    path: 'qa-dashboard/reports/playwright/index.html',
    command: 'npx playwright test --reporter=html && npx playwright show-report qa-dashboard/reports/playwright/',
  },
  {
    id: 'performance',
    name: 'k6 / Lighthouse',
    desc: 'Performance & stress results',
    path: 'qa-dashboard/reports/performance/index.html',
    command: 'npx playwright test --project=performance',
  },
  {
    id: 'coverage',
    name: 'Coverage',
    desc: 'Code coverage report',
    path: 'qa-dashboard/reports/coverage/index.html',
    command: 'npx vitest run --coverage --coverage.reporter=html --coverage.reportsDirectory=qa-dashboard/reports/coverage',
  },
];

export const dynamic = 'force-dynamic';

export async function GET() {
  const root = process.cwd();
  const reports = REPORTS_CONFIG.map(r => ({
    id: r.id,
    name: r.name,
    desc: r.desc,
    path: r.path,
    command: r.command,
    exists: fs.existsSync(path.join(root, r.path)),
  }));

  return NextResponse.json({ reports });
}
