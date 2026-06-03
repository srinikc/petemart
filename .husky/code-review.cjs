const { execSync } = require('child_process');

(async () => {
  let diff = '';
  try {
    diff = execSync('git diff --cached', { encoding: 'utf-8', windowsHide: true, maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch (e) {
    console.log('\n  Code review skipped: could not read diff (' + e.message + ')');
    process.exit(0);
  }

  if (!diff) {
    process.exit(0);
  }

  if (diff.length > 15000) {
    console.log('\n  Code review skipped: diff too large (' + diff.length + ' chars, max 15000)');
    process.exit(0);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log('\n  Code review skipped: DEEPSEEK_API_KEY not set in environment');
    process.exit(0);
  }

  console.log('\n  Reviewing staged changes...');

  const fetchTimeout = AbortSignal.timeout(30000);

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    signal: fetchTimeout,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a senior code reviewer. Review the git diff for: logic errors, security issues, bugs, code quality, and adherence to the project requirements. Start with APPROVED or CHANGES_REQUIRED on the first line, then provide specific feedback with file paths and line numbers if issues found.' },
        { role: 'user', content: 'Review this diff:\n\n' + diff }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  const data = await res.json();
  const review = data.choices?.[0]?.message?.content || 'No review generated';
  const trimmed = review.trim().toUpperCase();

  console.log('\n\u2500'.repeat(50));
  console.log('  AI CODE REVIEW');
  console.log('\u2500'.repeat(50));
  console.log(review);
  console.log('\u2500'.repeat(50));

  if (trimmed.startsWith('CHANGES_REQUIRED')) {
    console.log('\n  \u2716 Commit BLOCKED: fix the issues above, then git add + git commit again\n');
    process.exit(1);
  }

  if (trimmed.startsWith('APPROVED')) {
    console.log('\n  \u2713 Code review passed\n');
    process.exit(0);
  }

  // If the model didn't start with either word, be conservative
  console.log('\n  \u26A0 Review unclear — committing with caution\n');
  process.exit(0);
})().catch(err => {
  console.error('\n  Code review error:', err.message);
  console.log('  Proceeding with commit (review failed, not blocking)\n');
  process.exit(0);
});
