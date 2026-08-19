## Investigation: Headroom (github.com/chopratejas/headroom)

**What it is**: Context compression layer for AI agents. Compresses tool calls, RAG retrievals, logs, and conversation history before they hit the LLM — claims 60–95% token reduction.

**Why it fits this framework**:
- **Agent 14 (FinOps)** — direct cost control: fewer tokens = lower spend
- **Agent 0 (Supervisor)** — our ~100K token budget per cycle goes further
- **All agents** — reversible compression (originals stored locally, LLM fetches on demand)
- **Usage modes**: library (`pip install headroom-ai`), proxy (`headroom proxy --port 8787`), or `wrap` for Claude Code/Codex/Aider
- **License**: Apache 2.0, open-source

**Next steps to evaluate**:
- [ ] Install and test with a single agent (e.g., Ideation Agent 01)
- [ ] Measure token reduction on actual agent outputs vs. baseline
- [ ] Integrate compression hook into `LLMProvider.js` or as middleware
- [ ] Wire cost savings into FinOps (Agent 14) monitoring
- [ ] Consider `headroom wrap opencode` if community issue #74 adds support

---

## Investigation: Understand Anything (github.com/Egonex-AI/Understand-Anything)

**What it is**: Turns any codebase into an interactive knowledge graph using a 7-phase multi-agent pipeline (Tree-sitter parsing + LLM semantic analysis). Every file, function, class, and dependency becomes a navigable node with plain-English summaries, guided tours, and domain/business-logic mapping.

**Why it fits this framework**:
- **Agent 0 (Supervisor)** — visualize the 15-agent dependency chain, state machine, and pipeline flow as a living graph
- **Onboarding** — new developers can explore the entire petemart framework via `/understand-dashboard` instead of reading through AGENTS.md blind
- **Agent structure mapping** — see how agents connect through `STATE_MATRIX.json`, `AGENT_REGISTRY.json`, and artifact flows
- **Diff impact analysis** (`/understand-diff`) — before committing, see what agents/directories a change affects
- **Works with OpenCode** directly — `/plugin install understand-anything` then `/understand`
- **Multi-platform**: supports Claude Code, Codex, Cursor, Copilot, Gemini CLI, OpenCode
- **License**: MIT

**Next steps to evaluate**:
- [ ] Run `/plugin install understand-anything` then `/understand` on this repo
- [ ] Explore dashboard — verify it maps agents, state files, and dependency edges correctly
- [ ] Test `/understand-explain` on key modules (AgentRuntime.js, SupervisorAgent.js)
- [ ] Test `/understand-diff` before a PR to see impacted agents
- [ ] Generate business-domain view mapping the 5 phases (Front-Office → Engineering → Execution → QA → Maintenance)
- [ ] Share graph output with team as onboarding reference
- [ ] Track dashboard URL for inclusion in documentation/slides
