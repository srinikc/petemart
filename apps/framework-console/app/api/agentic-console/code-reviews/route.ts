import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const owner = request.nextUrl.searchParams.get('owner') || 'srinikc';
    const repo = request.nextUrl.searchParams.get('repo') || 'petemart';
    const prNumber = request.nextUrl.searchParams.get('pr_number');

    if (!prNumber) {
        return NextResponse.json({ reviews: [], error: 'pr_number query parameter is required' });
    }

    try {
        const output = execSync(`gh pr view ${prNumber} --json reviews,comments`, {
            encoding: 'utf-8',
            timeout: 15000,
            cwd: frameworkRoot(),
        }).trim();

        const data = JSON.parse(output || '{}');
        const reviews = (data.reviews || []).map((r: any) => ({
            reviewer: r.author?.login || 'unknown',
            state: r.state,
            body: r.body || '',
            submitted_at: r.submittedAt || null,
        }));

        return NextResponse.json({ reviews, source: 'github' });
    } catch (err: any) {
        return NextResponse.json({
            reviews: [],
            source: 'fallback',
            message: 'GitHub CLI unavailable or PR not found. Install gh CLI to enable code review data.',
        });
    }
}
