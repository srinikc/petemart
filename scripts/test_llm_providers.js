/**
 * Validate LLM providers via direct HTTP.
 * Tests the OpenAI-compatible providers supported by the runtime:
 * OpenRouter, OpenAI.
 * (Google, Anthropic, Ollama use native providers in the runtime —
 * see scripts/runtime/LLMProvider.js.)
 *
 * Usage:
 *   set OPENROUTER_API_KEY=your_key_here
 *   set OPENAI_API_KEY=your_key_here
 *   node scripts/test_llm_providers.js
 *
 * If no keys set, script prompts for them.
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

const PROVIDERS = [
  {
    name: 'OpenRouter (deepseek/deepseek-v4-flash)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-v4-flash',
    keyEnv: 'OPENROUTER_API_KEY',
    keyPrompt: 'OpenRouter API key (from openrouter.ai/settings/keys)',
  },
  {
    name: 'OpenAI (gpt-4o-mini)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    keyEnv: 'OPENAI_API_KEY',
    keyPrompt: 'OpenAI API key (from platform.openai.com/api-keys)',
  },
];

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, answer => { rl.close(); resolve(answer.trim()); }));
}

function httpRequest(url, postData, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 60000,
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data.slice(0, 2000) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data.slice(0, 2000) });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(postData);
    req.end();
  });
}

async function testProvider(provider, apiKey) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Testing: ${provider.name}`);
  console.log(`  Endpoint: ${provider.endpoint}`);
  console.log(`  Model: ${provider.model}`);
  console.log(`${'='.repeat(60)}`);

  // Test 1: Simple text completion
  console.log('\n  [Test 1] Simple text prompt...');
  const body1 = JSON.stringify({
    model: provider.model,
    messages: [{ role: 'user', content: 'Reply with exactly: HELLO_OK' }],
    max_tokens: 50,
    temperature: 0,
  });

  let start = Date.now();
  let result;
  try {
    result = await httpRequest(provider.endpoint, body1, {
      'Authorization': `Bearer ${apiKey}`,
    });
  } catch (err) {
    console.log(`  ❌ NETWORK ERROR: ${err.message}`);
    return false;
  }
  const elapsed = Date.now() - start;

  if (result.status === 200 && result.body) {
    const content = result.body.choices?.[0]?.message?.content || '';
    const ok = content.includes('HELLO_OK');
    console.log(`  ${ok ? '✅' : '⚠️'} Status ${result.status} | ${elapsed}ms`);
    console.log(`     Response: "${content.slice(0, 100)}"`);
    if (result.body.usage) {
      console.log(`     Tokens: ${result.body.usage.total_tokens || '?'} (${result.body.usage.prompt_tokens || '?'} in / ${result.body.usage.completion_tokens || '?'} out)`);
    }
    if (!ok) console.log(`     (expected "HELLO_OK" but got different content)`);
  } else {
    console.log(`  ❌ Status ${result.status} | ${elapsed}ms`);
    console.log(`     Error: ${result.body?.error?.message || result.body?.error || result.raw.slice(0, 200)}`);
    return false;
  }

  // Test 2: Tool/function calling
  console.log('\n  [Test 2] Tool/function call test...');
  const body2 = JSON.stringify({
    model: provider.model,
    messages: [{ role: 'user', content: 'What is 2+2? Reply with the tool.' }],
    tools: [{
      type: 'function',
      function: {
        name: 'report_answer',
        description: 'Report the answer to a question',
        parameters: {
          type: 'object',
          properties: {
            answer: { type: 'string', description: 'The answer' },
          },
          required: ['answer'],
        },
      },
    }],
    tool_choice: 'auto',
    max_tokens: 100,
    temperature: 0,
  });

  start = Date.now();
  try {
    result = await httpRequest(provider.endpoint, body2, {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/srinikc/petemart',
      'X-Title': 'Petemart LLM Validation',
    });
  } catch (err) {
    console.log(`  ❌ NETWORK ERROR: ${err.message}`);
    return false;
  }
  const elapsed2 = Date.now() - start;

  if (result.status === 200 && result.body) {
    const msg = result.body.choices?.[0]?.message;
    const toolCalls = msg?.tool_calls || [];
    const hasToolCall = toolCalls.length > 0;
    console.log(`  ${hasToolCall ? '✅' : '⚠️'} Status ${result.status} | ${elapsed2}ms`);
    console.log(`     Tool calls: ${toolCalls.length}`);
    if (hasToolCall) {
      for (const tc of toolCalls) {
        console.log(`     - ${tc.function.name}(${tc.function.arguments})`);
      }
    } else {
      console.log(`     Content: "${(msg?.content || '').slice(0, 100)}"`);
    }
    if (result.body.usage) {
      console.log(`     Tokens: ${result.body.usage.total_tokens || '?'}`);
    }
  } else {
    console.log(`  ❌ Status ${result.status}`);
    console.log(`     Error: ${result.body?.error?.message || result.body?.error || result.raw.slice(0, 200)}`);
    return false;
  }

  console.log(`\n  ✅ ${provider.name}: PASS`);
  return true;
}

async function main() {
  console.log('LLM Provider Validation Script');
  console.log('==============================\n');

  const keys = {};
  for (const provider of PROVIDERS) {
    let key = process.env[provider.keyEnv];
    if (!key) {
      key = await askQuestion(`Enter ${provider.keyPrompt}: `);
    }
    keys[provider.keyEnv] = key;
  }

  console.log('\nStarting provider tests...');

  const results = [];
  for (const provider of PROVIDERS) {
    const key = keys[provider.keyEnv];
    if (!key) {
      console.log(`\n  ⏭️  Skipping ${provider.name} — no ${provider.keyEnv} set`);
      results.push({ name: provider.name, passed: false, skipped: true });
      continue;
    }
    const passed = await testProvider(provider, key);
    results.push({ name: provider.name, passed });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  SUMMARY');
  console.log(`${'='.repeat(60)}`);
  for (const r of results) {
    if (r.skipped) {
      console.log(`  ⏭️  ${r.name}: SKIPPED`);
    } else {
      console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}: ${r.passed ? 'PASS' : 'FAIL'}`);
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed && !r.skipped).length;
  console.log(`\n  ${passed} passed, ${failed} failed, ${results.length - passed - failed} skipped`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});