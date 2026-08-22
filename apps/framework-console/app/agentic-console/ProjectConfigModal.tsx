'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Loader2, CheckCircle, Upload, Sparkles, Folder, Globe, Layers, Cpu, Shield, Wallet, Rocket, Lightbulb,
} from 'lucide-react';
import {
  AGENT_ROSTER, AgentRosterEntry, LLM_PROVIDERS, getProvider, providerDefaultBaseUrl,
  OPTIONAL_AGENTS_BY_PHASE, inferFromIdea, IdeaSuggestion,
} from '@productforge/shared';
import { AgentRosterEditor, AgentLlmMap, defaultAgentLlmMap } from './AgentRosterEditor';
import { ProjectInfo } from './shared';

const PLATFORM_OPTIONS = [
  { id: 'auto', label: 'Auto (infer from idea)', desc: 'Framework decides based on your product idea/vision' },
  { id: 'web', label: 'Web only', desc: 'Responsive web app — fastest validation' },
  { id: 'mobile', label: 'Mobile (Android + iOS)', desc: 'React Native/Expo native app' },
  { id: 'web_mobile', label: 'Web + Mobile', desc: 'Both surfaces' },
  { id: 'pwa', label: 'Web + PWA', desc: 'Web with offline/push capabilities' },
];

const COMPLEXITY_OPTIONS = [
  { id: 'poc', label: 'POC / Pilot', desc: 'Zero-cost pilot, validate the core workflow' },
  { id: 'standard', label: 'Standard / MVP', desc: 'Full product, standard complexity' },
  { id: 'enterprise', label: 'Enterprise', desc: 'Multi-tenant, scale, compliance' },
];

const MARKET_OPTIONS = [
  { id: 'local', label: 'Local', desc: 'City / neighbourhood' },
  { id: 'regional', label: 'Regional', desc: 'Multi-city region' },
  { id: 'national', label: 'National', desc: 'Country-wide' },
  { id: 'global', label: 'Global', desc: 'Worldwide' },
];

const MONETIZATION_OPTIONS = [
  { id: 'subscription', label: 'Subscription' },
  { id: 'commission', label: 'Commission / Marketplace fee' },
  { id: 'advertising', label: 'Advertising' },
  { id: 'delivery_fees', label: 'Delivery / Service fees' },
  { id: 'freemium', label: 'Freemium' },
];

const TECH_STACK_PRESETS = [
  {
    id: 'default', label: 'Recommended (Auto)', desc: 'Next.js/React + Node API + PostgreSQL + Vercel',
    stack: { frontend: 'Next.js/React', backend: 'Node.js / Next API', database: 'PostgreSQL (Supabase)', deploy: 'Vercel + Supabase' },
  },
  {
    id: 'fullstack_next', label: 'Full-Stack Next.js', desc: 'Single Next.js app for web+mobile web',
    stack: { frontend: 'Next.js/React + Tailwind', backend: 'Next.js API routes', database: 'PostgreSQL + Prisma', deploy: 'Vercel' },
  },
  {
    id: 'mern', label: 'MERN', desc: 'React + Express + MongoDB',
    stack: { frontend: 'React (Vite)', backend: 'Express/Node', database: 'MongoDB', deploy: 'Railway' },
  },
  {
    id: 'python', label: 'Python Backend', desc: 'React + FastAPI/Django',
    stack: { frontend: 'Next.js/React', backend: 'FastAPI (Python)', database: 'PostgreSQL', deploy: 'Railway / Render' },
  },
];

function LogoPreview({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      setPreview(data);
      setForm({ ...form, logo: { type: 'upload', data, filename: file.name } });
    };
    reader.readAsDataURL(file);
  };

  const generated = useMemo(() => {
    const initials = (form.logo?.initials || form.name?.trim().slice(0, 2).toUpperCase() || 'PF');
    const color = form.logo?.color || '#6366F1';
    return { initials, color };
  }, [form.logo, form.name]);

  return (
    <div className="flex items-start gap-4">
      <div className="w-20 h-20 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0"
        style={preview ? {} : { background: generated.color }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="logo" className="w-full h-full object-contain" />
        ) : (
          <span className="text-2xl font-black text-white">{generated.initials}</span>
        )}
      </div>
      <div className="space-y-2 flex-1">
        <label className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer w-fit font-medium">
          <Upload size={13} /> Upload logo
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <div className="flex items-center gap-2">
          <input value={generated.initials} maxLength={3} onChange={(e) => setForm({ ...form, logo: { ...(form.logo || {}), type: 'generated', initials: e.target.value } })}
            placeholder="PF" className="w-16 border rounded-lg px-2 py-1 text-[11px] text-center" />
          <input type="color" value={generated.color} onChange={(e) => setForm({ ...form, logo: { ...(form.logo || {}), type: 'generated', color: e.target.value } })}
            className="w-9 h-9 rounded border cursor-pointer" />
        </div>
        <p className="text-[10px] text-gray-400">Upload your product logo, or auto-generate one from the product initials + brand color.</p>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-indigo-600">{icon}</span>
        <h3 className="text-sm font-bold">{title}</h3>
        {subtitle && <span className="text-[10px] text-gray-400 ml-auto">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

export default function ProjectConfigModal({
  open, editing, initialConfig, onClose, onSaved,
}: {
  open: boolean;
  editing: ProjectInfo | null;
  initialConfig?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [platformChoice, setPlatformChoice] = useState('auto');
  const [complexity, setComplexity] = useState('standard');
  const [marketScope, setMarketScope] = useState('regional');
  const [monetization, setMonetization] = useState<string[]>(['subscription']);
  const [techPreset, setTechPreset] = useState('default');
  const [techStack, setTechStack] = useState(TECH_STACK_PRESETS[0].stack);
  const [folderPath, setFolderPath] = useState('');
  const [billingModel, setBillingModel] = useState('byok');
  const [form, setForm] = useState<any>({ logo: { type: 'generated', initials: '', color: '#6366F1' } });
  const [agentMap, setAgentMap] = useState<AgentLlmMap>({});
  const [acceptedOptional, setAcceptedOptional] = useState<string[]>([]);
  const [budgetMonthly, setBudgetMonthly] = useState<number | null>(null);

  const inference: IdeaSuggestion | null = useMemo(() => (idea.trim() ? inferFromIdea(idea) : null), [idea]);

  const baseAgents = useMemo(() => AGENT_ROSTER.filter((a) => a.base), []);

  const effectiveAgents = useMemo(() => {
    const ids = new Set([...baseAgents.map((a) => a.id), ...acceptedOptional]);
    return AGENT_ROSTER.filter((a) => ids.has(a.id));
  }, [baseAgents, acceptedOptional]);

  const optionalAgents = useMemo(() => AGENT_ROSTER.filter((a) => a.optional), []);
  const suggestedIds = inference?.suggested_agents || [];

  // Initialize with editing config or defaults
  useEffect(() => {
    if (!open) return;
    const cfg = initialConfig;
    if (editing && cfg) {
      setName(cfg.name || editing.name || '');
      setIdea(cfg.idea_prompt || cfg.description || '');
      setPlatformChoice(cfg.platforms?.includes('mobile') && cfg.platforms?.includes('web')
        ? 'web_mobile'
        : cfg.platforms?.includes('mobile') ? 'mobile'
        : cfg.platforms?.includes('pwa') ? 'pwa'
        : cfg.platforms?.includes('web') ? 'web' : 'auto');
      setComplexity(cfg.complexity || 'standard');
      setMarketScope(cfg.market_scope || 'regional');
      setMonetization(cfg.monetization || ['subscription']);
      setTechStack(cfg.tech_stack || TECH_STACK_PRESETS[0].stack);
      setFolderPath(cfg.folder_path ? (cfg.folder_path_relative || cfg.folder_path) : '');
      setBillingModel(cfg.billing_model || 'byok');
      setBudgetMonthly(cfg.budget?.production_monthly_inr ?? null);
      setForm({ logo: cfg.logo || { type: 'generated', initials: '', color: '#6366F1' } });
      const enabled = cfg.agent_roster || Object.keys(cfg.agents || {});
      const accepted = enabled.filter((id: string) => AGENT_ROSTER.find((a) => a.id === id)?.optional);
      setAcceptedOptional(accepted);
      const seeded = defaultAgentLlmMap(AGENT_ROSTER.filter((a) => enabled.includes(a.id)));
      for (const [id, ac] of Object.entries<any>(cfg.agents || {})) {
        if (seeded[id]) { seeded[id].provider = ac.provider || seeded[id].provider; seeded[id].model = ac.model || seeded[id].model; seeded[id].baseURL = ac.baseURL; }
      }
      setAgentMap(seeded);
    } else {
      setName(''); setIdea(''); setPlatformChoice('auto'); setComplexity('standard');
      setMarketScope('regional'); setMonetization(['subscription']); setTechPreset('default');
      setTechStack(TECH_STACK_PRESETS[0].stack); setFolderPath(''); setBillingModel('byok');
      setBudgetMonthly(null); setForm({ logo: { type: 'generated', initials: '', color: '#6366F1' } });
      setAcceptedOptional([]);
      setAgentMap(defaultAgentLlmMap(baseAgents));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const applySuggestion = (ids: string[]) => {
    setAcceptedOptional((prev) => Array.from(new Set([...prev, ...ids])));
    setAgentMap((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const meta = AGENT_ROSTER.find((a) => a.id === id);
        if (meta && !next[id]) next[id] = { provider: meta.recommended.provider, model: meta.recommended.model, apiKey: '', baseURL: providerDefaultBaseUrl(meta.recommended.provider), enabled: true };
      }
      return next;
    });
  };

  const toggleOptional = (id: string) => {
    if (acceptedOptional.includes(id)) {
      setAcceptedOptional((prev) => prev.filter((x) => x !== id));
      setAgentMap((prev) => ({ ...prev, [id]: { ...prev[id], enabled: false } }));
    } else {
      applySuggestion([id]);
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Project name is required'); return; }
    setSaving(true);
    try {
      const enabled = Object.entries(agentMap).filter(([, v]) => v.enabled).map(([id]) => id);
      const agents: Record<string, any> = {};
      for (const id of enabled) {
        const v = agentMap[id];
        agents[id] = { provider: v.provider, model: v.model, baseURL: v.baseURL, apiKey: v.apiKey };
      }
      const platforms = platformChoice === 'auto'
        ? (inference?.platforms || ['web'])
        : platformChoice === 'web_mobile' ? ['web', 'mobile']
        : platformChoice === 'pwa' ? ['web', 'pwa']
        : [platformChoice];

      const body: any = {
        name,
        description: idea,
        idea_prompt: idea,
        platforms,
        complexity,
        market_scope: marketScope,
        monetization,
        tech_stack: techStack,
        folder_path: folderPath || undefined,
        billing_model: billingModel,
        logo: form.logo,
        llm_defaults: { provider: agentMap['00_supervisor_agent']?.provider || 'openrouter', model: agentMap['00_supervisor_agent']?.model || 'deepseek/deepseek-v4-flash', baseURL: agentMap['00_supervisor_agent']?.baseURL || '' },
        agents,
        enabled_agents: enabled,
        suggested_agents: acceptedOptional,
        budget_production_monthly_inr: budgetMonthly,
      };

      const res = await fetch('/api/agentic-console/projects', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...body } : body),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.error || 'Save failed'); setSaving(false); return; }
      showToast(editing ? `Updated "${json.project?.name}"` : `Created "${json.project?.name}"`);
      setTimeout(() => { onSaved(); onClose(); }, 700);
    } catch {
      showToast('Save failed');
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold">{editing ? 'Edit Project Configuration' : 'Create New Project'}</h2>
            <p className="text-[10px] text-gray-400">Every section pre-fills from your idea — override anything.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* 1. Identity & Idea */}
          <Section icon={<Lightbulb size={16} />} title="1 · Identity & Product Idea">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Project Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Bangalore Silk Marketplace"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Project Folder</label>
                <div className="flex items-center gap-1.5">
                  <Folder size={14} className="text-gray-400" />
                  <input value={folderPath} onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="default: projects/<id> in workspace (or absolute path)"
                    className="w-full border rounded-lg px-3 py-2 text-[12px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Product Idea / Vision *</label>
              <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3}
                placeholder="Describe your product, who it's for, and the core workflow…"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              {inference && (
                <div className="mt-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold"><Sparkles size={12} /> Auto-suggested from your idea</div>
                  {inference.reasons.slice(0, 3).map((r, i) => <div key={i}>• {r}</div>)}
                </div>
              )}
            </div>
          </Section>

          {/* 2. Scope */}
          <Section icon={<Globe size={16} />} title="2 · Delivery Scope" subtitle="Auto-inferred from idea">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Target Platforms</label>
                <div className="space-y-1.5">
                  {PLATFORM_OPTIONS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setPlatformChoice(p.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${platformChoice === p.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                      <span className="font-semibold">{p.label}</span>
                      <span className="block text-[10px] text-gray-400">{p.desc}</span>
                    </button>
                  ))}
                  {platformChoice === 'auto' && inference && (
                    <div className="text-[10px] text-emerald-600 font-medium">→ Platform inference: <b>{inference.platforms.join(' + ')}</b></div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Complexity</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {COMPLEXITY_OPTIONS.map((c) => (
                      <button key={c.id} type="button" onClick={() => setComplexity(c.id)}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] transition-colors ${complexity === c.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Market Scope</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MARKET_OPTIONS.map((m) => (
                      <button key={m.id} type="button" onClick={() => setMarketScope(m.id)}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] transition-colors ${marketScope === m.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Monetization</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MONETIZATION_OPTIONS.map((mo) => (
                      <button key={mo.id} type="button" onClick={() => setMonetization((prev) => prev.includes(mo.id) ? prev.filter((x) => x !== mo.id) : [...prev, mo.id])}
                        className={`px-2.5 py-1 rounded-full border text-[10px] transition-colors ${monetization.includes(mo.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600'}`}>
                        {mo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* 3. Tech Stack & Billing */}
          <Section icon={<Layers size={16} />} title="3 · Tech Stack & Delivery">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">Stack Preset</label>
                <div className="space-y-1.5">
                  {TECH_STACK_PRESETS.map((t) => (
                    <button key={t.id} type="button" onClick={() => { setTechPreset(t.id); setTechStack(t.stack); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${techPreset === t.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                      <span className="font-semibold">{t.label}</span>
                      <span className="block text-[10px] text-gray-400">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(techStack).map(([k, v]) => (
                  <div key={k}>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-0.5">{k}</label>
                    <input value={String(v)} onChange={(e) => setTechStack((prev) => ({ ...prev, [k]: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-1.5 text-[12px] focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-0.5">Billing Model</label>
                  <select value={billingModel} onChange={(e) => setBillingModel(e.target.value)}
                    className="w-full border rounded-lg px-3 py-1.5 text-[12px] bg-white">
                    <option value="byok">Enterprise BYOK (bring your own LLM keys)</option>
                    <option value="managed">Managed SaaS (pre-paid credits)</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>

          {/* 4. Branding */}
          <Section icon={<Cpu size={16} />} title="4 · Branding & Logo">
            <LogoPreview form={form} setForm={setForm} />
          </Section>

          {/* 5. Agent Roster + LLM */}
          <Section icon={<Shield size={16} />} title="5 · Agents & LLM Configuration" subtitle={`${effectiveAgents.length} agents active`}>
            {/* Supervisor explainer */}
            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700"><Shield size={13} /> Agent 00 — Supervisor (always on)</div>
              <p>Orchestrates all other agents: enforces dependency chains, pool scheduling, loop guardrails, HITL gates and compliance audits. It does <b>not</b> make product decisions — it escalates to you. Every agent listed below reports back to it.</p>
            </div>

            {/* Suggestion engine */}
            {!editing && optionalAgents.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  <Sparkles size={12} className="text-fuchsia-500" /> Optional agents (suggested based on your idea)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {optionalAgents.map((a) => {
                    const recommended = suggestedIds.includes(a.id);
                    const accepted = acceptedOptional.includes(a.id);
                    return (
                      <div key={a.id} className={`border rounded-lg p-2.5 ${accepted ? 'border-indigo-300 bg-indigo-50/50' : recommended ? 'border-fuchsia-200 bg-fuchsia-50/40' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleOptional(a.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center text-white shrink-0 ${accepted ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                            {accepted && <span className="text-[9px]">✓</span>}
                          </button>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold font-mono">{a.id.split('_')[0]} · {a.short_role}</div>
                            <div className="text-[10px] text-gray-500 leading-tight">{a.description.slice(0, 90)}…</div>
                            <div className="text-[9px] text-gray-400 mt-0.5">{a.phase_label.split(':')[0]} · feeds: {a.consumers.slice(0, 3).map((c) => c.split('_')[0]).join(', ')}</div>
                          </div>
                          {recommended && <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold shrink-0">SUGGESTED</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <AgentRosterEditor agents={effectiveAgents} value={agentMap} onChange={setAgentMap} />
          </Section>

          {/* 6. Budget note */}
          <Section icon={<Wallet size={16} />} title="6 · Budget">
            <div className="text-[11px] text-gray-500 space-y-2">
              <p className="flex items-center gap-1.5"><Rocket size={13} className="text-emerald-500" /> <b>POC budget = ₹0 (free tiers only)</b> — confirmed by default.</p>
              <p>Production budget is <b>confirmed after architecture & tech-stack derivation</b> (Agent 03 produces cost models → GATE-COSTING-01 → you approve before production agents run).</p>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Optional — Production monthly budget cap (₹)</label>
                <input type="number" min={0} value={budgetMonthly ?? ''} onChange={(e) => setBudgetMonthly(e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g., 25000 (optional; enforced by Agent 14 FinOps)" className="w-72 border rounded-lg px-3 py-1.5 text-[12px]" />
              </div>
            </div>
          </Section>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] text-gray-400">{effectiveAgents.length} agents · {Object.values(agentMap).filter((v) => v.enabled).length} enabled · POC ₹0</span>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              {editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg shadow-lg z-[70]">{toast}</div>
      )}
    </div>
  );
}