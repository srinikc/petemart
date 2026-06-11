'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Code, CheckCircle, XCircle, Loader2, Shield, GitBranch,
    AlertCircle, Clock, FileText, Layers as LayersIcon, Zap, ArrowLeft,
    ExternalLink, Activity, BarChart3, Bug, ScrollText, Search,
    ChevronRight, RefreshCw,
} from 'lucide-react';
import {
    AgentState, StatusBadge, fetchWithTimeout,
} from '../shared';

function GoNoGoBadge({ decision }: { decision: 'go' | 'no-go' | null | undefined }) {
    if (decision === 'go') {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-300">GO <CheckCircle size={16} /></span>;
    }
    if (decision === 'no-go') {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-300">NO-GO <XCircle size={16} /></span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600 border border-gray-300">PENDING <Clock size={16} /></span>;
}

type TabId = 'kpis' | 'tests' | 'defects';

function ReqQualityBadge({ status }: { status: 'green' | 'yellow' | 'red' }) {
    const colors = { green: 'bg-green-100 text-green-800 border-green-300', yellow: 'bg-amber-100 text-amber-800 border-amber-300', red: 'bg-red-100 text-red-800 border-red-300' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[status]}`}>{status.toUpperCase()}</span>;
}

export default function QualityPage() {
    const router = useRouter();
    const [state, setState] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [qaResults, setQaResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('kpis');

    useEffect(() => {
        Promise.all([
            fetchWithTimeout('/api/agentic-console/state'),
            fetch('/api/qa/reviews').then(r => r.json().catch(() => null)),
            fetch('/api/qa/results').then(r => r.json().catch(() => null)),
        ]).then(([stateRes, reviewData, qaData]) => {
            if (stateRes.ok) stateRes.json().then(d => setState(d));
            if (reviewData?.reviews) {
                setReviews(reviewData.reviews.map((r: any) => ({
                    agent: r.agent_id || 'Unknown',
                    reviewer: r.reviewer_role || '-',
                    findings_count: r.findings_count ?? r.findings?.length ?? 0,
                    fixes_count: r.fixes_count ?? 0,
                    pr_number: r.pr_number || null,
                    review_gate: r.review_gate_passed ? 'pass' : 'fail',
                    fix_gate: r.fix_gate_passed ? 'pass' : 'fail',
                })));
            }
            if (qaData) setQaResults(qaData);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const agentStates: Record<string, AgentState> = state?.stateMatrix?.agent_states || {};
    const loopGuardrails = state?.stateMatrix?.supervisor_control?.loop_guardrails || {};
    const workflowEnforcement = state?.stateMatrix?.supervisor_control?.workflow_enforcement || {};
    const pipelineStrategy = state?.stateMatrix?.supervisor_control?.pipeline_strategy || {};

    const summary = qaResults?.summary;
    const testTypes: any[] = Array.isArray(qaResults?.testTypes) ? qaResults.testTypes : [];
    const gates: any[] = Array.isArray(qaResults?.qualityGates) ? qaResults.qualityGates : [];

    const openItems = useMemo(() => {
        const items: Array<{ type: 'agent' | string; data: any }> = [];
        Object.values(agentStates).filter((a: AgentState) => a.status === 'awaiting_approval' || a.status === 'failed' || a.last_error)
            .forEach(a => items.push({ type: 'agent', data: a }));
        return items;
    }, [agentStates]);

    const allGatesPassed = gates.length > 0 && gates.every((g: any) => g.status === 'pass');
    const goNoGoDecision = gates.length > 0 ? (allGatesPassed ? 'go' as const : 'no-go' as const) : null;
    const implementedCount = testTypes.filter((t: any) => t.status === 'implemented').length;
    const totalTestTypes = testTypes.length;

    const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
        { id: 'kpis', label: 'Quality KPIs', icon: <Activity size={16} /> },
        { id: 'tests', label: 'Test Results', icon: <ScrollText size={16} /> },
        { id: 'defects', label: 'Defects & Reviews', icon: <Bug size={16} /> },
    ];

    // Derive Req Quality Status from test types
    const reqQualityMap = useMemo(() => {
        const map: Record<string, { total: number; passed: number; status: 'green' | 'yellow' | 'red' }> = {};
        const reqMapping: Record<string, string[]> = {
            'REQ-UI': ['component', 'visual-regression', 'accessibility'],
            'REQ-API': ['api-contract', 'integration'],
            'REQ-BE': ['unit', 'data-integrity', 'migration'],
            'REQ-COM': ['e2e', 'checkout-flow'],
            'REQ-INFRA': ['load', 'deployment'],
            'REQ-PERF': ['performance', 'benchmark'],
            'REQ-DATA': ['security', 'encryption'],
            'REQ-FUNNEL': ['analytics', 'funnel'],
            'REQ-MAINT': ['rollback', 'backup'],
            'REQ-MICRO': ['merchant-microsite'],
            'REQ-DR': ['disaster-recovery'],
        };
        for (const [reqId, testTypeIds] of Object.entries(reqMapping)) {
            let total = 0, passed = 0;
            for (const tt of testTypes) {
                if (testTypeIds.includes(tt.id)) {
                    total += tt.total || 0;
                    passed += tt.passed || 0;
                }
            }
            if (total > 0) {
                const rate = total > 0 ? (passed / total) * 100 : 0;
                const status = rate >= 90 ? 'green' : rate >= 70 ? 'yellow' : 'red';
                map[reqId] = { total, passed, status };
            }
        }
        return map;
    }, [testTypes]);

    if (loading) {
        return <div className="text-center py-20"><Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-base text-gray-500">Loading Quality Dashboard...</p></div>;
    }

    return (
        <div className="space-y-6 text-sm">
            {/* Header + Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 pb-0 flex items-center gap-3 flex-wrap">
                    <button onClick={() => router.push('/agentic-console')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium shrink-0">
                        <ArrowLeft size={14} /> Dashboard
                    </button>
                    <span className="text-xs font-semibold text-gray-500 shrink-0">Quality:</span>
                    <div className="flex gap-1 flex-1 min-w-0">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                                    activeTab === t.id
                                        ? 'text-indigo-700 border-indigo-600 bg-indigo-50'
                                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                }`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    <a href="/qa-dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto font-medium shrink-0">
                        <ExternalLink size={14} /> Full QA Dashboard
                    </a>
                </div>

                {/* ─── TAB: KPIs ──────────────────────────────────── */}
                {activeTab === 'kpis' && (
                    <div className="p-4 space-y-4">
                        {summary ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setActiveTab('tests')} title="Click for test details">
                                        <div className="text-2xl font-bold text-blue-700">{summary.totalTests}</div>
                                        <div className="text-xs text-blue-500 font-medium">Total Tests</div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setActiveTab('tests')} title="Click for test details">
                                        <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                                        <div className="text-xs text-green-500 font-medium">Passed</div>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setActiveTab('tests')} title="Click for test details">
                                        <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
                                        <div className="text-xs text-red-500 font-medium">Failed</div>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setActiveTab('tests')} title="Click for detailed traceability">
                                        <div className="text-2xl font-bold text-amber-600">{summary.passRate}%</div>
                                        <div className="text-xs text-amber-500 font-medium">Pass Rate</div>
                                    </div>
                                    <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
                                        <div className="text-2xl font-bold text-indigo-600">{summary.qualityGatesPassed}/{summary.qualityGatesTotal}</div>
                                        <div className="text-xs text-indigo-500 font-medium">Gates Passed</div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setActiveTab('defects')} title="Click for defect details">
                                        <div className="text-2xl font-bold text-purple-600">{summary.totalDefects}</div>
                                        <div className="text-xs text-purple-500 font-medium">Defects</div>
                                    </div>
                                </div>

                                {/* Go/No-Go + Test Coverage */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg border p-4">
                                        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                                            <Shield size={18} className="text-amber-600" />
                                            Release Go / No-Go Status
                                        </h3>
                                        <div className="flex items-center gap-3 mb-2">
                                            <GoNoGoBadge decision={goNoGoDecision} />
                                            <span className="text-sm text-gray-500">
                                                {gates.length > 0
                                                    ? `${gates.filter((g: any) => g.status === 'pass').length}/${gates.length} quality gates passed`
                                                    : 'No gates configured'}
                                            </span>
                                        </div>
                                        {gates.length > 0 && (
                                            <div className="space-y-1.5 mt-2">
                                                {gates.map((g: any) => (
                                                    <div key={g.id} className="flex items-center gap-2 text-sm">
                                                        {g.status === 'pass'
                                                            ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                                                            : <XCircle size={16} className="text-red-400 shrink-0" />}
                                                        <span className="text-gray-700">{g.name}</span>
                                                        <span className="text-xs text-gray-400 ml-auto">{g.description}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg border p-4">
                                        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                                            <BarChart3 size={18} className="text-blue-600" />
                                            Test Coverage Summary
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Test Types Implemented</span>
                                                <span className="font-bold">{implementedCount}/{totalTestTypes}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Open Defects</span>
                                                <span className={`font-bold ${summary.openDefects > 0 ? 'text-red-600' : 'text-green-600'}`}>{summary.openDefects}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Fixed Defects</span>
                                                <span className="font-bold text-green-600">{summary.fixedDefects}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Duration</span>
                                                <span className="font-bold">{(summary.durationMs / 1000).toFixed(1)}s</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Last Updated</span>
                                                <span className="font-bold text-xs">{qaResults.lastUpdated ? new Date(qaResults.lastUpdated).toLocaleString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ Req Quality Status ═══ */}
                                <div className="bg-white rounded-lg border p-4">
                                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                        <Search size={18} className="text-indigo-600" />
                                        Requirement Quality Status
                                        <span className="text-xs text-gray-400 font-normal ml-auto">
                                            Quality per REQ category from test results
                                        </span>
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-gray-500">
                                                    <th className="pb-2 pr-3 font-medium">Requirement Category</th>
                                                    <th className="pb-2 pr-3 font-medium text-right">Total Tests</th>
                                                    <th className="pb-2 pr-3 font-medium text-right">Passed</th>
                                                    <th className="pb-2 pr-3 font-medium text-right">Pass Rate</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(reqQualityMap).map(([reqId, info]) => {
                                                    const rate = info.total > 0 ? Math.round((info.passed / info.total) * 100) : 0;
                                                    return (
                                                        <tr key={reqId} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                                                            onClick={() => router.push(`/qa-dashboard?req=${reqId}`)}>
                                                            <td className="py-2 pr-3 font-mono text-sm">{reqId}</td>
                                                            <td className="py-2 pr-3 text-right">{info.total}</td>
                                                            <td className="py-2 pr-3 text-right text-green-600">{info.passed}</td>
                                                            <td className="py-2 pr-3 text-right font-mono">{rate}%</td>
                                                            <td className="py-2"><ReqQualityBadge status={info.status} /></td>
                                                        </tr>
                                                    );
                                                })}
                                                {Object.keys(reqQualityMap).length === 0 && (
                                                    <tr><td colSpan={5} className="py-4 text-center text-gray-400">No requirement mapping data available</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Green ≥ 90% | Yellow 70-89% | Red &lt; 70% — Click any row for detailed traceability
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Activity size={40} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">QA results not available.</p>
                                <a href="/qa-dashboard" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Go to QA Dashboard →</a>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: Tests ─────────────────────────────────── */}
                {activeTab === 'tests' && (
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ScrollText size={20} className="text-blue-600" />
                            <h2 className="text-lg font-bold">Test Results by Type</h2>
                            <a href="/qa-dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto">
                                <ExternalLink size={14} /> Full QA Dashboard
                            </a>
                        </div>
                        {testTypes.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500">
                                            <th className="pb-2 pr-3 font-medium">Test Type</th>
                                            <th className="pb-2 pr-3 font-medium text-right">Total</th>
                                            <th className="pb-2 pr-3 font-medium text-right">Passed</th>
                                            <th className="pb-2 pr-3 font-medium text-right">Failed</th>
                                            <th className="pb-2 pr-3 font-medium text-right">Blocked</th>
                                            <th className="pb-2 pr-3 font-medium text-right">Coverage</th>
                                            <th className="pb-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testTypes.map((tt: any) => {
                                            const runPct = tt.total > 0 ? Math.round((tt.passed / tt.total) * 100) : 0;
                                            const statusColor = runPct >= 80 ? 'text-green-600' : runPct >= 50 ? 'text-amber-600' : 'text-red-600';
                                            return (
                                                <tr key={tt.id} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="py-2 pr-3 font-medium">{tt.name}</td>
                                                    <td className="py-2 pr-3 text-right">{tt.total}</td>
                                                    <td className="py-2 pr-3 text-right text-green-600">{tt.passed}</td>
                                                    <td className="py-2 pr-3 text-right text-red-500">{tt.failed || 0}</td>
                                                    <td className="py-2 pr-3 text-right text-gray-400">{tt.blocked || 0}</td>
                                                    <td className={`py-2 pr-3 text-right font-mono ${statusColor}`}>{runPct}%</td>
                                                    <td className="py-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            runPct >= 80 ? 'bg-green-100 text-green-800' : runPct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                                        }`}>{tt.total > 0 ? (tt.passed >= tt.total ? 'PASS' : 'PARTIAL') : 'N/A'}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <ScrollText size={40} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No test type data available.</p>
                            </div>
                        )}

                        {/* Guardrails section - compact below test results */}
                        <div className="bg-gray-50 rounded-lg border p-4 mt-4">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield size={18} className="text-amber-500" /> Pipeline Guardrails</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-gray-400 uppercase">Execution</div>
                                    {[
                                        ['Max exec/agent', `${loopGuardrails.max_sequential_executions_per_agent || 3}`],
                                        ['Max cycles', `${loopGuardrails.max_total_cycles_lifetime || 100}`],
                                        ['Circuit breaker', `${loopGuardrails.circuit_breaker_threshold || 5} failures`],
                                    ].map(([l, v]) => (
                                        <div key={l as string} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-bold">{v as string}</span></div>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-gray-400 uppercase">Branch Workflow</div>
                                    {[
                                        ['Feature branch', workflowEnforcement.feature_branch_required ? '✅' : '❌'],
                                        ['Direct push blocked', workflowEnforcement.direct_push_blocked ? '✅' : '❌'],
                                        ['PR required', workflowEnforcement.pr_required_before_merge ? '✅' : '❌'],
                                    ].map(([l, v]) => (
                                        <div key={l as string} className="flex justify-between"><span className="text-gray-500">{l}</span><span className={`font-bold ${v === '✅' ? 'text-green-600' : 'text-red-600'}`}>{v}</span></div>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-gray-400 uppercase">Halt Strategy</div>
                                    {[
                                        ['Approval gates', pipelineStrategy.halt_at_approval_gates],
                                        ['Expert review', pipelineStrategy.halt_at_expert_review],
                                        ['Production deploy', pipelineStrategy.halt_at_production_deployment],
                                    ].map(([l, enabled]) => (
                                        <div key={l as string} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>{l as string}</span>
                                            <span className={`ml-auto text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-400'}`}>{enabled ? 'HALT' : 'PASS'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB: Defects & Reviews ────────────────────── */}
                {activeTab === 'defects' && (
                    <div className="p-4 space-y-4">
                        {/* Defect summary KPI row */}
                        {summary && (
                            <div className="grid grid-cols-3 gap-3 mb-2">
                                <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                                    <div className="text-xl font-bold text-red-500">{summary.openDefects}</div>
                                    <div className="text-xs text-red-500 font-medium">Open</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                                    <div className="text-xl font-bold text-green-600">{summary.fixedDefects}</div>
                                    <div className="text-xs text-green-500 font-medium">Fixed</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                                    <div className="text-xl font-bold text-purple-600">{summary.totalDefects}</div>
                                    <div className="text-xs text-purple-500 font-medium">Total</div>
                                </div>
                            </div>
                        )}

                        {/* Code Review */}
                        <div className="bg-white rounded-lg border">
                            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                                <Code size={18} className="text-indigo-600" />
                                <h3 className="text-base font-semibold">Code Review Status</h3>
                                <span className="text-xs text-gray-400 ml-auto">Agent 0 enforced</span>
                            </div>
                            {reviews.length > 0 ? (
                                <div className="overflow-x-auto px-4 pb-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-gray-500">
                                                <th className="pb-2 pr-3 font-medium">Agent</th>
                                                <th className="pb-2 pr-3 font-medium">Reviewer</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Findings</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Fixes</th>
                                                <th className="pb-2 pr-3 font-medium">PR #</th>
                                                <th className="pb-2 pr-3 font-medium">Review Gate</th>
                                                <th className="pb-2 font-medium">Fix Gate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.map((r: any, i: number) => (
                                                <tr key={r.agent || i} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="py-2 pr-3 font-mono text-sm">{r.agent}</td>
                                                    <td className="py-2 pr-3 text-sm">{r.reviewer}</td>
                                                    <td className="py-2 pr-3 text-right">{r.findings_count}</td>
                                                    <td className="py-2 pr-3 text-right">{r.fixes_count}</td>
                                                    <td className="py-2 pr-3 text-sm">{r.pr_number ? `#${r.pr_number}` : '-'}</td>
                                                    <td className="py-2 pr-3">{r.review_gate === 'pass' ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-400" />}</td>
                                                    <td className="py-2">{r.fix_gate === 'pass' ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-400" />}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="text-xs text-gray-400 mt-2">Agent 0 enforces review + fix gate before Gatekeeper sign-off.</p>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 px-4 pb-4">
                                    <Code size={32} className="mx-auto mb-1 opacity-50" />
                                    <p className="text-sm">No code review data available.</p>
                                </div>
                            )}
                        </div>

                        {/* Open Items */}
                        <div className="bg-white rounded-lg border">
                            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                                <AlertCircle size={18} className="text-amber-600" />
                                <h3 className="text-base font-semibold">Open Items Awaiting Action</h3>
                            </div>
                            {openItems.length > 0 ? (
                                <div className="space-y-2 px-4 pb-4">
                                    {openItems.map((item, idx) => (
                                        <div key={idx} className="border rounded-lg p-3 flex items-start gap-3 bg-red-50 border-red-200">
                                            {item.data.status === 'failed' || item.data.last_error
                                                ? <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                                                : <Clock size={18} className="text-amber-500 mt-0.5 shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{item.data.agent_id}</span>
                                                    <StatusBadge status={item.data.status} />
                                                </div>
                                                {item.data.last_error && <p className="text-sm text-red-600 mt-1">{item.data.last_error}</p>}
                                                {item.data.notes && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.data.notes}</p>}
                                                <button onClick={() => setSelectedAgent(item.data)} className="text-sm text-blue-600 hover:underline mt-1 font-medium">View details →</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400 px-4 pb-4">
                                    <CheckCircle size={32} className="mx-auto mb-1 opacity-50" />
                                    <p className="text-sm">No open items. All agents resolved.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Agent Detail Modal */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedAgent(null)}>
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">{selectedAgent.agent_id}</h2>
                                <p className="text-sm text-gray-500">{selectedAgent.role}</p>
                            </div>
                            <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-400">Status:</span> <StatusBadge status={selectedAgent.status} /></div>
                                <div><span className="text-gray-400">Phase:</span> <span className="font-medium">{selectedAgent.phase}</span></div>
                                <div><span className="text-gray-400">Executions:</span> <span className="font-medium">{selectedAgent.execution_count}</span></div>
                                <div><span className="text-gray-400">HITL:</span> <span className="font-medium">{selectedAgent.requires_human_approval ? 'Yes' : 'No'}</span></div>
                            </div>
                            {selectedAgent.last_error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded mt-3">{selectedAgent.last_error}</div>}
                            {selectedAgent.notes && <div className="mt-3 text-sm text-gray-600 bg-yellow-50 p-3 rounded">{selectedAgent.notes}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}