// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  LLM_PROVIDERS, getProvider, defaultModelFor, providerDefaultBaseUrl,
  AGENT_ROSTER, AGENT_ROSTER_BY_ID, BASE_AGENT_IDS, OPTIONAL_AGENT_IDS,
  inferFromIdea, suggestedAgentEntries,
} from '@productforge/shared';

describe('LLM Catalog', () => {
  it('has a rich set of providers with real model lists', () => {
    expect(LLM_PROVIDERS.length).toBeGreaterThanOrEqual(10);
    for (const p of LLM_PROVIDERS) {
      expect(p.value).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.models.length).toBeGreaterThan(0);
      // defaultModel must be one of the listed models
      expect(p.models.map((m) => m.value)).toContain(p.defaultModel);
    }
  });

  it('getProvider / defaultModelFor / providerDefaultBaseUrl work', () => {
    expect(getProvider('openrouter')?.baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(getProvider('deepseek')?.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(getProvider('google')?.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta/openai');
    expect(defaultModelFor('openrouter')).toBeTruthy();
    expect(providerDefaultBaseUrl('local')).toContain('localhost');
    expect(getProvider('nope')).toBeUndefined();
  });
});

describe('Agent Roster', () => {
  it('has the base 16 agents (00-15) + suggested optional agents', () => {
    expect(BASE_AGENT_IDS).toContain('00_supervisor_agent');
    expect(BASE_AGENT_IDS).toContain('01_ideation_agent');
    expect(BASE_AGENT_IDS).toContain('07a_ui_agent');
    expect(BASE_AGENT_IDS).toContain('15_secrets_compliance_agent');
    // Base = 00-06 (7) + 07a-d (4) + 08-15 (8) = 19 roster entries ("16 agents" counts 07 as one role)
    expect(BASE_AGENT_IDS.length).toBe(19);
    // optional agents 16-26
    expect(OPTIONAL_AGENT_IDS).toContain('16_product_analyst_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('18_mobile_engineer_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('19_appsec_engineer_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('20_perf_sre_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('21_data_analytics_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('22_customer_success_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('23_growth_experiment_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('24_legal_privacy_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('25_product_evolution_agent');
    expect(OPTIONAL_AGENT_IDS).toContain('26_content_seo_agent');
    expect(OPTIONAL_AGENT_IDS.length).toBeGreaterThanOrEqual(11);
  });

  it('every recommended model exists in the recommended provider catalog', () => {
    for (const a of AGENT_ROSTER) {
      const prov = getProvider(a.recommended.provider);
      expect(prov, `${a.id} provider ${a.recommended.provider} must exist`).toBeDefined();
      const modelIds = prov!.models.map((m) => m.value);
      expect(modelIds, `${a.id} recommended model ${a.recommended.model} not in ${a.recommended.provider}`).toContain(a.recommended.model);
    }
  });

  it('dependencies and consumers reference valid agent ids; no self-dependency', () => {
    const ids = new Set(AGENT_ROSTER.map((a) => a.id));
    for (const a of AGENT_ROSTER) {
      for (const d of a.dependencies) {
        expect(ids.has(d), `${a.id} dep ${d} must exist`).toBe(true);
        expect(d).not.toBe(a.id);
      }
      for (const c of a.consumers) {
        expect(ids.has(c), `${a.id} consumer ${c} must exist`).toBe(true);
      }
    }
  });

  it('phases and pools are valid', () => {
    const phases = new Set(['system', 'phase_one', 'phase_two', 'phase_three', 'phase_four', 'phase_five', 'post_launch']);
    for (const a of AGENT_ROSTER) {
      expect(phases.has(a.phase), `${a.id} phase ${a.phase}`).toBe(true);
      expect(['async', 'sync']).toContain(a.pool);
      expect(a.recommended.reason).toBeTruthy();
    }
  });
});

describe('Idea auto-inference', () => {
  it('mobile-first signals infer mobile + dedicated mobile engineer', () => {
    const s = inferFromIdea('Fitness tracker app for delivery riders with offline mode and push notifications, used on the go');
    expect(s.platforms).toContain('mobile');
    expect(s.suggested_agents).toContain('18_mobile_engineer_agent');
  });

  it('marketplace signals infer web-first + product analyst + data analytics', () => {
    const s = inferFromIdea('A B2B SaaS marketplace for wholesale sellers with dashboards and analytics');
    expect(s.platforms).toContain('web');
    expect(s.suggested_agents).toContain('16_product_analyst_agent');
    expect(s.suggested_agents).toContain('21_data_analytics_agent');
  });

  it('fintech/payment signals infer appsec + legal', () => {
    const s = inferFromIdea('Fintech payment app for UPI cards with sensitive financial data');
    expect(s.suggested_agents).toContain('19_appsec_engineer_agent');
    expect(s.suggested_agents).toContain('24_legal_privacy_agent');
  });

  it('content-driven ideas infer the content & SEO publisher', () => {
    const s = inferFromIdea('A blog and SEO content platform for e-commerce guides');
    expect(s.suggested_agents).toContain('26_content_seo_agent');
  });

  it('suggestedAgentEntries returns roster entries', () => {
    const entries = suggestedAgentEntries('A fintech payment app for UPI cards');
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) expect(e.optional).toBe(true);
  });
});