'use client';

import React from 'react';
import {
  getProvider, LLM_PROVIDERS, defaultModelFor, providerDefaultBaseUrl,
  AgentRosterEntry,
} from '@productforge/shared';
import { Sparkles, Eye, EyeOff, Shield } from 'lucide-react';

export type AgentLlmSelection = {
  provider: string;
  model: string;
  apiKey?: string;
  baseURL?: string;
  enabled: boolean;
};

export type AgentLlmMap = Record<string, AgentLlmSelection>;

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI', claude: 'Anthropic Claude', google: 'Google Gemini', groq: 'Groq',
  cerebras: 'Cerebras', openrouter: 'OpenRouter', deepseek: 'DeepSeek', mistral: 'Mistral',
  deepinfra: 'DeepInfra', together: 'Together AI', xai: 'xAI Grok', opencode: 'OpenCode Zen', local: 'Local (Ollama)',
};

export function defaultAgentLlmMap(agents: AgentRosterEntry[]): AgentLlmMap {
  const map: AgentLlmMap = {};
  for (const a of agents) {
    map[a.id] = {
      provider: a.recommended.provider,
      model: a.recommended.model,
      apiKey: '',
      baseURL: providerDefaultBaseUrl(a.recommended.provider),
      enabled: true,
    };
  }
  return map;
}

export function mergeAgentLlmMap(
  roster: AgentRosterEntry[],
  existing: Record<string, any> | undefined
): AgentLlmMap {
  const base = defaultAgentLlmMap(roster);
  if (!existing) return base;
  for (const id of Object.keys(base)) {
    const ex = existing[id];
    if (!ex) continue;
    base[id] = {
      provider: ex.provider || base[id].provider,
      model: ex.model || base[id].model,
      apiKey: ex.apiKey || base[id].apiKey || '',
      baseURL: ex.baseURL !== undefined ? ex.baseURL : providerDefaultBaseUrl(ex.provider || base[id].provider),
      enabled: ex.enabled !== undefined ? ex.enabled : true,
    };
  }
  return base;
}

export function AgentRosterEditor({
  agents, value, onChange, showKeys = true,
}: {
  agents: AgentRosterEntry[];
  value: AgentLlmMap;
  onChange: (v: AgentLlmMap) => void;
  showKeys?: boolean;
}) {
  const [visible, setVisible] = React.useState<Record<string, boolean>>({});

  const set = (id: string, patch: Partial<AgentLlmSelection>) => {
    onChange({ ...value, [id]: { ...value[id], ...patch } });
  };

  const handleProviderChange = (id: string, provider: string) => {
    const rec = agents.find((a) => a.id === id)?.recommended;
    const model = rec && rec.provider === provider ? rec.model : defaultModelFor(provider);
    set(id, { provider, model, baseURL: providerDefaultBaseUrl(provider) });
  };

  const enabled = agents.filter((a) => value[a.id]?.enabled !== false);
  const disabled = agents.filter((a) => value[a.id]?.enabled === false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] font-medium text-indigo-700">
          <Sparkles size={12} /> {enabled.length} agents active
        </div>
        {disabled.length > 0 && (
          <div className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-500">
            {disabled.length} disabled
          </div>
        )}
        <div className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
          <Shield size={11} /> Keys are stored in gitignored llm_config.json — never committed.
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2 w-8">On</th>
              <th className="px-3 py-2">Agent</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2 min-w-[170px]">Model</th>
              {showKeys && <th className="px-3 py-2">API Key</th>}
              <th className="px-3 py-2">Base URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enabled.map((a) => {
              const sel = value[a.id];
              const provider = getProvider(sel.provider);
              const rec = a.recommended;
              const isRec = sel.provider === rec.provider && sel.model === rec.model;
              return (
                <tr key={a.id} className="hover:bg-gray-50/50 align-top">
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => set(a.id, { enabled: false })}
                      className={`w-4 h-4 rounded border flex items-center justify-center text-white ${sel.enabled ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                      {sel.enabled && <span className="text-[9px]">✓</span>}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-semibold font-mono">{a.id}</div>
                    <div className="text-[10px] text-gray-400 leading-tight max-w-[220px]">{a.short_role}</div>
                    <div className="text-[9px] text-gray-300 mt-0.5">{a.phase_label.split(':')[0]}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select value={sel.provider} onChange={(e) => handleProviderChange(a.id, e.target.value)}
                      className="w-full border rounded-md px-1.5 py-1 text-[11px] bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                      {LLM_PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <select value={sel.model} onChange={(e) => set(a.id, { model: e.target.value })}
                        className="w-full border rounded-md px-1.5 py-1 text-[11px] bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                        {provider?.models.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}{rec && rec.provider === sel.provider && rec.model === m.value ? ' ★' : ''}</option>
                        ))}
                      </select>
                      {isRec && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px] px-1 py-px rounded-full bg-emerald-100 text-emerald-700 font-bold">★ REC</span>
                      )}
                    </div>
                    {isRec && <div className="text-[9px] text-emerald-600 mt-0.5 leading-tight">{rec.reason}</div>}
                  </td>
                  {showKeys && (
                    <td className="px-3 py-2">
                      <div className="relative">
                        <input type={visible[a.id] ? 'text' : 'password'} value={sel.apiKey || ''}
                          onChange={(e) => set(a.id, { apiKey: e.target.value })}
                          placeholder={sel.provider === 'local' ? '(not needed)' : 'sk-...'}
                          className="w-full border rounded-md px-2 py-1 text-[11px] font-mono pr-7 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                        <button type="button" onClick={() => setVisible((v) => ({ ...v, [a.id]: !v[a.id] }))}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {visible[a.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <input value={sel.baseURL || ''} onChange={(e) => set(a.id, { baseURL: e.target.value })}
                      placeholder="auto"
                      className="w-full border rounded-md px-2 py-1 text-[11px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {disabled.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Disabled agents</div>
          <div className="flex flex-wrap gap-1.5">
            {disabled.map((a) => (
              <button key={a.id} type="button" onClick={() => set(a.id, { enabled: true })}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {a.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-400">
        Provider labels: {LLM_PROVIDERS.map((p) => p.label).join(' · ')}
      </div>
    </div>
  );
}

export function providerLabel(v: string): string {
  return PROVIDER_LABELS[v] || v;
}