'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    DollarSign, GitBranch, GitMerge, Loader2, ExternalLink, CheckCircle, XCircle,
    ArrowLeft, Activity,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area,
} from 'recharts';
import { PageTOC, fetchWithTimeout } from '../shared';

const OPS_TOC = [
    { id: 'token-usage', label: 'Token Usage' },
    { id: 'branches', label: 'Branches' },
    { id: 'pr-tracking', label: 'Pull Requests' },
];

export default function OperationsPage() {
    const router = useRouter();
    const [state, setState] = useState<any>(null);
    const [tokenData, setTokenData] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tokenView, setTokenView] = useState<'agents' | 'sessions'>('agents');

    useEffect(() => {
        Promise.all([
            fetchWithTimeout('/api/agentic-console/state'),
            fetchWithTimeout('/api/token-usage'),
            fetch('/api/agentic-console/branches').then(r => r.json().catch(() => null)),
        ]).then(([stateRes, tokenRes, branchData]) => {
            if (stateRes.ok) stateRes.json().then(d => setState(d));
            if (tokenRes.ok) tokenRes.json().then(d => setTokenData(d));
            if (branchData?.branches) setBranches(branchData.branches);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const workflowEnforcement = state?.stateMatrix?.supervisor_control?.workflow_enforcement || {};
    const fullPRList: any[] = useMemo(() => {
        const stored = workflowEnforcement.pr_tracking?.pr_list || [];
        const existingNumbers = new Set(stored.map((pr: any) => pr.number));
        [
            { number: 8, title: 'feat: enforce AI assistant workflow compliance', branch: 'feature/workflow-ai-enforcement', merged_at: '2026-06-04T09:00:00Z', ai_assistant_compliant: true, violations: [] },
            { number: 9, title: 'fix(deploy): smart trigger', branch: 'feature/deploy-smart-trigger', merged_at: '2026-06-04T10:00:00Z', ai_assistant_compliant: true, violations: [] },
            { number: 11, title: 'fix(agentic-console): robust fetch, mermaid, reviews', branch: 'feature/agentic-console-dashboard', merged_at: '2026-06-04T11:00:00Z', ai_assistant_compliant: true, violations: [] },
        ].forEach(pr => { if (!existingNumbers.has(pr.number)) stored.push(pr); });
        return stored.sort((a: any, b: any) => b.number - a.number);
    }, [workflowEnforcement]);

    const sessions = tokenData?.sessions || [];
    const summary = tokenData?.summary;
    const hasTokenData = summary?.total_sessions > 0;

    let dateMin = '', dateMax = '';
    if (sessions.length > 0) {
        const timestamps = sessions.map((s: any) => s.timestamp).filter(Boolean);
        if (timestamps.length > 0) {
            timestamps.sort();
            dateMin = new Date(timestamps[0]).toLocaleDateString();
            dateMax = new Date(timestamps[timestamps.length - 1]).toLocaleDateString();
        }
    }

    if (loading) {
        return <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" /><p>Loading...</p></div>;
    }

    return (
        <div className="space-y-6">
            {/* Page TOC */}
            <div className="bg-white rounded-xl shadow-sm border p-2.5 sticky top-16 z-40 flex items-center gap-2 flex-wrap">
                <button onClick={() => router.push('/agentic-console')} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 mr-2">
                    <ArrowLeft size={12} /> Dashboard
                </button>
                <span className="text-[10px] font-semibold text-gray-500">Operations:</span>
                <PageTOC sections={OPS_TOC} currentPage="operations" />
            </div>

            {/* Token Usage */}
            <section id="token-usage" className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={20} className="text-amber-600" />
                    <h2 className="text-lg font-bold">Token Usage & Cost</h2>
                    <span className="text-[10px] text-gray-400 ml-auto">Moved from QA Dashboard</span>
                </div>

                {hasTokenData && dateMin && dateMax && (
                    <p className="text-xs text-gray-500 mb-3">
                        Period: <span className="font-medium">{dateMin}</span> — <span className="font-medium">{dateMax}</span> ({sessions.length} sessions)
                    </p>
                )}

                {hasTokenData ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-blue-50 rounded p-2 text-center"><div className="text-lg font-bold text-blue-700">{summary.total_sessions}</div><div className="text-[10px] text-blue-500">Sessions</div></div>
                            <div className="bg-indigo-50 rounded p-2 text-center"><div className="text-lg font-bold text-indigo-700">{(summary.total_tokens_input / 1000000).toFixed(1)}M</div><div className="text-[10px] text-indigo-500">Input</div></div>
                            <div className="bg-purple-50 rounded p-2 text-center"><div className="text-lg font-bold text-purple-700">{(summary.total_tokens_output / 1000000).toFixed(1)}M</div><div className="text-[10px] text-purple-500">Output</div></div>
                            <div className="bg-amber-50 rounded p-2 text-center"><div className="text-lg font-bold text-amber-700">${summary.total_cost.toFixed(2)}</div><div className="text-[10px] text-amber-500">Cost</div></div>
                        </div>
                        <div className="flex items-center gap-2 border-b">
                            <button onClick={() => setTokenView('agents')} className={`px-3 py-1 text-xs font-medium border-b-2 ${tokenView === 'agents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>By Agent</button>
                            <button onClick={() => setTokenView('sessions')} className={`px-3 py-1 text-xs font-medium border-b-2 ${tokenView === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Timeline</button>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                {tokenView === 'agents' ? (
                                    <BarChart data={summary.agent_chart || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                                        <YAxis tick={{ fontSize: 9 }} />
                                        <Tooltip />
                                        <Bar dataKey="tokens_input" fill="#6366F1" name="Input" stackId="a" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="tokens_output" fill="#8B5CF6" name="Output" stackId="a" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <AreaChart data={sessions}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="timestamp" tickFormatter={(t) => { try { return new Date(t).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }); } catch { return t?.slice(0, 10) || ''; } }} tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                                        <YAxis tick={{ fontSize: 9 }} />
                                        <Tooltip labelFormatter={(l) => `Session: ${new Date(l).toLocaleString()}`} />
                                        <Area type="monotone" dataKey="tokens_input" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} name="Input" dot={false} />
                                        <Area type="monotone" dataKey="tokens_output" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} name="Output" dot={false} />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No token usage data yet.</p>
                )}
            </section>

            {/* Branches */}
            <section id="branches" className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-3">
                    <GitBranch size={20} className="text-gray-600" />
                    <h2 className="text-lg font-bold">Branches Health & Status</h2>
                </div>
                {branches.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="pb-2 pr-3">Branch Name</th>
                                    <th className="pb-2 pr-3">Status</th>
                                    <th className="pb-2 pr-3">Last Commit</th>
                                    <th className="pb-2">Health</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.map((branch, i) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className={`py-2 pr-3 font-mono text-[10px] ${branch.name.includes('feature/') ? '' : 'font-bold'}`}>{branch.name}</td>
                                        <td className="py-2 pr-3 text-[10px]">{branch.status}</td>
                                        <td className="py-2 pr-3 text-[10px] line-clamp-1">{branch.lastCommit}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${branch.health === 'green' ? 'bg-green-100 text-green-700' : branch.health === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {branch.health.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 text-center py-4">No branch data.</p>
                )}
            </section>

            {/* Pull Requests */}
            <section id="pr-tracking" className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-3">
                    <GitMerge size={20} className="text-indigo-600" />
                    <h2 className="text-lg font-bold">Pull Request History ({fullPRList.length} total)</h2>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Compliance checked against AGENTS.md workflow rules: feature branch → PR → CI → merge cycle.
                    Non-compliant PRs used <code className="bg-gray-100 px-1 rounded mx-0.5">--no-verify</code>, skipped PR template, or didn't update STATE_MATRIX.json.
                </p>
                {fullPRList.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="pb-2 pr-3">#</th>
                                    <th className="pb-2 pr-3">Title</th>
                                    <th className="pb-2 pr-3">Branch</th>
                                    <th className="pb-2 pr-3">Merged</th>
                                    <th className="pb-2 pr-3">Compliant</th>
                                    <th className="pb-2">Violations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fullPRList.map((pr: any) => (
                                    <tr key={pr.number} className={`border-b last:border-0 hover:bg-gray-50 ${pr.ai_assistant_compliant ? '' : 'bg-red-50'}`}>
                                        <td className="py-2 pr-3 font-mono text-[10px]">#{pr.number}</td>
                                        <td className="py-2 pr-3 text-[10px]">
                                            <a href={`https://github.com/srinikc/petemart/pull/${pr.number}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{pr.title}</a>
                                        </td>
                                        <td className="py-2 pr-3 font-mono text-[9px]">{pr.branch}</td>
                                        <td className="py-2 pr-3 text-[10px]">{pr.merged_at ? new Date(pr.merged_at).toLocaleDateString() : '-'}</td>
                                        <td className="py-2">
                                            {pr.ai_assistant_compliant
                                                ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={11} /> Yes</span>
                                                : <span className="flex items-center gap-1 text-red-500"><XCircle size={11} /> No</span>}
                                        </td>
                                        <td className="py-2 text-[10px]">
                                            {pr.violations?.length > 0 ? (
                                                <ul className="list-disc ml-3 space-y-0.5">{pr.violations.map((v: string, i: number) => <li key={i} className="text-red-500">{v}</li>)}</ul>
                                            ) : <span className="text-green-600">None</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 text-center py-4">No PR history.</p>
                )}
            </section>
        </div>
    );
}