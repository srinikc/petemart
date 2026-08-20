import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const EVAL_FILE = '00_state_ledger/EVAL_RULES.json';

export async function GET(req: NextRequest) {
    try {
        const fp = path.join(ROOT, EVAL_FILE);
        if (!fs.existsSync(fp)) {
            return NextResponse.json({ error: 'EVAL_RULES.json not found' }, { status: 404 });
        }
        const raw = fs.readFileSync(fp, 'utf-8');
        const data = JSON.parse(raw);
        const agentId = req.nextUrl.searchParams.get('agentId');

        if (agentId && data.rules[agentId]) {
            const rules = data.rules[agentId] as any[];
            const totalWeight = rules.reduce((sum: number, r: any) => sum + (r.weight || 0), 0);
            return NextResponse.json({
                agentId,
                rules,
                totalWeight,
                maxScore: totalWeight,
                ruleCount: rules.length,
            });
        }

        // Return all rules grouped by agent
        const allScores: Record<string, { ruleCount: number; totalWeight: number; rules: any[] }> = {};
        for (const [id, rules] of Object.entries(data.rules)) {
            const r = rules as any[];
            allScores[id] = {
                ruleCount: r.length,
                totalWeight: r.reduce((sum, rule) => sum + (rule.weight || 0), 0),
                rules: r,
            };
        }

        return NextResponse.json({
            version: data.version,
            description: data.description,
            agents: allScores,
            totalRules: Object.values(data.rules).flat().length,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}