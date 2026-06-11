import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ROOT = process.cwd();
const DAG_FILE = '00_state_ledger/WORKFLOW_DAG.json';

export async function GET(req: NextRequest) {
    try {
        const fp = path.join(ROOT, DAG_FILE);
        if (!fs.existsSync(fp)) {
            return NextResponse.json({ error: 'WORKFLOW_DAG.json not found' }, { status: 404 });
        }
        const raw = fs.readFileSync(fp, 'utf-8');
        const dag = JSON.parse(raw);

        const nodeId = req.nextUrl.searchParams.get('node');
        const phase = req.nextUrl.searchParams.get('phase');

        if (nodeId && dag.nodes[nodeId]) {
            return NextResponse.json({ node: dag.nodes[nodeId] });
        }

        if (phase) {
            const phaseNodes = Object.entries(dag.nodes)
                .filter(([, n]: any) => n.phase === phase)
                .map(([id, n]) => ({ id, ...n as any }));
            return NextResponse.json({ phase, nodes: phaseNodes, count: phaseNodes.length });
        }

        // Return full DAG with computed next-to-walk
        const entryPoints = dag.edges.validation.entry_nodes;
        const computeWalkOrder = () => {
            const visited = new Set<string>();
            const order: string[] = [];
            const queue = [...entryPoints];
            while (queue.length > 0) {
                const id = queue.shift()!;
                if (visited.has(id)) continue;
                visited.add(id);
                order.push(id);
                const node = dag.nodes[id];
                if (node) {
                    // Add next_on_success nodes
                    for (const next of node.next_on_success || []) {
                        if (!visited.has(next)) queue.push(next);
                    }
                    // Add fork targets
                    for (const fork of node.forks || []) {
                        if (!visited.has(fork)) queue.push(fork);
                    }
                }
            }
            return order;
        };

        const walkOrder = computeWalkOrder();

        return NextResponse.json({
            version: dag.version,
            description: dag.description,
            nodes: dag.nodes,
            edges: dag.edges,
            entryPoints,
            terminalNodes: dag.edges.validation.terminal_nodes,
            forkPoints: dag.edges.validation.fork_points,
            conditionalPoints: dag.edges.validation.conditional_points,
            walkOrder,
            nodeCount: Object.keys(dag.nodes).length,
            acyclic: dag.edges.validation.acyclic,
        });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}