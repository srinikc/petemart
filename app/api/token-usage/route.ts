import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CSV_PATH = path.join(process.cwd(), 'agent_token_usage_log.csv');

interface TokenSession {
  session_id: string;
  agent: string;
  model: string;
  title: string;
  tokens_input: number;
  tokens_output: number;
  tokens_reasoning: number;
  tokens_cache_read: number;
  tokens_cache_write: number;
  cost: number;
  timestamp: string;
}

export async function GET() {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return NextResponse.json({
        sessions: [],
        summary: {
          total_sessions: 0,
          total_tokens_input: 0,
          total_tokens_output: 0,
          total_cost: 0,
          by_agent: {},
          by_model: {},
        },
      });
    }

    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.trim().split('\n');

    if (lines.length < 2) {
      return NextResponse.json({
        sessions: [],
        summary: {
          total_sessions: 0,
          total_tokens_input: 0,
          total_tokens_output: 0,
          total_cost: 0,
          by_agent: {},
          by_model: {},
        },
      });
    }

    const headers = lines[0].split(',');
    const sessions: TokenSession[] = lines.slice(1).map(line => {
      const vals = line.split(',');
      return {
        session_id: vals[0] || '',
        agent: vals[1] || '',
        model: vals[2] || '',
        title: vals[3] || '',
        tokens_input: parseInt(vals[4] || '0', 10),
        tokens_output: parseInt(vals[5] || '0', 10),
        tokens_reasoning: parseInt(vals[6] || '0', 10),
        tokens_cache_read: parseInt(vals[7] || '0', 10),
        tokens_cache_write: parseInt(vals[8] || '0', 10),
        cost: parseFloat(vals[9] || '0'),
        timestamp: vals[10] || '',
      };
    }).filter(s => s.tokens_input > 0 || s.tokens_output > 0);

    const byAgent: Record<string, { sessions: number; tokens_input: number; tokens_output: number; cost: number }> = {};
    const byModel: Record<string, { sessions: number; tokens_input: number; tokens_output: number; cost: number }> = {};

    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;

    for (const s of sessions) {
      totalInput += s.tokens_input;
      totalOutput += s.tokens_output;
      totalCost += s.cost;

      const agent = s.agent || 'unknown';
      if (!byAgent[agent]) byAgent[agent] = { sessions: 0, tokens_input: 0, tokens_output: 0, cost: 0 };
      byAgent[agent].sessions++;
      byAgent[agent].tokens_input += s.tokens_input;
      byAgent[agent].tokens_output += s.tokens_output;
      byAgent[agent].cost += s.cost;

      const model = s.model || 'unknown';
      if (!byModel[model]) byModel[model] = { sessions: 0, tokens_input: 0, tokens_output: 0, cost: 0 };
      byModel[model].sessions++;
      byModel[model].tokens_input += s.tokens_input;
      byModel[model].tokens_output += s.tokens_output;
      byModel[model].cost += s.cost;
    }

    const agentChart = Object.entries(byAgent)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.tokens_input - a.tokens_input);

    const modelChart = Object.entries(byModel)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.tokens_input - a.tokens_input);

    return NextResponse.json({
      sessions,
      summary: {
        total_sessions: sessions.length,
        total_tokens_input: totalInput,
        total_tokens_output: totalOutput,
        total_cost: totalCost,
        by_agent: byAgent,
        by_model: byModel,
        agent_chart: agentChart,
        model_chart: modelChart,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
