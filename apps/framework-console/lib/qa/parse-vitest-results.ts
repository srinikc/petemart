// =============================================================================
// ProductForge — QA test result parser
// Parses vitest JSON reporter output into a normalized TestResult structure
// and maps test-type identifiers to vitest glob patterns.
// =============================================================================

export interface ParsedTestResult {
  testFile: string;
  testName: string;
  passed: boolean;
  error?: string;
  durationMs?: number;
}

export interface ParsedTestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export interface ParsedVitestResults {
  results: ParsedTestResult[];
  summary: ParsedTestSummary;
}

// Map vitest reporter JSON (--reporter=json) into our normalized structure.
export function parseVitestResults(stdout: string, _stderr?: string): ParsedVitestResults {
  const results: ParsedTestResult[] = [];
  const summary: ParsedTestSummary = { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 };

  let raw: any = null;
  try {
    raw = JSON.parse(stdout);
  } catch {
    // Some vitest versions wrap output or print it with ANSI. Try to extract the
    // JSON blob and parse it; otherwise return empty results.
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[0]);
      } catch {
        raw = null;
      }
    }
  }

  if (!raw) return { results, summary };

  const testResults = Array.isArray(raw.testResults) ? raw.testResults : [];
  const startTime = typeof raw.startTime === 'number' ? raw.startTime : 0;

  for (const file of testResults) {
    const filePath = file.name || file.testFilePath || '';
    const assertions = Array.isArray(file.assertionResults) ? file.assertionResults : [];

    for (const a of assertions) {
      const status = a.status || 'failed';
      const passed = status === 'passed';
      const skipped = status === 'pending' || status === 'skipped' || status === 'todo' || a.status === 'disabled';

      if (skipped) {
        summary.skipped++;
      } else if (passed) {
        summary.passed++;
      } else {
        summary.failed++;
      }
      summary.total++;

      results.push({
        testFile: filePath,
        testName: a.fullName || a.title || a.ancestorTitles?.join(' > ') || '',
        passed: skipped ? true : passed,
        error: !passed && !skipped ? (a.failureMessages?.[0] || 'Unknown error') : undefined,
        durationMs: typeof a.duration === 'number' ? a.duration : undefined,
      });
    }
  }

  summary.durationMs = typeof raw.testDuration === 'number' ? raw.testDuration : 0;
  if (summary.durationMs === 0 && typeof raw.startTime === 'number' && typeof raw.endTime === 'number') {
    summary.durationMs = raw.endTime - startTime;
  }

  return { results, summary };
}

// Map generic test-type identifiers to vitest glob patterns rooted at the framework root.
const TEST_TYPE_PATTERNS: Record<string, string> = {
  unit: '__tests__/agentic-console/unit/**/*.test.{ts,tsx}',
  component: '__tests__/components/**/*.test.{ts,tsx}',
  'api-contract': '__tests__/api-*.test.ts',
  sse: '__tests__/agentic-console/sse/**/*.test.{ts,tsx}',
  security: '__tests__/agentic-console/security/**/*.test.{ts,tsx}',
  regression: '__tests__/agentic-console/regression/**/*.test.{ts,tsx}',
  integration: '__tests__/agentic-console/integration/**/*.test.{ts,tsx}',
  'multi-tenant': '__tests__/multi-tenant.test.ts',
  migration: '__tests__/migration.test.ts',
  'disaster-recovery': '__tests__/disaster-recovery.test.ts',
  'visual-regression': 'e2e/visual-regression.spec.ts',
  e2e: 'e2e/**/*.spec.ts',
};

export function testTypeToPattern(testType: string): string {
  return TEST_TYPE_PATTERNS[testType] || `__tests__/**/*.test.{ts,tsx}`;
}

export function isTestTypeKnown(testType: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEST_TYPE_PATTERNS, testType);
}
