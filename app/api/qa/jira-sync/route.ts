import { NextRequest, NextResponse } from 'next/server';
import { loadDefects, exportToJiraFormat } from '@/app/api/qa/defect-tracker';

export async function POST(req: NextRequest) {
  try {
    const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

    const defects = loadDefects();
    const openDefects = defects.filter((d) => d.status === 'open');
    const jiraPayloads = exportToJiraFormat(openDefects);

    if (!dryRun) {
      console.log(`[JIRA_SYNC] Would create ${jiraPayloads.length} issues in project PETEMART`);
    }

    return NextResponse.json({
      dryRun,
      totalOpenDefects: openDefects.length,
      totalIssuesToSync: jiraPayloads.length,
      project: 'PETEMART',
      payloads: jiraPayloads,
      preview: jiraPayloads.map((p: any) => ({
        summary: p.fields.summary,
        issuetype: p.fields.issuetype.name,
        priority: p.fields.priority.name,
        labels: p.fields.labels.filter(Boolean),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
