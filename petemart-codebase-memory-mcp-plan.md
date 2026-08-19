# codebase-memory-mcp — PeteMart Project Setup Plan

> **Goal**: Install and configure DeusData's codebase-memory-mcp as a development tool for AI-assisted work on the PeteMart project.

## What It Is

codebase-memory-mcp indexes the PeteMart codebase into a persistent knowledge graph (functions, classes, routes, call chains) that AI agents query instead of reading files one by one. Single static binary, zero dependencies, all processing local.

## Why PeteMart

This project is large and complex (15+ agents, Next.js app, state ledger, supabase, i18n, CI/CD pipelines). Navigating it file-by-file is slow. A knowledge graph gives instant answers to:

- "Where are all the API routes defined?"
- "What calls this function?"
- "Show me the agent pipeline architecture"
- "What files changed in the last commit and what's affected?"

## Installation Plan

### Step 1: Download Binary
- Download `codebase-memory-mcp-windows-amd64.zip` from https://github.com/DeusData/codebase-memory-mcp/releases/latest
- Verify checksum from `checksums.txt`
- Extract to `~/.local/bin/` or `C:\tools\`

### Step 2: Register with OpenCode
- Run `codebase-memory-mcp install` from the petemart project root
- Auto-detects OpenCode and registers MCP server
- Or manually add to opencode.json if needed

### Step 3: Index the Codebase
- Run `codebase-memory-mcp index .` from project root
- Estimated: ~2-5 seconds for this project size
- Creates `.codebase/data/` with persistent graph

### Step 4: Verify
- AI agent will have tools available: `search_graph`, `trace_call_path`, `get_architecture`, `detect_changes`, `search_code`, etc.
- Try: "get architecture of this project" to see languages, packages, routes, hotspots

## Available Tools (MCP)

| Tool | Purpose |
|------|---------|
| `get_architecture` | Languages, packages, entry points, routes, hotspots, layers |
| `search_graph` | Find functions/classes by pattern |
| `trace_call_path` | Follow call chains (what calls this, what does this call) |
| `search_code` | Text search across codebase |
| `detect_changes` | Git diff impact analysis with risk classification |
| `search_dead_code` | Functions with zero callers |
| `query_cypher` | Custom graph queries (e.g. `MATCH (f:Function)-[:CALLS]->(g) RETURN f.name, g.name`) |
| `manage_adr` | Persist architecture decisions across sessions |

## Resources
- GitHub: https://github.com/DeusData/codebase-memory-mcp
- Docs: https://deusdata.github.io/codebase-memory-mcp/
- Windows binary: GitHub Releases -> `codebase-memory-mcp-windows-amd64.zip`

## When to Actually Do This
- Before the next major feature build on petemart
- Estimated time: 10 minutes total
