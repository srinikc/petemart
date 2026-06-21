const { spawn } = require('child_process');
const vlog = require('./VerboseLogger');

class LLMOpenCodeProvider {
  constructor(options = {}) {
    this.provider = options.provider || process.env.LLM_PROVIDER || 'opencode-go';
    this.model = options.model || process.env.LLM_MODEL || 'deepseek-v4-flash';
    this._initialized = false;
  }

  static getName() { return 'opencode-go'; }

  setModel(model) { this.model = model; }

  async initialize() {
    this._initialized = true;
    return { provider: this.provider, model: this.model, contextWindow: 131072 };
  }

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    // systemPrompt already has tool definitions embedded by LLMProvider.js.
    // LLMProvider.js also handles <function_call> parsing centrally.
    // This backend just sends text to the opencode CLI and returns raw output.
    const fullPrompt = systemPrompt + '\n\n' + (messages || []).map(m => {
      const role = m.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`;
    }).join('\n');

    const args = ['run', fullPrompt, '--model', `${this.provider}/${this.model}`];
    const isWin = process.platform === 'win32';

    return new Promise((resolve, reject) => {
      const opts = {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
        shell: isWin,
        timeout: options.timeout || 300000,
      };

      const proc = spawn('opencode', args, opts);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => { stdout += chunk; });
      proc.stderr.on('data', (chunk) => { stderr += chunk; });
      proc.on('error', (err) => reject(err));

      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error('opencode timed out after ' + opts.timeout + 'ms'));
      }, opts.timeout);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0 && stderr) reject(new Error(stderr.trim().slice(0, 500)));
        resolve({
          content: stdout?.trim() || '',
          toolCalls: [],
          usage: { prompt_tokens: Math.ceil(fullPrompt.length / 3.5), completion_tokens: 0, total_tokens: Math.ceil(fullPrompt.length / 3.5) },
        });
      });
    });
  }

  async emergencyCall(systemPrompt, messages, options) {
    const { spawnSync } = require('child_process');
    const maxChars = 8000;
    let truncated = systemPrompt;
    if (truncated.length > maxChars) {
      const keepStart = Math.floor(maxChars * 0.6);
      const keepEnd = Math.floor(maxChars * 0.2);
      truncated = truncated.slice(0, keepStart) + '\n[... truncated to ' + maxChars + ' chars ...]\n' + truncated.slice(truncated.length - keepEnd);
    }

    const args = ['run', truncated, '--model', `${this.provider}/${this.model}`];
    try {
      const result = spawnSync('opencode', args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, windowsHide: true, shell: true, timeout: options.timeout || 300000 });
      return { content: result.stdout?.trim() || '', toolCalls: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
    } catch (err) {
      return { content: '', toolCalls: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
    }
  }
}

module.exports = { LLMOpenCodeProvider };
