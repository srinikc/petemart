import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'qa-dashboard', '.run-status.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      return NextResponse.json({
        status: 'idle',
        tier: null,
        started_at: null,
        completed_at: null,
        progress: 'No test run in progress',
        results_url: '/api/qa/results/latest',
        run_id: null,
      });
    }

    const content = fs.readFileSync(STATUS_FILE, 'utf-8');
    const data = JSON.parse(content);

    // If completed or failed and older than 10 minutes, auto-clean
    if (data.status === 'completed' || data.status === 'failed') {
      const completedAt = data.completed_at ? new Date(data.completed_at).getTime() : 0;
      if (Date.now() - completedAt > 600000) { // 10 min
        try {
          fs.unlinkSync(STATUS_FILE);
        } catch {}
        return NextResponse.json({
          status: 'idle',
          tier: null,
          started_at: null,
          completed_at: null,
          progress: 'No test run in progress',
          results_url: '/api/qa/results/latest',
          run_id: null,
        });
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      status: 'idle',
      tier: null,
      started_at: null,
      completed_at: null,
      progress: 'Error reading status',
      results_url: '/api/qa/results/latest',
      run_id: null,
      error: err.message,
    });
  }
}
