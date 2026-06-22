const fs = require('fs');
const path = require('path');
const os = require('os');
const vlog = require('./VerboseLogger');
const { LLMOpenAIProvider } = require('./LLMOpenAIProvider');
const { LLMOpenCodeProvider } = require('./LLMOpenCodeProvider');
const { LLMGoogleProvider } = require('./LLMGoogleProvider');
const { LLMAnthropicProvider } = require('./LLMAnthropicProvider');
const { LLMOllamaProvider } = require('./LLMOllamaProvider');

const SPEND_LOG_PATH = path.join(process.cwd(), '00_state_ledger', 'token_spend_log.json');

// Maps provider names to their backend class and default config
const PROVIDER_REGISTRY = {
  'opencode-go': { cls: LLMOpenAIProvider, config: { baseURL: 'https://opencode.ai/zen/go/v1', authKey: 'opencode-go' } },
  'openrouter': { cls: LLMOpenAIProvider, config: { baseURL: 'https://openrouter.ai/api/v1', authKey: 'openrouter' } },
  'opencode': { cls: LLMOpenAIProvider, config: { baseURL: 'https://opencode.ai/zen/v1', authKey: 'opencode-go' } },
  'openai': { cls: LLMOpenAIProvider, config: { baseURL: 'https://api.openai.com/v1', authKey: 'openai' } },
  'google': { cls: LLMGoogleProvider, config: {} },
  'gemini': { cls: LLMGoogleProvider, config: {} },
  'anthropic': { cls: LLMAnthropicProvider, config: {} },
  'claude': { cls: LLMAnthropicProvider, config: {} },
  'ollama': { cls: LLMOllamaProvider, config: {} },
};

// Map provider aliases to canonical names
const PROVIDER_ALIASES = {
  'gemini': 'google',
  'claude': 'anthropic',
  'gpt': 'openai',
  'chatgpt': 'openai',
};

function readAuthKeys() {
  const candidates = [
    path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json'),
    path.join(process.env.LOCALAPPDATA || '', 'opencode', 'auth.json'),
    path.join(process.env.APPDATA || '', 'opencode', 'auth.json'),
  ];
  for (const fp of candidates) {
    try {
      if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch {}
  }
  return {};
}

/**
 * Embed tool definitions as text instructions in the system prompt so that
 * ANY LLM (regardless of native function-calling support) understands how to
 * call tools. The LLM responds with <function_call> tags which we parse from
 * the raw text content. This is the provider-agnostic approach.
 */
function embedToolsInPrompt(systemPrompt, tools) {
  if (!tools || tools.length === 0) return systemPrompt;
  const toolDefs = tools.map(t => {
    const fn = t.function || t;
    const params = fn.parameters?.properties
      ? '\n' + Object.entries(fn.parameters.properties).map(([k, v]) =>
          `    ${k} (${v.type}${fn.parameters.required?.includes(k) ? ', required' : ''}): ${v.description || ''}`
        ).join('\n')
      : '';
    return `  - ${fn.name}: ${fn.description || ''}${params}`;
  }).join('\n');
  return systemPrompt + `\n\n## Available Tools\nYou MUST use these tools to complete your task. Every response MUST begin with a tool call. Never just describe what you will do — execute it immediately.\n\n### Format — call tools like this (EXACT format required):\n<function_call>\nname: write_artifact\narguments: { "name": "output.md", "data": "# Content here...", "type": "markdown" }\n</function_call>\n\n### Tools:\n${toolDefs}\n\n### Rules:\n- Call write_artifact for EVERY output file. Do NOT output file contents as text — always use write_artifact.\n- Call read_dependency to read upstream artifacts before starting.\n- One tool call per <function_call> block. You can make multiple <function_call> blocks in one response.`;
}

/**
 * Parse embedded <function_call> tags from raw text content.
 * This is the universal fallback for providers without native function calling.
 */
function parseEmbeddedToolCalls(content) {
  const toolCalls = [];
  const fcRegex = /<function_call>\s*name:\s*(\S+)\s*arguments:\s*(\{[\s\S]*?\})\s*<\/function_call>/gi;
  let match;
  while ((match = fcRegex.exec(content)) !== null) {
    try {
      JSON.parse(match[2]);
      toolCalls.push({
        id: `fc_${toolCalls.length}`,
        type: 'function',
        function: { name: match[1], arguments: match[2] },
      });
    } catch {}
  }
  return toolCalls;
}

/**
 * Strip <function_call> markup from text content for clean output.
 */
function stripToolMarkup(content) {
  return content.replace(/<function_call>[\s\S]*?<\/function_call>/gi, '').trim();
}

class LLMProvider {
  constructor(options = {}) {
    const cfg = this._resolveConfig(options);
    this._backend = cfg.backend;
    this._providerName = cfg.provider;
    this._model = cfg.model;
    this._initialized = false;
    this._initResult = null;
  }

  _resolveConfig(options) {
    let rawProvider = (options.provider || process.env.LLM_PROVIDER || 'opencode-go').toLowerCase();
    let model = options.model || process.env.LLM_MODEL || 'deepseek-v4-flash';
    let apiKey = options.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '';
    let baseURL = options.baseURL || process.env.LLM_BASE_URL || '';

    // STATE_MATRIX llm_override fills in anything not set by options/env
    try {
      const statePath = path.join(process.cwd(), '00_state_ledger/STATE_MATRIX.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        const ov = state?.supervisor_control?.agent_00_supervisor?.llm_override;
        if (ov) {
          if (!options.provider && ov.provider) rawProvider = ov.provider;
          if (!options.model && ov.model) model = ov.model;
          if (!options.apiKey && ov.apiKey) apiKey = ov.apiKey;
          if (!options.baseURL && ov.baseURL) baseURL = ov.baseURL;
        }
      }
    } catch {}

    // Resolve alias (e.g. gemini -> google, claude -> anthropic)
    let provider = PROVIDER_ALIASES[rawProvider] || rawProvider;

    // Look up provider in registry
    const entry = PROVIDER_REGISTRY[provider];
    if (!entry) {
      vlog.write('LLM', 'CONFIG', `Unknown provider "${provider}", falling back to opencode CLI`);
      return { backend: new LLMOpenCodeProvider({ provider, model }), provider, model };
    }

    // Apply default baseURL and auth key from registry config
    if (entry.config) {
      if (!baseURL && entry.config.baseURL) baseURL = entry.config.baseURL;
      if (!apiKey && entry.config.authKey) {
        const auth = readAuthKeys();
        const authEntry = auth[entry.config.authKey];
        if (authEntry && authEntry.key) apiKey = authEntry.key;
      }
    }

    // For OpenAI-compatible providers: need both apiKey + baseURL
    if (entry.cls === LLMOpenAIProvider) {
      if (apiKey && baseURL) {
        // opencode-go/openprovider: use CLI mode (DeepSeek multi-turn tool calling unreliable via HTTP)
        if (provider === 'opencode-go' || provider === 'opencode') {
          vlog.write('LLM', 'CONFIG', `${provider}/${model} — using CLI mode (reliable multi-turn tool calling)`);
          return { backend: new LLMOpenCodeProvider({ provider, model }), provider, model };
        }
        vlog.write('LLM', 'CONFIG', `OpenAI-compatible: ${provider}/${model} via ${baseURL}`);
        return { backend: new LLMOpenAIProvider({ apiKey, model, baseURL, toolChoice: 'auto' }), provider, model };
      }
      vlog.write('LLM', 'CONFIG', `No API key for ${provider}, falling back to CLI mode`);
      return { backend: new LLMOpenCodeProvider({ provider, model }), provider, model };
    }

    // Ollama: no API key required
    if (entry.cls === LLMOllamaProvider) {
      vlog.write('LLM', 'CONFIG', `Native: ${provider}/${model}`);
      const opts = { model };
      if (baseURL) opts.baseURL = baseURL;
      return { backend: new entry.cls(opts), provider, model };
    }

    // Native providers (Google, Anthropic): need API key
    const providerApiKey = apiKey || process.env[`${provider.toUpperCase()}_API_KEY`] || '';
    if (providerApiKey) {
      vlog.write('LLM', 'CONFIG', `Native: ${provider}/${model}`);
      const opts = { model, apiKey: providerApiKey };
      if (baseURL) opts.baseURL = baseURL;
      return { backend: new entry.cls(opts), provider, model };
    }

    vlog.write('LLM', 'CONFIG', `No API key for ${provider}, falling back to CLI mode`);
    return { backend: new LLMOpenCodeProvider({ provider, model }), provider, model };
  }

  static fromEnv(options = {}) { return new LLMProvider(options); }

  async initialize() {
    if (this._initialized) return this._initResult;
    this._initResult = await this._backend.initialize();
    this._initialized = true;
    if (this._initResult.contextWindow) {
      vlog.write('LLM', 'SYSTEM', 'Context window: ' + this._initResult.contextWindow + ' tokens');
    }
    if (this._initResult.error) {
      vlog.write('LLM', 'SYSTEM', 'Init warning: ' + this._initResult.error);
    }
    return this._initResult;
  }

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    const agentId = options.agentId || 'SYSTEM';
    if (!this._initialized) await this.initialize();

    try {
      // Step 1: Embed tool definitions as text in the system prompt.
      // This works with ANY LLM — no native function-calling support needed.
      const augmentedPrompt = embedToolsInPrompt(systemPrompt, tools);

      // Step 2: Send to the backend. The backend may ALSO use native tools
      // parameter if it supports it (bonus), but the text embedding is the
      // universal fallback.
      let result;
      try {
        result = await this._backend.complete(augmentedPrompt, messages, tools, options);
      } catch (err) {
        // If native tool calling failed (e.g. API doesn't support it), retry without tools
        // Embedded <function_call> instructions in the prompt still work.
        if (tools && tools.length > 0) {
          vlog.write('LLM', agentId, `Native tool call failed, retrying without native tools: ${err.message.slice(0, 100)}`);
          result = await this._backend.complete(augmentedPrompt, messages, [], options);
        } else {
          throw err;
        }
      }

      if (result.usage) {
        this._logTokenUsage(result.usage.prompt_tokens, result.usage.completion_tokens, this._model);
      }

      // Step 3: Parse tool calls from the response.
      // Native tool_calls (OpenAI-compatible APIs) take priority.
      const nativeToolCalls = result.toolCalls || [];
      // Embedded <function_call> tags work with ANY provider.
      const embeddedToolCalls = parseEmbeddedToolCalls(result.content || '');
      const toolCalls = nativeToolCalls.length > 0 ? nativeToolCalls : embeddedToolCalls;

      // Strip <function_call> markup from content for clean text
      const cleanContent = stripToolMarkup(result.content || '');

      vlog.write('LLM', agentId, `Returned from ${this._providerName}/${this._model} | content=${cleanContent.length} chars | toolCalls=${toolCalls.length} (native=${nativeToolCalls.length} embedded=${embeddedToolCalls.length})`);

      return {
        content: cleanContent,
        toolCalls,
        usage: result.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: this._providerName + '/' + this._model,
        reasoningContent: result.reasoningContent || null,
      };
    } catch (err) {
      vlog.write('LLM', agentId, 'Provider failed, trying emergency: ' + err.message);
      if (this._backend.emergencyCall) {
        return this._backend.emergencyCall(systemPrompt, messages, options);
      }
      return { content: '', toolCalls: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, model: this._providerName + '/' + this._model, error: err.message };
    }
  }

  get provider() { return this._providerName; }
  get model() { return this._model; }
  set model(m) { this._model = m; if (this._backend.setModel) this._backend.setModel(m); }

  _logTokenUsage(promptTokens, completionTokens, model) {
    try {
      const month = new Date().toISOString().slice(0, 7);
      let log = {};
      try { log = JSON.parse(fs.readFileSync(SPEND_LOG_PATH, 'utf-8')); } catch {}
      const costPer1K = model?.includes('deepseek') ? 0.00014 : 0.0025;
      const cost = ((promptTokens || 0) + (completionTokens || 0)) / 1000 * costPer1K;
      log[month] = (log[month] || 0) + cost;
      fs.writeFileSync(SPEND_LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
      vlog.write('LLM', 'SYSTEM', 'Token cost: $' + cost.toFixed(6) + ' (' + ((promptTokens || 0) + (completionTokens || 0)) + ' tok @ ' + costPer1K + '/1K)');
    } catch {}
    this._updateStateMatrix(this._providerName, this._model);
  }

  _updateStateMatrix(provider, model) {
    try {
      const matrixPath = path.join(process.cwd(), '00_state_ledger/STATE_MATRIX.json');
      if (fs.existsSync(matrixPath)) {
        const data = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
        Object.keys(data.agent_states || {}).forEach(aid => {
          if (data.agent_states[aid].status === 'in_progress') {
            data.agent_states[aid].active_llm = provider + '/' + model;
          }
        });
        fs.writeFileSync(matrixPath, JSON.stringify(data, null, 2));
      }
    } catch (e) { vlog.write('LLM', 'SYSTEM', 'Failed to update state matrix: ' + e.message); }
  }
}

module.exports = { LLMProvider };
