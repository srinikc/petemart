import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Execute git branch command to get all branches with last commit info
        const branchesOutput = execSync('git branch -a --format="%(refname:short)|%(upstream:track)|%(subject)"', {
            encoding: 'utf-8',
            timeout: 10000,
            cwd: process.cwd(),
        }).trim();

        const lines = branchesOutput.split('\n').filter(Boolean);
        const branches = lines.map(line => {
            const [name, tracking, subject] = line.split('|');
            const isRemote = name.startsWith('remotes/');
            const branchName = isRemote ? name.replace('remotes/origin/', '') : name;

            // Skip remote HEAD
            if (branchName === 'HEAD' || name === 'remotes/origin/HEAD') return null;

            let status = isRemote ? '⬆ Remote' : '⬆ Local';
            let health: 'green' | 'amber' | 'red' = 'green';

            // Determine health based on branch name patterns
            if (name === 'main' || name === 'origin/main' || name === 'remotes/origin/main') {
                status = '✅ Protected (Production)';
                health = 'green';
            } else if (name === 'develop' || name === 'origin/develop' || name === 'remotes/origin/develop') {
                status = '✅ Protected (Base)';
                health = 'green';
            } else if (tracking?.includes('behind')) {
                status = '⚠️ Behind upstream';
                health = 'amber';
            } else if (tracking?.includes('ahead')) {
                status = '⬆ Ahead of upstream';
                health = 'green';
            } else if (name.startsWith('feature/')) {
                status = isRemote ? '⬆ Remote feature' : '⬆ Local feature';
                health = 'green';
            }

            return {
                name: branchName,
                status,
                lastCommit: subject?.trim() || 'N/A',
                health,
            };
        }).filter(Boolean);

        // Deduplicate (prefer local over remote)
        const uniqueBranches: Record<string, any> = {};
        branches.forEach((b: any) => {
            if (b && !uniqueBranches[b.name]) {
                uniqueBranches[b.name] = b;
            }
        });

        const sortedBranches = Object.values(uniqueBranches).sort((a: any, b: any) => {
            const priority = ['main', 'develop'];
            const ai = priority.indexOf(a.name);
            const bi = priority.indexOf(b.name);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({ branches: sortedBranches });
    } catch (err: any) {
        // Fallback to derived data if git command fails
        return NextResponse.json({
            branches: [
                { name: 'main', status: '✅ Protected (Production)', lastCommit: 'Production branch', health: 'green' },
                { name: 'develop', status: '✅ Protected (Base)', lastCommit: 'Active development', health: 'green' },
                { name: 'feature/agentic-console-dashboard', status: '⬆ Current branch', lastCommit: 'Active', health: 'green' },
            ],
            error: err.message,
        });
    }
}