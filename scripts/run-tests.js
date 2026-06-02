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
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: ROOT }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', cwd: ROOT }).trim();
    let tag = '';
    try { tag = execSync('git describe --tags --exact-match 2>nul', { encoding: 'utf-8', cwd: ROOT }).trim(); } catch {}
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

  process.exit(allPassed ? 0 : 1);
}

main();
