# AgentScope vs Petemart Agentic SDLC Framework — Comparative Analysis

> **Date**: 2026-06-18
> **Scope**: Alibaba AgentScope 2.0 (Apache 2.0, Python) vs Petemart Agentic SDLC Framework (Node/Next.js)
> **Purpose**: Identify architectural gaps and adoption opportunities

---

## 1. High-Level Comparison

| Dimension | AgentScope 2.0 | Petemart Framework |
|-----------|---------------|-------------------|
| **Core Purpose** | General-purpose agent runtime & hosting platform | SDLC pipeline orchestrator with compliance gates |
| **Primary Abstraction** | `Agent` (stateless ReAct loop) | Supervisor-controlled multi-agent pipeline (15 agents) |
| **Language** | Python 3.11+ | Node.js / Next.js / TypeScript |
| **License** | Apache 2.0 | Proprietary |
| **Target Users** | Agent application developers | Enterprise software delivery teams |
| **Deployment** | REST + SSE Agent Service | Local CLI + daemon process |

---

## 2. Feature Gap Analysis

### 2.1 Event System (Streaming Architecture)

**AgentScope**: Typed event bus with structured lifecycle events (`ReplyStartEvent` → `TextBlockDeltaEvent` → `ToolCallStartEvent` → `ReplyEndEvent`). Events follow a start→delta→end pattern per content block. Frontends reconstruct full `Msg` objects from event streams. Supports multi-subscriber SSE fan-out.

**Petemart**: No streaming event system. Agent communication is file-based (`STATE_MATRIX.json`, `AGENT_MESSAGES.jsonl`). No real-time UI updates.

**Why Petemart needs this**:
- **Real-time HITL UX**: Agents 2, 4, 5 halt for human review. An event stream would let the dashboard show thinking progress, tool calls, and permission requests in real time instead of polling state files.
- **Supervisor dashboard**: Agent 0 could stream compliance audit results per agent as they complete, rather than writing to JSON after the fact.
- **Multi-client support**: SSE stream allows multiple observers (human gatekeeper, PM dashboard, CI pipeline) to watch the pipeline live.

### 2.2 Permission & Security System

**AgentScope**: Five permission modes (`DEFAULT`, `EXPLORE`, `ACCEPT_EDITS`, `BYPASS`, `DONT_ASK`), rule-based allow/deny/ask engine, tool-level `check_permissions()` methods, bypass-immune safety checks (dangerous path protection, read-only command detection). Permission rules are persisted at runtime via suggested rules.

**Petemart**: Agent 15 (Secrets & Compliance) scans for exposed credentials only. No runtime permission system for agent tool execution.

**Why Petemart needs this**:
- **Code-gen agent safety**: Agents 7a-7d (UI, API, DB, Integration) and Agent 13 (Maintenance) generate and execute code. Without runtime permissions, a hallucinated `rm -rf /` or accidental credential write is unprotected.
- **EXPLORE mode for audit**: Agent 0 could run compliance audits in EXPLORE mode (read-only), guaranteeing no side effects during inspection.
- **DONT_ASK for CI/CD**: Automated pipeline runs could use DONT_ASK mode, converting all prompts to denials — safe for unattended execution.
- **Per-agent policies**: UI agent (7a) only allowed to write to `agents/03_execution_workspace/07a_ui_agent/`, API agent (7b) restricted to its sandbox — prevents cross-agent contamination.

### 2.3 Workspace / Sandbox Isolation

**AgentScope**: Pluggable workspace backends — `LocalWorkspace`, `DockerWorkspace`, `E2BWorkspace`. MCP gateway for in-container tool execution. Workspace manager with TTL-based caching and per-agent/per-user/per-session isolation policies. Built-in offloader for context and tool results.

**Petemart**: Flat sandbox directories under `agents/03_execution_workspace/<agent_id>/`. No container isolation. Tools execute directly on the host filesystem.

**Why Petemart needs this**:
- **Security containment**: Code-gen agents (7a-7d, 13) could accidentally modify files outside their sandbox. DockerWorkspace would constrain filesystem access to the agent's directory.
- **Parallel execution safety**: Sync pool runs up to 3 agents concurrently. Shared host filesystem risks race conditions on state files. Docker isolation prevents cross-agent interference.
- **Reproducible builds**: E2B or Docker sandboxes ensure every agent execution starts from a clean environment, eliminating "works on my machine" issues.
- **MCP gateway**: Infrastructure agent (06) could manage MCP servers inside containers, simplifying tool provisioning across environments.

### 2.4 Standardized Agent Runtime (ReAct Loop)

**AgentScope**: Formal `Agent` class with a well-defined reasoning-acting loop: input → context assembly → model call → tool execution → permission check → event emission. Middleware hooks at every stage. Automatic context compression and offloading.

**Petemart**: Agents are system-prompt-injected LLM calls with no standardized runtime loop. Each agent's logic is entirely within its prompt text (see AGENTS.md — every agent has a "System Prompt Injection" section). No shared tool execution framework.

**Why Petemart needs this**:
- **Deterministic agent behavior**: Currently, agent outputs depend entirely on prompt engineering. A standardized ReAct loop with structured tool calls would make agent behavior more predictable and testable.
- **Tool reuse**: Built-in tools (Read, Write, Edit, Bash, Grep, Glob) are used by every agent. AgentScope's `Toolkit` abstraction would provide consistent tool interfaces with permission checking built in.
- **Middleware for compliance**: Agent 0's compliance checks could be implemented as middleware hooks (`on_reply` for deliverables audit, `on_reasoning` for traceability validation) rather than post-hoc file scans.
- **Context compression**: Long-running agents (03 Architect with 103 requirements, 08 QA with full test suites) would benefit from automatic context window management.

### 2.5 MCP (Model Context Protocol) Integration

**AgentScope**: Native `MCPClient` support with HTTP and stdio transports. GatewayMCPClient for in-container MCP access. Tool discovery and invocation via MCP protocol.

**Petemart**: No MCP integration. Tools are hardcoded as prompt instructions.

**Why Petemart needs this**:
- **External tool ecosystem**: Thousands of MCP servers exist for web search, database queries, API integrations, code analysis. Infra agent (06) could pull these dynamically instead of maintaining bespoke integrations.
- **Dynamic tool provisioning**: Agent 06's role includes "pull open-source skill and framework requirements." MCP would standardize this — each skill is an MCP server with discoverable tools.
- **Future-proofing**: MCP is becoming the standard protocol for LLM tool integration (supported by Claude, OpenAI, Copilot). Adopting it now prevents vendor lock-in.

### 2.6 Middleware System

**AgentScope**: Six hook positions — `on_reply`, `on_reasoning`, `on_acting`, `on_model_call`, `on_compress_context`, `on_system_prompt`. Onion-style wrapping for before/after logic. Built-in `TracingMiddleware` (OpenTelemetry). Custom middleware for timing, rate-limiting, dynamic prompts, model fallback.

**Petemart**: No middleware abstraction. Cross-cutting concerns (logging, compliance, token tracking) are handled ad-hoc via script calls (`python scripts/track_usage.py`) or file-based communication.

**Why Petemart needs this**:
- **Observability without code changes**: `TracingMiddleware` would give Petemart distributed tracing across all 15 agents with OpenTelemetry, connecting to Jaeger/Grafana — no need for custom log parsers.
- **Compliance middleware**: Agent 0's compliance audit could be a middleware applied to every agent, running checks automatically at each lifecycle stage.
- **Token budget enforcement**: FinOps agent (14) could enforce per-agent token budgets via a middleware that monitors model call input/output counts.
- **Rate limiting**: Prevent LLM API throttling by adding a `RateLimitMiddleware` across all agents.

### 2.7 Context Management & Offloading

**AgentScope**: Automatic context compression at configurable `trigger_ratio`. Tool result truncation. Offloader protocol for persisting compressed context to disk/S3/Redis. Summary schema with structured fields (task_overview, current_state, important_discoveries, next_steps, context_to_preserve).

**Petemart**: No context management. Agents receive the full conversation history each time. No compression, truncation, or offloading.

**Why Petemart needs this**:
- **Extended agent runs**: Agent 03 (Architect) processes 103 requirements — context can exceed model limits. Automatic compression would summarize earlier findings while preserving critical info.
- **Cost control**: Token spend is already tracked (`agent_token_usage_log.csv`). Context compression directly reduces token consumption, lowering costs.
- **Cross-session continuity**: Offloaded context could feed back into Agent 13 (Maintenance) when diagnosing production issues from historical runs.
- **Structured summaries**: The compression summary schema (task_overview, next_steps) maps naturally to Petemart's `context_lake/latest.json` format.

### 2.8 State Persistence & Serialization

**AgentScope**: `AgentState` — a Pydantic model holding full agent state (conversation context, compression summary, permission rules, tool state, reply position). Serializes to JSON. `RedisStorage` for persistence. Clean `update_session_state()` / `get_session()` API.

**Petemart**: `STATE_MATRIX.json` for agent pipeline state. `context_lake/latest.json` for session memory. No standardized state model for individual agents.

**Why Petemart needs this**:
- **Agent state checkpointing**: If an agent fails mid-execution (circuit breaker in Agent 0), `AgentState` serialization would allow resumption from the last checkpoint rather than restarting from scratch.
- **Multi-session support**: As Petemart scales to multiple projects, each agent session needs isolated state — Redis-backed AgentState provides this naturally.
- **Debugging**: Full agent state snapshots (including tool call history, reasoning trace, permission decisions) would simplify debugging agent failures.

### 2.9 Multi-tenancy & Agent Service

**AgentScope**: FastAPI-based `Agent Service` with REST+SSE endpoints. Multi-tenant by construction (resources scoped to `user_id`). Session streams with replay for late joiners. Cron scheduling. Background task offloading. Pluggable authentication, storage, workspace.

**Petemart**: Single-user CLI with daemon process (`supervisor_daemon.log`). No HTTP API. No multi-tenancy. One pipeline instance per project.

**Why Petemart needs this**:
- **Team collaboration**: Multiple engineers need to view pipeline status, approve HITL gates, and review agent outputs. Agent Service would expose REST APIs for a team dashboard.
- **Scheduled agent runs**: Agent 13 (Maintenance) should run on cron for production monitoring. Agent Service's scheduler would trigger it automatically.
- **Integration with external systems**: REST API would allow webhook-based triggers (e.g., GitHub push → Agent 06 deploy pipeline, or Jira ticket → Agent 05 sprint update).
- **Scaling**: As Petemart serves multiple clients (multi-city e-commerce expansion), multi-tenancy becomes essential.

### 2.10 Tool Abstraction & Standardization

**AgentScope**: `ToolBase` abstract class with `__call__()`, `check_permissions()`, `check_read_only()`, `match_rule()`, `generate_suggestions()`. Tools grouped into `ToolGroup`s with activation via `ResetTools` meta-tool. Concurrent execution of independent tools.

**Petemart**: Tools are called via LLM system prompt instructions. No standard tool interface, no permission hooks, no grouping.

**Why Petemart needs this**:
- **Tool discoverability**: Each Petemart agent has implicit tools (read files, write artifacts, execute commands). A formal tool registry would let agents discover available tools dynamically.
- **Permission enforcement**: Tool-level `check_permissions()` integrates with the permission system, preventing unauthorized operations before they execute.
- **Parallel execution**: AgentScope automatically batches independent tools for concurrent execution — Petemart agents process tools sequentially.
- **Tool reuse across agents**: Same tool implementations (file operations, API calls, DB queries) would be shared via `Toolkit` rather than duplicated in each agent's system prompt.

---

## 3. Benefit vs. Effort Matrix

| Feature | Petemart Value | Integration Effort | Priority |
|---------|---------------|-------------------|----------|
| Permission System | High (safety for code-gen agents) | Medium (existing Agent 15 can be extended) | **P0** |
| Event System | High (real-time HITL UX) | High (new streaming layer needed) | **P1** |
| Tool Abstraction | Medium (standardization) | Medium (refactor prompt tools into classes) | **P1** |
| Context Management | Medium (cost & reliability) | Low (add ContextConfig to LLM calls) | **P1** |
| Workspace Isolation | High (security & parallel safety) | High (Docker dependency) | **P2** |
| Middleware System | Medium (observability) | Medium (hook points needed in runtime) | **P2** |
| MCP Integration | Medium (ecosystem access) | Medium (MCP client library) | **P2** |
| Standardized Agent Runtime | High (determinism) | High (fundamental architecture change) | **P2** |
| State Persistence | Medium (resumability) | Low (Pydantic model + Redis) | **P2** |
| Multi-tenancy | Low (current scope) | High (service layer) | **P3** |

---

## 4. Recommended Adoption Roadmap

### Phase 1 (Immediate — 0-2 weeks)
1. **Permission System**: Extend Agent 15 to implement a rule-based permission engine. Add `check_permissions()` to all agent tool calls. Five modes as per AgentScope. Start with DEFAULT mode, add EXPLORE for Agent 0 audits.
2. **Context Management**: Add `ContextConfig` (trigger_ratio, reserve_ratio, tool_result_limit) to LLM provider calls. Implement automatic compression for long-running agents (03, 08).

### Phase 2 (Short-term — 2-4 weeks)
3. **Event System**: Build a typed event bus on top of `PIPELINE_EVENTS.jsonl`. Define event hierarchy (AgentStartEvent, AgentCompleteEvent, ToolCallEvent, ComplianceCheckEvent). Stream to dashboard via SSE.
4. **Tool Abstraction**: Create `ToolBase` abstract class. Refactor `scripts/` tools and agent-specific tools into registered `Toolkit` instances. Add `ToolGroup` for activating/deactivating tool sets per agent.

### Phase 3 (Medium-term — 1-2 months)
5. **Workspace Isolation**: Integrate DockerWorkspace for code-gen agents (7a-7d, 13). Start with optional opt-in, default to LocalWorkspace. Add MCP gateway for in-container tool access.
6. **Middleware System**: Add hook points to the agent execution pipeline. Implement `TracingMiddleware` (OpenTelemetry) and `ComplianceMiddleware` (integrates with Agent 0 audits).

### Phase 4 (Long-term — 2-3 months)
7. **Standardized Agent Runtime**: Evolve from pure system-prompt injection to a formal ReAct loop with `Agent` class, structured tool calls, and middleware hooks. Maintain backward compatibility by allowing prompt-only mode.
8. **MCP Integration**: Add MCP client support to `Toolkit`. Create MCP servers for Petemart-specific tools (state reads, artifact writes, compliance checks).
9. **Agent Service**: Expose pipeline state and chat endpoints via FastAPI. Add multi-tenancy support. Implement cron scheduling for maintenance and monitoring agents.

---

## 5. Architectural Impact Notes

### What NOT to copy from AgentScope
- **Python-only**: Petemart is Node.js/TypeScript. Do not adopt AgentScope directly — extract patterns and re-implement in TypeScript.
- **Over-engineering**: AgentScope's multi-tenancy and distributed deployment features are unnecessary at Petemart's current scale. Build them only when demand emerges.
- **Qwen/DashScope dependency**: AgentScope is tied to Alibaba's DashScope models. Petemart should remain model-agnostic.

### What to preserve in Petemart
- **Compliance-first design**: Agent 0's compliance audit, traceability matrix, and quality guardrails are Petemart's strongest differentiators. These do not exist in AgentScope.
- **SDLC pipeline model**: Petemart's phased pipeline (Front Office → Engineering Specs → Execution → Verification → Post-Delivery) is purpose-built for software delivery. Do not replace with generic agent orchestration.
- **Per-agent quality guardrails**: Agent-specific fail states and validation rules (e.g., "block if cost schema missing") are more specialized than AgentScope's generic permission system.

---

## 6. Key Takeaway

**AgentScope is a general-purpose agent runtime. Petemart is a specialized SDLC pipeline.** The right strategy is not to switch frameworks but to **adopt AgentScope's proven architectural patterns** — event streaming, permission control, workspace isolation, and middleware — while preserving Petemart's compliance and SDLC strengths.

The highest-ROI change is the **permission system** (P0): it directly addresses Petemart's biggest risk (uncontrolled agent tool execution) with relatively low integration effort by extending Agent 15's existing mandate.
