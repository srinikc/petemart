import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const JIRA_BASE = process.env.JIRA_BASE_URL || '';
const JIRA_TOKEN = process.env.JIRA_TOKEN || '';
const JIRA_PROJECT = process.env.JIRA_PROJECT || 'PETEMART';

export async function GET() {
  if (!JIRA_BASE || !JIRA_TOKEN) {
    return NextResponse.json({
      configured: false,
      message: 'JIRA_BASE_URL and JIRA_TOKEN not configured in .env.local',
      issues: [],
      total: 0,
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
    });
  } catch (err: unknown) {
    return NextResponse.json({
      configured: true,
      error: err instanceof Error ? err.message : 'Unknown error',
      issues: [],
      total: 0,
    });
  }
}
