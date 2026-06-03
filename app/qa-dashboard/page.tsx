'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import staticResultsData from '@/qa-dashboard/results.json';
import staticTypeData from '@/qa-dashboard/test-types.json';
import staticTestRunConfig from '@/qa-dashboard/test-run-config.json';
import staticRunHistoryData from '@/qa-dashboard/run-history.json';
import staticTraceabilityData from '@/qa-dashboard/traceability.json';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  FileText, Layout, Link, Monitor, FileJson, Eye, Zap, Activity,
  Shield, Accessibility, Globe, RotateCcw, Layers, Database, CloudOff,
  CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronRight,
  Filter, Search, Download, RefreshCw, ExternalLink, Bug, Settings, Play,
  Loader2, FileDown,
} from 'lucide-react';
import jsPDF from 'jspdf';

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
  // ── Live data fetching (overrides static imports via API) ──
  const [liveResults, setLiveResults] = useState<any>(null);
  const [liveRunHistory, setLiveRunHistory] = useState<any[] | null>(null);
  const [liveTraceability, setLiveTraceability] = useState<any>(null);
  const [liveTestRunConfig, setLiveTestRunConfig] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/qa/results').then(r => r.json().catch(() => null)),
      fetch('/api/qa/run-history').then(r => r.json().catch(() => null)),
      fetch('/api/qa/traceability').then(r => r.json().catch(() => null)),
    ]).then(([results, runHistory, traceability]) => {
      if (results?.results) setLiveResults(results.results);
      if (results?.runConfig) setLiveTestRunConfig(results.runConfig);
      if (Array.isArray(runHistory)) setLiveRunHistory(runHistory);
      if (traceability?.categories) setLiveTraceability(traceability);
    }).catch(() => {});
  }, []);

  const resultsData = liveResults || staticResultsData;
  const testRunConfig = liveTestRunConfig || staticTestRunConfig;
  const runHistoryData = liveRunHistory || (staticRunHistoryData as any[]);
  const traceabilityData = liveTraceability || staticTraceabilityData;

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
  const [goNoGoPdfGenerated, setGoNoGoPdfGenerated] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [traceCategory, setTraceCategory] = useState<string>('all');
  const [traceFilter, setTraceFilter] = useState<string>('all');

  const traceCategories = traceabilityData.categories;
  const allTraceItems = traceCategories.flatMap((c: any) => c.items.map((i: any) => ({ ...i, categoryLabel: c.label })));
  const filteredTraceItems = allTraceItems.filter((i: any) => {
    const catMatch = traceCategory === 'all' || i.id.startsWith(traceCategory);
    const statusMatch = traceFilter === 'all' || i.status === traceFilter;
    return catMatch && statusMatch;
  });
  const traceableTotal = traceabilityData.coverage_summary.total;
  const traceableImplemented = traceabilityData.coverage_summary.covered_pct;

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Tests Engine state
  const [runBuildLabel, setRunBuildLabel] = useState('');
  const [runTriggeredBy, setRunTriggeredBy] = useState('qa-dashboard');
  const [engineRunning, setEngineRunning] = useState<string | null>(null);
  const [engineOutput, setEngineOutput] = useState<string | null>(null);
  const [lastRunMeta, setLastRunMeta] = useState<{ tier: string; buildLabel: string; time: string } | null>(null);

  // ── ITEM 3: Background process polling ──
  const [runProgress, setRunProgress] = useState<string | null>(null);
  const [runPollError, setRunPollError] = useState<string | null>(null);

  // ── ITEM 5: Report existence status ──
  const [reportStatuses, setReportStatuses] = useState<Record<string, { exists: boolean; command: string; name: string; desc: string }>>({});

  // ── ITEM 2: Historical run dropdown ──
  const [selectedHistoricalRun, setSelectedHistoricalRun] = useState<number>(-1);
  const runHistory = (runHistoryData as any[]) || [];
  const [historicalRuns, setHistoricalRuns] = useState<any[]>(runHistory);

  useEffect(() => {
    const saved = localStorage.getItem('qa-dashboard-go-nogo-history');
    if (saved) {
      try { setGoNoGoHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  // ── ITEM 5: Fetch report existence statuses ──
  useEffect(() => {
    fetch('/api/qa/reports/status')
      .then(res => res.json())
      .then(data => {
        if (data.reports) {
          const map: Record<string, { exists: boolean; command: string; name: string; desc: string }> = {};
          for (const r of data.reports) {
            map[r.id] = { exists: r.exists, command: r.command, name: r.name, desc: r.desc };
          }
          setReportStatuses(map);
        }
      })
      .catch(() => {
        // If endpoint fails, assume none exist and use defaults
        const defaults: Record<string, any> = {
          vitest: { exists: false, command: 'npx vitest run --reporter=html --output-file=qa-dashboard/reports/vitest/index.html', name: 'Vitest', desc: 'Unit/integration/component tests' },
          playwright: { exists: false, command: 'npx playwright test --reporter=html', name: 'Playwright', desc: 'E2E test report with traces & screenshots' },
          performance: { exists: false, command: 'npx playwright test --project=performance', name: 'k6 / Lighthouse', desc: 'Performance & stress results' },
          coverage: { exists: false, command: 'npx vitest run --coverage --coverage.reporter=html --coverage.reportsDirectory=qa-dashboard/reports/coverage', name: 'Coverage', desc: 'Code coverage report' },
        };
        setReportStatuses(defaults);
      });
  }, []);

  // ── ITEM 3: Poll background process status ──
  useEffect(() => {
    if (!engineRunning) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/qa/status');
        const status = await res.json();
        if (status.status === 'running') {
          setRunProgress(status.progress || 'Running...');
        } else if (status.status === 'completed') {
          setRunProgress('Completed!');
          setEngineRunning(null);
          setEngineOutput('Tests completed successfully. Results updated.');
          clearInterval(pollInterval);
          // Refresh historical runs data from API
          try {
            const refreshed = await fetch('/api/qa/run-history');
            const data = await refreshed.json();
            if (Array.isArray(data) && data.length > 0) {
              setHistoricalRuns(data);
            }
            // Force page reload after delay to refresh all data
            setTimeout(() => { window.location.reload(); }, 3000);
          } catch {}
        } else if (status.status === 'failed') {
          setRunProgress('Failed');
          setEngineRunning(null);
          setEngineOutput(`Tests failed: ${status.error || 'Unknown error'}`);
          setRunPollError(status.error || 'Tests failed');
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        // Keep polling
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [engineRunning]);

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
    // ── ITEM 2: If a historical run is selected, overlay its data ──
    const selectedRun = selectedHistoricalRun >= 0 && selectedHistoricalRun < historicalRuns.length
      ? historicalRuns[selectedHistoricalRun]
      : null;

    return testTypes.map(t => {
      let passCount = t.passed;
      let failCount = t.failed;
      let blockCount = t.blocked;
      let runStatus = t.status;

      if (selectedRun && selectedRun.tests) {
        const runTest = selectedRun.tests[t.id];
        if (runTest) {
          if (runTest.status === 'passed') {
            passCount = t.total; // Assume all passed
            failCount = 0;
            blockCount = 0;
            runStatus = 'implemented';
          } else if (runTest.status === 'failed') {
            passCount = 0;
            failCount = t.total; // Assume all failed
            blockCount = 0;
            runStatus = 'implemented';
          } else if (runTest.status === 'skipped') {
            // Skipped in this run — show as blocked but keep original
            blockCount = t.total + t.blocked;
            passCount = 0;
            failCount = 0;
            runStatus = 'partial';
          }
        }
      }

      const totalCount = t.total + t.blocked;
      return {
        id: t.id,
        name: t.name,
        total: totalCount,
        automated: t.total,
        run: passCount + failCount,
        runPct: totalCount > 0 ? Math.round(((passCount + failCount) / totalCount) * 100) : 0,
        pass: passCount,
        fail: failCount,
        blocked: blockCount,
        inProgress: t.inProgress ?? (t.status === 'partial' ? t.blocked : 0),
        bugs: 0,
        passPct: pct(passCount, totalCount),
        failPct: pct(failCount, totalCount),
        blockedPct: pct(blockCount, totalCount),
        inProgPct: pct(t.inProgress ?? (t.status === 'partial' ? t.blocked : 0), totalCount),
        status: runStatus,
        isSelected: selectedTypes.has(t.id),
      };
    });
  }, [testTypes, selectedTypes, selectedHistoricalRun, historicalRuns]);

  // ── ITEM 9: Derive active run test type IDs for filtering ──
  const activeRun = useMemo(() => {
    if (selectedHistoricalRun >= 0 && selectedHistoricalRun < historicalRuns.length) {
      return historicalRuns[selectedHistoricalRun];
    }
    return historicalRuns.length > 0 ? historicalRuns[historicalRuns.length - 1] : null;
  }, [selectedHistoricalRun, historicalRuns]);

  const activeRunTestTypeIds = useMemo(() => {
    if (!activeRun?.tier) return null;
    const tierConfig = (testRunConfig as any).tiers?.[activeRun.tier];
    if (!tierConfig?.testTypes) return null;
    return new Set<string>(tierConfig.testTypes as string[]);
  }, [activeRun]);

  const activeRunLabel = useMemo(() => {
    if (!activeRun) return '';
    const tierLabel = activeRun.tierLabel || activeRun.tier || 'Run';
    let ts = '';
    try { ts = new Date(activeRun.started).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }); } catch { ts = activeRun.started || ''; }
    return `${tierLabel} — ${ts}`;
  }, [activeRun]);

  // ── ITEM 9: Filter summaryTableData to only include active run's test types ──
  const filteredTableData = useMemo(() => {
    if (!activeRunTestTypeIds) return summaryTableData;
    return summaryTableData.filter(r => activeRunTestTypeIds.has(r.id));
  }, [summaryTableData, activeRunTestTypeIds]);

  const totals = useMemo(() => {
    const data = filteredTableData;
    const t = { total: 0, automated: 0, run: 0, runPct: 0, pass: 0, fail: 0, blocked: 0, inProgress: 0, bugs: 0 };
    for (const r of data) {
      t.total += r.total; t.automated += r.automated; t.run += r.run;
      t.pass += r.pass; t.fail += r.fail; t.blocked += r.blocked; t.inProgress += r.inProgress; t.bugs += r.bugs;
    }
    return { ...t, runPct: t.total > 0 ? Math.round((t.run / t.total) * 100) : 0, passPct: pct(t.pass, t.total), failPct: pct(t.fail, t.total), blockedPct: pct(t.blocked, t.total), inProgPct: pct(t.inProgress, t.total) };
  }, [filteredTableData]);

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
    setRunProgress('Starting...');
    setRunPollError(null);
    try {
      const label = runBuildLabel || `manual-${new Date().toISOString().slice(0, 10)}`;
      const res = await fetch('/api/qa/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, env: testEnv, buildLabel: label, triggeredBy: runTriggeredBy }),
      });
      const data = await res.json();
      if (data.status === 'started') {
        // Tests started in background — will poll for completion
        setRunProgress('Tests started in background...');
        setLastRunMeta({ tier: tierId, buildLabel: label, time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) });
        // The polling effect will handle the rest
      } else {
        setEngineOutput(data.output || JSON.stringify(data, null, 2));
        setEngineRunning(null);
        setRunProgress(null);
      }
    } catch (err: any) {
      setEngineOutput(`Error: ${err.message}`);
      setRunProgress(null);
      setEngineRunning(null);
      setRunPollError(err.message);
    }
  }, [testEnv, runBuildLabel, runTriggeredBy]);

  const exportCSV = useCallback(() => {
    const headers = ['Category', 'Planned', 'Automated', 'Run', 'Run%', 'Pass', 'Fail', 'Blocked', 'In Prog', 'Pass%', 'Fail%', 'Blocked%', 'In Prog%', 'Bugs'];
    const rows = filteredTableData.map(r => [
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
  }, [filteredTableData, totals, defectsList]);

  const hasNoRuns = historicalRuns.length === 0;

  const applyGoNoGo = () => {
    if (!goNoGo) return;
    const entry = { decision: goNoGo, comment: goNoGoComment, date: new Date().toISOString() };
    const updated = [...goNoGoHistory, entry];
    setGoNoGoHistory(updated);
    setGoNoGoPdfGenerated(false); // Reset so user clicks Apply again to get new PDF
    setTimeout(() => setGoNoGoPdfGenerated(true), 100); // Show PDF button after state update
    localStorage.setItem('qa-dashboard-go-nogo-history', JSON.stringify(updated));
  };

  const downloadGoNoGoPdf = () => {
    if (!goNoGo) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Go/No-Go Decision Record', pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Divider line
    doc.setDrawColor(200);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Verdict
    doc.setFontSize(14);
    const isGo = goNoGo === 'go';
    doc.setTextColor(isGo ? 22 : 220, isGo ? 163 : 38, isGo ? 74 : 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`Verdict: ${goNoGo.toUpperCase()}`, 20, y);
    y += 10;

    // Timestamp
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Decision Timestamp: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`, 20, y);
    y += 8;
    doc.text(`Date: ${now.toISOString().slice(0, 10)}`, 20, y);
    y += 12;

    // Comment section
    doc.setTextColor(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rationale / Comment:', 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);

    // Word wrap the comment
    const maxWidth = pageWidth - 40;
    const lines = doc.splitTextToSize(goNoGoComment || '(No comment provided)', maxWidth);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 10;

    // Another divider
    doc.setDrawColor(200);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Signature Fields
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.text('Approvals', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const signatures = [
      'QA Lead Signature',
      'Project Manager Signature',
      'Human Gatekeeper Signature',
    ];

    for (const sig of signatures) {
      doc.text(sig, 20, y);
      y += 4;
      // Dotted line for signature
      const lineStart = 20;
      const lineEnd = pageWidth - 20;
      for (let x = lineStart; x < lineEnd; x += 4) {
        doc.line(x, y, x + 2, y);
      }
      y += 4;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('(Signature)', lineStart + 2, y);
      y += 2;
      doc.text('Date: _______________', lineStart + 70, y - 2);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(80);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text('Generated by PeteMart QA Dashboard', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    // Save
    const filename = `GoNoGo-${goNoGo.toUpperCase()}-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const statsCards = [
    { label: 'Total Tests (Planned)', value: totalAll, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pass Rate', value: `${livePassRate}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Test Types', value: `${summary.testTypesImplemented}/${summary.testTypesTotal}`, icon: Layout, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Quality Gates', value: `${gatesPassed}/${gatesTotal}`, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Reqs Traceable', value: `${traceableImplemented}%`, icon: Link, color: 'text-blue-600', bg: 'bg-blue-50' },
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
                <p className="text-xs text-gray-500">Data: {new Date(resultsData.lastUpdated || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} · Live: {liveTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} · Mode: {liveResults ? 'API' : 'Static Fallback'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md">21/21 test types · 12/12 gates</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Table of Contents */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-[57px] z-40 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700 mr-1">Jump to:</span>
            <a href="#kpi-cards" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">KPI + Go/No-Go</a>
            <a href="#tests-engine" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Tests Engine</a>
            <a href="#summary-table" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Summary</a>
            <a href="#charts" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Charts</a>
            <a href="#quality-gates" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Quality Gates</a>
            <a href="#traceability" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Traceability</a>
            <a href="#test-types" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Test Types</a>
            <a href="#defect-log" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Defects</a>
            <a href="#tool-dashboards" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Reports</a>
            <a href="#token-usage" className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700 transition-colors">Tokens</a>
          </div>
        </div>

        {/* KPI + Go/No-Go Split Frame */}
        <div id="kpi-cards" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Key Performance Indicators</h2>
              <span className="text-[10px] text-gray-400">Live pass rate: <span className={livePassRate >= 80 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{livePassRate}%</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Left: KPI Cards (2/3 width) */}
            <div className="lg:col-span-2 p-5 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            </div>
            {/* Right: Go/No-Go Decision Panel (1/3 width) */}
            <div className="border-t lg:border-t-0 lg:border-l border-gray-200 p-5 bg-gray-50/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Go / No-Go</h3>
                <button onClick={() => setShowGoNoGoHistory(!showGoNoGoHistory)} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
                  History ({goNoGoHistory.length})
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setGoNoGo('go')} className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md border transition-all text-center ${goNoGo === 'go' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:border-green-300'}`}>
                  ✅ GO
                </button>
                <button onClick={() => setGoNoGo('no-go')} className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md border transition-all text-center ${goNoGo === 'no-go' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'}`}>
                  🚫 NO-GO
                </button>
              </div>
              <textarea placeholder="Reason / blockers... (supports multiple paragraphs)" value={goNoGoComment} onChange={(e) => setGoNoGoComment(e.target.value)} rows={5} className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 bg-white mb-2 resize-y max-h-[200px] overflow-y-auto" />
              <div className="flex gap-2 mb-2">
                <button onClick={applyGoNoGo} disabled={!goNoGo} className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${!goNoGo ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                  Apply Decision
                </button>
                {goNoGoPdfGenerated && (
                  <button onClick={downloadGoNoGoPdf} className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-1">
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </button>
                )}
              </div>
              {goNoGo && <p className="mt-1 text-[10px] text-gray-500">Selected: <span className={goNoGo === 'go' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{goNoGo.toUpperCase()}</span></p>}
              {showGoNoGoHistory && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[10px] font-medium text-gray-700 mb-1.5">Audit Trail</p>
                  {goNoGoHistory.length === 0 ? (
                    <p className="text-[10px] text-gray-400">No decisions recorded yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {goNoGoHistory.map((entry, i) => (
                        <div key={i} className="flex items-start gap-1.5 p-1.5 rounded bg-white text-[10px]">
                          <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold ${entry.decision === 'go' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {entry.decision.toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-600 truncate">{entry.comment || '(no comment)'}</p>
                            <p className="text-gray-400">{new Date(entry.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border shadow-sm ${
                testEnv === 'sandbox' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-blue-50 text-blue-700 border-blue-300'
              }`}>
                {testEnv === 'sandbox' ? <CheckCircle className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                <span className="uppercase tracking-wider">{testEnv === 'sandbox' ? 'Sandbox' : 'CI/CD'}</span>
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
            </div>
          </div>

          {/* Tier Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {TIER_CONFIGS.map((tier) => {
              const TIcon = tier.icon;
              const rn = engineRunning === tier.id;
              const envTier = '✅';
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
                    {rn && <span className="text-blue-600 font-medium animate-pulse">{runProgress || 'Running...'}</span>}
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

          {/* Engine Output / Progress */}
          {engineRunning && runProgress && (
            <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Tests running in background...</p>
                  <p className="text-xs text-blue-600">{runProgress}</p>
                  <p className="text-[10px] text-blue-400 mt-1">Polling for status every 5s — UI stays responsive</p>
                </div>
              </div>
            </div>
          )}
          {runPollError && !engineRunning && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-medium text-red-700">Error: {runPollError}</p>
              <button onClick={() => setRunPollError(null)} className="text-[10px] text-red-500 hover:text-red-700 mt-1">Dismiss</button>
            </div>
          )}
          {engineOutput && !engineRunning && (
            <div className="mb-3 p-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono max-h-48 overflow-auto">
              <pre className="whitespace-pre-wrap">{engineOutput}</pre>
              <button onClick={() => setEngineOutput(null)} className="mt-1 text-gray-500 hover:text-white">Clear</button>
            </div>
          )}

          {/* Tests Selection Toggle + Collapsible Content */}
          <div className="flex items-center justify-end mb-3">
            <button onClick={() => setShowTestConfig(!showTestConfig)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              showTestConfig ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              <Filter className="w-3.5 h-3.5" /> Tests Selection {selectedTypes.size > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-full text-[10px]">{selectedTypes.size}</span>}
            </button>
          </div>
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
              {/* ── ITEM 2: Historical Run Dropdown ── */}
              {historicalRuns.length > 0 && (
                <div className="relative mr-2">
                  <select
                    value={selectedHistoricalRun}
                    onChange={(e) => setSelectedHistoricalRun(parseInt(e.target.value, 10))}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 pr-7 cursor-pointer hover:border-amber-300 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value={-1}>Current Results (Latest)</option>
                    {historicalRuns.map((run, idx) => {
                      const tierLabel = run.tierLabel || run.tier || 'Run';
                      const ts = run.started
                        ? (() => {
                            try { return new Date(run.started).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
                            catch { return run.started.slice(0, 16).replace('T', ' '); }
                          })()
                        : `#${idx + 1}`;
                      const statusIcon = run.allPassed ? '✅' : run.allPassed === false ? '❌' : '⏳';
                      return (
                        <option key={idx} value={idx}>
                          {statusIcon} {tierLabel} — {ts}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <span className="text-[10px] text-gray-400">{totalAll} total tests across {testTypes.length} categories</span>
              <button onClick={exportCSV} disabled={hasNoRuns} className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium border rounded transition-colors ${hasNoRuns ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed' : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'}`}>
                <Download className="w-3 h-3" /> {hasNoRuns ? 'Run a test tier first' : 'CSV'}
              </button>
            </div>
          </div>
          {/* ── ITEM 2: Historical run viewing indicator ── */}
          {selectedHistoricalRun >= 0 && (
            <div className="mb-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-800 font-medium">
                Viewing historical run: {activeRunLabel}
              </span>
              <button
                onClick={() => setSelectedHistoricalRun(-1)}
                className="ml-auto px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
              >
                View Current Results
              </button>
            </div>
          )}
          {/* ── ITEM 9: Show active run indicator (for latest run too) ── */}
          {activeRun && selectedHistoricalRun < 0 && (
            <div className="mb-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-xs text-blue-800 font-medium">
                Showing results for: {activeRunLabel}
              </span>
            </div>
          )}
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
                {filteredTableData.map(row => (
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

        {/* Requirements Traceability */}
        <div id="traceability" className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Requirements Traceability ({traceableTotal} reqs)</h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${traceableImplemented >= 80 ? 'text-green-600' : traceableImplemented >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {traceableImplemented}% coverage
              </span>
              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${traceableImplemented >= 80 ? 'bg-green-500' : traceableImplemented >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${traceableImplemented}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select value={traceCategory} onChange={(e) => setTraceCategory(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700">
              <option value="all">All Categories</option>
              {traceCategories.map((cat: any) => (
                <option key={cat.id} value={cat.req_prefix}>{cat.label} ({cat.total})</option>
              ))}
            </select>
            <select value={traceFilter} onChange={(e) => setTraceFilter(e.target.value)} className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700">
              <option value="all">All Status</option>
              <option value="implemented">Implemented</option>
              <option value="partial">Partial</option>
              <option value="not_implemented">Not Implemented</option>
            </select>
            <span className="text-xs text-gray-400">{filteredTraceItems.length} of {allTraceItems.length} items</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {filteredTraceItems.map((item: any) => (
              <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                item.status === 'implemented' ? 'bg-green-50 border-green-200' :
                item.status === 'partial' ? 'bg-amber-50 border-amber-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                {item.status === 'implemented' ? <CheckCircle className="w-3 h-3 text-green-600 shrink-0" /> :
                 item.status === 'partial' ? <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" /> :
                 <XCircle className="w-3 h-3 text-gray-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-gray-900 truncate">{item.id}</p>
                  <p className="text-[10px] text-gray-500 truncate">{item.title}</p>
                </div>
                <StatusBadge status={item.status === 'not_implemented' ? 'not-executed' : item.status} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400 border-t border-gray-100 pt-3">
            <span>🟢 Implemented: {traceabilityData.coverage_summary.implemented}</span>
            <span>🟡 Partial: {traceabilityData.coverage_summary.partial}</span>
            <span>⚪ Not Implemented: {traceabilityData.coverage_summary.not_implemented}</span>
            <span className="ml-auto">Last updated: {traceabilityData.generated_at}</span>
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
        {/* Reports Info — Dynamic with existence checking */}
        <div id="tool-dashboards" className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">External Reports</h2>
          <p className="text-xs text-gray-500 mb-3">Click any report link to view test artifacts. Reports are generated during CI/CD pipeline runs.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'vitest', name: 'Vitest', icon: FileText, href: '/qa-dashboard/reports/vitest/index.html' },
              { id: 'playwright', name: 'Playwright', icon: Monitor, href: '/qa-dashboard/reports/playwright/index.html' },
              { id: 'performance', name: 'k6 / Lighthouse', icon: Activity, href: '/qa-dashboard/reports/performance/index.html' },
              { id: 'coverage', name: 'Coverage', icon: FileJson, href: '/qa-dashboard/reports/coverage/index.html' },
            ].map((tool) => {
              const Icon = tool.icon;
              const rs = reportStatuses[tool.id];
              const exists = rs?.exists === true;
              const genCommand = rs?.command || '';

              if (exists) {
                return (
                  <a key={tool.id} href={tool.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <Icon className="w-4 h-4 text-gray-500 group-hover:text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 group-hover:text-amber-700 flex items-center gap-1">{tool.name} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                      <p className="text-[10px] text-gray-400">{rs?.desc || 'Test report'}</p>
                    </div>
                  </a>
                );
              }

              // Disabled state for non-existent reports
              return (
                <div key={tool.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-100 opacity-60 cursor-not-allowed select-none relative group">
                  <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400 flex items-center gap-1">{tool.name}</p>
                    <p className="text-[10px] text-gray-400">Not generated yet — run tests first</p>
                  </div>
                  {/* Tooltip with generation command */}
                  {genCommand && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 max-w-[300px] break-all">
                      <p className="font-semibold mb-1">Generate command:</p>
                      <code className="text-green-300">{genCommand}</code>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* Token Usage & Cost Tracking */}
        {/* ═══════════════════════════════════════════════════ */}
        <TokenUsageSection />
      </div>
    </div>
  );
}

function TokenUsageSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/token-usage')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div id="token-usage" className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">Token Usage & Cost</h2>
        </div>
        <div className="animate-pulse flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading token usage data...
        </div>
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div id="token-usage" className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">Token Usage & Cost</h2>
        </div>
        <p className="text-xs text-gray-400">No token usage data available yet. Run agent tasks to generate usage logs.</p>
      </div>
    );
  }

  const { summary, sessions } = data;
  const agentChart = summary.agent_chart || [];
  const modelChart = summary.model_chart || [];

  return (
    <div id="token-usage" className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900">Token Usage & Cost</h2>
        </div>
        <span className="text-[10px] text-gray-400">{summary.total_sessions} tracked sessions</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total Sessions</p>
          <p className="text-lg font-bold text-gray-900">{summary.total_sessions}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Tokens In</p>
          <p className="text-lg font-bold text-gray-900">{(summary.total_tokens_input / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-gray-400">{summary.total_tokens_input.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Tokens Out</p>
          <p className="text-lg font-bold text-gray-900">{(summary.total_tokens_output / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-gray-400">{summary.total_tokens_output.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Est. Cost</p>
          <p className="text-lg font-bold text-gray-900">
            {summary.total_cost > 0
              ? `$${summary.total_cost.toFixed(2)}`
              : '—'}
          </p>
          <p className="text-[10px] text-gray-400">DeepSeek V4 Flash (free)</p>
        </div>
      </div>

      {/* Agent Breakdown */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">Usage by Agent</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Agent</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Sessions</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Tokens In</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Tokens Out</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {agentChart.map((agent: any) => (
                <tr key={agent.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-1.5 px-2 font-medium text-gray-900">{agent.name}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{agent.sessions}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{(agent.tokens_input / 1000).toFixed(0)}K</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{(agent.tokens_output / 1000).toFixed(0)}K</td>
                  <td className="py-1.5 px-2 text-right font-mono">{agent.cost > 0 ? `$${agent.cost.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">Usage by Model</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-2 font-semibold text-gray-600">Model</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Sessions</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Tokens In</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Tokens Out</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-600">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {modelChart.map((model: any) => (
                <tr key={model.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-1.5 px-2 font-medium text-gray-900">{model.name}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{model.sessions}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{(model.tokens_input / 1000).toFixed(0)}K</td>
                  <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{(model.tokens_output / 1000).toFixed(0)}K</td>
                  <td className="py-1.5 px-2 text-right font-mono">{model.cost > 0 ? `$${model.cost.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent sessions */}
      {sessions && sessions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Recent Sessions (top 10)</h3>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 sticky top-0">
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Agent</th>
                  <th className="text-center py-1.5 px-2 font-semibold text-gray-600">Model</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-gray-600">In</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-gray-600">Out</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map((s: any) => (
                  <tr key={s.session_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1.5 px-2 font-medium text-gray-900">{s.agent}</td>
                    <td className="py-1.5 px-2 text-center text-gray-600">{s.model}</td>
                    <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{s.tokens_input.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-gray-700 font-mono">{s.tokens_output.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-gray-500">{s.timestamp.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
