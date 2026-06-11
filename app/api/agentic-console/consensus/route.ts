import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const DEBATES_FILE = '00_state_ledger/debates.jsonl';

type DebateSession = {
    debate_id: string;
    topic: string;
    opener_agent: string;
    responder_agent: string;
    position: string;
    arguments: string;
    stake: string;
    requires_consensus: boolean;
    status: 'open' | 'responded' | 'resolved' | 'escalated';
    opened_at: string;
    responded_at: string | null;
    resolved_at: string | null;
    response: {
        position: string;
        counter_arguments: string;
        agreed_points: string;
        vote: string;
        vote_reason: string;
        suggested_compromise: string;
    } | null;
    resolution: {
        outcome: string;
        final_position: string;
        consensus_score: number;
        resolution_summary: string;
        escalated_to: string;
    } | null;
};

function readDebates(): DebateSession[] {
    const fp = path.join(ROOT, DEBATES_FILE);
    try {
        if (!fs.existsSync(fp)) return [];
        const raw = fs.readFileSync(fp, 'utf-8').trim();
        if (!raw) return [];
        return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
    } catch { return []; }
}

function appendDebate(d: DebateSession) {
    const fp = path.join(ROOT, DEBATES_FILE);
    try {
        const dir = path.dirname(fp);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(fp, JSON.stringify(d) + '\n', 'utf-8');
    } catch { }
}

function overwriteDebates(debates: DebateSession[]) {
    const fp = path.join(ROOT, DEBATES_FILE);
    try {
        fs.writeFileSync(fp, debates.map(d => JSON.stringify(d)).join('\n') + '\n', 'utf-8');
    } catch { }
}

export async function GET(req: NextRequest) {
    try {
        const debateId = req.nextUrl.searchParams.get('debate_id');
        const agentId = req.nextUrl.searchParams.get('agentId');
        const status = req.nextUrl.searchParams.get('status');
        let debates = readDebates();

        if (debateId) debates = debates.filter(d => d.debate_id === debateId);
        if (agentId) debates = debates.filter(d => d.opener_agent === agentId || d.responder_agent === agentId);
        if (status) debates = debates.filter(d => d.status === status);

        // Sort by opened_at descending
        debates.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());

        return NextResponse.json({ debates, count: debates.length });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'open_debate') {
            const { opener_agent, responder_agent, topic, position, arguments: args, stake, requires_consensus } = body;
            if (!opener_agent || !responder_agent || !topic || !position || !args) {
                return NextResponse.json({ error: 'opener_agent, responder_agent, topic, position, and arguments required' }, { status: 400 });
            }

            const debate: DebateSession = {
                debate_id: `debate-${crypto.randomUUID().split('-')[0]}`,
                topic,
                opener_agent,
                responder_agent,
                position,
                arguments: args,
                stake: stake || '',
                requires_consensus: requires_consensus ?? true,
                status: 'open',
                opened_at: new Date().toISOString(),
                responded_at: null,
                resolved_at: null,
                response: null,
                resolution: null,
            };

            appendDebate(debate);

            // Also log as A2A message
            try {
                const msg = {
                    message_id: `msg-${crypto.randomUUID().split('-')[0]}`,
                    from_agent: opener_agent,
                    to_agent: responder_agent,
                    subject: `Debate: ${topic}`,
                    body: args,
                    a2a_type: 'DebateOpen',
                    a2a_payload: { debate_id: debate.debate_id, topic, position },
                    status: 'delivered',
                    timestamp: new Date().toISOString(),
                };
                const msgFp = path.join(ROOT, '00_state_ledger/AGENT_MESSAGES.jsonl');
                if (fs.existsSync(path.dirname(msgFp))) {
                    fs.appendFileSync(msgFp, JSON.stringify(msg) + '\n', 'utf-8');
                }
            } catch { }

            return NextResponse.json({ success: true, debate });
        }

        if (action === 'respond_debate') {
            const { debate_id, position, counter_arguments, agreed_points, vote, vote_reason, suggested_compromise } = body;
            if (!debate_id || !position || !vote) {
                return NextResponse.json({ error: 'debate_id, position, and vote required' }, { status: 400 });
            }

            const debates = readDebates();
            const idx = debates.findIndex(d => d.debate_id === debate_id && d.status === 'open');
            if (idx === -1) {
                return NextResponse.json({ error: 'Open debate not found' }, { status: 404 });
            }

            debates[idx].status = 'responded';
            debates[idx].responded_at = new Date().toISOString();
            debates[idx].response = {
                position,
                counter_arguments: counter_arguments || '',
                agreed_points: agreed_points || '',
                vote,
                vote_reason: vote_reason || '',
                suggested_compromise: suggested_compromise || '',
            };

            // Auto-resolve: approval or rejection
            if (vote === 'APPROVE') {
                debates[idx].status = 'resolved';
                debates[idx].resolved_at = new Date().toISOString();
                debates[idx].resolution = {
                    outcome: 'CONSENSUS_REACHED',
                    final_position: debates[idx].position,
                    consensus_score: 100,
                    resolution_summary: `Debate resolved. ${debates[idx].responder_agent} voted ${vote} on topic "${debates[idx].topic}". Reason: ${vote_reason || 'No reason given'}`,
                    escalated_to: '',
                };
            } else if (vote === 'REJECT') {
                debates[idx].status = 'escalated';
                debates[idx].resolved_at = new Date().toISOString();
                debates[idx].resolution = {
                    outcome: 'ESCALATED',
                    final_position: suggested_compromise || debates[idx].position,
                    consensus_score: 0,
                    resolution_summary: `Debate escalated. ${debates[idx].responder_agent} rejected proposal. Suggested compromise: ${suggested_compromise || 'None'}`,
                    escalated_to: 'human_gatekeeper',
                };
            } else {
                // ABSTAIN — keep open for another responder
            }

            overwriteDebates(debates);

            // Log as A2A message
            try {
                const msg = {
                    message_id: `msg-${crypto.randomUUID().split('-')[0]}`,
                    from_agent: debates[idx].responder_agent,
                    to_agent: debates[idx].opener_agent,
                    subject: `Debate Response: ${debates[idx].topic}`,
                    body: counter_arguments || vote_reason || '',
                    a2a_type: 'DebateResponse',
                    a2a_payload: { debate_id, vote, position },
                    status: 'delivered',
                    timestamp: new Date().toISOString(),
                };
                const msgFp = path.join(ROOT, '00_state_ledger/AGENT_MESSAGES.jsonl');
                if (fs.existsSync(path.dirname(msgFp))) {
                    fs.appendFileSync(msgFp, JSON.stringify(msg) + '\n', 'utf-8');
                }
            } catch { }

            return NextResponse.json({ success: true, debate: debates[idx] });
        }

        if (action === 'resolve_debate') {
            const { debate_id, outcome, final_position, consensus_score, resolution_summary, escalated_to } = body;
            if (!debate_id || !outcome || !final_position) {
                return NextResponse.json({ error: 'debate_id, outcome, and final_position required' }, { status: 400 });
            }

            const debates = readDebates();
            const idx = debates.findIndex(d => d.debate_id === debate_id);
            if (idx === -1) {
                return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
            }

            debates[idx].status = outcome === 'CONSENSUS_REACHED' ? 'resolved' : 'escalated';
            debates[idx].resolved_at = new Date().toISOString();
            debates[idx].resolution = {
                outcome,
                final_position,
                consensus_score: consensus_score ?? 50,
                resolution_summary: resolution_summary || '',
                escalated_to: escalated_to || '',
            };

            overwriteDebates(debates);

            return NextResponse.json({ success: true, debate: debates[idx] });
        }

        return NextResponse.json({ error: 'Unknown action. Use: open_debate, respond_debate, resolve_debate' }, { status: 400 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}