"""
context_lake/capture.py — Generic Cross-Session Context Capture Engine

Captures project state, agent context, conversation metadata, git state,
and opencode session data into a structured, queryable Lake.

Usage:
    python context_lake/capture.py
    python context_lake/capture.py --window "My Window Title"
    python context_lake/capture.py --out-dir ./my-custom-lake

The Lake survives conversation compaction and new window creation.
Drop this into ANY opencode project — it auto-discovers everything.
"""

import argparse
import datetime
import glob as glob_mod
import json
import os
import platform
import re
import sqlite3
import subprocess
import sys
import textwrap
import time
from pathlib import Path


# ─── Helpers ────────────────────────────────────────────────────────────────

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def safe_read(path, mode="r", encoding="utf-8"):
    try:
        with open(path, mode, encoding=encoding) as f:
            return f.read()
    except Exception as e:
        return f"[error reading: {e}]"


def safe_read_json(path):
    raw = safe_read(path)
    try:
        return json.loads(raw)
    except Exception as e:
        return {"_parse_error": str(e), "_raw_preview": raw[:500]}


def safe_run(cmd, timeout=15):
    try:
        r = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout
        )
        return {"stdout": r.stdout.strip(), "stderr": r.stderr.strip(), "returncode": r.returncode}
    except FileNotFoundError:
        return {"stdout": "", "stderr": "command not found", "returncode": -1}
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "timed out", "returncode": -2}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -3}


def is_windows():
    return platform.system() == "Windows"


# ─── Config ─────────────────────────────────────────────────────────────────

def load_config(project_root):
    config_path = os.path.join(project_root, "context_lake", "config.json")
    defaults = {
        "lake": {
            "max_entries_per_dir": 1000,
            "date_format": "%Y-%m-%d",
            "datetime_format": "%Y-%m-%dT%H-%M-%S",
        },
        "capture": {
            "state_file_patterns": [
                "**/STATE_MATRIX*.json",
                "**/*_STATE*.json",
                "**/*_REGISTRY*.json",
                "**/state_ledger/**/*.json",
                "**/state/**/*.json",
            ],
            "conversation_dirs": ["conversations"],
            "agent_dirs": [".opencode/agents"],
            "opencode_db_paths": [
                "~/.config/opencode/opencode.db",
                "~/.opencode/opencode.db",
                ".opencode/opencode.db",
            ],
            "git": {"enabled": True, "max_log_entries": 20},
        },
        "entry_name_template": "{datetime}_{window_name}",
    }
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                user_config = json.load(f)
            deep_merge(defaults, user_config)
        except Exception as e:
            eprint(f"[context_lake] Warning: could not load config: {e}")
    return defaults


def deep_merge(base, override):
    for k, v in override.items():
        if k in base and isinstance(base[k], dict) and isinstance(v, dict):
            deep_merge(base[k], v)
        else:
            base[k] = v


# ─── Project Discovery ──────────────────────────────────────────────────────

def discover_project(project_root):
    info = {
        "project_root": project_root,
        "project_name": os.path.basename(os.path.normpath(project_root)),
        "os": platform.system(),
        "python_version": sys.version,
        "captured_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    dirname = os.path.basename(os.path.normpath(project_root))

    git_info = discover_git(project_root)
    if git_info:
        info["git"] = git_info
        if git_info.get("remote_url"):
            match = re.search(r"[/:]([^/]+/[^/.]+?)(\.git)?$", git_info["remote_url"])
            if match:
                info["project_name"] = match.group(1).replace("/", "-")

    return info


def discover_git(project_root):
    git_dir = os.path.join(project_root, ".git")
    if not os.path.isdir(git_dir):
        return None

    info = {}
    url = safe_run(["git", "remote", "get-url", "origin"], timeout=5)
    if url["returncode"] == 0:
        info["remote_url"] = url["stdout"]

    branch = safe_run(["git", "branch", "--show-current"], timeout=5)
    if branch["returncode"] == 0:
        info["branch"] = branch["stdout"]

    sha = safe_run(["git", "rev-parse", "HEAD"], timeout=5)
    if sha["returncode"] == 0:
        info["head_sha"] = sha["stdout"]
        short = safe_run(["git", "rev-parse", "--short", "HEAD"], timeout=5)
        if short["returncode"] == 0:
            info["head_short_sha"] = short["stdout"]

    msg = safe_run(["git", "log", "-1", "--format=%s"], timeout=5)
    if msg["returncode"] == 0:
        info["last_commit_msg"] = msg["stdout"]

    return info


# ─── OpenCode DB ────────────────────────────────────────────────────────────

def discover_opencode_db_paths(config):
    paths = config["capture"]["opencode_db_paths"]
    resolved = []
    for p in paths:
        expanded = os.path.expanduser(p)
        if os.path.exists(expanded):
            resolved.append(expanded)
    return resolved


def read_opencode_sessions(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        sessions = []
        if "Session" in tables:
            cursor.execute(
                """
                SELECT id, agent_id, model, title,
                       tokens_in, tokens_out, tokens_reasoning,
                       tokens_cache_read, tokens_cache_write, cost,
                       created_at
                FROM Session
                ORDER BY created_at DESC
                LIMIT 100
            """
            )
            for row in cursor.fetchall():
                sessions.append({
                    "session_id": row[0],
                    "agent": row[1] or "unknown",
                    "model": row[2] or "unknown",
                    "title": row[3] or "",
                    "tokens_input": row[4] or 0,
                    "tokens_output": row[5] or 0,
                    "tokens_reasoning": row[6] or 0,
                    "tokens_cache_read": row[7] or 0,
                    "tokens_cache_write": row[8] or 0,
                    "cost": row[9] or 0,
                    "timestamp": row[10] or "",
                })

        conn.close()
        return sessions
    except Exception as e:
        eprint(f"[context_lake] DB read warning: {e}")
        return []


# ─── State Files ────────────────────────────────────────────────────────────

def discover_state_files(project_root, config):
    patterns = config["capture"]["state_file_patterns"]
    found = []
    for pattern in patterns:
        matches = glob_mod.glob(os.path.join(project_root, pattern), recursive=True)
        for m in matches:
            rel = os.path.relpath(m, project_root)
            found.append({"path": rel, "content": safe_read_json(m)})
    return found


# ─── Agent Configs ──────────────────────────────────────────────────────────

def discover_agent_configs(project_root, config):
    dirs = config["capture"]["agent_dirs"]
    agents = {}
    for d in dirs:
        agent_dir = os.path.join(project_root, d)
        if os.path.isdir(agent_dir):
            for fname in sorted(os.listdir(agent_dir)):
                if fname.endswith(".md"):
                    content = safe_read(os.path.join(agent_dir, fname))
                    agents[fname.replace(".md", "")] = parse_agent_md(content)
    return agents


def parse_agent_md(content):
    info = {}
    for line in content.split("\n"):
        m = re.match(r"^description:\s*(.+)", line)
        if m:
            info["description"] = m.group(1).strip()
    first_line = content.split("\n")[0] if content else ""
    if "Agent" in first_line or "agent" in first_line:
        info["title"] = first_line.strip("# \t\r\n")
    return info


# ─── Conversations ─────────────────────────────────────────────────────────

def discover_conversations(project_root, config):
    dirs = config["capture"]["conversation_dirs"]
    entries = []
    for d in dirs:
        conv_dir = os.path.join(project_root, d)
        if os.path.isdir(conv_dir):
            for fname in sorted(os.listdir(conv_dir), reverse=True):
                fpath = os.path.join(conv_dir, fname)
                if os.path.isfile(fpath) and fname.endswith(".md"):
                    stat = os.stat(fpath)
                    entries.append({
                        "filename": fname,
                        "path": os.path.relpath(fpath, project_root),
                        "size_bytes": stat.st_size,
                        "modified_at": datetime.datetime.fromtimestamp(
                            stat.st_mtime, tz=datetime.timezone.utc
                        ).isoformat(),
                    })
    return entries


# ─── Git Log ───────────────────────────────────────────────────────────────

def capture_git_log(project_root, config):
    if not config["capture"]["git"]["enabled"]:
        return None
    git_dir = os.path.join(project_root, ".git")
    if not os.path.isdir(git_dir):
        return None

    max_entries = config["capture"]["git"]["max_log_entries"]
    log = safe_run(
        ["git", "log", f"-{max_entries}", "--format=%H|%ai|%s"],
        timeout=10
    )
    if log["returncode"] != 0:
        return None

    entries = []
    for line in log["stdout"].split("\n"):
        if not line.strip():
            continue
        parts = line.split("|", 2)
        if len(parts) == 3:
            entries.append({
                "sha": parts[0],
                "date": parts[1],
                "message": parts[2],
            })
    return entries


# ─── Window Name Detection ─────────────────────────────────────────────────

def detect_window_name(project_root):
    if is_windows():
        title = safe_run(
            ["powershell", "-Command", "(Get-Process -Id $pid).MainWindowTitle"],
            timeout=5
        )
        if title["returncode"] == 0 and title["stdout"].strip():
            return sanitize_name(title["stdout"].strip())

    try:
        import psutil
        proc = psutil.Process()
        if proc.name():
            return sanitize_name(proc.name())
    except ImportError:
        pass
    return "unknown-window"


def extract_summary(content):
    if not isinstance(content, dict):
        return "unknown"
    pctl = content.get("pipeline_control", {})
    if pctl:
        ds = pctl.get("dashboard_summary", {})
        if ds:
            return f"{ds.get('overall_progress_pct', '?')}% complete | {ds.get('agents_completed', 0)}/{ds.get('total_agents', '?')} agents done"
    status = content.get("status", "")
    if status:
        return f"status: {status}"
    return "state file"


def sanitize_name(name):
    name = re.sub(r'[<>:"/\\|?*]', "-", name)
    name = re.sub(r"\s+", " ", name).strip()[:80]
    return name if name else "unknown-window"


# ─── Conversation Content ──────────────────────────────────────────────────

def capture_latest_conversation_content(project_root, config):
    dirs = config["capture"]["conversation_dirs"]
    md_files = []
    for d in dirs:
        conv_dir = os.path.join(project_root, d)
        if os.path.isdir(conv_dir):
            for fname in os.listdir(conv_dir):
                fpath = os.path.join(conv_dir, fname)
                if os.path.isfile(fpath) and fname.endswith(".md"):
                    md_files.append(fpath)

    if not md_files:
        return None

    md_files.sort(key=lambda p: os.path.basename(p), reverse=True)
    latest_file = md_files[0]

    content = safe_read(latest_file)
    lines = content.split("\n")
    mtime = os.stat(latest_file).st_mtime

    all_messages = extract_clean_messages(lines, max_messages=None)
    last_messages = all_messages[-3:] if len(all_messages) >= 3 else all_messages
    summary = generate_session_summary(all_messages)

    result = {
        "filename": os.path.basename(latest_file),
        "modified_at": datetime.datetime.fromtimestamp(
            mtime, tz=datetime.timezone.utc
        ).isoformat(),
        "last_messages": last_messages,
        "summary": summary,
        "exchange_count": len(all_messages),
        "total_size_bytes": len(content),
    }
    return result


_HEURISTIC_DONE = re.compile(r"\b(done|complete|finished|implemented|built|added|fixed)\b", re.IGNORECASE)
_HEURISTIC_PENDING = re.compile(r"\b(next|pending|remaining|still|yet|todo|blocked|bug|issue)\b", re.IGNORECASE)
_HEURISTIC_TOPIC = re.compile(
    r"\b(sprint|milestone|deploy|test|api|ui|db|schema|migration|auth|payment|checkout|catalog|"
    r"cart|order|merchant|customer|admin|docker|ci|cd|review|pr|commit|branch|rollback|"
    r"supabase|vercel|expo|whatsapp|analytics|seo|ai|model|token)\b",
    re.IGNORECASE,
)


def generate_session_summary(messages):
    if not messages:
        return {"goal": "", "exchanges": 0, "topics": [], "done_count": 0, "pending_count": 0}

    user_msgs = [m["text"] for m in messages if m.get("role") == "user"]
    assistant_msgs = [m["text"] for m in messages if m.get("role") == "assistant"]

    goal = user_msgs[0][:300] if user_msgs else ""
    last_user = user_msgs[-1][:300] if user_msgs else ""
    last_assistant = assistant_msgs[-1][:300] if assistant_msgs else ""

    topics = set()
    done_count = 0
    pending_count = 0
    for text in assistant_msgs:
        topics.update(t.lower() for t in _HEURISTIC_TOPIC.findall(text))
        done_count += len(_HEURISTIC_DONE.findall(text))
        pending_count += len(_HEURISTIC_PENDING.findall(text))

    topic_list = sorted(topics)[:15]

    return {
        "goal": goal,
        "last_user_query": last_user,
        "last_assistant_summary": last_assistant,
        "topics": topic_list,
        "done_mentions": done_count,
        "pending_mentions": pending_count,
        "exchanges": len(messages),
    }


def extract_clean_messages(lines, max_messages=None, max_block_size=5000):
    messages = []
    current = []
    in_details = 0
    turn_role = "user"
    started = False

    for line in lines:
        raw = line.strip()

        if not started:
            if line.startswith("### ") and ("User" in line or "Assistant" in line):
                started = True
            else:
                continue

        if raw.startswith("<details"):
            in_details += 1
            continue
        if raw == "</details>":
            in_details = max(0, in_details - 1)
            continue
        if in_details > 0:
            continue

        if line.startswith("### ") and ("User" in line or "Assistant" in line):
            if current:
                text = " ".join(current).strip()
                if len(text) > 10:
                    messages.append({"role": turn_role, "text": text[:max_block_size]})
            current = []
            turn_role = "user"

        elif raw.startswith("*[step-start"):
            if current:
                text = " ".join(current).strip()
                if len(text) > 10:
                    messages.append({"role": turn_role, "text": text[:max_block_size]})
                current = []
            turn_role = "assistant"

        elif raw.startswith("*[") and raw.endswith("*"):
            if current:
                text = " ".join(current).strip()
                if len(text) > 10:
                    messages.append({"role": turn_role, "text": text[:max_block_size]})
                current = []

        elif raw.startswith("#### ") or raw.startswith("<") or raw.startswith(">"):
            continue

        elif raw.startswith("💭") or raw == "**Reasoning:**":
            continue

        elif raw.startswith("*") and not raw.startswith("**"):
            continue

        else:
            current.append(raw)

    if current:
        text = " ".join(current).strip()
        if len(text) > 10:
            messages.append({"role": turn_role, "text": text[:max_block_size]})

    messages = [m for m in messages if m.get("text")]
    if max_messages is not None:
        return messages[-max_messages:]
    return messages


# ─── Lake Writer ────────────────────────────────────────────────────────────

def write_to_lake(project_root, config, data, window_name, permanent=True):
    dt_format = config["lake"]["datetime_format"]
    date_format = config["lake"]["date_format"]
    now = datetime.datetime.now()
    date_str = now.strftime(date_format)
    dt_str = now.strftime(dt_format)

    manifest = generate_manifest(data, window_name, date_str)
    lake_root = os.path.join(project_root, "context_lake")

    latest_json = os.path.join(lake_root, "latest.json")
    latest_md = os.path.join(lake_root, "latest.md")

    if permanent:
        entry_name_template = config.get("entry_name_template", "{datetime}_{window_name}")
        entry_name = entry_name_template.format(datetime=dt_str, window_name=window_name)
        lake_base = os.path.join(project_root, "context_lake", "lake")
        date_dir = os.path.join(lake_base, date_str)
        os.makedirs(date_dir, exist_ok=True)
        entry_dir = os.path.join(date_dir, entry_name)
        os.makedirs(entry_dir, exist_ok=True)

        context_path = os.path.join(entry_dir, "context.json")
        with open(context_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

        manifest_path = os.path.join(entry_dir, "manifest.md")
        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(manifest)

        entry_ref = os.path.relpath(entry_dir, lake_root).replace("\\", "/")
    else:
        entry_dir = "latest"
        entry_ref = "latest"

    conv = data.get("conversation_last") or {}
    conv_summary = conv.get("summary") or {}

    with open(latest_json, "w", encoding="utf-8") as f:
        json.dump({
            "latest_entry": entry_ref,
            "window_name": window_name,
            "captured_at": data.get("project", {}).get("captured_at", ""),
            "git_branch": data.get("project", {}).get("git", {}).get("branch"),
            "git_sha": data.get("project", {}).get("git", {}).get("head_short_sha"),
            "last_commit": data.get("project", {}).get("git", {}).get("last_commit_msg"),
            "conversation": {
                "file": conv.get("filename"),
                "exchanges": conv_summary.get("exchanges", 0),
                "goal": conv_summary.get("goal", "")[:200],
                "last_query": conv_summary.get("last_user_query", "")[:200],
                "last_response": conv_summary.get("last_assistant_summary", "")[:200],
                "topics": conv_summary.get("topics", []),
                "done_mentions": conv_summary.get("done_mentions", 0),
                "pending_mentions": conv_summary.get("pending_mentions", 0),
                "messages": len(conv.get("last_messages", [])),
            } if conv else None,
            "state_files": [
                {"path": s["path"], "summary": extract_summary(s.get("content", {}))}
                for s in data.get("state_files", [])
            ],
            "agent_count": len(data.get("agents", {})),
            "recent_sessions": [
                {"agent": s.get("agent"), "title": s.get("title", "")[:60],
                 "tokens": s.get("tokens_input", 0) + s.get("tokens_output", 0),
                 "timestamp": (s.get("timestamp") or "")[:19]}
                for s in data.get("opencode_sessions", [])[:5]
            ],
        }, f, indent=2, default=str)

    with open(latest_md, "w", encoding="utf-8") as f:
        f.write(manifest)

    return entry_dir


def generate_manifest(data, window_name, date_str):
    proj = data.get("project", {})
    agents = data.get("agents", {})
    sessions = data.get("opencode_sessions", [])
    state_files = data.get("state_files", [])
    conversations = data.get("conversations", [])
    git_log = data.get("git_log", [])

    lines = []
    lines.append(f"# Context Lake Entry — {date_str}")
    lines.append(f"")
    lines.append(f"**Window:** {window_name}")
    lines.append(f"**Project:** {proj.get('project_name', 'unknown')}")
    lines.append(f"**Captured At:** {proj.get('captured_at', 'unknown')}")
    lines.append(f"")

    git = proj.get("git")
    if git:
        lines.append(f"## Git State")
        lines.append(f"- **Branch:** {git.get('branch', 'N/A')}")
        lines.append(f"- **HEAD:** {git.get('head_short_sha', 'N/A')}")
        lines.append(f"- **Last Commit:** {git.get('last_commit_msg', 'N/A')}")
        if git.get("remote_url"):
            lines.append(f"- **Remote:** {git['remote_url']}")
        lines.append(f"")

    if agents:
        lines.append(f"## Agent Configs ({len(agents)} found)")
        for aid, ainfo in sorted(agents.items()):
            desc = ainfo.get("description", "no description")
            lines.append(f"- **{aid}**: {desc}")
        lines.append(f"")

    if state_files:
        lines.append(f"## State Files ({len(state_files)} found)")
        for sf in state_files:
            content = sf.get("content", {})
            status = content.get("status") or content.get("pipeline_control", {}).get("dashboard_summary", {}).get("overall_progress_pct", "?")
            lines.append(f"- **{sf['path']}** → status: {status}")
        lines.append(f"")

    if sessions:
        lines.append(f"## Recent OpenCode Sessions (last {len(sessions)})")
        lines.append(f"| Session | Agent | Model | Tokens | Cost | Timestamp |")
        lines.append(f"|---------|-------|-------|--------|------|-----------|")
        for s in sessions[:10]:
            title = s.get("title", "")[:40]
            cost_str = f"${s.get('cost', 0):.6f}"
            t = s.get("timestamp", "")[:19]
            lines.append(
                f"| {s.get('session_id', '?')[:12]}... | {s.get('agent', '?')} | "
                f"{s.get('model', '?')} | {s.get('tokens_input', 0) + s.get('tokens_output', 0)} | "
                f"{cost_str} | {t} |"
            )
        lines.append(f"")

    if git_log:
        lines.append(f"## Recent Commits (last {len(git_log)})")
        for entry in git_log[:5]:
            short_sha = entry.get("sha", "")[:8]
            date = (entry.get("date", "")[:19] if entry.get("date") else "?")
            msg = entry.get("message", "")[:80]
            lines.append(f"- `{short_sha}` {date} — {msg}")
        lines.append(f"")

    if conversations:
        lines.append(f"## Conversation Files ({len(conversations)} recent)")
        for c in conversations[:10]:
            lines.append(f"- {c['filename']} ({c.get('size_bytes', 0)} bytes, modified {c.get('modified_at', '')[:19]})")
        lines.append(f"")

    conv_last = data.get("conversation_last")
    if conv_last:
        summary = conv_last.get("summary") or {}
        lines.append(f"## Session Summary")
        lines.append(f"**File:** {conv_last.get('filename', '?')}")
        lines.append(f"**Exchanges:** {summary.get('exchanges', 0)} (user + assistant turns)")
        if summary.get("goal"):
            lines.append(f"**Goal:** {summary['goal']}")
        if summary.get("topics"):
            lines.append(f"**Topics:** {', '.join(summary['topics'])}")
        lines.append(f"**Done mentions:** {summary.get('done_mentions', 0)} | **Pending mentions:** {summary.get('pending_mentions', 0)}")
        lines.append(f"")
        if summary.get("last_user_query"):
            lines.append(f"### Last User Query")
            lines.append(f"{summary['last_user_query']}")
            lines.append(f"")
        if summary.get("last_assistant_summary"):
            lines.append(f"### Last Assistant Response")
            lines.append(f"{summary['last_assistant_summary']}")
            lines.append(f"")

    lines.append(f"---")
    lines.append(f"_Generated by context_lake/capture.py_")
    return "\n".join(lines)


# ─── Main Capture Function ─────────────────────────────────────────────────

def capture(project_root, window_name=None, permanent=True):
    config = load_config(project_root)

    if not window_name:
        window_name = detect_window_name(project_root)

    eprint(f"[context_lake] Capturing context for window: {window_name}")

    data = {
        "capture_version": "1.0",
        "window_name": window_name,
        "project": discover_project(project_root),
    }

    db_paths = discover_opencode_db_paths(config)
    all_sessions = []
    for dbp in db_paths:
        sessions = read_opencode_sessions(dbp)
        all_sessions.extend(sessions)
    all_sessions.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
    data["opencode_sessions"] = all_sessions[:100]

    data["state_files"] = discover_state_files(project_root, config)
    data["agents"] = discover_agent_configs(project_root, config)
    data["conversations"] = discover_conversations(project_root, config)
    data["git_log"] = capture_git_log(project_root, config)

    conv_content = capture_latest_conversation_content(project_root, config)
    if conv_content:
        data["conversation_last"] = conv_content

    entry_dir = write_to_lake(project_root, config, data, window_name, permanent=permanent)

    label = "Permanent entry" if permanent else "Latest snapshot"
    summary = {
        "window_name": window_name,
        "entry_dir": os.path.relpath(entry_dir, project_root) if entry_dir != "latest" else "latest (in-place)",
        "permanent": permanent,
        "sessions_captured": len(all_sessions),
        "state_files_found": len(data["state_files"]),
        "agent_configs_found": len(data["agents"]),
        "conversations_found": len(data["conversations"]),
        "conversation_messages": len(conv_content.get("last_messages", [])) if conv_content else 0,
        "git_commits": len(data["git_log"]) if data["git_log"] else 0,
    }

    eprint(f"[context_lake] {label}: {summary['entry_dir']}")
    return summary


# ─── Watch Mode ─────────────────────────────────────────────────────────────

def run_watch(project_root, interval_minutes, window_name=None):
    interval_seconds = interval_minutes * 60
    cycle = 0

    eprint(f"[context_lake] Watch mode started — capturing every {interval_minutes} min(s)")
    eprint(f"[context_lake] Project: {project_root}")
    eprint(f"[context_lake] PID: {os.getpid()}")
    eprint(f"[context_lake] Press Ctrl+C to stop")
    eprint("")

    while True:
        cycle += 1
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        win = window_name or detect_window_name(project_root)
        eprint(f"[{ts}] Capture #{cycle} — window: {win}")

        try:
            summary = capture(project_root, window_name=win, permanent=False)
            eprint(f"[{ts}] Done — {summary['entry_dir']}")
        except Exception as e:
            eprint(f"[{ts}] Capture failed: {e}")

        next_time = datetime.datetime.now() + datetime.timedelta(seconds=interval_seconds)
        eprint(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Next capture at {next_time.strftime('%H:%M:%S')}")

        try:
            time.sleep(interval_seconds)
        except KeyboardInterrupt:
            eprint(f"\n[context_lake] Watch stopped after {cycle} capture(s)")
            break


# ─── CLI ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Context Lake — generic cross-session context capture engine"
    )
    parser.add_argument(
        "--window", "-w",
        default=None,
        help="Window/session name (auto-detected if omitted)"
    )
    parser.add_argument(
        "--project-root", "-r",
        default=".",
        help="Project root directory (default: current dir)"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output summary as JSON (for programmatic use)"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Run in watch mode - capture context every N minutes (default: 2)"
    )
    parser.add_argument(
        "--interval", "-i",
        type=float,
        default=None,
        help="Capture interval in minutes (default: 2, configurable in config.json watch.interval_minutes)"
    )

    args = parser.parse_args()
    project_root = os.path.abspath(args.project_root)

    if args.watch:
        config = load_config(project_root)
        interval = args.interval or config.get("watch", {}).get("interval_minutes", 2)
        run_watch(project_root, interval, window_name=args.window)
        return

    summary = capture(project_root, window_name=args.window)

    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print(f"\n{'=' * 50}")
        print(f"Context Lake Capture Summary")
        print(f"{'=' * 50}")
        print(f"  Window:         {summary['window_name']}")
        print(f"  Entry:          {summary['entry_dir']}/")
        print(f"  Sessions:       {summary['sessions_captured']}")
        print(f"  State Files:    {summary['state_files_found']}")
        print(f"  Agent Configs:  {summary['agent_configs_found']}")
        print(f"  Conversations:  {summary['conversations_found']}")
        print(f"  Git Commits:    {summary['git_commits']}")
        print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
