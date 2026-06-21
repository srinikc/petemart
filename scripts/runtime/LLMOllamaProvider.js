const http = require('http');
const https = require('https');
const vlog = require('./VerboseLogger');

class LLMOllamaProvider {
  constructor(options = {}) {
    this.model = options.model || process.env.LLM_MODEL || 'llama3';
    this.baseURL = (options.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    this._initialized = false;
  }

  static getName() { return 'ollama'; }

  setModel(model) { this.model = model; }

  async initialize() {
    this._initialized = true;
    return { provider: 'ollama', model: this.model, contextWindow: 8192 };
  }

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    // systemPrompt already has tool definitions embedded by LLMProvider.js
    const timeout = options.timeout || 120000;

    const ollamaMessages = [];
    if (systemPrompt) {
      ollamaMessages.push({ role: 'system', content: systemPrompt });
    }
    for (const m of messages) {
      ollamaMessages.push({ role: m.role || 'user', content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) });
    }
    if (ollamaMessages.length === 0) {
      ollamaMessages.push({ role: 'user', content: 'Proceed with the task.' });
    }

    const body = {
      model: this.model,
      messages: ollamaMessages,
      stream: false,
    };

    // Some Ollama models support native function calling via tools param
    if (tools && tools.length > 0) {
      body.tools = tools.map(t => {
        const fn = t.function || t;
        return {
          type: 'function',
          function: {
            name: fn.name,
            description: fn.description || '',
            parameters: fn.parameters || { type: 'object', properties: {} },
          },
        };
      });
    }

    const urlStr = `${this.baseURL}/api/chat`;

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const mod = isHttps ? https : http;

      const req = mod.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout,
      }, (res) => {
        let raw = '';
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            const content = json.message?.content || json.response || '';

            resolve({
              content,
              toolCalls: [],
              usage: { prompt_tokens: json.prompt_eval_count || 0, completion_tokens: json.eval_count || 0, total_tokens: (json.prompt_eval_count || 0) + (json.eval_count || 0) },
            });
          } catch (e) {
            reject(new Error('Ollama parse error: ' + e.message + ' | raw: ' + raw.slice(0, 200)));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Ollama request timed out after ' + timeout + 'ms')); });
      req.write(data);
      req.end();
    });
  }
}

module.exports = { LLMOllamaProvider };
