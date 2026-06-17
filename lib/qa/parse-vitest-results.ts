/**
 * Parses vitest JSON reporter output into structured results.
 *
 * Vitest JSON output structure (when --reporter=json is used):
 * {
 *   numTotalTestSuites: number,
 *   numPassedTestSuites: number,
 *   numFailedTestSuites: number,
 *   numTotalTests: number,
 *   numPassedTests: number,
 *   numFailedTests: number,
 *   numPendingTests: number,
 *   testResults: Array<{
 *     assertionResults: Array<{
 *       fullName: string,
 *       title: string,
 *       status: 'passed' | 'failed' | 'pending' | 'skipped',
 *       failureMessages: string[],
 *       duration?: number
 *     }>,
 *     startTime: number,
 *     endTime: number,
 *     status: 'passed' | 'failed' | 'pending',
 *     message: string,
 *     name: string  // test file path
 *   }>,
 *   coverage?: any
 * }
 */

export interface VitestResult {
  testFile: string;
  testName: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export interface ParseResult {
  results: VitestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
  };
}

/**
 * Attempts to parse vitest JSON output.
 * Returns structured results or null if parsing fails.
 */
export function parseVitestJson(stdout: string): ParseResult | null {
  try {
    // Vitest outputs JSON to stdout — try to find the JSON block
    // Sometimes there's extra logging before/after the JSON
    const jsonStart = stdout.indexOf('{');
    const jsonEnd = stdout.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const jsonStr = stdout.slice(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonStr);

    if (!data || typeof data !== 'object') return null;

    const results: VitestResult[] = [];

    if (Array.isArray(data.testResults)) {
      for (const suite of data.testResults) {
        const testFile = suite.name || 'unknown';
        if (Array.isArray(suite.assertionResults)) {
          for (const assertion of suite.assertionResults) {
            results.push({
              testFile,
              testName: assertion.fullName || assertion.title || 'unknown',
              passed: assertion.status === 'passed',
              error: assertion.failureMessages?.[0] || undefined,
              duration: assertion.duration,
            });
          }
        }
      }
    }

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const skipped = data.numPendingTests ?? 0;

    // Calculate total duration from start/end times of test suites
    let durationMs = 0;
    if (Array.isArray(data.testResults)) {
      for (const suite of data.testResults) {
        if (suite.startTime && suite.endTime) {
          durationMs += suite.endTime - suite.startTime;
        }
      }
    }

    return {
      results,
      summary: { total, passed, failed, skipped, durationMs },
    };
  } catch (e) {
    return null;
  }
}

/**
 * Parses vitest text output (non-JSON mode) by scanning for known patterns.
 * Less reliable than JSON parsing but provides basic counts.
 */
export function parseVitestText(stdout: string): Partial<ParseResult> {
  const results: VitestResult[] = [];

  // Pattern: ✓ or ✗ test name (duration)
  // Pattern: PASS or FAIL test file path
  const passFailLines = stdout.split('\n').filter((line) => {
    return line.includes('✓') || line.includes('✗') || line.includes('×') ||
           line.includes('PASS') || line.includes('FAIL') ||
           line.includes('Tests') || line.includes('passed') || line.includes('failed');
  });

  for (const line of passFailLines) {
    // Try to extract test name from pass/fail markers
    if (line.includes('✓')) {
      const parts = line.split('✓').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const nameParts = parts[0].split('(');
        results.push({
          testFile: 'unknown',
          testName: nameParts[0]?.trim() || 'unknown',
          passed: true,
        });
      }
    } else if (line.includes('✗') || line.includes('×')) {
      const symbol = line.includes('✗') ? '✗' : '×';
      const parts = line.split(symbol).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const nameParts = parts[0].split('(');
        results.push({
          testFile: 'unknown',
          testName: nameParts[0]?.trim() || 'unknown',
          passed: false,
          error: parts.slice(1).join(': ').trim() || 'Unknown error',
        });
      }
    }
  }

  // Extract summary numbers from "Tests  ..." line
  const summaryMatch = stdout.match(/Tests\s+(\d+)\s+passed\s*\(?\s*(\d+)?\s*failed\s*\(?\s*(\d+)?/);
  const totalMatch = stdout.match(/(\d+)\s+tests?\s+total/i);
  const passMatch = stdout.match(/(\d+)\s+passed/i);
  const failMatch = stdout.match(/(\d+)\s+failed/i);
  const skipMatch = stdout.match(/(\d+)\s+skipped/i);

  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  if (results.length > 0) {
    passed = results.filter((r) => r.passed).length;
    failed = results.filter((r) => !r.passed).length;
    total = passed + failed;
  }

  if (totalMatch) total = parseInt(totalMatch[1], 10) || total;
  if (passMatch) passed = parseInt(passMatch[1], 10) || passed;
  if (failMatch) failed = parseInt(failMatch[1], 10) || failed;
  if (skipMatch) skipped = parseInt(skipMatch[1], 10) || skipped;

  return {
    results,
    summary: { total, passed, failed, skipped, durationMs: 0 },
  };
}

/**
 * Parses vitest output — tries JSON first, falls back to text parsing.
 */
export function parseVitestResults(stdout: string, stderr: string): ParseResult {
  const jsonResult = parseVitestJson(stdout);
  if (jsonResult) return jsonResult;

  const textResult = parseVitestText(stdout);
  return {
    results: textResult.results || [],
    summary: textResult.summary || { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
  };
}

/**
 * Converts test type name to a test file path pattern for vitest.
 */
export function testTypeToPattern(testType: string): string {
  const patternMap: Record<string, string> = {
    'unit': '__tests__/agentic-console/unit/',
    'component': '__tests__/agentic-console/comp/',
    'api-contract': '__tests__/agentic-console/api/',
    'integration': '__tests__/agentic-console/api/',
    'sse': '__tests__/agentic-console/sse/',
    'security': '__tests__/agentic-console/security/',
  };
  return patternMap[testType] || `__tests__/agentic-console/${testType}/`;
}
