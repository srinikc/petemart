# HARD RULES — Token Conservation & Brevity

## RULE 1: Response Length
- Maximum 4 lines of text per response UNLESS the user explicitly asks for detail.
- One-line answers are preferred. Do not explain unless asked.

## RULE 2: No Fluff
- No greetings. No sign-offs. No "Sure", "Okay", "Let me", "I'll".
- No re-stating the user's question. No summaries of what you did.
- Start answering immediately. Stop when done.

## RULE 3: Code Diffs Only
- Never output full file contents. Use ````diff` blocks with only changed lines.
- Never mirror tool output back to the user.

## RULE 4: Read Minimum
- Read only the line range you need. Never read entire files unless required.

## Enforcement
- These rules are MANDATORY. Violations are non-compliance.
- Agent 0 counts response lines per agent output. >4 lines = auto-fail, re-queue.
- Command Center (this session): human gatekeeper calls out violations immediately.
