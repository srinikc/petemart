'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Activity, BarChart3, AlertCircle, CheckCircle, Clock, RefreshCw,
    TrendingUp, TrendingDown, Loader2,
} from 'lucide-react';
import { fetchWithTimeout, timeAgo } from '../shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type AgentHealth = {
    error_rate: number;
    avg_duration_ms: number;
    success_rate: number;
    execution_count: number;
    last_error: string | null;
    status: string;
    role: string;
};

type HealthResponse = {
    metrics: Record<string, AgentHealth>;
    aggregate: {
        total_agents: number;
        active_agents: number;
        failed_agents: number;
        avg_success_rate: number;
    };
    timestamp: string;
};

function successColor(rate: number): string {
    if (rate >= 0.8) return '#16A34A';
    if (rate >= 0.5) return '#F59E0B';
    return '#DC2626';
}

function successBg(rate: number): string {
    if (rate >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (rate >= 0.5) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
}

function statusColor(status: string): string {
    switch (status) {
        case 'approved':
        case 'completed':
            return 'text-green-600 bg-green-50';
        case 'active':
        case 'in_progress':
            return 'text-blue-600 bg-blue-50';
        case 'awaiting_approval':
            return 'text-amber-600 bg-amber-50';
        case 'failed':
            return 'text-red-600 bg-red-50';
        default:
            return 'text-gray-600 bg-gray-50';
    }
}

export default function HealthPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        const project = searchParams?.get('project') || '';
        const url = project
            ? `/api/agentic-console/health?project=${encodeURIComponent(project)}`
            : '/api/agentic-console/health';
        try {
            const res = await fetchWithTimeout(url);
            if (res.ok) setData(await res.json());
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchHealth();
    }, [searchParams]);

    const chartData = data
        ? Object.entries(data.metrics)
            .filter(([_, m]) => m.execution_count > 0)
            .map(([id, m]) => ({
                name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                id,
                'Success Rate': parseFloat((m.success_rate * 100).toFixed(1)),
                'Error Rate': parseFloat((m.error_rate * 100).toFixed(1)),
                success_rate: m.success_rate,
            }))
            .sort((a, b) => b['Success Rate'] - a['Success Rate'])
        : [];

    const tableData = data
        ? Object.entries(data.metrics).map(([id, m]) => ({ id, ...m }))
        : [];

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    const agg = data?.aggregate;
    const avgPct = agg ? (agg.avg_success_rate * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity size={22} className="text-indigo-600" />
                        Agent Health Dashboard
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Real-time health metrics for all pipeline agents
                        {data?.timestamp && <span className="ml-2">· Updated {timeAgo(data.timestamp)}</span>}
                    </p>
                </div>
                <button onClick={fetchHealth} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Aggregate Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
                        <BarChart3 size={14} /> Total Agents
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{agg?.total_agents || 0}</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-blue-500 text-xs font-medium mb-1">
                        <Activity size={14} /> Active
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{agg?.active_agents || 0}</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-red-500 text-xs font-medium mb-1">
                        <AlertCircle size={14} /> Failed
                    </div>
                    <div className="text-2xl font-bold text-red-600">{agg?.failed_agents || 0}</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-green-500 text-xs font-medium mb-1">
                        <TrendingUp size={14} /> Avg Success Rate
                    </div>
                    <div className={`text-2xl font-bold ${successColor((agg?.avg_success_rate || 0) > 0.8 ? 0.9 : (agg?.avg_success_rate || 0))}`}>
                        {avgPct}%
                    </div>
                </div>
            </div>

            {/* Success Rate Chart */}
            <div className="bg-white rounded-xl border p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-500" />
                    Success Rate by Agent
                </h2>
                {chartData.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 140, right: 20, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                                <Tooltip
                                    formatter={(value: number) => [`${value}%`, 'Success Rate']}
                                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="Success Rate" radius={[0, 4, 4, 0]} maxBarSize={16}>
                                    {chartData.map((entry) => (
                                        <Cell key={entry.id} fill={successColor(entry.success_rate)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No execution data available yet</p>
                )}
            </div>

            {/* Agent Health Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50/50">
                    <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500" />
                        Agent Health Details
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-gray-50/80">
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Agent</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                                <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Executions</th>
                                <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Success Rate</th>
                                <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Error Rate</th>
                                <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Avg Duration</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Last Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((m) => (
                                <tr key={m.id} className="border-b hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <div className="font-medium text-gray-800">{m.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                                        <div className="text-[10px] text-gray-400 truncate max-w-[220px]">{m.role}</div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor(m.status)}`}>
                                            {m.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">{m.execution_count}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${successBg(m.success_rate)}`}>
                                            {(m.success_rate * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                        {(m.error_rate * 100).toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                        {m.avg_duration_ms > 0
                                            ? m.avg_duration_ms >= 60000
                                                ? `${(m.avg_duration_ms / 60000).toFixed(1)}m`
                                                : `${(m.avg_duration_ms / 1000).toFixed(1)}s`
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 max-w-[250px]">
                                        {m.last_error ? (
                                            <span className="text-red-600 text-[10px] truncate block" title={m.last_error}>
                                                <AlertCircle size={10} className="inline mr-1" />
                                                {m.last_error.length > 80 ? m.last_error.slice(0, 80) + '...' : m.last_error}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {tableData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No agent data found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
