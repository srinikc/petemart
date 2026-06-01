'use client';

import React, { useState, useMemo } from 'react';
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

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Layout, Link, Monitor, FileJson, Eye, Zap, Activity,
  Shield, Accessibility, Globe, RotateCcw, Layers, Database, CloudOff,
};

const STATUS_COLORS = { pass: '#16A34A', fail: '#DC2626', blocked: '#F59E0B', partial: '#F59E0B' };
const STATUS_BG = { pass: 'bg-green-50 text-green-700 border-green-200', fail: 'bg-red-50 text-red-700 border-red-200', blocked: 'bg-amber-50 text-amber-700 border-amber-200' };
const SEVERITY_COLORS = { critical: '#DC2626', high: '#EA580C', medium: '#F59E0B', low: '#6B7280' };

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = s === 'pass' ? 'bg-green-100 text-green-700' : s === 'fail' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : status === 'blocked' ? 'BLOCKED' : status.toUpperCase()}</span>;
}

function formatPct(v: number) { return `${Math.round(v)}%`; }

export default function QADashboard() {
  const testTypes = resultsData.testTypes as TestType[];
  const gates = resultsData.qualityGates as QualityGate[];
  const defects = resultsData.defects as Defect[];
  const history = resultsData.history as HistoryEntry[];
  const summary = resultsData.summary;

  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defectsList, setDefectsList] = useState<Defect[]>(defects);
  const [newDefect, setNewDefect] = useState({ title: '', description: '', severity: 'medium', component: '' });
  const [testEnv, setTestEnv] = useState<'sandbox' | 'ci'>('sandbox');
  const [showTestConfig, setShowTestConfig] = useState(false);

  const envConfig = testRunConfig.environments[testEnv];
  const enabledTypes = Object.entries(envConfig.testTypes)
    .filter(([, v]) => v.enabled)
    .map(([k]) => k);

  const filteredTypes = useMemo(() => {
    return testTypes.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [testTypes, filterStatus]);

  const categories = useMemo(() => {
    const cats = typeData.categories.map(c => c.name);
    return ['all', ...cats];
  }, []);

  const totalPlanned = testTypes.reduce((a, t) => a + (t.total || 0), 0);
  const totalBlocked = testTypes.reduce((a, t) => a + (t.blocked || 0), 0);
  const totalPlannedAll = totalPlanned + totalBlocked;

  const pieData = [
    { name: 'Passed', value: summary.passed, color: '#16A34A' },
    { name: 'Failed', value: summary.failed, color: '#DC2626' },
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

  const statsCards = [
    { label: 'Total Tests (Implemented)', value: totalPlanned, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pass Rate', value: `${Math.round(summary.passRate)}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Test Types', value: `${summary.testTypesImplemented}/${summary.testTypesTotal}`, icon: Layout, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Quality Gates', value: `${gatesPassed}/${gatesTotal}`, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Open Defects', value: defectsList.filter(d => d.status === 'open').length, icon: Bug, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Blocked Tests', value: totalBlocked, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <button
                onClick={() => window.open('http://localhost:51204', '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Vitest UI
              </button>
              <button
                onClick={() => window.open('/qa-dashboard/playwright-report/index.html', '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Playwright Report
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Test Environment & Selection Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                testEnv === 'sandbox' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <Play className="w-3.5 h-3.5" />
                {testEnv === 'sandbox' ? 'Sandbox Mode' : 'CI/CD Mode'}
              </div>
              <span className="text-xs text-gray-500">{envConfig.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTestEnv(testEnv === 'sandbox' ? 'ci' : 'sandbox')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Switch to {testEnv === 'sandbox' ? 'CI/CD' : 'Sandbox'}
              </button>
              <button
                onClick={() => setShowTestConfig(!showTestConfig)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" /> Test Selection
              </button>
            </div>
          </div>

          {showTestConfig && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-3">Enabled test types for <span className="font-semibold">{testEnv.toUpperCase()}</span> environment:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(envConfig.testTypes).map(([id, cfg]: [string, any]) => (
                  <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                    cfg.enabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}>
                    {cfg.enabled ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span className="font-medium truncate">{id}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>🧪 Playwright projects: <span className="font-mono">{envConfig.playwrightProjects.join(', ')}</span></span>
                <span>⚡ Fail fast: <span className={envConfig.failFast ? 'text-red-600' : 'text-green-600'}>{envConfig.failFast ? 'ON' : 'OFF'}</span></span>
                <span>📊 Collect results: {envConfig.collectResults ? '✅' : '❌'}</span>
              </div>
              <p className="mt-2 text-[10px] text-gray-400">
                To change these settings, edit <code className="bg-gray-100 px-1 rounded">qa-dashboard/test-run-config.json</code>
              </p>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart - Pass/Fail/Blocked Distribution */}
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

          {/* Bar Chart - Tests by Type */}
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

          {/* Pass Rate Trend */}
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
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

              return (
                <div key={type.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
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
                <input
                  type="text"
                  placeholder="Defect title"
                  value={newDefect.title}
                  onChange={(e) => setNewDefect({ ...newDefect, title: e.target.value })}
                  className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white"
                />
                <select
                  value={newDefect.severity}
                  onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value })}
                  className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input
                  type="text"
                  placeholder="Component (e.g. Cart API)"
                  value={newDefect.component}
                  onChange={(e) => setNewDefect({ ...newDefect, component: e.target.value })}
                  className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white"
                />
              </div>
              <textarea
                placeholder="Description"
                value={newDefect.description}
                onChange={(e) => setNewDefect({ ...newDefect, description: e.target.value })}
                className="text-xs border border-amber-200 rounded-md px-3 py-2 bg-white w-full"
                rows={2}
              />
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
                {defectsList.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No defects logged</td></tr>
                )}
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

        {/* Test Framework Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Test Tool Dashboards</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Vitest UI', url: 'http://localhost:51204', desc: 'Real-time unit/integration/component tests', icon: FileText },
              { name: 'Playwright Report', url: '/playwright-report/index.html', desc: 'E2E tests with screenshots & traces', icon: Monitor },
              { name: 'k6 Load Report', url: '/qa-dashboard/k6-report/index.html', desc: 'Stress & performance test results', icon: Activity },
              { name: 'Lighthouse CI', url: '/qa-dashboard/lighthouse-report/index.html', desc: 'Performance, a11y, SEO scores', icon: Zap },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 truncate">{tool.name} <ExternalLink className="w-3 h-3 inline-block opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                    <p className="text-[10px] text-gray-500 truncate">{tool.desc}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
