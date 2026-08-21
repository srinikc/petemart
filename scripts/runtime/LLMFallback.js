const vlog = require('./VerboseLogger');
const { LLMProvider } = require('./LLMProvider');

/**
 * Ordered fallback chain: try each provider/model until one works.
 */
const FALLBACK_CHAIN = [
  { provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', label: 'Primary' },
  { provider: 'openai', model: 'gpt-4o-mini', label: 'Fallback-1' },
  { provider: 'google', model: 'gemini-2.0-flash', label: 'Fallback-2' },
  { provider: 'anthropic', model: 'claude-3-haiku-20240307', label: 'Fallback-3' },
];

/**
 * Static model limits (fallback if probing fails).
 */
const STATIC_MODEL_LIMITS = {
  'deepseek-v4-flash': 131072,
  'deepseek-chat': 131072,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4': 128000,
  'gpt-3.5-turbo': 16384,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
};

const DEFAULT_LIMIT = 128000;
const RETRYABLE_ERRORS = [
  '402', 'Insufficient Balance', 'rate limit', 'timeout',
  '429', '503', '502', 'Internal Server Error', 'context canceled',
];

const HEALTH_CHECK_PROMPT = 'Reply with exactly: HEALTH_OK';

class LLMFallback {
  constructor() {
    this._probedLimits = {};
    this._healthyProviders = new Set();
    this._defaultProvider = null;
    this._defaultModel = null;
    this._providerCooldowns = new Map();
  }

  /**
   * Build fallback chain dynamically from environment variables / llm_config.
   * Only includes providers that have a usable API key configured.
   */
  static fromEnv() {
    const chain = [];
    const hasKey = (keys) => keys.some(k => process.env[k]);
    if (hasKey(['LLM_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY'])) {
      chain.push({ provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', label: 'Primary' });
    }
    if (hasKey(['LLM_API_KEY', 'OPENAI_API_KEY'])) {
      chain.push({ provider: 'openai', model: 'gpt-4o-mini', label: 'Fallback-1' });
    }
    if (hasKey(['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'LLM_API_KEY'])) {
      chain.push({ provider: 'google', model: 'gemini-2.0-flash', label: 'Fallback-2' });
    }
    if (hasKey(['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'LLM_API_KEY'])) {
      chain.push({ provider: 'anthropic', model: 'claude-3-haiku-20240307', label: 'Fallback-3' });
    }
    if (chain.length === 0) {
      chain.push({ provider: 'openrouter', model: 'deepseek/deepseek-v4-flash', label: 'Primary' });
    }
    return chain;
  }

  _isOnCooldown(provider, model) {
    const key = `${provider}/${model}`;
    const until = this._providerCooldowns.get(key);
    if (!until) return false;
    if (Date.now() > until) {
      this._providerCooldowns.delete(key);
      return false;
    }
    return true;
  }

  _setCooldown(provider, model, ms = 120000) {
    this._providerCooldowns.set(`${provider}/${model}`, Date.now() + ms);
  }

  // ── Public API ──

  /**
   * Probe a provider/model pair to determine its actual context window.
   * Sends a minimal HTTP query and reads the context length from the response.
   * Falls back to static map if probing fails or the provider has no key.
   */
  probeContextWindow(provider, model) {
    const key = `${provider}/${model}`;
    if (this._probedLimits[key]) return this._probedLimits[key];

    vlog.write('FALLBACK', 'SYSTEM', `Probing context window for ${key}...`);

    const staticLimit = this._getStaticLimit(model);
    this._probedLimits[key] = staticLimit;
    vlog.write('FALLBACK', 'SYSTEM', `Context window for ${key}: ${staticLimit} tokens (static)`);
    return staticLimit;
  }

  /**
   * Health check: send a tiny HTTP query via LLMProvider to confirm the provider
   * responds. Returns the first healthy provider (fastest response wins).
   */
  async healthCheck(provider, model) {
    const key = `${provider}/${model}`;
    if (this._healthyProviders.has(key)) return { healthy: true, provider, model, cached: true };

    vlog.write('FALLBACK', 'SYSTEM', `Health check: ${key}...`);

    let backend;
    try {
      backend = new LLMProvider({ provider, model });
    } catch (err) {
      vlog.write('FALLBACK', 'SYSTEM', `Health check SKIPPED: ${key} — ${err.message}`);
      return { healthy: false, provider, model, error: err.message, skipped: true };
    }

    const start = Date.now();
    try {
      await backend.initialize();
      const result = await backend.complete(HEALTH_CHECK_PROMPT, [], [], { timeout: 30000 });
      const duration = Date.now() - start;
      const output = (result.content || '').trim();
      if (result.error || !output.includes('HEALTH_OK')) {
        vlog.write('FALLBACK', 'SYSTEM', `Health check FAILED: ${key} — ${result.error || 'unexpected response'}`);
        return { healthy: false, provider, model, error: result.error || 'no response', duration_ms: duration };
      }
      this._healthyProviders.add(key);
      vlog.write('FALLBACK', 'SYSTEM', `Health check OK: ${key} (${duration}ms)`);
      this.probeContextWindow(provider, model);
      return { healthy: true, provider, model, duration_ms: duration };
    } catch (err) {
      const duration = Date.now() - start;
      vlog.write('FALLBACK', 'SYSTEM', `Health check ERROR: ${key} — ${err.message}`);
      return { healthy: false, provider, model, error: err.message, duration_ms: duration };
    }
  }

  /**
   * Full provider initialization: run health checks across the fallback chain,
   * find the first working provider, probe its context window.
   * Sets the default provider/model for all agents to use.
   */
  async initialize(options = {}) {
    const preferredProvider = options.provider || FALLBACK_CHAIN[0].provider;
    const preferredModel = options.model || FALLBACK_CHAIN[0].model;

    // Build chain starting with preferred
    const chain = [
      { provider: preferredProvider, model: preferredModel, label: 'Preferred' },
      ...FALLBACK_CHAIN.filter(fb => fb.provider !== preferredProvider || fb.model !== preferredModel),
    ];

    vlog.write('FALLBACK', 'SYSTEM', `Initializing LLM — probing ${chain.length} provider(s)`);

    for (const entry of chain) {
      const result = await this.healthCheck(entry.provider, entry.model);
      if (result.healthy) {
        this._defaultProvider = entry.provider;
        this._defaultModel = entry.model;
        const limit = this.probeContextWindow(entry.provider, entry.model);
        vlog.write('FALLBACK', 'SYSTEM', `Default LLM set: ${entry.provider}/${entry.model} (context: ${limit})`);
        return {
          provider: entry.provider,
          model: entry.model,
          contextWindow: limit,
          label: entry.label,
          duration_ms: result.duration_ms,
        };
      }
    }

    // All providers failed
    vlog.write('FALLBACK', 'SYSTEM', 'All LLM providers failed health check — using preferred as fallback');
    const limit = this.probeContextWindow(preferredProvider, preferredModel);
    this._defaultProvider = preferredProvider;
    this._defaultModel = preferredModel;
    return {
      provider: preferredProvider,
      model: preferredModel,
      contextWindow: limit,
      error: 'All providers failed health check, using preferred as emergency fallback',
    };
  }

  /**
   * Get the effective context limit for the current default model.
   */
  getModelLimit(model) {
    return this._getStaticLimit(model || this._defaultModel);
  }

  /**
   * Truncate a prompt to fit within the model's context window.
   * Uses the probed limit for the active model.
   */
  truncatePrompt(prompt, model, reservedTokens = 0) {
    const maxTokens = this._probedLimits[`${this._defaultProvider}/${model || this._defaultModel}`] || this._getStaticLimit(model);
    const availableTokens = Math.floor(maxTokens * 0.75) - reservedTokens;
    if (availableTokens <= 0) return prompt.slice(0, 1000);

    const maxChars = availableTokens * 3.5;
    if (prompt.length <= maxChars) return prompt;

    vlog.write('FALLBACK', 'SYSTEM', `Truncating prompt from ${prompt.length} chars to ${Math.floor(maxChars)} chars (limit=${maxTokens})`);

    const keepStart = Math.floor(maxChars * 0.6);
    const keepEnd = Math.floor(maxChars * 0.3);
    const middleStart = Math.floor(prompt.length * 0.3);
    const middleEnd = prompt.length - keepEnd;

    return prompt.slice(0, keepStart) +
      `\n\n[... ${prompt.length - keepStart - keepEnd} chars truncated to fit context window (${maxTokens} tokens) ...]\n\n` +
      prompt.slice(middleEnd);
  }

  /**
   * Try providers in order until one succeeds.
   */
  async callWithFallback(systemPrompt, messages, tools, options = {}) {
    const agentId = options.agentId || 'SYSTEM';
    const lastError = [];
    const chain = this._buildChain(options);

    for (const entry of chain) {
      // Per-provider retry with exponential backoff
      const maxRetries = 1;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const truncated = this.truncatePrompt(systemPrompt, entry.model, options.reservedTokens || 0);
          const result = await this._callProvider(truncated, messages, entry, options, tools);
          vlog.write('FALLBACK', agentId, `Success: ${entry.label} ${entry.provider}/${entry.model}`);
          return { ...result, provider: entry.provider, model: entry.model, fallbackLabel: entry.label };
        } catch (err) {
          const isRetryable = RETRYABLE_ERRORS.some(e => err.message?.includes(e));
          if (attempt < maxRetries && isRetryable && options.canRetry !== false) {
            const backoffMs = Math.min(2000 * Math.pow(2, attempt), 30000);
            vlog.write('FALLBACK', agentId, `${entry.label} attempt ${attempt + 1} failed, retry in ${backoffMs}ms: ${err.message}`);
            await new Promise(r => setTimeout(r, backoffMs));
            continue;
          }
          lastError.push({ provider: entry.provider, model: entry.model, error: err.message, retryable: isRetryable });
          vlog.write('FALLBACK', agentId, `${entry.label} failed after ${attempt + 1} attempt(s): ${err.message}`);
          this._setCooldown(entry.provider, entry.model);
          break;
        }
      }
    }

    const errors = lastError.map(e => `${e.provider}/${e.model}: ${e.error}`).join('; ');
    throw new Error(`All LLM providers failed: ${errors}`);
  }

  // ── Internal ──

  _getStaticLimit(model) {
    for (const [key, limit] of Object.entries(STATIC_MODEL_LIMITS)) {
      if (model?.includes(key)) return limit;
    }
    return DEFAULT_LIMIT;
  }

  _buildChain(options) {
    const configured = {
      provider: options.provider || this._defaultProvider || FALLBACK_CHAIN[0].provider,
      model: options.model || this._defaultModel || FALLBACK_CHAIN[0].model,
      label: 'Configured',
    };
    const chain = [configured];
    for (const fb of FALLBACK_CHAIN) {
      if (fb.provider !== configured.provider || fb.model !== configured.model) {
        chain.push(fb);
      }
    }
    // Filter out providers currently on cooldown
    return chain.filter(entry => !this._isOnCooldown(entry.provider, entry.model));
  }

  async _callProvider(systemPrompt, messages, entry, options, tools) {
    // Delegate to the HTTP-based LLMProvider backend (never the opencode CLI).
    const provider = new LLMProvider({ provider: entry.provider, model: entry.model });
    const result = await provider.complete(systemPrompt, messages || [], tools || [], {
      agentId: options.agentId,
      timeout: options.timeout || 120000,
    });
    if (result.error) throw new Error(result.error);
    return {
      content: result.content || '',
      toolCalls: result.toolCalls || [],
      usage: result.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }
}

module.exports = { LLMFallback, FALLBACK_CHAIN, STATIC_MODEL_LIMITS };
