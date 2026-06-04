const { execSync } = require('child_process');

(async () => {
  let diff = '';
  try {
    diff = execSync('git diff --cached', { encoding: 'utf-8', windowsHide: true, maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch (e) {
    console.log('\n  Code review skipped: could not read diff (' + e.message + ')');
    process.exitCode = 0;
    return;
  }

  if (!diff) {
    process.exitCode = 0;
    return;
  }

  if (diff.length > 15000) {
    console.log('\n  Code review skipped: diff too large (' + diff.length + ' chars, max 15000)');
    process.exitCode = 0;
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log('\n  Code review skipped: DEEPSEEK_API_KEY not set in environment');
    process.exitCode = 0;
    return;
  }

  console.log('\n  Reviewing staged changes...');

  const https = require('https');

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You are a senior code reviewer. Review the git diff for: logic errors, security issues, bugs, code quality, and adherence to the project requirements. Start with APPROVED or CHANGES_REQUIRED on the first line, then provide specific feedback with file paths and line numbers if issues found.' },
      { role: 'user', content: 'Review this diff:\n\n' + diff }
    ],
    max_tokens: 2000,
    temperature: 0.3
  });

  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.deepseek.com',
        path: '/chat/completions',
        method: 'POST',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('Failed to parse response: ' + e.message)); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
      req.write(body);
      req.end();
    });

    const review = data.choices?.[0]?.message?.content || 'No review generated';
    const trimmed = review.trim().toUpperCase();

    console.log('\n' + '\u2500'.repeat(50));
    console.log('  AI CODE REVIEW');
    console.log('\u2500'.repeat(50));
    console.log(review);
    console.log('\u2500'.repeat(50));

    if (trimmed.startsWith('CHANGES_REQUIRED')) {
      console.log('\n  \u2716 Commit BLOCKED: fix the issues above, then git add + git commit again\n');
      process.exitCode = 1;
      return;
    }

    if (trimmed.startsWith('APPROVED')) {
      console.log('\n  \u2713 Code review passed\n');
      process.exitCode = 0;
      return;
    }

    console.log('\n  \u26A0 Review unclear — committing with caution\n');
    process.exitCode = 0;
  } catch (err) {
    console.error('\n  Code review error:', err.message);
    console.log('  Proceeding with commit (review failed, not blocking)\n');
    process.exitCode = 0;
  }
})();
