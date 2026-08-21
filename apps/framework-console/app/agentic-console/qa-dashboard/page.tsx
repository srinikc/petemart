'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity, CheckCircle, XCircle, AlertCircle, Clock, Loader2,
  FileText, Layout, Link, Monitor, FileJson, Eye, Zap, Shield,
  ArrowLeft, ChevronDown, ChevronRight, Bug, BarChart3, TrendingUp,
  TrendingDown, Play, RefreshCw, Filter, Search, ExternalLink,
  Server, Radio, Wifi, Layers, BookOpen, Settings, Bot,
} from 'lucide-react';
import {
  StatusBadge, ProgressRing, fetchWithTimeout,
} from '../shared';

export const dynamic = 'force-dynamic';

// ── Types ──
interface MetricData {
  totalTests: number; passed: number; failed: number; passRate: number;
  testTypesImplemented: number; testTypesTotal: number; openDefects: number;
  trend: { passRate: number[]; totalTests: number[]; dates: string[] };
}
interface TestTypeData {
  id: string; name: string; description: string; status: string;
  total: number; passed: number; failed: number; blocked: number;
  coverageActual: number; coverageTarget: number;
}
interface FeatureData {
  id: string; name: string; status: string; testTypes: string[];
  tests: string[]; lastRunResult: string;
}
interface QualityGateData {
  id: string; name: string; category: string; status: string; description: string;
}
interface DefectData {
  id: string; title: string; severity: string; status: string;
  testFile: string; foundAt: string; layer: string;
}
interface RunHistoryData {
  runId: string; tier: string; status: string;
  startedAt: string; completedAt: string;
  totalTests: number; passed: number; failed: number;
  passRate: number; durationMs: number; triggeredBy: string;
}
interface DashboardData {
  metrics: MetricData;
  testTypes: TestTypeData[];
  features: FeatureData[];
  qualityGates: QualityGateData[];
  defects: DefectData[];
  runHistory: RunHistoryData[];
}

// ── Helpers ──
const TEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  unit: <FileText size={18} />,
  component: <Layout size={18} />,
  'api-contract': <FileJson size={18} />,
  integration: <Link size={18} />,
  e2e: <Monitor size={18} />,
  sse: <Radio size={18} />,
  security: <Shield size={18} />,
  'visual-regression': <Eye size={18} />,
  performance: <Zap size={18} />,
  stress: <Activity size={18} />,
  accessibility: <Activity size={18} />,
};

function formatDuration(ms: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  const rem = Math.round(sec % 60);
  return `${min}m ${rem}s`;
}

function timeAgo(ts: string): string {
  if (!ts) return '-';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function PassRateBar({ pct, height = 6 }: { pct: number; height?: number }) {
  const color = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full bg-gray-200 rounded-full" style={{ height }}>
      <div className={`${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%`, height }} />
    </div>
  );
}

// ── Sparkline mini component ──
function Sparkline({ data, className = '' }: { data: number[]; className?: string }) {
  if (!data || data.length < 2) return <span className="text-gray-400 text-xs">no trend</span>;
  const w = 80, h = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  const color = data[data.length - 1] >= data[0] ? '#16A34A' : '#DC2626';
  return (
    <svg width={w} height={h} className={className}>
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} />
    </svg>
  );
}

// ── Defect severity color ──
function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };
  const c = colors[severity.toLowerCase()] ?? colors.medium;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${c}`}>{severity.toUpperCase()}</span>;
}

function DefectStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
    fixed: 'bg-green-100 text-green-800',
    verified: 'bg-purple-100 text-purple-800',
    closed: 'bg-gray-100 text-gray-600',
  };
  const c = colors[status.toLowerCase()] ?? colors.open;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c}`}>{status.replace('_', ' ').toUpperCase()}</span>;
}

function GateBadge({ status }: { status: string }) {
  if (status === 'pass') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300"><CheckCircle size={12} /> PASS</span>;
  if (status === 'fail') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300"><XCircle size={12} /> FAIL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200"><Clock size={12} /> N/E</span>;
}

// ── Tier configuration ──
const TIERS: Record<string, { label: string; types: string[] }> = {
  sanity: { label: 'Sanity', types: ['unit', 'component', 'api-contract'] },
  full: { label: 'Full QA', types: ['unit', 'component', 'api-contract', 'sse'] },
  release: { label: 'Release', types: ['unit', 'component', 'api-contract', 'sse', 'e2e', 'security', 'visual-regression'] },
  custom: { label: 'Custom', types: [] },
};

const TEST_TYPE_OPTIONS = [
  { id: 'unit', label: 'Unit' },
  { id: 'component', label: 'Component' },
  { id: 'api-contract', label: 'API Contract' },
  { id: 'sse', label: 'SSE' },
  { id: 'security', label: 'Security' },
];

// ── Main Page ──
export default function QaDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run Tests modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [tier, setTier] = useState('sanity');
  const [customTypes, setCustomTypes] = useState<string[]>(['unit']);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [runResult, setRunResult] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Defects filter
  const [defectFilter, setDefectFilter] = useState<string>('all');

  // Active section for accordion
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metrics: true, testTypes: true, features: true, gates: true, defects: true, history: true,
  });

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout('/api/qa/dashboard?project=agentic-console');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError(`API error: ${res.status}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Run tests ──
  const handleRunTests = useCallback(async () => {
    setRunStatus('running');
    setRunResult(null);
    setRunError(null);

    let types: string[];
    if (tier === 'custom') {
      types = customTypes;
    } else {
      types = TIERS[tier]?.types ?? [];
    }

    try {
      const res = await fetch('/api/qa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testTypes: types, tier, triggeredBy: 'qa-dashboard', project: 'agentic-console' }),
      });
      const result = await res.json();
      setRunResult(result);
      setRunStatus(result.success ? 'completed' : 'failed');
      if (!result.success) setRunError(result.error || 'Run failed');

      // Poll for completion then refresh
      if (result.success) {
        const pollMs = 3000;
        const maxPolls = 60;
        let polls = 0;
        const pollInterval = setInterval(async () => {
          polls++;
          try {
            const statusRes = await fetch('/api/qa/status');
            const status = await statusRes.json();
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(pollInterval);
              setRunStatus(status.status);
              await fetchData();
            }
          } catch {}
          if (polls >= maxPolls) clearInterval(pollInterval);
        }, pollMs);
      }
    } catch (e: any) {
      setRunError(e.message || 'Error starting test run');
      setRunStatus('failed');
    }
  }, [tier, customTypes, fetchData]);

  const m = data?.metrics;
  const testTypes = data?.testTypes ?? [];
  const features = data?.features ?? [];
  const qualityGates = data?.qualityGates ?? [];
  const defects = data?.defects ?? [];
  const runHistory = data?.runHistory ?? [];

  const passRateColor = useMemo(() => {
    if (!m) return 'text-gray-500';
    if (m.passRate >= 90) return 'text-green-600';
    if (m.passRate >= 70) return 'text-amber-600';
    return 'text-red-600';
  }, [m]);

  const defectStatuses = useMemo(() => {
    const set = new Set<string>();
    defects.forEach(d => set.add(d.status));
    return ['all', ...Array.from(set)];
  }, [defects]);

  const filteredDefects = useMemo(() => {
    if (defectFilter === 'all') return defects;
    return defects.filter(d => d.status === defectFilter);
  }, [defects, defectFilter]);

  // ── Loading ──
  if (loading && !data) {
    return (
      <div className="text-center py-20">
        <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-base text-gray-500">Loading QA Dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
        <p className="text-base text-red-600 mb-2">Failed to load QA Dashboard</p>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {/* ═══ HEADER ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/agentic-console/quality')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
            <ArrowLeft size={14} /> Quality
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} className="text-indigo-600" />
            Agentic Console QA Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => { setShowRunModal(true); setRunStatus('idle'); setRunResult(null); }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <Play size={14} /> Run Tests
          </button>
        </div>
      </div>

      {/* ═══ RUN MODAL ═══ */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { if (runStatus !== 'running') setShowRunModal(false); }}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Run Tests</h2>
              <button onClick={() => { if (runStatus !== 'running') setShowRunModal(false); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Tier selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Test Tier</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(TIERS).map(([key, t]) => (
                    <button key={key} onClick={() => setTier(key)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        tier === key
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom checkboxes */}
              {tier === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Test Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_TYPE_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={customTypes.includes(opt.id)}
                          onChange={() => setCustomTypes(prev =>
                            prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                          )}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Run button / progress */}
              {runStatus === 'idle' && (
                <button onClick={handleRunTests} disabled={tier === 'custom' && customTypes.length === 0}
                  className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  Run {TIERS[tier]?.label || 'Custom'} Tests
                </button>
              )}

              {runStatus === 'running' && (
                <div className="text-center py-4">
                  <Loader2 size={28} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Tests running...</p>
                  <p className="text-xs text-gray-400 mt-1">This may take several minutes</p>
                </div>
              )}

              {runStatus === 'completed' && runResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <CheckCircle size={24} className="text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-green-700">Tests triggered successfully</p>
                  <p className="text-xs text-green-600 mt-1">Run ID: {runResult.run_id}</p>
                  <p className="text-xs text-gray-400 mt-2">Dashboard will auto-refresh when tests complete.</p>
                  <button onClick={() => setShowRunModal(false)} className="mt-3 text-xs text-indigo-600 hover:underline font-medium">Close</button>
                </div>
              )}

              {runStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <XCircle size={24} className="text-red-500 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-red-700">Test run failed</p>
                  {runError && <p className="text-xs text-red-600 mt-1">{runError}</p>}
                  <button onClick={() => setRunStatus('idle')} className="mt-3 text-xs text-indigo-600 hover:underline font-medium">Try Again</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION: Metrics KPI Cards ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('metrics')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-sm font-bold flex items-center gap-2"><BarChart3 size={16} className="text-indigo-600" /> Quality Metrics</h2>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSections.metrics ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.metrics && m && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-500 font-medium">Total Tests</span>
                  {m.trend?.passRate && m.trend.passRate.length >= 2 && (
                    m.trend.passRate[m.trend.passRate.length - 1] >= m.trend.passRate[0]
                      ? <TrendingUp size={14} className="text-green-500" />
                      : <TrendingDown size={14} className="text-red-500" />
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-700">{m.totalTests}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkline data={m.trend?.totalTests ?? []} className="shrink-0" />
                </div>
              </div>
              <div className={`rounded-lg p-3 border ${passRateColor.replace('text-', 'bg-').replace('600', '50')} ${passRateColor.replace('text-', 'border-').replace('600', '200')}`}>
                <div className="text-xs font-medium mb-1">Pass Rate</div>
                <div className={`text-2xl font-bold ${passRateColor}`}>{m.passRate}%</div>
                <PassRateBar pct={m.passRate} height={4} />
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-xs text-purple-500 font-medium mb-1">Test Types</div>
                <div className="text-2xl font-bold text-purple-700">{m.testTypesImplemented}/{m.testTypesTotal}</div>
                <div className="text-xs text-purple-400 mt-1">Implemented</div>
              </div>
              <div
                className={`rounded-lg p-3 border cursor-pointer hover:brightness-95 transition-all ${
                  m.openDefects > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}
                onClick={() => {
                  toggleSection('defects');
                  setTimeout(() => document.getElementById('defects-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                title="Click to view defects"
              >
                <div className="text-xs font-medium mb-1">Open Defects</div>
                <div className={`text-2xl font-bold ${m.openDefects > 0 ? 'text-red-600' : 'text-green-600'}`}>{m.openDefects}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {m.openDefects > 0 ? 'Click to view →' : 'All clear'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SECTION: Test Type Cards ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('testTypes')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-sm font-bold flex items-center gap-2"><FileText size={16} className="text-indigo-600" /> Test Types</h2>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSections.testTypes ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.testTypes && (
          <div className="px-4 pb-4">
            {testTypes.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FileText size={32} className="mx-auto mb-1 opacity-50" />
                <p className="text-sm">No test type data available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {testTypes.map(tt => {
                  const runPct = tt.total > 0 ? Math.round((tt.passed / tt.total) * 100) : 0;
                  const statusColor = runPct >= 90 ? 'border-green-300' : runPct >= 70 ? 'border-amber-300' : 'border-red-300';
                  return (
                    <div key={tt.id} className={`border rounded-lg p-3 ${statusColor} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-indigo-600">{TEST_TYPE_ICONS[tt.id] || <FileText size={18} className="text-gray-400" />}</span>
                        <span className="font-semibold text-sm truncate">{tt.name}</span>
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full
                          ${tt.status === 'implemented' ? 'bg-green-100 text-green-700'
                            : tt.status === 'partial' ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'}">
                          {tt.status === 'implemented' ? '✓' : tt.status === 'partial' ? '~' : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                        <span><span className="font-bold text-gray-700">{tt.passed}</span> / {tt.total} passed</span>
                        {tt.failed > 0 && <span className="text-red-500 font-bold">{tt.failed} failed</span>}
                      </div>
                      <PassRateBar pct={runPct} />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-mono">{runPct}%</span>
                        <button onClick={() => {
                          setTier('custom');
                          setCustomTypes([tt.id]);
                          setShowRunModal(true);
                        }}
                          className="text-[10px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5">
                          <Play size={10} /> Run
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ SECTION: By Feature Traceability ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('features')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-sm font-bold flex items-center gap-2"><Layers size={16} className="text-indigo-600" /> By Feature</h2>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSections.features ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.features && (
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-3 font-medium">Feature</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Test Types</th>
                  <th className="pb-2 pr-3 font-medium">Test Files</th>
                  <th className="pb-2 font-medium">Last Run</th>
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium text-gray-700">{f.name}</td>
                    <td className="py-2 pr-3">
                      {f.status === 'tested'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700"><CheckCircle size={10} /> TESTED</span>
                        : f.status === 'partial'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"><AlertCircle size={10} /> PARTIAL</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">NOT TESTED</span>
                      }
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {f.testTypes.map(tt => (
                          <span key={tt} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">{tt}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-3 max-w-[200px]">
                      <div className="truncate text-gray-500" title={f.tests.join('\n')}>
                        {f.tests.length} file{f.tests.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="py-2 text-gray-400">-</td>
                  </tr>
                ))}
                {features.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-400">No feature data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ SECTION: Quality Gates ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('gates')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-sm font-bold flex items-center gap-2"><Shield size={16} className="text-indigo-600" /> Quality Gates ({qualityGates.length})</h2>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSections.gates ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.gates && (
          <div className="px-4 pb-4">
            {qualityGates.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Shield size={32} className="mx-auto mb-1 opacity-50" />
                <p className="text-sm">No quality gates configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {qualityGates.map(g => (
                  <div key={g.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="mt-0.5 shrink-0">
                      <GateBadge status={g.status} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-700">{g.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{g.description}</div>
                      <span className="text-[10px] text-gray-400 font-mono mt-0.5 inline-block">{g.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ SECTION: Defects ═══ */}
      <div id="defects-section" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('defects')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-sm font-bold flex items-center gap-2"><Bug size={16} className="text-indigo-600" /> Defects ({defects.length})</h2>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSections.defects ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.defects && (
          <div className="px-4 pb-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Filter size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              {defectStatuses.map(s => (
                <button key={s} onClick={() => setDefectFilter(s)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                    defectFilter === s
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {filteredDefects.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-1 opacity-50" />
                <p className="text-sm">No defects match the filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-2 font-medium">ID</th>
                      <th className="pb-2 pr-3 font-medium">Title</th>
                      <th className="pb-2 pr-2 font-medium">Severity</th>
                      <th className="pb-2 pr-2 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Test File</th>
                      <th className="pb-2 font-medium">Found</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDefects.map(d => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-2">
                          <a href={`#defect-${d.id}`} className="font-mono text-indigo-600 hover:underline font-medium text-xs">
                            {d.id}
                          </a>
                        </td>
                        <td className="py-2 pr-3 text-gray-700 max-w-[250px] truncate" title={d.title}>{d.title}</td>
                        <td className="py-2 pr-2"><SeverityBadge severity={d.severity} /></td>
                        <td className="py-2 pr-2"><DefectStatusBadge status={d.status} /></td>
                        <td className="py-2 pr-3 text-gray-500 max-w-[180px] truncate font-mono text-[10px]" title={d.testFile}>{d.testFile || '-'}</td>
                        <td className="py-2 text-gray-400 text-[10px]">{timeAgo(d.foundAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ SECTION: Run History ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('history')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h2 className="text-sm font-bold flex items-center gap-2"><Activity size={16} className="text-indigo-600" /> Run History (last {runHistory.length})</h2>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedSections.history ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.history && (
          <div className="px-4 pb-4">
            {runHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Clock size={32} className="mx-auto mb-1 opacity-50" />
                <p className="text-sm">No run history available.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {runHistory.map(run => {
                  const runPct = run.totalTests > 0 ? Math.round((run.passed / run.totalTests) * 100) : 0;
                  return (
                    <div key={run.runId} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        run.status === 'completed' || run.status === 'passed' ? 'bg-green-500'
                          : run.status === 'failed' ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{run.tier || 'custom'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{run.runId}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                          <span>{run.totalTests} tests</span>
                          <span className="font-mono font-bold">{runPct}%</span>
                          <span>{formatDuration(run.durationMs)}</span>
                          <span>{timeAgo(run.startedAt)}</span>
                          {run.triggeredBy && <span>by {run.triggeredBy}</span>}
                        </div>
                      </div>
                      <Sparkline data={runHistory.map(r => r.passRate)} className="shrink-0" />
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          run.status === 'completed' || run.status === 'passed' ? 'bg-green-100 text-green-700'
                            : run.status === 'failed' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {run.status === 'completed' || run.status === 'passed' ? 'PASSED'
                            : run.status === 'failed' ? 'FAILED'
                            : run.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Footer navigation ═══ */}
      <div className="flex items-center justify-between text-xs text-gray-400 py-2">
        <button onClick={() => router.push('/agentic-console/quality')} className="text-indigo-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Quality Dashboard
        </button>
        <span>Last updated: {data ? new Date().toLocaleString() : '-'}</span>
      </div>
    </div>
  );
}
