const { execSync } = require('child_process');

try {
  const diffOutput = execSync('git diff --cached --name-only', { encoding: 'utf-8', windowsHide: true }).trim();
  if (!diffOutput) {
    process.exit(0);
  }

  const changedFiles = diffOutput.split('\n').map(f => f.trim().toLowerCase());

  // Map changed files to relevant test files
  const testMap = [
    { pattern: /^app\/qa-dashboard\//, tests: ['__tests__/api-routes.test.ts'] },
    { pattern: /^app\/api\//, tests: ['__tests__/api-routes.test.ts', '__tests__/api-contract.test.ts', '__tests__/api-helpers.test.ts'] },
    { pattern: /^__tests__\/components\//, tests: ['__tests__/components/'] },
    { pattern: /^components\//, tests: ['__tests__/components/'] },
    { pattern: /^app\/admin\//, tests: ['__tests__/api-routes.test.ts'] },
    { pattern: /^supabase\/migrations\//, tests: ['__tests__/migration.test.ts'] },
    { pattern: /^lib\/supabase\//, tests: ['__tests__/data.test.ts', '__tests__/migration.test.ts', '__tests__/multi-tenant.test.ts'] },
    { pattern: /^lib\//, tests: ['__tests__/utils.test.ts', '__tests__/api-helpers.test.ts'] },
    { pattern: /middleware/, tests: ['__tests__/security-headers.test.ts'] },
    { pattern: /auth/, tests: ['__tests__/security-headers.test.ts'] },
    { pattern: /security/, tests: ['__tests__/security-sqli-xss.test.ts', '__tests__/security-headers.test.ts'] },
    { pattern: /whatsapp/i, tests: ['__tests__/integration-whatsapp.test.ts'] },
    { pattern: /payment|razorpay|checkout/i, tests: ['__tests__/integration-payment.test.ts'] },
    { pattern: /multi-tenant|merchant/, tests: ['__tests__/multi-tenant.test.ts'] },
    { pattern: /docker|kubernetes|k8s|container/i, tests: ['__tests__/disaster-recovery.test.ts'] },
    { pattern: /stress|load|perform/i, tests: ['__tests__/stress.test.ts', '__tests__/performance.test.ts'] },
    { pattern: /data\.test|seed|mock/, tests: ['__tests__/data.test.ts'] },
    { pattern: /\.json$/, tests: ['__tests__/api-contract.test.ts'] },
  ];

  const selectedTests = new Set();

  // Check if any config/hook/system files changed — run full suite
  const systemFiles = changedFiles.filter(f =>
    f.startsWith('.husky/') || f.startsWith('.github/') || f === 'package.json' ||
    f === 'tsconfig.json' || f === 'next.config.js' || f === 'next.config.ts' ||
    f.startsWith('00_state_ledger/') || f === 'AGENTS.md'
  );

  if (systemFiles.length > 0) {
    console.log('  \u2139 System/config files changed — running full test suite');
    const result = execSync('npm test 2>&1', { encoding: 'utf-8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
    console.log(result);
    const failed = result.includes('FAIL') || result.includes('failed');
    if (failed) process.exit(1);
    process.exit(0);
  }

  for (const file of changedFiles) {
    for (const entry of testMap) {
      if (entry.pattern.test(file)) {
        const tests = Array.isArray(entry.tests) ? entry.tests : [entry.tests];
        tests.forEach(t => selectedTests.add(t));
      }
    }
  }

  // If no specific tests matched, run the basic tier
  if (selectedTests.size === 0) {
    selectedTests.add('__tests__/utils.test.ts');
    selectedTests.add('__tests__/api-helpers.test.ts');
  }

  const testArgs = Array.from(selectedTests).join(' ');
  console.log('  \u2139 Running relevant tests for changed files: ' + changedFiles.length + ' file(s)');
  console.log('  Test targets: ' + testArgs);

  const result = execSync('npx vitest run ' + testArgs + ' 2>&1', { encoding: 'utf-8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
  console.log(result);

  const failed = result.includes('FAIL') || result.includes('failed');
  if (failed) process.exit(1);
  process.exit(0);
} catch (err) {
  // If the smart test runner itself fails, fall back to full suite
  console.log('  \u26A0 Smart test selection failed (' + err.message + ') — falling back to full test suite');
  try {
    const result = execSync('npm test 2>&1', { encoding: 'utf-8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
    console.log(result);
    const failed = result.includes('FAIL') || result.includes('failed');
    if (failed) process.exit(1);
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
