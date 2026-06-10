/**
 * collect-test-results.js
 *
 * Runs all configured test suites and aggregates results into qa-dashboard/results.json
 *
 * Usage: node scripts/collect-test-results.js
 *        npm run qa:collect
 *
 * This script:
 * 1. Runs vitest with JSON reporter and captures output
 * 2. Updates qa-dashboard/results.json with fresh counts
 * 3. Appends to qa-dashboard/history.json for trend tracking
 * 4. Generates a summary to stdout
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const QA_DASHBOARD_DIR = path.join(__dirname, '..', 'qa-dashboard');
const RESULTS_FILE = path.join(QA_DASHBOARD_DIR, 'results.json');
const HISTORY_FILE = path.join(QA_DASHBOARD_DIR, 'history.json');
const PLAYWRIGHT_RESULTS_FILE = path.join(QA_DASHBOARD_DIR, 'playwright-results.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function runVitest() {
  console.log('\n[collector] Running Vitest tests...');
  try {
    const output = execSync('npx vitest run --reporter=json', {
      encoding: 'utf-8',
      timeout: 120000,
      cwd: path.join(__dirname, '..'),
      windowsHide: true,
    });

    const lines = output.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    return JSON.parse(jsonLine);
  } catch (err) {
    const stderr = err.stderr || '';
    const stdout = err.stdout || '';
    const lines = (stdout + stderr).trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(lines[i]);
      } catch { /* skip non-JSON lines */ }
    }
    console.error('[collector] Failed to parse vitest output:', err.message);
    return null;
  }
}

function readPlaywrightResults() {
  const data = readJSON(PLAYWRIGHT_RESULTS_FILE);
  if (!data || !data.stats) {
    console.log('[collector] No Playwright results found at', PLAYWRIGHT_RESULTS_FILE);
    return null;
  }
  console.log(`[collector] Found Playwright results: ${data.stats.expected} passed, ${data.stats.unexpected} failed`);
  return data;
}

function updateResults(vitestResults) {
  const results = readJSON(RESULTS_FILE) || {};
  if (!results.testTypes) results.testTypes = [];

  if (vitestResults) {
    const { numTotalTests, numPassedTests, numFailedTests, numTotalTestSuites } = vitestResults;

    const unitType = results.testTypes.find(t => t.id === 'unit');
    if (unitType) {
      unitType.total = numPassedTests + numFailedTests;
      unitType.passed = numPassedTests;
      unitType.failed = numFailedTests;
      unitType.blocked = 0;
      unitType.durationMs = vitestResults.testResults
        ? vitestResults.testResults.reduce((acc, r) => acc + (r.endTime - r.startTime), 0)
        : 0;
    }

    const intType = results.testTypes.find(t => t.id === 'integration');
    if (intType) {
      intType.total = numPassedTests + numFailedTests;
      intType.passed = numPassedTests;
      intType.failed = numFailedTests;
    }

    const regType = results.testTypes.find(t => t.id === 'regression');
    if (regType) {
      const smokeSub = regType.subcategories.find(s => s.id === 'reg-smoke');
      if (smokeSub) {
        smokeSub.total = numPassedTests + numFailedTests;
        smokeSub.passed = numPassedTests;
        smokeSub.failed = numFailedTests;
        smokeSub.status = numFailedTests === 0 ? 'pass' : 'fail';
      }
    }

    // Merge Playwright E2E results if available
    const pwResults = readPlaywrightResults();
    if (pwResults && pwResults.stats) {
      const e2eType = results.testTypes.find(t => t.id === 'e2e');
      if (e2eType) {
        e2eType.total = pwResults.stats.expected + pwResults.stats.unexpected;
        e2eType.passed = pwResults.stats.expected;
        e2eType.failed = pwResults.stats.unexpected;
        e2eType.status = pwResults.stats.unexpected === 0 ? 'implemented' : 'partial';
        e2eType.durationMs = pwResults.stats.duration || 0;
      }
    }

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalBlocked = 0;
    let typesImplemented = 0;

    for (const t of results.testTypes) {
      totalTests += t.total || 0;
      totalPassed += t.passed || 0;
      totalFailed += t.failed || 0;
      totalBlocked += t.blocked || 0;
      if (t.status === 'implemented' || t.status === 'partial') typesImplemented++;
    }

    results.summary.totalTests = totalTests;
    results.summary.passed = totalPassed;
    results.summary.failed = totalFailed;
    results.summary.blocked = totalBlocked;
    results.summary.passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    results.summary.testTypesImplemented = typesImplemented;
    results.summary.testTypesTotal = results.testTypes.length;
    results.summary.qualityGatesPassed = results.qualityGates ? results.qualityGates.filter(g => g.status === 'pass').length : 0;
    results.summary.qualityGatesTotal = results.qualityGates ? results.qualityGates.length : 0;
    results.summary.openDefects = results.defects ? results.defects.filter(d => d.status === 'open').length : 0;
    results.summary.durationMs = vitestResults.testResults
      ? vitestResults.testResults.reduce((acc, r) => acc + (r.endTime - r.startTime), 0)
      : 0;

    results.lastUpdated = new Date().toISOString();

    // Update history
    const today = new Date().toISOString().split('T')[0];
    const historyEntry = {
      date: today,
      totalTests: results.summary.totalTests,
      passed: results.summary.passed,
      failed: results.summary.failed,
      passRate: results.summary.passRate,
      coveragePct: 0,
      testTypesImplemented: results.summary.testTypesImplemented,
    };

    let history = readJSON(HISTORY_FILE) || [];
    // Replace today's entry if exists, otherwise append
    const existingIdx = history.findIndex(h => h.date === today);
    if (existingIdx >= 0) {
      history[existingIdx] = historyEntry;
    } else {
      history.push(historyEntry);
    }
    // Keep last 30 days
    if (history.length > 30) history = history.slice(-30);
    writeJSON(HISTORY_FILE, history);

    // Update trend data in results
    results.history = history;
    results.trend = {
      passRate: history.map(h => h.passRate),
      totalTests: history.map(h => h.totalTests),
      dates: history.map(h => h.date),
    };

    writeJSON(RESULTS_FILE, results);

    console.log(`[collector] Results updated: ${totalPassed}/${totalTests} passed, ${totalFailed} failed, ${totalBlocked} blocked`);
    console.log(`[collector] Pass rate: ${results.summary.passRate}%`);
    console.log(`[collector] History entries: ${history.length}`);
  }

  return results;
}

// Main
console.log('='.repeat(60));
console.log('  PeteMart QA Results Collector');
console.log('='.repeat(60));

ensureDir(QA_DASHBOARD_DIR);

// Step 1: Run vitest
const vitestOutput = runVitest();

// Step 2: Update results
const results = updateResults(vitestOutput);

// Step 3: Print summary
if (results) {
  console.log('\n[collector] QA Dashboard Summary:');
  console.log(`  Test Types: ${results.summary.testTypesImplemented}/${results.summary.testTypesTotal}`);
  console.log(`  Total Tests: ${results.summary.totalTests}`);
  console.log(`  Pass Rate: ${results.summary.passRate}%`);
  console.log(`  Quality Gates: ${results.summary.qualityGatesPassed}/${results.summary.qualityGatesTotal}`);
  console.log(`  Open Defects: ${results.summary.openDefects}`);
  console.log(`\n[collector] Dashboard data written to: qa-dashboard/results.json`);
  console.log(`[collector] History written to: qa-dashboard/history.json`);
}

console.log('\n[collector] Done.');
