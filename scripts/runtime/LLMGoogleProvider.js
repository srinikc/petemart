const https = require('https');
const http = require('http');
const vlog = require('./VerboseLogger');

class LLMGoogleProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.GOOGLE_API_KEY || '';
    this.model = options.model || process.env.LLM_MODEL || 'gemini-2.0-flash';
    this.baseURL = (options.baseURL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
    this.maxTokens = options.maxTokens || 8192;
    this._initialized = false;
  }

  static getName() { return 'google'; }

  setModel(model) { this.model = model; }

  async initialize() {
    this._initialized = true;
    return { provider: 'google', model: this.model, contextWindow: 1048576 };
  }

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    // systemPrompt already has tool definitions embedded by LLMProvider.js
    const timeout = options.timeout || 120000;

    const contents = [];
    if (messages.length > 0) {
      for (const m of messages) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        contents.push({ role, parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] });
      }
    }
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Proceed with the task.' }] });
    }

    const body = {
      contents,
      generationConfig: { maxOutputTokens: this.maxTokens },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    if (tools && tools.length > 0) {
      body.tools = [{
        functionDeclarations: tools.map(t => {
          const fn = t.function || t;
          return {
            name: fn.name,
            description: fn.description || '',
            parameters: fn.parameters || { type: 'object', properties: {} },
          };
        }),
      }];
    }

    const urlStr = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const url = new URL(urlStr);

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
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
            if (!json.candidates || json.candidates.length === 0) {
              resolve({ content: '', toolCalls: [], usage: {} });
              return;
            }
            const candidate = json.candidates[0];
            const parts = candidate.content?.parts || [];

            let content = '';
            const toolCalls = [];
            for (const part of parts) {
              if (part.text) content += part.text;
              if (part.functionCall) {
                toolCalls.push({
                  id: `gc_${toolCalls.length}`,
                  type: 'function',
                  function: {
                    name: part.functionCall.name,
                    arguments: JSON.stringify(part.functionCall.args || {}),
                  },
                });
              }
            }

            resolve({
              content,
              toolCalls,
              usage: json.usageMetadata || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            });
          } catch (e) {
            reject(new Error('Gemini parse error: ' + e.message + ' | raw: ' + raw.slice(0, 200)));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => { req.destroy(); reject(new Error('Gemini request timed out after ' + timeout + 'ms')); });
      req.write(data);
      req.end();
    });
  }
}

module.exports = { LLMGoogleProvider };
