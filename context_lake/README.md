# Context Lake — Generic Cross-Session Context Persistence for OpenCode

Drop this into **any** opencode project. It automatically captures project state, agent configs, git history, conversations, and opencode session data into a structured, queryable Lake that **survives** conversation compaction and new window creation.

## How It Works

```
context_lake/
  capture.py          ← One script to rule them all
  config.json         ← Generic config (auto-discovers everything by default)
  hooks/              ← Lifecycle hooks (post-commit, agent-complete)
    post-commit       ← Auto-capture after every git commit
    capture-on-agent.bat  ← Call from agents after they complete
  lake/               ← The actual Lake — immutable, structured context
    2026-06-02/
      2026-06-02T10-30-00_Main-Window/
        context.json  ← Full machine-readable snapshot
        manifest.md   ← Human-readable summary
      2026-06-02T11-00-00_Agent-07a-Auth-Page/
        ...
```

Each entry captures:
- **Project info**: name, root, OS, Python version
- **Git state**: branch, HEAD SHA, last commit, remote URL, recent log
- **Agent configs**: all `.opencode/agents/*.md` files with descriptions
- **State files**: auto-discovers `STATE_MATRIX*.json`, `*_STATE*.json`, `*_REGISTRY*.json`
- **Conversations**: recent files from `conversations/` directory
- **OpenCode sessions**: reads local SQLite DB for session metadata

## Quick Start

```bash
# Capture context right now (auto-detects window name)
python context_lake/capture.py

# Capture with a specific window name
python context_lake/capture.py --window "My Session Title"

# Output as JSON (for programmatic use)
python context_lake/capture.py --json
```

## Automatic Capture

### Option 1: Git post-commit hook
```bash
copy context_lake\hooks\post-commit .git\hooks\post-commit
```
Now context is captured automatically after every `git commit`.

### Option 2: Call from agents
Agents can capture after they complete:
```bash
python context_lake/capture.py --window "Agent 07a UI - Auth Page Done"
```

### Option 3: Manual (anytime)
Run `python context_lake/capture.py` from any opencode window,
terminal, or automation script.

## Project Structure After Drop-In

```
your-project/
  context_lake/       ← Just add this directory
    capture.py
    config.json
    hooks/
    lake/
      ...             ← Context entries accumulate here
  .gitignore          ← Add: context_lake/lake/*.json (optional)
```

## How Context Survives Compaction

| Scenario | What Happens | How Lake Helps |
|----------|-------------|----------------|
| New window opened | Blank chat, no history | Read `lake/YYYY-MM-DD/latest/manifest.md` → know where you left off |
| Compaction runs | Messages summarized, detail lost | `context.json` has the full structured state |
| Agent completed, window closed | Session gone | Lake entry preserves: what agent did, what files changed, what's next |
| Cross-project switch | Different project, no overlap | Each project has its own `context_lake/` — independent |

## Configuration

Edit `context_lake/config.json` to customize:

```json
{
  "lake": {
    "max_entries_per_dir": 1000
  },
  "capture": {
    "state_file_patterns": [
      "**/STATE_MATRIX*.json",
      "**/my_custom_state*.json"
    ],
    "conversation_dirs": ["conversations", ".opencode/logs"],
    "agent_dirs": [".opencode/agents"],
    "git": {
      "enabled": true,
      "max_log_entries": 20
    }
  }
}
```

Patterns are globs — the script searches from your project root.

## Use Cases

1. **Resume after compaction**: Open the latest `manifest.md` → see exact pipeline state
2. **Cross-window handoff**: Window A saves context → Window B reads it → picks up where A left off
3. **Agent audit trail**: Every agent run is captured with timestamps, state, and git context
4. **Debugging**: Find exactly what state the project was in at any point in time

## Requirements

- Python 3.7+
- Works on Windows, macOS, Linux
- No external dependencies (uses stdlib only)
