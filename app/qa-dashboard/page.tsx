'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import resultsData from '@/qa-dashboard/results.json';
import typeData from '@/qa-dashboard/test-types.json';
import testRunConfig from '@/qa-dashboard/test-run-config.json';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  FileText, Layout, Link, Monitor, FileJson, Eye, Zap, Activity,
  Shield, Accessibility, Globe, RotateCcw, Layers, Database, CloudOff,
  CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronRight,
  Filter, Search, Download, RefreshCw, ExternalLink, Bug, Settings, Play,
  Loader2,
} from 'lucide-react';

type TestTypeStatus = 'implemented' | 'partial' | 'missing';

interface Subcategory {
  id: string; name: string; tool: string;
  total: number; passed: number; failed: number; blocked: number;
  status: string;
}

interface TestType {
  id: string; icon: string; name: string; description: string;
  status: TestTypeStatus;
  total: number; passed: number; failed: number; blocked: number;
  inProgress?: number;
  coverageTarget: number; coverageActual: number; durationMs: number;
  subcategories: Subcategory[];
}

interface QualityGate {
  id: string; name: string; category: string; status: string; description: string;
}

interface Defect {
  id: string; severity: string; status: string; component: string;
  title: string; description: string; files: string[];
  foundAt: string; fixedAt?: string; fixedBy?: string;
}

interface HistoryEntry {
  date: string; totalTests: number; passed: number; failed: number;
  passRate: number; coveragePct: number; testTypesImplemented: number;
}

const TIER_CONFIGS = [
  { id: 'sanity', label: 'Sanity (Tier 1)', desc: 'Fast build + unit + integration — ~3 min', icon: Zap, color: 'green' },
  { id: 'full', label: 'Full QA (Tier 2)', desc: 'All tests except DR — ~15 min', icon: Shield, color: 'amber' },
  { id: 'release', label: 'Release (Tier 3)', desc: 'Every test including DR — ~25 min', icon: Activity, color: 'red' },
];

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Layout, Link, Monitor, FileJson, Eye, Zap, Activity,
  Shield, Accessibility, Globe, RotateCcw, Layers, Database, CloudOff,
};

const STATUS_COLORS = { pass: '#16A34A', fail: '#DC2626', blocked: '#F59E0B', partial: '#F59E0B' };
const SEVERITY_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#F59E0B', low: '#6B7280' };

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = s === 'pass' ? 'bg-green-100 text-green-700' : s === 'fail' ? 'bg-red-100 text-red-700' : s === 'not-executed' ? 'bg-gray-100 text-gray-500' : s === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{status.toUpperCase().replace('-', ' ')}</span>;
}

function formatPct(v: number) { return `${Math.round(v)}%`; }

function pct(n: number, total: number) { return total > 0 ? ((n / total) * 100).toFixed(1) : '0.0'; }

export default function QADashboard() {
  const testTypes = resultsData.testTypes as TestType[];
  const gates = resultsData.qualityGates as QualityGate[];
  const defects = resultsData.defects as Defect[];
  const history = resultsData.history as HistoryEntry[];
  const summary = resultsData.summary;

  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defectsList, setDefectsList] = useState<Defect[]>(defects);
  const [newDefect, setNewDefect] = useState({ title: '', description: '', severity: 'medium', component: '' });
  const [testEnv, setTestEnv] = useState<'sandbox' | 'ci'>('sandbox');
  const [showTestConfig, setShowTestConfig] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [goNoGo, setGoNoGo] = useState<'go' | 'no-go' | null>(null);
  const [goNoGoComment, setGoNoGoComment] = useState('');
  const [goNoGoHistory, setGoNoGoHistory] = useState<{ decision: 'go' | 'no-go'; comment: string; date: string }[]>([]);
  const [showGoNoGoHistory, setShowGoNoGoHistory] = useState(false);

  // Tests Engine state
  const [runBuildLabel, setRunBuildLabel] = useState('');
  const [runTriggeredBy, setRunTriggeredBy] = useState('qa-dashboard');
  const [engineRunning, setEngineRunning] = useState<string | null>(null);
  const [engineOutput, setEngineOutput] = useState<string | null>(null);
  const [lastRunMeta, setLastRunMeta] = useState<{ tier: string; buildLabel: string; time: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('qa-dashboard-go-nogo-history');
    if (saved) {
      try { setGoNoGoHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  const envConfig = testRunConfig.environments[testEnv];

  const toggleType = (id: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectedTypes(new Set());
      setSelectAll(false);
    } else {
      setSelectedTypes(new Set(testTypes.map(t => t.id)));
      setSelectAll(true);
    }
  };

  const runSelected = useCallback(async () => {
    if (selectedTypes.size === 0) return;
    setIsRunning(true);
    setRunOutput(null);
    try {
      const res = await fetch('/api/qa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: Array.from(selectedTypes), env: testEnv }),
      });
      const data = await res.json();
      setRunOutput(data.output || JSON.stringify(data, null, 2));
    } catch (err: any) {
      setRunOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [selectedTypes, testEnv]);

  const filteredTypes = useMemo(() => {
    return testTypes.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [testTypes, filterStatus]);

  const totalPlanned = testTypes.reduce((a, t) => a + (t.total || 0), 0);
  const totalBlocked = testTypes.reduce((a, t) => a + (t.blocked || 0), 0);
  const totalFailed = testTypes.reduce((a, t) => a + (t.failed || 0), 0);
  const totalPassed = testTypes.reduce((a, t) => a + (t.passed || 0), 0);
  const totalRun = totalPassed + totalFailed;
  const totalAll = totalPlanned + totalBlocked;
  const livePassRate = totalAll > 0 ? Math.round((totalPassed / totalAll) * 100) : 0;

  const summaryTableData = useMemo(() => {
    return testTypes.map(t => ({
      id: t.id,
      name: t.name,
      total: t.total + t.blocked,
      automated: t.total,
      run: t.passed + t.failed,
      runPct: (t.total + t.blocked) > 0 ? Math.round(((t.passed + t.failed) / (t.total + t.blocked)) * 100) : 0,
      pass: t.passed,
      fail: t.failed,
      blocked: t.blocked,
      inProgress: t.inProgress ?? (t.status === 'partial' ? t.blocked : 0),
      bugs: 0,
      passPct: pct(t.passed, t.total + t.blocked),
      failPct: pct(t.failed, t.total + t.blocked),
      blockedPct: pct(t.blocked, t.total + t.blocked),
      inProgPct: pct(t.inProgress ?? (t.status === 'partial' ? t.blocked : 0), t.total + t.blocked),
      status: t.status,
      isSelected: selectedTypes.has(t.id),
    }));
  }, [testTypes, selectedTypes]);

  const totals = useMemo(() => {
    const data = summaryTableData;
    const t = { total: 0, automated: 0, run: 0, runPct: 0, pass: 0, fail: 0, blocked: 0, inProgress: 0, bugs: 0 };
    for (const r of data) {
      t.total += r.total; t.automated += r.automated; t.run += r.run;
      t.pass += r.pass; t.fail += r.fail; t.blocked += r.blocked; t.inProgress += r.inProgress; t.bugs += r.bugs;
    }
    return { ...t, runPct: t.total > 0 ? Math.round((t.run / t.total) * 100) : 0, passPct: pct(t.pass, t.total), failPct: pct(t.fail, t.total), blockedPct: pct(t.blocked, t.total), inProgPct: pct(t.inProgress, t.total) };
  }, [summaryTableData]);

  const pieData = [
    { name: 'Passed', value: totalPassed, color: '#16A34A' },
    { name: 'Failed', value: totalFailed, color: '#DC2626' },
    { name: 'Blocked', value: totalBlocked, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const passRateData = history.map(h => ({
    date: h.date,
    passRate: h.passRate,
    total: h.totalTests,
  }));

  const typeChartData = testTypes
    .filter(t => t.total > 0 || t.blocked > 0)
    .map(t => ({
      name: t.name.split(' ')[0],
      passed: t.passed,
      failed: t.failed,
      blocked: t.blocked,
    }));

  const gatesTotal = gates.length;
  const gatesPassed = gates.filter(g => g.status === 'pass').length;
  const gatesFailed = gates.filter(g => g.status === 'fail').length;
  const gatesBlocked = gates.filter(g => g.status === 'blocked').length;

  const addDefect = () => {
    if (!newDefect.title) return;
    const def: Defect = {
      id: `DEF-${String(defectsList.length + 1).padStart(3, '0')}`,
      severity: newDefect.severity as 'medium' | 'high' | 'critical' | 'low',
      status: 'open',
      component: newDefect.component,
      title: newDefect.title,
      description: newDefect.description,
      files: [],
      foundAt: new Date().toISOString(),
    };
    setDefectsList([def, ...defectsList]);
    setNewDefect({ title: '', description: '', severity: 'medium', component: '' });
    setShowDefectForm(false);
  };

  const markFixed = (id: string) => {
    setDefectsList(defectsList.map(d => d.id === id ? { ...d, status: 'fixed', fixedAt: new Date().toISOString(), fixedBy: 'Human Gatekeeper' } : d));
  };

  const reopenDefect = (id: string) => {
    setDefectsList(defectsList.map(d => d.id === id ? { ...d, status: 'open', fixedAt: undefined, fixedBy: undefined } : d));
  };

  const runEngine = useCallback(async (tierId: string) => {
    setEngineRunning(tierId);
    setEngineOutput(null);
    try {
      const label = runBuildLabel || `manual-${new Date().toISOString().slice(0, 10)}`;
      const res = await fetch('/api/qa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, env: testEnv, buildLabel: label, triggeredBy: runTriggeredBy }),
      });
      const data = await res.json();
      setEngineOutput(data.output || JSON.stringify(data, null, 2));
      setLastRunMeta({ tier: tierId, buildLabel: label, time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) });
    } catch (err: any) {
      setEngineOutput(`Error: ${err.message}`);
    } finally {
      setEngineRunning(null);
    }
  }, [testEnv, runBuildLabel, runTriggeredBy]);

  const exportCSV = useCallback(() => {
    const headers = ['Category', 'Planned', 'Automated', 'Run', 'Run%', 'Pass', 'Fail', 'Blocked', 'In Prog', 'Pass%', 'Fail%', 'Blocked%', 'In Prog%', 'Bugs'];
    const rows = summaryTableData.map(r => [
      r.name, r.total, r.automated, r.run, r.runPct,
      r.pass, r.fail, r.blocked, r.inProgress,
      r.passPct, r.failPct, r.blockedPct, r.inProgPct, r.bugs
    ]);
    rows.push(['TOTAL', totals.total, totals.automated, totals.run, totals.runPct,
      totals.pass, totals.fail, totals.blocked, totals.inProgress,
      totals.passPct, totals.failPct, totals.blockedPct, totals.inProgPct,
      defectsList.filter(d => d.status === 'open').length
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'qa-dashboard-export.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [summaryTableData, totals, defectsList]);

  const applyGoNoGo = () => {
    if (!goNoGo) return;
    const entry = { decision: goNoGo, comment: goNoGoComment, date: new Date().toISOString() };
    const updated = [...goNoGoHistory, entry];
    setGoNoGoHistory(updated);
    localStorage.setItem('qa-dashboard-go-nogo-history', JSON.stringify(updated));
  };

  const statsCards = [
    { label: 'Total Tests (Planned)', value: totalAll, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pass Rate', value: `${livePassRate}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Test Types', value: `${summary.testTypesImplemented}/${summary.testTypesTotal}`, icon: Layout, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Quality Gates', value: `${gatesPassed}/${gatesTotal}`, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Open Defects', value: defectsList.filter(d => d.status === 'open').length, icon: Bug, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Blocked / Not Run', value: totalBlocked, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PeteMart QA Dashboard</h1>
                <p className="text-xs text-gray-500">Last updated: {new Date(resultsData.lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Reports available after CI run</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Table of Contents */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-[57px] z-40 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700 mr-1">Jump to:</span>
            <a href="#kpi-cards" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">KPIs</a>
            <a href="#tests-engine" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Tests Engine</a>
            <a href="#summary-table" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Summary</a>
            <a href="#charts" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Charts</a>
            <a href="#quality-gates" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Quality Gates</a>
            <a href="#test-types" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Test Types</a>
            <a href="#defect-log" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Defects</a>
            <a href="#go-nogo" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Go/No-Go</a>
            <a href="#tool-dashboards" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Dashboards</a>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-900">Key Performance Indicators</h2>
          <span className="text-[10px] text-gray-400">Live pass rate: <span className={livePassRate >= 80 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{livePassRate}%</span></span>
        </div>
        <div id="kpi-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Tests Engine — Tiered Runner + Mode Switch + Selection */}
        {/* ═══════════════════════════════════════════════════ */}
        <div id="tests-engine" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900">Tests Engine</h2>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium ${
                testEnv === 'sandbox' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <Play className="w-3 h-3" />
                {testEnv === 'sandbox' ? 'Sandbox' : 'CI/CD'}
              </div>
              <span className="text-[10px] text-gray-400 hidden sm:inline">{envConfig.description}</span>
              <div className="relative group">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help">?</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {testEnv === 'sandbox' ? 'Quick local runs. Skips E2E, performance, stress, cross-browser, DR.' : 'Full CI/CD suite. Runs all tests including E2E, security, performance, a11y.'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTestEnv(testEnv === 'sandbox' ? 'ci' : 'sandbox')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Settings className="w-3.5 h-3.5" /> Switch to {testEnv === 'sandbox' ? 'CI/CD' : 'Sandbox'}
              </button>
              <button onClick={() => setShowTestConfig(!showTestConfig)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                showTestConfig ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                <Filter className="w-3.5 h-3.5" /> Selection {selectedTypes.size > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-full text-[10px]">{selectedTypes.size}</span>}
              </button>
            </div>
          </div>

          {/* Tier Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {TIER_CONFIGS.map((tier) => {
              const TIcon = tier.icon;
              const rn = engineRunning === tier.id;
              const envTier = testEnv === 'sandbox' ? (tier.id === 'sanity' ? '✅' : '❌') : '✅';
              return (
                <button key={tier.id} onClick={() => runEngine(tier.id)} disabled={rn}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${rn ? 'border-blue-400 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-amber-300 hover:shadow-md bg-white'}`}>
                  {rn && <div className="absolute top-2 right-2"><Loader2 className="w-4 h-4 text-blue-600 animate-spin" /></div>}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tier.color === 'green' ? 'bg-green-50' : tier.color === 'amber' ? 'bg-amber-50' : 'bg-red-50'}`}>
                      <TIcon className={`w-4 h-4 ${tier.color === 'green' ? 'text-green-600' : tier.color === 'amber' ? 'text-amber-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{tier.label}</p>
                      <p className="text-[10px] text-gray-400">{tier.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-gray-500">Avail: {envTier}</span>
                    {rn && <span className="text-blue-600 font-medium animate-pulse">Running...</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Run Metadata + Last Run */}
          <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Build Label</label>
              <input type="text" value={runBuildLabel} onChange={(e) => setRunBuildLabel(e.target.value)} placeholder="auto (git SHA)" className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white w-32" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Triggered By</label>
              <select value={runTriggeredBy} onChange={(e) => setRunTriggeredBy(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white">
                <option value="qa-dashboard">QA Dashboard</option>
                <option value="developer">Developer</option>
                <option value="ci-pipeline">CI Pipeline</option>
                <option value="release-manager">Release Manager</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Env</label>
              <span className="text-xs font-mono font-medium text-gray-700 bg-white px-2 py-1.5 rounded-md border border-gray-200">
                {testEnv === 'sandbox' ? 'Local' : 'CI/CD'}
              </span>
            </div>
            {lastRunMeta && (
              <div className="flex items-center gap-2 ml-auto text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                <CheckCircle className="w-3 h-3 shrink-0" />
                Last: <span className="font-semibold">{lastRunMeta.tier.toUpperCase()}</span>
                {' · '}{lastRunMeta.buildLabel}
              </div>
            )}
          </div>

          {/* Engine Output */}
          {engineOutput && (
            <div className="mb-3 p-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap">{engineOutput}</pre>
              <button onClick={() => setEngineOutput(null)} className="mt-1 text-gray-500 hover:text-white">Clear</button>
            </div>
          )}

          {/* Collapsible Test Selection */}
          {showTestConfig && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">Select test types to run in <span className="font-semibold">{testEnv.toUpperCase()}</span> environment:</p>
                  <p className="text-[10px] text-gray-400">{selectedTypes.size} of {testTypes.length} types selected</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleAll} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                  <button onClick={runSelected} disabled={selectedTypes.size === 0 || isRunning}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedTypes.size === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                      isRunning ? 'bg-blue-100 text-blue-700 cursor-wait' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}>
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {isRunning ? 'Running...' : `Run Selected (${selectedTypes.size})`}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {testTypes.map(type => {
                  const isSelected = selectedTypes.has(type.id);
                  const isImpl = type.status !== 'missing';
                  return (
                    <label key={type.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : isImpl ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleType(type.id)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" disabled={!isImpl} />
                      <span className="font-medium truncate">{type.name}</span>
                      {type.total > 0 && <span className="text-[10px] text-gray-400 shrink-0">({type.passed}/{type.total})</span>}
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>Playwright: <span className="font-mono">{envConfig.playwrightProjects.join(', ')}</span></span>
                <span>Fail fast: <span className={envConfig.failFast ? 'text-red-600' : 'text-green-600'}>{envConfig.failFast ? 'ON' : 'OFF'}</span></span>
                <span>Collect: {envConfig.collectResults ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SUMMARY TABLE — Planned, Automated, Run, Run%, Pass/Fail/Blocked/InProg + %s */}
        {/* ═══════════════════════════════════════════════════ */}
        <div id="summary-table" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Test Summary by Category</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{totalAll} total tests across {testTypes.length} categories</span>
              <button onClick={exportCSV} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600 sticky left-0 bg-gray-50">Category</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-600">Planned</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-600">Automated</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-600">Run</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-600">Run%</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-green-700">Pass</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-red-700">Fail</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-amber-700">Blocked</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-blue-700">In Prog</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-green-600">Pass%</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-red-600">Fail%</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-amber-600">Blocked%</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-blue-600">In Prog%</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-red-600">Bugs</th>
                </tr>
              </thead>
              <tbody>
                {summaryTableData.map(row => (
                  <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${row.isSelected ? 'bg-blue-50/30' : ''}`}>
                    <td className="py-2 px-3 font-medium text-gray-900 sticky left-0 bg-white">{row.name}</td>
                    <td className="text-center py-2 px-2 text-gray-700 font-mono">{row.total}</td>
                    <td className="text-center py-2 px-2 text-gray-700 font-mono">{row.automated}</td>
                    <td className="text-center py-2 px-2 text-gray-700 font-mono">{row.run}</td>
                    <td className="text-center py-2 px-2 font-mono">
                      <span className={row.runPct >= 80 ? 'text-green-600' : row.runPct >= 50 ? 'text-amber-600' : 'text-red-600'}>{row.runPct}%</span>
                    </td>
                    <td className="text-center py-2 px-2 font-mono"><span className={row.pass > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>{row.pass}</span></td>
                    <td className="text-center py-2 px-2 font-mono"><span className={row.fail > 0 ? 'text-red-700 font-medium' : 'text-gray-400'}>{row.fail}</span></td>
                    <td className="text-center py-2 px-2 font-mono"><span className={row.blocked > 0 ? 'text-amber-700 font-medium' : 'text-gray-400'}>{row.blocked}</span></td>
                    <td className="text-center py-2 px-2 font-mono text-blue-700">{row.inProgress}</td>
                    <td className="text-center py-2 px-2 font-mono">
                      <span className={Number(row.passPct) >= 80 ? 'text-green-600' : Number(row.passPct) >= 50 ? 'text-amber-600' : 'text-red-600'}>{row.passPct}%</span>
                    </td>
                    <td className="text-center py-2 px-2 font-mono text-red-600">{row.failPct}%</td>
                    <td className="text-center py-2 px-2 font-mono text-amber-600">{row.blockedPct}%</td>
                    <td className="text-center py-2 px-2 font-mono text-blue-600">{row.inProgPct}%</td>
                    <td className="text-center py-2 px-2 font-mono">{row.bugs > 0 ? <span className="text-red-600 font-medium">{row.bugs}</span> : <span className="text-gray-400">—</span>}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-2.5 px-3 text-gray-900 sticky left-0 bg-gray-50">TOTAL</td>
                  <td className="text-center py-2.5 px-2 text-gray-900 font-mono">{totals.total}</td>
                  <td className="text-center py-2.5 px-2 text-gray-900 font-mono">{totals.automated}</td>
                  <td className="text-center py-2.5 px-2 text-gray-900 font-mono">{totals.run}</td>
                  <td className="text-center py-2.5 px-2 font-mono text-green-600">{totals.runPct}%</td>
                  <td className="text-center py-2.5 px-2 font-mono text-green-700">{totals.pass}</td>
                  <td className="text-center py-2.5 px-2 font-mono text-red-700">{totals.fail}</td>
                  <td className="text-center py-2.5 px-2 font-mono text-amber-700">{totals.blocked}</td>
                  <td className="text-center py-2.5 px-2 font-mono text-blue-700">{totals.inProgress}</td>
                  <td className="text-center py-2.5 px-2 font-mono text-green-600">{totals.passPct}%</td>
                  <td className="text-center py-2.5 px-2 font-mono text-red-600">{totals.failPct}%</td>
                  <td className="text-center py-2.5 px-2 font-mono text-amber-600">{totals.blockedPct}%</td>
                  <td className="text-center py-2.5 px-2 font-mono text-blue-600">{totals.inProgPct}%</td>
                  <td className="text-center py-2.5 px-2 font-mono text-red-600">{defectsList.filter(d => d.status === 'open').length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Row */}
        <div id="charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Test Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Tests by Type</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="passed" fill="#16A34A" stackId="a" name="Passed" radius={[0, 0, 0, 0]} />
                <Bar dataKey="blocked" fill="#F59E0B" stackId="a" name="Blocked" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" fill="#DC2626" stackId="a" name="Failed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pass Rate Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={passRateData.length > 0 ? passRateData : [{ date: 'No data', passRate: 0, total: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="passRate" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Gates */}
        <div id="quality-gates" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Quality Gates</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> {gatesPassed} Pass</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> {gatesFailed} Fail</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> {gatesBlocked} Blocked</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gates.map((gate) => (
              <div key={gate.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                gate.status === 'pass' ? 'bg-green-50 border-green-200' :
                gate.status === 'fail' ? 'bg-red-50 border-red-200' :
                'bg-amber-50 border-amber-200'
              }`}>
                {gate.status === 'pass' ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> :
                 gate.status === 'fail' ? <XCircle className="w-4 h-4 text-red-600 shrink-0" /> :
                 <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{gate.id}: {gate.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{gate.description}</p>
                </div>
                <StatusBadge status={gate.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Test Types Grid */}
        <div id="test-types" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">All Test Types ({summary.testTypesTotal})</h2>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="implemented">Implemented</option>
                <option value="partial">Partial</option>
                <option value="missing">Missing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTypes.map((type) => {
              const Icon = ICON_MAP[type.icon] || FileText;
              const isExpanded = expandedType === type.id;
              const totalTests = type.total + type.blocked;
              const passPct = totalTests > 0 ? Math.round((type.passed / totalTests) * 100) : 0;
              const isSelected = selectedTypes.has(type.id);

              return (
                <div key={type.id} className={`border rounded-lg overflow-hidden transition-colors ${
                  isSelected ? 'border-blue-300 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <button
                    onClick={() => setExpandedType(isExpanded ? null : type.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      type.status === 'implemented' ? 'bg-green-50' :
                      type.status === 'partial' ? 'bg-amber-50' : 'bg-gray-50'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        type.status === 'implemented' ? 'text-green-600' :
                        type.status === 'partial' ? 'text-amber-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{type.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{type.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-900">{type.passed}/{totalTests}</p>
                      <StatusBadge status={type.status} />
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Tool: {type.subcategories[0]?.tool || 'N/A'}</span>
                          <span>Coverage target: {type.coverageTarget}%</span>
                          <span>Actual: <span className={type.coverageActual >= type.coverageTarget ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{type.coverageActual}%</span></span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${passPct >= 80 ? 'bg-green-500' : passPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${passPct}%` }}
                          />
                        </div>
                        <div className="space-y-1">
                          {type.subcategories.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-gray-700 truncate">{sub.name}</span>
                                <span className="text-[10px] text-gray-400 hidden sm:inline">({sub.tool})</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-600">{sub.passed}/{sub.total || sub.blocked || '?'}</span>
                                <StatusBadge status={sub.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Defect Log */}
        <div id="defect-log" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Defect Log</h2>
            <button
              onClick={() => setShowDefectForm(!showDefectForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              <Bug className="w-3.5 h-3.5" /> Log Defect
            </button>
          </div>

          {showDefectForm && (
            <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-lg space-y-3">
              <h3 className="text-xs font-semibold text-amber-800">Log New Defect</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Defect title" value={newDefect.title} onChange={(e) => setNewDefect({ ...newDefect, title: e.target.value })} className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white" />
                <select value={newDefect.severity} onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value })} className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white">
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input type="text" placeholder="Component (e.g. Cart API)" value={newDefect.component} onChange={(e) => setNewDefect({ ...newDefect, component: e.target.value })} className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white" />
              </div>
              <textarea placeholder="Description" value={newDefect.description} onChange={(e) => setNewDefect({ ...newDefect, description: e.target.value })} className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white w-full" rows={2} />
              <div className="flex gap-2">
                <button onClick={addDefect} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Submit</button>
                <button onClick={() => setShowDefectForm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-500">ID</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Severity</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Title</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500 hidden sm:table-cell">Component</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500 hidden md:table-cell">Found</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {defectsList.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No defects logged</td></tr>}
                {defectsList.map((defect) => (
                  <tr key={defect.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-2 font-mono text-gray-700">{defect.id}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        defect.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        defect.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        defect.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {defect.severity}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-900 font-medium">{defect.title}</td>
                    <td className="py-2 px-2 text-gray-500 hidden sm:table-cell">{defect.component}</td>
                    <td className="py-2 px-2"><StatusBadge status={defect.status} /></td>
                    <td className="py-2 px-2 text-gray-400 hidden md:table-cell">{new Date(defect.foundAt).toLocaleDateString()}</td>
                    <td className="py-2 px-2 text-right">
                      {defect.status === 'open' ? (
                        <button onClick={() => markFixed(defect.id)} className="text-green-600 hover:text-green-800 text-[10px] font-medium">Mark Fixed</button>
                      ) : (
                        <button onClick={() => reopenDefect(defect.id)} className="text-amber-600 hover:text-amber-800 text-[10px] font-medium">Re-open</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Go / No-Go Section */}
        {/* ═══════════════════════════════════════════════════ */}
        <div id="go-nogo" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Go / No-Go Decision</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowGoNoGoHistory(!showGoNoGoHistory)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
                History ({goNoGoHistory.length})
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">Decision:</span>
              <button onClick={() => setGoNoGo('go')} className={`px-4 py-2 text-xs font-semibold rounded-md border transition-all ${goNoGo === 'go' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:border-green-300'}`}>
                ✅ GO
              </button>
              <button onClick={() => setGoNoGo('no-go')} className={`px-4 py-2 text-xs font-semibold rounded-md border transition-all ${goNoGo === 'no-go' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'}`}>
                🚫 NO-GO
              </button>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input type="text" placeholder="Add a comment (reason, blockers, notes...)" value={goNoGoComment} onChange={(e) => setGoNoGoComment(e.target.value)} className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 bg-white" />
            </div>
            <button onClick={applyGoNoGo} disabled={!goNoGo} className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${!goNoGo ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
              Apply Decision
            </button>
          </div>
          {goNoGo && <p className="mt-2 text-xs text-gray-500">Current selection: <span className={goNoGo === 'go' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{goNoGo.toUpperCase()}</span></p>}

          {showGoNoGoHistory && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">Audit Trail</p>
              {goNoGoHistory.length === 0 ? (
                <p className="text-xs text-gray-400">No decisions recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {goNoGoHistory.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-50 text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.decision === 'go' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {entry.decision.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700">{entry.comment || '(no comment)'}</p>
                        <p className="text-[10px] text-gray-400">{new Date(entry.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Reports Info */}
        <div id="tool-dashboards" className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">External Reports</h2>
          <p className="text-xs text-gray-500 mb-3">Test reports (Playwright HTML, k6, Lighthouse, Coverage) are generated during CI/CD pipeline runs and uploaded as build artifacts. Access them from the GitHub Actions run page for any completed workflow.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Vitest', desc: 'Unit/integration/component tests (CLI output in CI logs)', icon: FileText },
              { name: 'Playwright', desc: 'E2E test report with traces & screenshots (CI artifact)', icon: Monitor },
              { name: 'k6 / Lighthouse', desc: 'Performance & stress results (CI artifact)', icon: Activity },
              { name: 'Coverage', desc: 'Code coverage report (CI artifact)', icon: FileJson },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.name} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">{tool.name}</p>
                    <p className="text-[10px] text-gray-400">{tool.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
