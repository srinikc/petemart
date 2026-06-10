const { execSync } = require('child_process');
const fs = require('fs');

try {
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8', windowsHide: true }).trim();
  if (!stagedFiles) process.exit(0);

  const jsonFiles = stagedFiles.split('\n').filter(f => f.endsWith('.json'));
  if (jsonFiles.length === 0) process.exit(0);

  let hasErrors = false;
  for (const file of jsonFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      JSON.parse(content);
    } catch (e) {
      console.log('  \u2716 JSON validation FAILED: ' + file);
      console.log('    ' + e.message);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log('\n  \u2716 Commit BLOCKED: Fix JSON errors above, then git add + commit again\n');
    process.exit(1);
  }

  console.log('  \u2713 Validated ' + jsonFiles.length + ' JSON file(s)');
  process.exit(0);
} catch (err) {
  console.log('  \u26A0 JSON validation unavailable (' + err.message + ') — proceeding');
  process.exit(0);
}
