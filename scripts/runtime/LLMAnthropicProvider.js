const https = require('https');
const http = require('http');
const vlog = require('./VerboseLogger');

class LLMAnthropicProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = options.model || process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022';
    this.baseURL = (options.baseURL || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    this.maxTokens = options.maxTokens || 8192;
    this.apiVersion = '2023-06-01';
    this._initialized = false;
  }

  static getName() { return 'anthropic'; }

  setModel(model) { this.model = model; }

  async initialize() {
    this._initialized = true;
    return { provider: 'anthropic', model: this.model, contextWindow: 200000 };
  }

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    // systemPrompt already has tool definitions embedded by LLMProvider.js
    const timeout = options.timeout || 120000;

    const claudeMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));
    if (claudeMessages.length === 0) {
      claudeMessages.push({ role: 'user', content: 'Proceed with the task.' });
    }

    const body = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: claudeMessages,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => {
        const fn = t.function || t;
        return {
          name: fn.name,
          description: fn.description || '',
          input_schema: fn.parameters || { type: 'object', properties: {} },
        };
      });
    }

    const urlStr = `${this.baseURL}/messages`;

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const mod = isHttps ? https : http;

      const req = mod.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'Content-Length': Buffer.byteLength(data),
        },
        timeout,
      }, (res) => {
        let raw = '';
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            if (!json.content || json.content.length === 0) {
              resolve({ content: '', toolCalls: [], usage: {} });
              return;
            }

            let content = '';
            const toolCalls = [];
            for (const block of json.content) {
              if (block.type === 'text') content += block.text;
              if (block.type === 'tool_use') {
                toolCalls.push({
                  id: block.id || `ac_${toolCalls.length}`,
                  type: 'function',
                  function: {
                    name: block.name,
                    arguments: JSON.stringify(block.input || {}),
                  },
                });
              }
            }

            resolve({
              content,
              toolCalls,
              usage: json.usage || { input_tokens: 0, output_tokens: 0 },
            });
          } catch (e) {
            reject(new Error('Anthropic parse error: ' + e.message + ' | raw: ' + raw.slice(0, 200)));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Anthropic request timed out after ' + timeout + 'ms')); });
      req.write(data);
      req.end();
    });
  }
}

module.exports = { LLMAnthropicProvider };
