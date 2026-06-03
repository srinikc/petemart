/**
 * run-tests.js — Test Selection & Execution Engine
 *
 * Reads qa-dashboard/test-run-config.json to determine which test types
 * to run based on the current environment (sandbox vs CI).
 *
 * Usage:
 *   node scripts/run-tests.js                         # sandbox mode (default)
 *   node scripts/run-tests.js --env=ci                # CI mode
 *   node scripts/run-tests.js --list                  # List enabled test types
 *   node scripts/run-tests.js --type=unit,e2e         # Override to specific types
 *   node scripts/run-tests.js --tier=sanity           # Run a predefined tier (sanity|full|release)
 *   node scripts/run-tests.js --tier=sanity --env=ci  # Run tier in CI mode
 *
 * npm scripts:
 *   npm run test:all      → sandbox mode
 *   npm run test:ci       → CI mode
 *   npm run test:list     → list test types
 *   npm run test:sanity   → Run Sanity tier (local)
 *   npm run test:full     → Run Full QA tier (local)
 *   npm run test:release  → Run Release tier (local)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'qa-dashboard', 'test-run-config.json');
const RESULTS_PATH = path.join(ROOT, 'qa-dashboard', 'results.json');

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getGitMeta() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: ROOT, windowsHide: true }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', cwd: ROOT, windowsHide: true }).trim();
    let tag = '';
    try { tag = execSync('git describe --tags --exact-match 2>nul', { encoding: 'utf-8', cwd: ROOT, windowsHide: true }).trim(); } catch {}
    return { gitSha: sha, gitBranch: branch, gitTag: tag || '' };
  } catch { return { gitSha: '', gitBranch: 'unknown', gitTag: '' }; }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { env: 'sandbox', list: false, types: null, tier: null };
  for (const arg of args) {
    if (arg === '--list' || arg === '-l') parsed.list = true;
    else if (arg.startsWith('--env=')) parsed.env = arg.split('=')[1];
    else if (arg.startsWith('--type=')) parsed.types = arg.split('=')[1].split(',');
    else if (arg.startsWith('--tier=')) parsed.tier = arg.split('=')[1];
  }
  return parsed;
}

function runCommand(command, label, envOverrides = {}) {
  console.log(`\n┌─ [${label}] ──────────────────────────────────`);
  console.log(`│ Running: ${command}`);
  console.log('└────────────────────────────────────────────────\n');
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 300000,
      cwd: ROOT,
      env: { ...process.env, ...envOverrides },
      stdio: 'pipe',
      windowsHide: true,
    });
    console.log(output);
    return { success: true, output };
  } catch (err) {
    console.log(err.stdout || '');
    console.error(err.stderr || '');
    return { success: false, output: err.stdout || err.stderr || '' };
  }
}

function main() {
  const args = parseArgs();
  const config = readJSON(CONFIG_PATH);
  if (!config) {
    console.error('ERROR: Could not read', CONFIG_PATH);
    process.exit(1);
  }

  const env = config.environments[args.env];
  if (!env) {
    console.error(`ERROR: Unknown environment "${args.env}". Available: ${Object.keys(config.environments).join(', ')}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log(`  PeteMart Test Runner — ${env.label}`);
  console.log(`  ${env.description}`);
  console.log('='.repeat(60));

  if (args.tier) {
    const tier = config.tiers?.[args.tier];
    if (!tier) {
      console.error(`ERROR: Unknown tier "${args.tier}". Available: ${Object.keys(config.tiers || {}).join(', ')}`);
      process.exit(1);
    }
    console.log(`  Tier: ${tier.label} — ${tier.description}`);
    args.types = tier.testTypes;
  }

  if (args.list && !args.tier) {
    console.log('\nTiers:');
    for (const [id, t] of Object.entries(config.tiers || {})) {
      console.log(`  ${id.padEnd(12)} ${t.label.padEnd(20)} ${t.testTypes.length} types`);
    }
    console.log('\nEnabled test types:');
    for (const [id, t] of Object.entries(env.testTypes)) {
      const status = t.enabled ? '✅' : '⬜';
      console.log(`  ${status} ${id.padEnd(20)} ${t.command}`);
    }
    console.log(`\nPlaywright projects: ${env.playwrightProjects.join(', ')}`);
    console.log(`Collect results: ${env.collectResults}`);
    console.log(`Fail fast: ${env.failFast}`);
    return;
  }

  const typesToRun = args.types
    ? Object.fromEntries(
        Object.entries(env.testTypes).map(([id, t]) => [id, { ...t, enabled: args.types.includes(id) }])
      )
    : env.testTypes;

  const gitMeta = getGitMeta();
  const results = {
    started: new Date().toISOString(),
    environment: args.env,
    tier: args.tier || 'custom',
    tierLabel: args.tier ? (config.tiers?.[args.tier]?.label || args.tier) : 'Custom Selection',
    gitSha: gitMeta.gitSha,
    gitBranch: gitMeta.gitBranch,
    gitTag: gitMeta.gitTag,
    buildLabel: process.env.BUILD_LABEL || `manual-${gitMeta.gitSha || Date.now()}`,
    triggeredBy: process.env.TRIGGERED_BY || 'local',
    tests: {},
  };
  let allPassed = true;

  for (const [typeId, typeConfig] of Object.entries(typesToRun)) {
    if (!typeConfig.enabled) {
      console.log(`\n⏭️  SKIPPED: ${typeId} (disabled in ${args.env} config)`);
      results.tests[typeId] = { status: 'skipped' };
      continue;
    }

    const cmd = typeConfig.command;
    const envOverrides = { ...env.env, TEST_TYPE: typeId };
    const result = runCommand(cmd, typeId, envOverrides);

    results.tests[typeId] = {
      status: result.success ? 'passed' : 'failed',
      command: cmd,
      timestamp: new Date().toISOString(),
    };

    if (!result.success) {
      allPassed = false;
      if (env.failFast) {
        console.error(`\n❌ FAILED: ${typeId} — failFast enabled, aborting.`);
        break;
      }
    }
  }

  results.completed = new Date().toISOString();
  results.allPassed = allPassed;

  const historyPath = path.join(ROOT, 'qa-dashboard', 'run-history.json');
  let history = readJSON(historyPath) || [];
  history.push(results);
  if (history.length > 50) history = history.slice(-50);
  writeJSON(historyPath, history);

  console.log('\n' + '='.repeat(60));
  console.log(`  Test Run Complete — ${args.env.toUpperCase()}`);
  console.log(`  Status: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log('='.repeat(60));

  // ── ITEM 1: Auto-Capture Failures → results.json, defect logs, supervisor notification ──
  if (!allPassed) {
    try {
      autoCaptureFailures(results, args);
    } catch (capErr) {
      console.error('Auto-capture error (non-fatal):', capErr.message);
    }
  }

  process.exit(allPassed ? 0 : 1);
}

/**
 * ITEM 1: Auto-Capture Test Failures & Create Defect Entries
 * Called automatically when any tests fail.
 */
function autoCaptureFailures(runResults, args) {
  const QA_DIR = path.join(ROOT, 'agents', '03_execution_workspace', '08_qa_agent');
  const RESULTS_PATH = path.join(ROOT, 'qa-dashboard', 'results.json');
  const DEFECT_LOG_MD = path.join(QA_DIR, '02_DEFECT_LOG.md');
  const DEFECT_LOG_JSON = path.join(QA_DIR, '03_DEFECT_LOG.json');
  const NOTIFICATION_PATH = path.join(ROOT, '00_state_ledger', 'SUPERVISOR_NOTIFICATION.json');

  // 1. Collect failed test type details
  const failedTypes = [];
  for (const [typeId, testResult] of Object.entries(runResults.tests)) {
    if (testResult.status === 'failed') {
      failedTypes.push({
        typeId,
        command: testResult.command || '',
        timestamp: testResult.timestamp || new Date().toISOString(),
      });
    }
  }

  const now = new Date().toISOString();
  const tier = args.tier || 'custom';
  const failedCount = failedTypes.length;

  if (failedCount === 0) return;

  console.log(`\n📸 Auto-capturing ${failedCount} failure(s) to defect logs...`);

  // 2. Read existing results.json and inject failure data
  let resultsData = readJSON(RESULTS_PATH) || { testTypes: [], defects: [], summary: {} };
  const tierLabel = (readJSON(CONFIG_PATH)?.tiers?.[tier]?.label) || 'Custom';

  // Mark failing test types in results.json
  if (resultsData.testTypes) {
    for (const tt of resultsData.testTypes) {
      if (failedTypes.some(f => f.typeId === tt.id)) {
        tt.failed = tt.total || 1; // Mark at least some failures
      }
    }
  }

  // Update summary
  resultsData.summary = resultsData.summary || {};
  resultsData.summary.failed = (resultsData.summary.failed || 0) + failedCount;
  resultsData.summary.totalTests = (resultsData.summary.totalTests || 0) + failedCount;
  resultsData.summary.passRate = resultsData.summary.totalTests > 0
    ? Math.round(((resultsData.summary.totalTests - resultsData.summary.failed) / resultsData.summary.totalTests) * 100)
    : 0;

  // 3. Create structured defect entries
  const defectIds = [];
  const newDefects = [];

  // Read existing defect log JSON
  let defectLog = readJSON(DEFECT_LOG_JSON) || { version: '1.0', lastUpdated: now, defects: [], autoCaptured: [] };

  // Determine next defect ID
  let nextDefNum = 1;
  const allExisting = [...(defectLog.defects || []), ...(defectLog.autoCaptured || [])];
  for (const d of allExisting) {
    const match = d.id && d.id.match(/DEF-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= nextDefNum) nextDefNum = num + 1;
    }
  }

  for (const ft of failedTypes) {
    const defId = `DEF-${String(nextDefNum).padStart(3, '0')}`;
    defectIds.push(defId);
    nextDefNum++;

    const defectEntry = {
      id: defId,
      severity: 'medium',
      status: 'open',
      component: ft.typeId,
      title: `Auto-captured: ${ft.typeId} tests failed`,
      description: `Test type "${ft.typeId}" failed during ${tierLabel} tier run. Command: ${ft.command || 'N/A'}. Timestamp: ${ft.timestamp}`,
      files: [],
      foundAt: ft.timestamp || now,
      autoCaptured: true,
      sourceTier: tier,
      sourceRunId: `${tier}-${now.replace(/[:.]/g, '-')}`,
    };

    newDefects.push(defectEntry);

    // Write results.json failure record
    if (!resultsData.defects) resultsData.defects = [];
    resultsData.defects.unshift(defectEntry);
  }

  // Append to JSON defect log
  if (!defectLog.autoCaptured) defectLog.autoCaptured = [];
  defectLog.autoCaptured.push(...newDefects);
  defectLog.lastUpdated = now;
  writeJSON(DEFECT_LOG_JSON, defectLog);
  writeJSON(RESULTS_PATH, resultsData);

  // 4. Append to human-readable MD defect log
  let mdContent = '';
  try { mdContent = fs.readFileSync(DEFECT_LOG_MD, 'utf-8'); } catch { mdContent = `# PeteMart — QA Defect Log\n\n---\n`; }

  const mdAppend = `
---

## Auto-Captured Defects — ${tierLabel} Run (${new Date(now).toISOString().slice(0, 16).replace('T', ' ')})

| ID | Component | Description |
|----|-----------|-------------|
${newDefects.map(d => `| **${d.id}** | ${d.component} | ${d.title} |`).join('\n')}

`;
  try {
    fs.appendFileSync(DEFECT_LOG_MD, mdAppend, 'utf-8');
  } catch (e) {
    console.error('Could not append to MD defect log:', e.message);
  }

  // 5. Write supervisor notification file
  const notification = {
    notification_id: `FAIL-${now.replace(/[:.]/g, '-')}`,
    agent_source: '08_qa_agent',
    event_type: 'test_failure',
    timestamp: now,
    tier: tier,
    failed_count: failedCount,
    defect_ids: defectIds,
    failed_types: failedTypes.map(f => f.typeId),
    message: `${failedCount} test failure(s) in ${tierLabel} tier. Defects created: ${defectIds.join(', ')}`,
  };

  try {
    // Create notification directory if needed
    const notifyDir = path.dirname(NOTIFICATION_PATH);
    if (!fs.existsSync(notifyDir)) {
      fs.mkdirSync(notifyDir, { recursive: true });
    }
    // Store all notifications in an array
    let existingNotifications = [];
    try { existingNotifications = JSON.parse(fs.readFileSync(NOTIFICATION_PATH, 'utf-8') || '[]'); }
    catch { existingNotifications = []; }
    if (!Array.isArray(existingNotifications)) existingNotifications = [];
    existingNotifications.push(notification);
    // Keep last 20
    if (existingNotifications.length > 20) existingNotifications = existingNotifications.slice(-20);
    writeJSON(NOTIFICATION_PATH, existingNotifications);

    console.log(`\n📨 Supervisor notification written: ${NOTIFICATION_PATH}`);
    console.log(`   Notification ID: ${notification.notification_id}`);
    console.log(`   Defect IDs: ${defectIds.join(', ')}`);
  } catch (e) {
    console.error('Could not write supervisor notification:', e.message);
  }

  // 6. Also append to run-history.json with failure markers
  const historyPath = path.join(ROOT, 'qa-dashboard', 'run-history.json');
  let history = readJSON(historyPath) || [];
  if (history.length > 0 && history[history.length - 1].started === runResults.started) {
    const lastEntry = history[history.length - 1];
    lastEntry.allPassed = false;
    lastEntry.failedCount = failedCount;
    lastEntry.defectIds = defectIds;
    lastEntry.notificationId = notification.notification_id;
    writeJSON(historyPath, history);
  }

  console.log(`✅ Auto-capture complete. ${failedCount} failure(s) logged, ${newDefects.length} defect(s) created.`);
}

main();
