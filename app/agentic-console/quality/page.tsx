'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Code, CheckCircle, XCircle, Loader2, Shield, Settings, GitBranch,
    AlertCircle, Clock, FileText, Layers as LayersIcon, Zap, ArrowLeft,
    ExternalLink, Activity, BarChart3, Bug,
} from 'lucide-react';
import {
    AgentState, StatusBadge, PageTOC, fetchWithTimeout,
} from '../shared';

const QUALITY_TOC = [
    { id: 'qa-dashboard', label: 'QA Dashboard KPIs' },
    { id: 'code-review', label: 'Code Review' },
    { id: 'guardrails', label: 'Guardrails' },
    { id: 'open-items', label: 'Open Items' },
];

function GoNoGoBadge({ decision }: { decision: 'go' | 'no-go' | null | undefined }) {
    if (decision === 'go') {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-300">GO <CheckCircle size={16} /></span>;
    }
    if (decision === 'no-go') {
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-300">NO-GO <XCircle size={16} /></span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600 border border-gray-300">PENDING <Clock size={16} /></span>;
}

export default function QualityPage() {
    const router = useRouter();
    const [state, setState] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [qaResults, setQaResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);

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

    // Derive Go/No-Go from gates
    const allGatesPassed = gates.length > 0 && gates.every((g: any) => g.status === 'pass');
    const goNoGoDecision = gates.length > 0 ? (allGatesPassed ? 'go' as const : 'no-go' as const) : null;

    // Test type breakdown for display
    const implementedCount = testTypes.filter((t: any) => t.status === 'implemented').length;
    const totalTestTypes = testTypes.length;

    if (loading) {
        return <div className="text-center py-20"><Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-base text-gray-500">Loading Quality Dashboard...</p></div>;
    }

    return (
        <div className="space-y-6 text-sm">
            {/* Page TOC */}
            <div className="bg-white rounded-xl shadow-sm border p-3 sticky top-16 z-40 flex items-center gap-3 flex-wrap">
                <button onClick={() => router.push('/agentic-console')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mr-2 font-medium">
                    <ArrowLeft size={14} /> Dashboard
                </button>
                <span className="text-xs font-semibold text-gray-500">Quality:</span>
                <PageTOC sections={QUALITY_TOC} currentPage="quality" />
                <a href="/qa-dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto font-medium">
                    <ExternalLink size={14} /> Full QA Dashboard
                </a>
            </div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* QA Dashboard KPIs & Go/No-Go */}
            {/* ═══════════════════════════════════════════════════ */}
            <section id="qa-dashboard" className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={24} className="text-green-600" />
                    <h2 className="text-xl font-bold">QA Dashboard Overview</h2>
                    <a href="/qa-dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1 ml-auto font-medium">
                        <ExternalLink size={14} /> View Full QA Dashboard →
                    </a>
                </div>

                {summary ? (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-5">
                            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                                <div className="text-2xl font-bold text-blue-700">{summary.totalTests}</div>
                                <div className="text-xs text-blue-500 font-medium">Total Tests</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                                <div className="text-xs text-green-500 font-medium">Passed</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                                <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
                                <div className="text-xs text-red-500 font-medium">Failed</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                                <div className="text-2xl font-bold text-amber-600">{summary.passRate}%</div>
                                <div className="text-xs text-amber-500 font-medium">Pass Rate</div>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
                                <div className="text-2xl font-bold text-indigo-600">{summary.qualityGatesPassed}/{summary.qualityGatesTotal}</div>
                                <div className="text-xs text-indigo-500 font-medium">Gates Passed</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                                <div className="text-2xl font-bold text-purple-600">{summary.totalDefects}</div>
                                <div className="text-xs text-purple-500 font-medium">Defects</div>
                            </div>
                        </div>

                        {/* Go/No-Go + Test Types Implemented */}
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

                        {/* Quick link to QA Dashboard */}
                        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <Bug size={18} className="text-indigo-600" />
                                <span className="text-indigo-700 font-medium">For detailed test results, defect logs, and historical trends:</span>
                            </div>
                            <a href="/qa-dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                                <ExternalLink size={16} /> Open QA Dashboard
                            </a>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Activity size={40} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">QA results not available.</p>
                        <a href="/qa-dashboard" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Go to QA Dashboard →</a>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* Code Review */}
            {/* ═══════════════════════════════════════════════════ */}
            <section id="code-review" className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Code size={24} className="text-indigo-600" />
                    <h2 className="text-xl font-bold">Code Review Status</h2>
                    <span className="text-xs text-gray-400 ml-auto">Agent 0 enforced</span>
                </div>
                {reviews.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="pb-2 pr-3 font-medium">Agent</th>
                                    <th className="pb-2 pr-3 font-medium">Reviewer</th>
                                    <th className="pb-2 pr-3 font-medium">Findings</th>
                                    <th className="pb-2 pr-3 font-medium">Fixes</th>
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
                                        <td className="py-2 pr-3 text-sm">{r.findings_count}</td>
                                        <td className="py-2 pr-3 text-sm">{r.fixes_count}</td>
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
                    <div className="text-center py-8 text-gray-400">
                        <Code size={40} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No code review data available.</p>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* Guardrails */}
            {/* ═══════════════════════════════════════════════════ */}
            <section id="guardrails" className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold mb-3">Project Pipeline Guardrails</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Project-wide operational constraints enforced by the Supervisor Agent (00) across the entire pipeline.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Execution constraints */}
                    <div className="bg-gray-50 rounded-lg border p-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Execution Constraints</h3>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Max executions per agent', `${loopGuardrails.max_sequential_executions_per_agent || 3}`],
                                ['Max cycles lifetime', `${loopGuardrails.max_total_cycles_lifetime || 100}`],
                                ['Circuit breaker', `${loopGuardrails.circuit_breaker_threshold || 5} failures`],
                                ['Cooldown', `${loopGuardrails.cooldown_between_cycles_s || 5}s`],
                                ['Max concurrent', `${loopGuardrails.max_concurrent_agents || 3}`],
                                ['Token budget/cycle', `${((loopGuardrails.token_budget_per_cycle_est || 100000) / 1000).toFixed(0)}K`],
                            ].map(([label, val]) => (
                                <div key={label as string} className="flex justify-between">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-bold">{val as string}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Branch workflow */}
                    <div className="bg-gray-50 rounded-lg border p-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><GitBranch size={18} className="text-blue-500" /> Branch Workflow</h3>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Feature branch required', workflowEnforcement.feature_branch_required ? '✅' : '❌'],
                                ['Direct push blocked', workflowEnforcement.direct_push_blocked ? '✅' : '❌'],
                                ['PR required', workflowEnforcement.pr_required_before_merge ? '✅' : '❌'],
                                ['CI must pass', workflowEnforcement.ci_must_pass_before_merge ? '✅' : '❌'],
                                ['AI Assistant compliance', workflowEnforcement.applies_to_ai_assistant ? '✅' : '❌'],
                            ].map(([label, val]) => (
                                <div key={label} className="flex justify-between">
                                    <span className="text-gray-500">{label}</span>
                                    <span className={`font-bold ${val === '✅' ? 'text-green-600' : 'text-red-600'}`}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Halt strategy */}
                    <div className="bg-gray-50 rounded-lg border p-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><LayersIcon size={18} className="text-purple-500" /> Halt Strategy</h3>
                        <p className="text-sm text-gray-500 mb-2">Pipeline halts at:</p>
                        <div className="space-y-1.5 text-sm">
                            {[
                                ['Auto-progress within phase', pipelineStrategy.auto_progress_within_phase],
                                ['Approval gates', pipelineStrategy.halt_at_approval_gates],
                                ['Expert review', pipelineStrategy.halt_at_expert_review],
                                ['Tech stack decision', pipelineStrategy.halt_at_tech_stack_decision],
                                ['Cost approval', pipelineStrategy.halt_at_cost_approval],
                                ['MVP definition', pipelineStrategy.halt_at_mvp_definition],
                                ['Production deploy', pipelineStrategy.halt_at_production_deployment],
                            ].map(([label, enabled]) => (
                                <div key={label as string} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>{label as string}</span>
                                    <span className={`ml-auto text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-400'}`}>{enabled ? 'HALT' : 'PASS'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* Open Items */}
            {/* ═══════════════════════════════════════════════════ */}
            <section id="open-items" className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold mb-3">Open Items Awaiting Action</h2>
                {openItems.length > 0 ? (
                    <div className="space-y-2">
                        {openItems.map((item, idx) => (
                            <div key={idx} className="border rounded-lg p-4 flex items-start gap-3 bg-red-50 border-red-200">
                                {item.data.status === 'failed' || item.data.last_error
                                    ? <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                    : <Clock size={20} className="text-amber-500 mt-0.5 shrink-0" />}
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
                    <div className="text-center py-8 text-gray-400">
                        <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No open items. All agents resolved.</p>
                    </div>
                )}
            </section>

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