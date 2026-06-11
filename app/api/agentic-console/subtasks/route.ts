import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const SUBTASKS_FILE = '00_state_ledger/subtasks.jsonl';

type SubTask = {
    subtask_id: string;
    parent_agent_id: string;
    child_agent_id: string;
    task_description: string;
    input_artifacts: string[];
    expected_output: string;
    status: 'spawned' | 'in_progress' | 'completed' | 'failed';
    spawned_at: string;
    completed_at: string | null;
    result_summary: string | null;
    output_artifacts: string[];
    error_details: string | null;
    duration_ms: number | null;
    depth: number;
};

function readSubtasks(): SubTask[] {
    const fp = path.join(ROOT, SUBTASKS_FILE);
    try {
        if (!fs.existsSync(fp)) return [];
        const raw = fs.readFileSync(fp, 'utf-8').trim();
        if (!raw) return [];
        return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
    } catch { return []; }
}

function appendSubtask(st: SubTask) {
    const fp = path.join(ROOT, SUBTASKS_FILE);
    try {
        const dir = path.dirname(fp);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(fp, JSON.stringify(st) + '\n', 'utf-8');
    } catch { }
}

function overwriteSubtasks(subtasks: SubTask[]) {
    const fp = path.join(ROOT, SUBTASKS_FILE);
    try {
        fs.writeFileSync(fp, subtasks.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf-8');
    } catch { }
}

export async function GET(req: NextRequest) {
    try {
        const parentId = req.nextUrl.searchParams.get('parent_id');
        const childId = req.nextUrl.searchParams.get('child_id');
        const subtaskId = req.nextUrl.searchParams.get('subtask_id');
        const status = req.nextUrl.searchParams.get('status');

        let subtasks = readSubtasks();
        if (parentId) subtasks = subtasks.filter(s => s.parent_agent_id === parentId);
        if (childId) subtasks = subtasks.filter(s => s.child_agent_id === childId);
        if (subtaskId) subtasks = subtasks.filter(s => s.subtask_id === subtaskId);
        if (status) subtasks = subtasks.filter(s => s.status === status);

        // Build tree structure if parent requested
        const buildTree = (parent: string, depth = 0): any[] => {
            const children = subtasks.filter(s => s.parent_agent_id === parent);
            return children.map(c => ({
                ...c,
                depth,
                children: buildTree(c.child_agent_id, depth + 1),
            }));
        };

        if (parentId && req.nextUrl.searchParams.get('tree') === 'true') {
            const tree = buildTree(parentId);
            return NextResponse.json({
                parentAgentId: parentId,
                tree,
                totalCount: subtasks.length,
                maxDepth: Math.max(...subtasks.map(s => s.depth), 0),
            });
        }

        subtasks.sort((a, b) => new Date(b.spawned_at).getTime() - new Date(a.spawned_at).getTime());
        return NextResponse.json({ subtasks, count: subtasks.length });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'spawn') {
            const { parent_agent_id, child_agent_id, task_description, input_artifacts, expected_output, a2a_message_id } = body;
            if (!parent_agent_id || !child_agent_id || !task_description) {
                return NextResponse.json({ error: 'parent_agent_id, child_agent_id, and task_description required' }, { status: 400 });
            }

            // Calculate depth
            const existingSubtasks = readSubtasks();
            const parentSubtasks = existingSubtasks.filter(s => s.child_agent_id === parent_agent_id);
            const depth = parentSubtasks.length > 0
                ? Math.max(...parentSubtasks.map(s => s.depth)) + 1
                : 0;

            const subtask: SubTask = {
                subtask_id: `subtask-${crypto.randomUUID().split('-')[0]}`,
                parent_agent_id,
                child_agent_id,
                task_description,
                input_artifacts: input_artifacts || [],
                expected_output: expected_output || '',
                status: 'spawned',
                spawned_at: new Date().toISOString(),
                completed_at: null,
                result_summary: null,
                output_artifacts: [],
                error_details: null,
                duration_ms: null,
                depth,
            };

            appendSubtask(subtask);

            // Log as A2A message
            try {
                const msg = {
                    message_id: `msg-${crypto.randomUUID().split('-')[0]}`,
                    from_agent: parent_agent_id,
                    to_agent: child_agent_id,
                    subject: `Subtask: ${task_description.slice(0, 80)}`,
                    body: task_description,
                    a2a_type: 'DelegateSubTask',
                    a2a_payload: {
                        task_id: subtask.subtask_id,
                        task_description,
                        input_artifacts: input_artifacts || [],
                        expected_output: expected_output || '',
                    },
                    status: 'delivered',
                    timestamp: new Date().toISOString(),
                    artifact_ref: (input_artifacts || []).join(', '),
                };
                const msgFp = path.join(ROOT, '00_state_ledger/AGENT_MESSAGES.jsonl');
                if (fs.existsSync(path.dirname(msgFp))) {
                    fs.appendFileSync(msgFp, JSON.stringify(msg) + '\n', 'utf-8');
                }
            } catch { }

            return NextResponse.json({ success: true, subtask });
        }

        if (action === 'complete') {
            const { subtask_id, status, result_summary, output_artifacts, error_details } = body;
            if (!subtask_id || !status) {
                return NextResponse.json({ error: 'subtask_id and status required' }, { status: 400 });
            }

            const subtasks = readSubtasks();
            const idx = subtasks.findIndex(s => s.subtask_id === subtask_id);
            if (idx === -1) {
                return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
            }

            const startedAt = new Date(subtasks[idx].spawned_at).getTime();
            subtasks[idx].status = status === 'completed' ? 'completed' : 'failed';
            subtasks[idx].completed_at = new Date().toISOString();
            subtasks[idx].result_summary = result_summary || null;
            subtasks[idx].output_artifacts = output_artifacts || [];
            subtasks[idx].error_details = error_details || null;
            subtasks[idx].duration_ms = Date.now() - startedAt;

            overwriteSubtasks(subtasks);

            // Log result as A2A SubTaskResult
            try {
                const msg = {
                    message_id: `msg-${crypto.randomUUID().split('-')[0]}`,
                    from_agent: subtasks[idx].child_agent_id,
                    to_agent: subtasks[idx].parent_agent_id,
                    subject: `Subtask Result: ${subtasks[idx].task_description.slice(0, 80)}`,
                    body: result_summary || '',
                    a2a_type: 'SubTaskResult',
                    a2a_payload: {
                        task_id: subtask_id,
                        status: subtasks[idx].status,
                        result_summary: result_summary || '',
                        output_artifacts: output_artifacts || [],
                        error_details: error_details || null,
                        duration_ms: subtasks[idx].duration_ms,
                    },
                    status: 'delivered',
                    timestamp: new Date().toISOString(),
                };
                const msgFp = path.join(ROOT, '00_state_ledger/AGENT_MESSAGES.jsonl');
                if (fs.existsSync(path.dirname(msgFp))) {
                    fs.appendFileSync(msgFp, JSON.stringify(msg) + '\n', 'utf-8');
                }
            } catch { }

            return NextResponse.json({ success: true, subtask: subtasks[idx] });
        }

        return NextResponse.json({ error: 'Unknown action. Use: spawn, complete' }, { status: 400 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}