const fs = require('fs');
const path = require('path');
const vlog = require('./VerboseLogger');
const { LLMFallback, FALLBACK_CHAIN, MODEL_LIMITS } = require('./LLMFallback');

const SPEND_LOG_PATH = path.join(process.cwd(), '00_state_ledger', 'token_spend_log.json');

class LLMProvider {
  constructor(options = {}) {
    this.provider = options.provider || 'opencode-go';
    this.model = options.model || 'deepseek-v4-flash';
    this.fallback = new LLMFallback();
    this._client = null;
    this._initialized = false;
  }

  static fromEnv() {
    return new LLMProvider({
      provider: process.env.LLM_PROVIDER || 'opencode-go',
      model: process.env.LLM_MODEL || 'deepseek-v4-flash',
    });
  }

  /**
   * Initialize LLM: run health check + probe context window.
   * Call before any agent work to confirm provider is alive.
   * Returns { provider, model, contextWindow, error? }
   */
  async initialize() {
    if (this._initialized) return this._initResult;
    vlog.write('LLM', 'SYSTEM', `Initializing LLM: ${this.provider}/${this.model}`);
    this._initResult = await this.fallback.initialize({
      provider: this.provider,
      model: this.model,
    });
    this._initialized = true;
    this.provider = this._initResult.provider;
    this.model = this._initResult.model;
    if (this._initResult.contextWindow) {
      vlog.write('LLM', 'SYSTEM', `Context window: ${this._initResult.contextWindow} tokens`);
    }
    if (this._initResult.error) {
      vlog.write('LLM', 'SYSTEM', `Init warning: ${this._initResult.error}`);
    }
    return this._initResult;
  }

  // ── Public API ──

  async complete(systemPrompt, messages = [], tools = [], options = {}) {
    const agentId = options.agentId || 'SYSTEM';

    // Auto-initialize on first call if not done
    if (!this._initialized) await this.initialize();

    try {
      // Use fallback chain with context width management
      const result = await this.fallback.callWithFallback(systemPrompt, messages, tools, {
        ...options,
        provider: this.provider,
        model: this.model,
        agentId,
      });

      // Log token usage
      if (result.usage) {
        this._logTokenUsage(result.usage.prompt_tokens, result.usage.completion_tokens, result.model);
      }

      vlog.write('LLM', agentId, `Returned from ${result.fallbackLabel}: ${result.provider}/${result.model} | content=${(result.content || '').length} chars | toolCalls=${(result.toolCalls || []).length}`);

      return {
        content: result.content,
        toolCalls: result.toolCalls || [],
        usage: result.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: `${result.provider}/${result.model}`,
      };
    } catch (err) {
      // Last resort: try with maximum truncation
      vlog.write('LLM', agentId, `Fallback chain exhausted, trying emergency truncation: ${err.message}`);
      return this._emergencyCall(systemPrompt, messages, options);
    }
  }

  // ── Emergency fallback (maximum truncation, last resort) ──

  async _emergencyCall(systemPrompt, messages, options) {
    const { spawnSync } = require('child_process');

    // Aggressively truncate: keep first 30% and last 20%
    const maxChars = 8000;
    let truncated = systemPrompt;
    if (truncated.length > maxChars) {
      const keepStart = Math.floor(maxChars * 0.6);
      const keepEnd = Math.floor(maxChars * 0.2);
      truncated = truncated.slice(0, keepStart) +
        `\n[... truncated to ${maxChars} chars ...]\n` +
        truncated.slice(truncated.length - keepEnd);
    }

    const args = ['run', truncated, '--model', `${this.provider}/${this.model}`];

    try {
      const result = spawnSync('opencode', args, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
        timeout: options.timeout || 120000,
      });

      const content = result.stdout?.trim() || '';
      return {
        content,
        toolCalls: [],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: `${this.provider}/${this.model}`,
      };
    } catch (err) {
      vlog.write('LLM', 'SYSTEM', `Emergency call also failed: ${err.message}`);
      return {
        content: '',
        toolCalls: [],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: `${this.provider}/${this.model}`,
      };
    }
  }

  // ── Token Cost Logging ──

  _logTokenUsage(promptTokens, completionTokens, model) {
    try {
      const month = new Date().toISOString().slice(0, 7);
      let log = {};
      try { log = JSON.parse(fs.readFileSync(SPEND_LOG_PATH, 'utf-8')); } catch {}
      // Cost per 1K tokens varies by model tier
      const costPer1K = model?.includes('deepseek') ? 0.00014 : 0.0025;
      const cost = ((promptTokens || 0) + (completionTokens || 0)) / 1000 * costPer1K;
      log[month] = (log[month] || 0) + cost;
      fs.writeFileSync(SPEND_LOG_PATH, JSON.stringify(log, null, 2), 'utf-8');
      vlog.write('LLM', 'SYSTEM', `Token cost: $${cost.toFixed(6)} (${(promptTokens || 0) + (completionTokens || 0)} tok @ ${costPer1K}/1K)`);
    } catch {}
  }
}

module.exports = { LLMProvider };
