const https = require('https');
const http = require('http');
const vlog = require('./VerboseLogger');

class LLMOpenAIProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
    this.model = options.model || process.env.LLM_MODEL || 'gpt-4o';
    this.baseURL = (options.baseURL || process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.maxTokens = options.maxTokens || 8192;
    this.toolChoice = options.toolChoice || 'auto';   // 'auto' works with all providers; 'required' may fail on DeepSeek
    this._initialized = false;
  }

  static getName() { return 'openai'; }

  setModel(model) { this.model = model; }

  async initialize() {
    this._initialized = true;
    return { provider: 'openai', model: this.model, contextWindow: 128000 };
  }

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    const agentId = options.agentId || 'SYSTEM';
    const timeout = options.timeout || 120000;

    // systemPrompt already has tool definitions embedded by LLMProvider.js.
    // We send the native tools param as a bonus for APIs that support it.
    const body = {
      model: this.model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: this.maxTokens,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.function?.name || t.name,
          description: t.function?.description || t.description || '',
          parameters: t.function?.parameters || t.parameters || { type: 'object', properties: {} },
        },
      }));
      body.tool_choice = this.toolChoice;
    }

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const base = this.baseURL.replace(/\/+$/, '');
      const urlStr = base.endsWith('/chat/completions') ? base : base + '/chat/completions';
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const mod = isHttps ? https : http;

      const req = mod.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.apiKey,
          'Content-Length': Buffer.byteLength(data),
        },
        timeout,
      }, (res) => {
        let raw = '';
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            if (!json.choices || json.choices.length === 0) {
              resolve({ content: '', toolCalls: [], usage: {} });
              return;
            }
            const choice = json.choices[0];
            const msg = choice.message || {};
            resolve({
              content: msg.content || '',
              toolCalls: (msg.tool_calls || []).map(tc => ({
                id: tc.id,
                type: tc.type,
                function: {
                  name: tc.function?.name || '',
                  arguments: tc.function?.arguments || '{}',
                },
              })),
              usage: json.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            });
          } catch (e) {
            reject(new Error('Failed to parse OpenAI response: ' + e.message + ' | raw: ' + raw.slice(0, 200)));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('OpenAI request timed out after ' + timeout + 'ms')); });
      req.write(data);
      req.end();
    });
  }
}

module.exports = { LLMOpenAIProvider };
