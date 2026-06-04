const { execSync } = require('child_process');

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', windowsHide: true }).trim();

  const protectedBranches = ['main', 'develop', 'staging', 'qa', 'master'];
  const isFeatureBranch = !protectedBranches.includes(branch) && !branch.startsWith('release/');

  if (!isFeatureBranch) {
    process.exit(0);
  }

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

  const hasPR = /#\d+|PR-\d+|pull\/\d+/i.test(commitMsg);
  if (!hasPR) {
    console.log('');
    console.log('  \u2716 Commit BLOCKED: Missing PR number');
    console.log('  Feature branch "' + branch + '" requires a PR number in the commit message.');
    console.log('  Add "#<number>" to your commit message (e.g., "feat(x): description (#42)")');
    console.log('');
    process.exit(1);
  }

  const requiredFields = [
    { key: '## Component:', label: 'Component/Feature name' },
    { key: '## Bug/Feature ID:', label: 'Bug/Feature ID' },
    { key: '## Code Review:', label: 'Code Review status (Done/Not Done)' },
    { key: '## Code Review Fix:', label: 'Code Review Fix status (Done/Not Done)' },
    { key: '## Tests Run:', label: 'Tests Run (list with results)' },
    { key: '## Fix Details:', label: 'Fix Details' },
    { key: '## Change Done By:', label: 'Change Done By (agent)' },
    { key: '## Branch:', label: 'Branch name' },
    { key: '## Version:', label: 'Version' },
    { key: '## Tag:', label: 'Tag' },
  ];

  const missing = [];
  for (const field of requiredFields) {
    const escapedKey = field.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escapedKey + '\\s+', 'm');
    if (!regex.test(commitMsg)) {
      missing.push(field.label);
    }
  }

  if (missing.length > 0) {
    console.log('');
    console.log('  \u2716 Commit BLOCKED: Missing required metadata fields');
    console.log('  The following fields are required in the commit message:');
    missing.forEach(f => console.log('    \u2022 ' + f));
    console.log('');
    console.log('  Required format (add to your commit body below the subject line):');
    console.log('');
    console.log('  ## Component: <component name>');
    console.log('  ## Bug/Feature ID: <bug/feature reference>');
    console.log('  ## Code Review: Done/Not Done');
    console.log('  ## Code Review Fix: Done/Not Done');
    console.log('  ## Tests Run: <list of tests and results>');
    console.log('  ## Fix Details: <brief description>');
    console.log('  ## Change Done By: <agent ID/name>');
    console.log('  ## Branch: <branch>');
    console.log('  ## Version: <version>');
    console.log('  ## Tag: <tag>');
    console.log('');
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  console.log('  \u26A0 Commit format check unavailable (' + err.message + ') — proceeding');
  process.exit(0);
}
