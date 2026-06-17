# Terminal Session Rules

**Scope**: These rules apply ONLY to the opencode AI assistant in CLI/terminal sessions.
**Does NOT apply to**: Project agents (01-15) — they follow rules defined in `AGENTS.md` and `AGENT_REGISTRY.json`.

---

## 1. Response Rules

| # | Rule |
|---|------|
| R1 | Maximum 4 lines per response UNLESS user explicitly asks for detail. One-line answers preferred. |
| R2 | No greetings, sign-offs, "Sure", "Okay", "Let me", "I'll". No re-stating user's question. No summaries of what you did. Start answering immediately. |
| R3 | Use `diff` blocks with only changed lines. Never output full file contents. Never mirror tool output back to user. |
| R4 | Read only the line range needed. Never read entire files unless required (<100 lines). |
| R5 | Answer exact question. No preamble, no context, no explanation. 1-2 lines max unless asked for detail. |

## 2. Tool Efficiency Rules

### File Reads
- Read first 30 lines before editing (imports, types, signatures).
- Use grep to find specific code, then read offset:limit (±10 lines around match).
- Never read full files unless the file is small (<100 lines).
- Batch parallel reads when multiple files are needed.

### Bash
- Don't dump full file content — use read/grep instead.
- Prefer targeted queries over broad output.
- Chain dependent commands with `; if ($?) { }`.

### Agents (task tool)
- Pass focused prompts with file paths — let agents read what they need.
- Don't dump full file contents into agent prompts.
- Specify exact artifact paths and formats.

## 3. Development Workflow (HARD RULES)

### R1: One Change at a Time
Never modify more than one logical unit per cycle. A logical unit is: one function/method signature change, one bug fix, or one new feature component. If a task requires touching 3 files, do it in 3 separate cycles, each followed by verification.

### R2: Verify Before Moving On
After EVERY change:
1. Syntax check: `node -c <file>` for JS, `npx tsc --noEmit` for TS
2. Module load: `node -e "require('<module>')"` confirms module loads without runtime errors
3. Existing tests: run any existing test suite
4. If runtime code (AgentRuntime.js, LLMProvider.js, supervisor_loop.js): trigger a minimal agent run or invoke the changed code path to confirm it doesn't throw

If ANY step fails → revert the change, fix, and restart from Rule 1.

### R3: No Cascading Fixes
If a change breaks something:
- Revert the change that caused the breakage first
- Understand why it broke
- Fix in isolation
- Do NOT add another feature/workaround on top of the breakage

### R4: One Fix, One Test
For every bug fix:
1. Write or identify a test that reproduces the bug
2. Apply the fix
3. Run the test to confirm it passes
4. Run all existing tests to confirm no regression

### R5: State & Context Discipline
Before making any change to runtime code (AgentRuntime, LLMProvider, supervisor, pipeline):
1. Read the current STATE_MATRIX.json to understand agent states
2. Check if a run is in progress — do NOT edit runtime files while an agent is running
3. After changes, update STATE_MATRIX.json compliance fields if applicable
4. Log the change context in `context_lake/latest.json` for cross-session continuity

### R6: No Assumptions About Available Libraries
Before using any npm package, React component library, or external API:
1. Check `package.json` that it's already a dependency
2. Check existing files for import patterns
3. If it's not in the project, ask the user before adding it

### R7: Rollback Preparedness
Before making any change to critical runtime files:
1. Know the rollback plan (which lines to revert)
2. `git diff` the file first to confirm current state
3. After the change, `git diff` again to confirm only intended lines changed
4. If verification fails, `git checkout -- <file>` to restore immediately

### R9: Dependency Trace & E2E Validation (Universal)
A fix or change is never isolated. Every change has upstream callers and downstream consumers. Before marking any change as done:
1. Trace all call paths: Find every function that calls the changed code. Use grep — don't assume.
2. Trace downstream consumers: Find every file, agent, or process that reads the artifacts this change produces. Verify they still work.
3. Fix all connected paths: If the same pattern is broken in multiple places, fix ALL of them.
4. Validate E2E: Run the full workflow path, not just the isolated unit.
5. No partial fixes: A fix that addresses the symptom in one path while leaving the same bug in another path is tech debt.

Examples:
- Fixing `write_artifact` → also check `write_artifacts_batch`, `_runPipeline`, and any agent that produces artifacts
- Changing a system prompt → re-run the agent and verify output schema hasn't changed
- Modifying LLM provider → run a test agent through complete lifecycle
- Editing a React component → check all pages that import it, verify no TypeScript errors, run component tests

### R10: Discuss Before Implementing (AI Assistant Only)
This rule applies ONLY to the AI assistant (opencode) in terminal/CLI sessions — NOT to autonomous agents (01-15) running in the background pipeline.
Before making any code change that involves design decisions, new features, or fixes:
1. List what will be changed — enumerate files, functions, and the nature of each change
2. Get explicit go-ahead — do NOT start coding until the user says "go ahead" or "implement"
3. One change at a time — after approval, follow Rules 1-9 during implementation
4. No premature coding — discussing/analyzing and implementing are separate phases. Do not mix them.

Violation: user calls out mid-discussion coding. Change is reverted, re-planned, and re-approved.

Autonomous pipeline agents (00-15) continue to execute without asking for permission.

### R11: Cross-Session Memory
After every significant work cycle:
1. Update `context_lake/latest.json` with what was done, what broke, and what was fixed
2. If rules were violated or lessons learned, update this Development Workflow section
3. If a pattern of mistakes is identified, add a HARD RULE here to prevent recurrence

## 4. Enforcement

- These rules are MANDATORY. Violations are non-compliance.
- Command Center (this session): human gatekeeper calls out violations immediately.
- No programmatic enforcement exists — compliance depends on self-discipline and human oversight.

## 5. Cross-References

| For this | See |
|----------|-----|
| Project agent rules (01-15) | `AGENTS.md` — per-agent quality guardrails, fail states, validation rules |
| Supervisor agent rules (00) | `AGENTS.md` Agent 0 section — compliance audit, loop guardrails, HITL gates |
| Enforcement gap analysis | `Rules-Guardrails-Compliance.md` — Enforcement Gap Summary section |
| All state file update patterns | `State-Changes.md` |
