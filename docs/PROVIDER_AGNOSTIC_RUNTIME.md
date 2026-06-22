# Provider-Agnostic Agent Runtime

## Problem

Every LLM provider handles tool calling differently. DeepSeek requires `reasoning_content` preservation, doesn't support `tool_choice: required`, and drops out after multi-turn native calls. OpenAI and Anthropic handle native tool calling reliably but have different API formats. Ollama has its own limitations. The runtime currently hardcodes behaviors per provider, making it fragile when providers change.

## Goal

A runtime that works with ANY LLM provider without code changes. The runtime detects provider capabilities at startup and adapts its tool-calling strategy accordingly.

## Provider Capability Matrix

| Capability | OpenAI | Anthropic | DeepSeek (native) | DeepSeek (OpenRouter) | Ollama |
|---|---|---|---|---|---|
| Native tools | ✅ | ✅ | ✅ | ✅ | ⚠️ varies |
| `tool_choice: required` | ✅ `required` | ✅ `any`/`tool` | ❌ | ❌ | ❌ |
| `tool_choice: none` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Requires `reasoning_content` | ❌ | ❌ | ✅ | ❌ | ❌ |
| Multi-turn reliability | ✅ | ✅ | ⚠️ medium | ✅ good | ⚠️ low |
| Text with `<function_call>` tags | ✅ | ✅ | ✅ | ✅ | ✅ |
| Header-based artifact extraction | ✅ | ✅ | ✅ | ✅ | ✅ |

## Architecture

### 1. Capability Detection (LLMProvider startup)

```
LLMProvider.initialize() probes:
  - Send test tool call
  - Check if tool_choice:'required' succeeds
  - Check if reasoning_content is returned
  - Store capability flags in provider config
```

### 2. Unified Tool Calling Strategy per Iteration

Each LLM iteration follows this fallback chain:

```
1. Try native tools with provider-specific adjustments
   │
   ├─ Success → process tool calls
   │   └─ If reasoning_content returned → preserve in messages
   │
   ├─ Returns empty content + tool calls → native path works
   │   └─ Process tools, preserve reasoning_content
   │
   ├─ Returns text content → extract artifacts via header parsing
   │   └─ Parse ## filename.md headers, save as files
   │
   └─ Throws 400 error → retry without native tools (embedded tags)
```

### 3. Artifact Extraction (Provider-Agnostic)

Regardless of provider, artifacts are extracted from TWO sources:

**A. Tool calls** (`write_artifact`):
```javascript
// Standard path — works with any provider that supports tool calling
{ role: 'assistant', tool_calls: [{function: {name: 'write_artifact', arguments: '...'}}] }
→ Execute tool, save file, track in artifacts array
```

**B. Text content** (header parsing):
```javascript
// Fallback path — works with ANY provider, even without tool calling
"## FEASIBILITY_ARCHITECTURE.md\n...content...\n## DIAGRAMS.md\n...content..."
→ Regex split on ## filename headers → save each section as file
```

**C. Binary files** (post-run generation):
```javascript
// xlsx/pptx generated from markdown data using Python scripts
python scripts/generate_binaries.py <sandbox_dir>
→ Reads COST_MODELS.md → DATA_EXPORT.xlsx
→ Reads FEASIBILITY_ARCHITECTURE.md → COMPLETION_SLIDE.pptx
```

### 4. Provider Routing Config

```json
// STATE_MATRIX.json → supervisor_control.agent_00_supervisor.llm_override
{
  "provider": "auto",        // auto-detect from available keys, or explicit
  "model": "auto",           // auto-select best model for provider
  "features": {
    "native_tools": true,    // detected at startup
    "required_tools": false, // detected at startup
    "reasoning_content": false // detected at startup
  }
}
```

When `provider: "auto"`:
- Check auth.json for available provider keys
- Try in order: `anthropic` → `openai` → `openrouter` → `opencode-go`
- First one with valid key + working connection wins

### 5. Multi-Turn Message Construction

```javascript
// Standard format that works with ALL providers:
messages.push({
  role: 'assistant',
  content: resp.content || '',    // empty for tool calls, text for content
  tool_calls: resp.toolCalls,     // native tool calls if any
  reasoning_content: resp.reasoningContent || undefined  // only for DeepSeek
});

// Tool results:
messages.push({
  role: 'tool',
  tool_call_id: tc.id,
  content: JSON.stringify(toolResult)
});
```

### 6. Implementation Priority

1. **Phase 1** (current): OpenRouter for DeepSeek — works reliably
2. **Phase 2**: Add OpenAI GPT-4o support via config switch
3. **Phase 3**: Add Anthropic Claude support
4. **Phase 4**: Auto-detection and fallback chain
5. **Phase 5**: Per-provider registry with capability flags

## Key Files to Modify

- `scripts/runtime/LLMProvider.js` — capability detection, provider routing
- `scripts/runtime/LLMOpenAIProvider.js` — reasoning_content handling
- `scripts/runtime/AgentRuntime.js` — artifact extraction pipeline
- `00_state_ledger/AGENT_REGISTRY.json` — provider-neutral agent configs
- `scripts/generate_binaries.py` — post-run binary generation

## Testing Strategy

- Run architect agent with each provider
- Verify all 9 artifacts produced (7 text + 2 binary)
- Measure iterations per checkpoint, total duration
- Log provider, model, capability flags per run
