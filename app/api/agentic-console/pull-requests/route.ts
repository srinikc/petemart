import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const output = execSync('gh pr list --state all --limit 50 --json number,title,headRefName,baseRefName,state,mergeCommit,createdAt,mergedAt,reviews,latestChecks', {
            encoding: 'utf-8',
            timeout: 15000,
            cwd: process.cwd(),
        }).trim();

        const prs = JSON.parse(output || '[]');
        const enriched = prs.map((pr: any) => ({
            number: pr.number,
            title: pr.title,
            branch: pr.headRefName,
            base: pr.baseRefName,
            state: pr.state,
            merged_at: pr.mergedAt || pr.mergeCommit?.committedDate || null,
            created_at: pr.createdAt,
            ci_status: getCheckStatus(pr.latestChecks),
            review_status: getReviewStatus(pr.reviews),
            url: `https://github.com/srinikc/petemart/pull/${pr.number}`,
        }));

        return NextResponse.json({ pull_requests: enriched });
    } catch (err: any) {
        return NextResponse.json({
            pull_requests: [],
            error: err.message,
            source: 'fallback',
        });
    }
}

function getCheckStatus(checks: any[] | null): string {
    if (!checks || checks.length === 0) return 'pending';
    const concluded = checks.filter((c: any) => c.conclusion);
    if (concluded.some((c: any) => c.conclusion === 'failure' || c.conclusion === 'cancelled')) return 'failure';
    if (concluded.every((c: any) => c.conclusion === 'success')) return 'success';
    return 'pending';
}

function getReviewStatus(reviews: any[] | null): string {
    if (!reviews || reviews.length === 0) return 'none';
    const states = reviews.map((r: any) => r.state);
    if (states.includes('APPROVED')) return 'approved';
    if (states.includes('CHANGES_REQUESTED')) return 'changes_requested';
    return 'commented';
}
