const { execSync } = require('child_process');

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', windowsHide: true }).trim();

  // Only enforce PR numbers on feature branches (not main/develop/staging/qa/release)
  const protectedBranches = ['main', 'develop', 'staging', 'qa', 'master'];
  const isFeatureBranch = !protectedBranches.includes(branch) && !branch.startsWith('release/');

  if (!isFeatureBranch) {
    process.exit(0);
  }

  // Check if commit message (from .git/COMMIT_EDITMSG) contains a PR number
  const commitMsgFile = process.env.GIT_PARAMS
    ? process.env.GIT_PARAMS.split(' ')[0]
    : process.argv[2] || '.git/COMMIT_EDITMSG';

  let commitMsg = '';
  try {
    const fs = require('fs');
    const cwd = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8', windowsHide: true }).trim();
    commitMsg = fs.readFileSync(commitMsgFile.includes(':') ? commitMsgFile : `${cwd}/${commitMsgFile}`, 'utf-8').trim();
  } catch {
    process.exit(0);
  }

  // Look for PR number pattern: #123 or PR-123 or pull/123
  const hasPR = /#\d+|PR-\d+|pull\/\d+/i.test(commitMsg);

  if (!hasPR) {
    console.log('');
    console.log('  \u2716 Commit BLOCKED: Missing PR number');
    console.log('  Feature branch "' + branch + '" requires a PR number in the commit message.');
    console.log('  Add "#<number>" to your commit message (e.g., "feat(x): description (#42)")');
    console.log('');
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  // If anything goes wrong, don't block the commit
  console.log('  \u26A0 PR number check unavailable (' + err.message + ') — proceeding');
  process.exit(0);
}
