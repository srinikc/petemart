import sqlite3, json, csv, os, datetime, sys

DB_PATH = os.path.expanduser(r"~/.local/share/opencode/opencode.db")
LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agent_token_usage_log.csv")

def get_all_sessions():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT id, agent, model, tokens_input, tokens_output, tokens_reasoning,
               tokens_cache_read, tokens_cache_write, cost, time_created, title
        FROM session
        ORDER BY time_created
    """)
    rows = c.fetchall()
    conn.close()
    return rows

def load_logged_ids():
    if not os.path.exists(LOG_FILE):
        return set()
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["session_id"] for row in reader}

def append_to_log(sessions, logged_ids):
    fieldnames = [
        "session_id", "agent", "model", "title",
        "tokens_input", "tokens_output", "tokens_reasoning",
        "tokens_cache_read", "tokens_cache_write",
        "cost", "timestamp"
    ]
    file_exists = os.path.exists(LOG_FILE)
    new_rows = []

    for s in sessions:
        sid = s[0]
        if sid in logged_ids:
            continue
        model_str = s[2]
        try:
            model_data = json.loads(model_str) if model_str else {}
            model_name = model_data.get("id", model_str or "N/A")
        except (json.JSONDecodeError, TypeError):
            model_name = model_str or "N/A"

        ts_ms = s[9]
        if ts_ms:
            dt = datetime.datetime.fromtimestamp(ts_ms / 1000)
            timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
        else:
            timestamp = "N/A"

        new_rows.append({
            "session_id": sid,
            "agent": s[1] or "N/A",
            "model": model_name,
            "title": (s[10] or "")[:80],
            "tokens_input": s[3] or 0,
            "tokens_output": s[4] or 0,
            "tokens_reasoning": s[5] or 0,
            "tokens_cache_read": s[6] or 0,
            "tokens_cache_write": s[7] or 0,
            "cost": round(s[8] or 0, 6),
            "timestamp": timestamp,
        })

    if not new_rows:
        print(f"No new sessions to log. Total logged: {len(logged_ids)}")
        return

    mode = "a" if file_exists else "w"
    with open(LOG_FILE, mode, encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerows(new_rows)

    print(f"Appended {len(new_rows)} new session(s) to {LOG_FILE}")
    print(f"Total sessions in log: {len(logged_ids) + len(new_rows)}")

    total_in = sum(r["tokens_input"] for r in new_rows)
    total_out = sum(r["tokens_output"] for r in new_rows)
    total_reason = sum(r["tokens_reasoning"] for r in new_rows)
    total_cache = sum(r["tokens_cache_read"] for r in new_rows)
    total_cost = sum(r["cost"] for r in new_rows)
    print(f"  New: {total_in:,} in + {total_out:,} out + {total_reason:,} reasoning = {total_in + total_out + total_reason:,} tokens | cache: {total_cache:,} | cost: ${total_cost:.4f}")

if __name__ == "__main__":
    sessions = get_all_sessions()
    logged_ids = load_logged_ids()
    append_to_log(sessions, logged_ids)
