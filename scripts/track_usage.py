"""
track_usage.py — Token Usage Logger

Reads opencode's local SQLite database and appends new sessions
to agent_token_usage_log.csv in the project root.

Usage:
    python scripts/track_usage.py

The supervisor agent (00) runs this after EVERY agent cycle.
"""

import csv
import json
import os
import sqlite3
from datetime import datetime, timezone

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_FILE = os.path.join(PROJECT_ROOT, "agent_token_usage_log.csv")

# Possible opencode SQLite DB locations
DB_CANDIDATES = [
    os.path.expanduser("~/.config/opencode/opencode.db"),
    os.path.expanduser("~/.opencode/opencode.db"),
    os.path.join(PROJECT_ROOT, ".opencode", "opencode.db"),
]


def find_db():
    for path in DB_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


def read_opencode_sessions(db_path):
    """Read session data from opencode SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check available tables
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
                LIMIT 50
            """
            )
            for row in cursor.fetchall():
                sessions.append(
                    {
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
                        "timestamp": row[10] or datetime.now(timezone.utc).strftime(
                            "%Y-%m-%d %H:%M:%S"
                        ),
                    }
                )

        conn.close()
        return sessions
    except Exception as e:
        print(f"[track_usage] Warning: Could not read opencode DB: {e}")
        return []


def append_to_log(sessions):
    """Append new sessions to the CSV log file."""
    fieldnames = [
        "session_id",
        "agent",
        "model",
        "title",
        "tokens_input",
        "tokens_output",
        "tokens_reasoning",
        "tokens_cache_read",
        "tokens_cache_write",
        "cost",
        "timestamp",
    ]

    # Read existing session IDs to avoid duplicates
    existing_ids = set()
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing_ids.add(row.get("session_id", ""))
        except Exception:
            pass

    new_count = 0
    mode = "a" if os.path.exists(LOG_FILE) else "w"
    with open(LOG_FILE, mode, newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)

        if mode == "w":
            writer.writeheader()

        for session in sessions:
            if session["session_id"] not in existing_ids:
                writer.writerow(session)
                existing_ids.add(session["session_id"])
                new_count += 1

    return new_count


def main():
    db_path = find_db()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    if not db_path:
        print("[track_usage] No opencode SQLite database found.")
        print("[track_usage] Appending manual session entry for tracking continuity.")
        manual_entry = {
            "session_id": f"manual_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            "agent": os.environ.get("OPENCODE_AGENT_ID", "08_qa_agent"),
            "model": os.environ.get("OPENCODE_MODEL", "deepseek-v4-flash-free"),
            "title": "QA Agent v2.0 — E2E Automation Framework & Dashboard",
            "tokens_input": 0,
            "tokens_output": 0,
            "tokens_reasoning": 0,
            "tokens_cache_read": 0,
            "tokens_cache_write": 0,
            "cost": 0,
            "timestamp": now,
        }
        append_to_log([manual_entry])
        print(f"[track_usage] Manual entry logged for 08_qa_agent")
        return

    sessions = read_opencode_sessions(db_path)
    if not sessions:
        print("[track_usage] No new sessions found in database.")
        # Still append a manual tracking entry
        manual_entry = {
            "session_id": f"manual_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            "agent": os.environ.get("OPENCODE_AGENT_ID", "08_qa_agent"),
            "model": os.environ.get("OPENCODE_MODEL", "deepseek-v4-flash-free"),
            "title": "QA Agent v2.0 — E2E Automation Framework & Dashboard",
            "tokens_input": 0,
            "tokens_output": 0,
            "tokens_reasoning": 0,
            "tokens_cache_read": 0,
            "tokens_cache_write": 0,
            "cost": 0,
            "timestamp": now,
        }
        append_to_log([manual_entry])
        return

    new_count = append_to_log(sessions)
    print(f"[track_usage] Logged {new_count} new session(s) to {LOG_FILE}")
    print(f"[track_usage] Total sessions in log: {len(sessions)}")


if __name__ == "__main__":
    main()
