import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const JIRA_BASE = process.env.JIRA_BASE_URL || '';
const JIRA_TOKEN = process.env.JIRA_TOKEN || '';
const JIRA_PROJECT = process.env.JIRA_PROJECT || 'PETEMART';

// Map agent status to Jira transitions
const STATUS_TRANSITIONS: Record<string, { fromStatus: string; toStatus: string; transitionId?: string }> = {
  'approved': { fromStatus: 'In Progress', toStatus: 'Done', transitionId: '41' },
  'completed': { fromStatus: 'In Progress', toStatus: 'Done', transitionId: '41' },
  'in_progress': { fromStatus: 'Selected for Development', toStatus: 'In Progress', transitionId: '11' },
  'failed': { fromStatus: 'In Progress', toStatus: 'To Do', transitionId: '131' },
  'awaiting_approval': { fromStatus: 'In Progress', toStatus: 'In Review', transitionId: '121' },
};

// Agent → Jira issue key mapping (stored in state ledger)
const JIRA_MAPPING_FILE = '00_state_ledger/jira_agent_mapping.json';

function readMapping(): Record<string, string> {
  const fp = path.join(ROOT, JIRA_MAPPING_FILE);
  try {
    if (!fs.existsSync(fp)) return {};
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch { return {}; }
}

function writeMapping(mapping: Record<string, string>) {
  const fp = path.join(ROOT, JIRA_MAPPING_FILE);
  try {
    fs.writeFileSync(fp, JSON.stringify(mapping, null, 2), 'utf-8');
  } catch { }
}

async function transitionIssue(issueKey: string, transitionId: string): Promise<boolean> {
  if (!JIRA_BASE || !JIRA_TOKEN) return false;
  try {
    const auth = Buffer.from(JIRA_TOKEN).toString('base64');
    const res = await fetch(`${JIRA_BASE}/rest/api/3/issue/${issueKey}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ transition: { id: transitionId } }),
    });
    return res.ok || res.status === 204;
  } catch { return false; }
}

function readIssueKeysFromEvents(): string[] {
  const eventsPath = path.join(ROOT, '00_state_ledger/PIPELINE_EVENTS.jsonl');
  if (!fs.existsSync(eventsPath)) return [];
  const issueKeys: Set<string> = new Set();
  const lines = fs.readFileSync(eventsPath, 'utf-8').split('\n').filter(Boolean);
  for (const line of lines.slice(-200)) {
    try {
      const ev = JSON.parse(line);
      if (ev.jira_issue_key) issueKeys.add(ev.jira_issue_key);
    } catch { }
  }
  return Array.from(issueKeys);
}

// Sync log
const SYNC_LOG_FILE = '00_state_ledger/jira_sync_log.jsonl';

function appendSyncLog(entry: any) {
  const fp = path.join(ROOT, SYNC_LOG_FILE);
  try {
    const dir = path.dirname(fp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(fp, JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n', 'utf-8');
  } catch { }
}

export async function GET() {
  if (!JIRA_BASE || !JIRA_TOKEN) {
    return NextResponse.json({
      configured: false,
      message: 'JIRA_BASE_URL and JIRA_TOKEN not configured in .env.local',
      issues: [],
      total: 0,
      mapping: readMapping(),
    });
  }

  try {
    const auth = Buffer.from(JIRA_TOKEN).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const jql = encodeURIComponent(`project=${JIRA_PROJECT} ORDER BY updated DESC`);
    const url = `${JIRA_BASE}/rest/api/3/search?jql=${jql}&maxResults=50&fields=summary,issuetype,status,priority,created,updated,assignee`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        error: `Jira API returned ${res.status}`,
        issues: [],
        total: 0,
        mapping: readMapping(),
      });
    }

    const data = await res.json();
    const issues = (data.issues || []).map((issue: any) => ({
      id: issue.key,
      summary: issue.fields.summary,
      type: issue.fields.issuetype?.name || 'Unknown',
      status: issue.fields.status?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'None',
      created: issue.fields.created,
      updated: issue.fields.updated,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      url: `${JIRA_BASE}/browse/${issue.key}`,
    }));

    return NextResponse.json({
      configured: true,
      project: JIRA_PROJECT,
      issues,
      total: issues.length,
      mapping: readMapping(),
      syncLogCount: fs.existsSync(path.join(ROOT, SYNC_LOG_FILE))
        ? fs.readFileSync(path.join(ROOT, SYNC_LOG_FILE), 'utf-8').split('\n').filter(Boolean).length
        : 0,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      configured: true,
      error: err instanceof Error ? err.message : 'Unknown error',
      issues: [],
      total: 0,
      mapping: readMapping(),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, agentId, targetStatus, issueKey } = body;

    if (action === 'sync') {
      // Manual sync: read state and transition matching issues
      const mapping = readMapping();
      const statePath = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
      if (!fs.existsSync(statePath)) {
        return NextResponse.json({ error: 'State file not found' }, { status: 404 });
      }
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      const agents = state.agent_states || {};
      let transitionsAttempted = 0;
      let transitionsSucceeded = 0;

      for (const [id, agent] of Object.entries(agents)) {
        const status = (agent as any).status;
        const mappedIssueKey = mapping[id] || issueKey;

        if (mappedIssueKey && STATUS_TRANSITIONS[status]) {
          const transition = STATUS_TRANSITIONS[status];
          transitionsAttempted++;
          const ok = await transitionIssue(mappedIssueKey, transition.transitionId!);
          if (ok) transitionsSucceeded++;
          appendSyncLog({
            agentId: id,
            issueKey: mappedIssueKey,
            fromStatus: (agent as any).status,
            transitionId: transition.transitionId,
            success: ok,
          });
        }
      }

      return NextResponse.json({
        success: true,
        transitionsAttempted,
        transitionsSucceeded,
        configured: !!(JIRA_BASE && JIRA_TOKEN),
        syncLogCount: transitionsAttempted,
      });
    }

    if (action === 'map_agent') {
      if (!agentId || !issueKey) {
        return NextResponse.json({ error: 'agentId and issueKey required' }, { status: 400 });
      }
      const mapping = readMapping();
      mapping[agentId] = issueKey;
      writeMapping(mapping);
      return NextResponse.json({ success: true, mapping });
    }

    if (action === 'transition') {
      if (!issueKey || !targetStatus) {
        return NextResponse.json({ error: 'issueKey and targetStatus required' }, { status: 400 });
      }
      const transition = Object.values(STATUS_TRANSITIONS).find(
        t => t.toStatus === targetStatus
      );
      if (!transition?.transitionId) {
        return NextResponse.json({ error: `No transition found for status ${targetStatus}` }, { status: 400 });
      }
      const ok = await transitionIssue(issueKey, transition.transitionId);
      appendSyncLog({ action: 'manual_transition', issueKey, targetStatus, transitionId: transition.transitionId, success: ok });
      return NextResponse.json({ success: ok, issueKey, targetStatus });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}