// Idea auto-inference: lightweight keyword analysis that pre-fills project
// configuration (target platforms, complexity, market scope, monetization
// model, and suggested optional agents) from the product idea/vision text.
// All suggestions are pre-fills the user can override.

import { AGENT_ROSTER, AgentRosterEntry } from './agent-roster';

export interface IdeaSuggestion {
  platforms: string[];
  complexity: 'poc' | 'standard' | 'enterprise';
  market_scope: 'local' | 'regional' | 'national' | 'global';
  monetization: string[];
  suggested_agents: string[]; // optional agent ids recommended for this idea
  reasons: string[];
}

const kw = (text: string, words: string[]): boolean =>
  words.some((w) => text.toLowerCase().includes(w.toLowerCase()));

function inferPlatforms(text: string): { platforms: string[]; reason: string } {
  const t = text.toLowerCase();
  if (kw(t, ['fitness', 'tracker', 'gym', 'health', 'delivery', 'courier', 'camera', 'offline', 'on the go', 'iot', 'bluetooth', 'push notif', 'field', 'attendance', 'rider'])) {
    return { platforms: ['mobile', 'web'], reason: 'Core usage is on-the-go / device-dependent → mobile-first with a companion web app.' };
  }
  if (kw(t, ['marketplace', 'e-commerce', 'ecommerce', 'shop', 'store', 'b2b', 'saas', 'dashboard', 'crm', 'admin', 'portal', 'booking'])) {
    return { platforms: ['web', 'pwa'], reason: 'Discovery/SEO and complex workflows matter → web-first with PWA.' };
  }
  return { platforms: ['web'], reason: 'Default web-first: fastest validation, then add mobile when device-native behavior is proven.' };
}

function inferComplexity(text: string): { complexity: IdeaSuggestion['complexity']; reason: string } {
  const t = text.toLowerCase();
  if (kw(t, ['enterprise', 'multi-tenant', 'multi tenant', 'compliance', 'scal', '5000', '5000+', 'large'])) {
    return { complexity: 'enterprise', reason: 'Multi-tenant / scale / compliance signals detected → enterprise architecture.' };
  }
  if (kw(t, ['poc', 'proof of concept', 'prototype', 'mvp', 'pilot', '8 merchant', 'pilot'])) {
    return { complexity: 'poc', reason: 'Pilot/MVP signals detected → POC scope first.' };
  }
  return { complexity: 'standard', reason: 'Balanced scope — full product but standard complexity.' };
}

function inferMarket(text: string): { market_scope: IdeaSuggestion['market_scope']; reason: string } {
  const t = text.toLowerCase();
  if (kw(t, ['old bangalore', 'chickpet', 'balepet', 'pete', 'bangalore', 'local', 'neighborhood'])) {
    return { market_scope: 'local', reason: 'Hyper-local market signals detected.' };
  }
  if (kw(t, ['india', 'state', 'regional', 'india-wide'])) {
    return { market_scope: 'national', reason: 'National market signals detected.' };
  }
  if (kw(t, ['global', 'worldwide', 'international', 'saas', 'b2b'])) {
    return { market_scope: 'global', reason: 'Global reach signals detected.' };
  }
  return { market_scope: 'regional', reason: 'Default regional scope.' };
}

function inferMonetization(text: string): { monetization: string[]; reason: string } {
  const t = text.toLowerCase();
  const m: string[] = [];
  if (kw(t, ['commission', 'marketplace', 'seller', 'merchant fee', 'cut per'])) m.push('commission');
  if (kw(t, ['subscription', 'saas', 'monthly', 'recurring', 'plan'])) m.push('subscription');
  if (kw(t, ['ads', 'advertising', 'sponsored'])) m.push('advertising');
  if (kw(t, ['delivery', 'shipping fee', 'logistics'])) m.push('delivery_fees');
  if (m.length === 0) m.push('subscription');
  return { monetization: m, reason: 'Monetization inferred from idea keywords (override any time).' };
}

function inferAgents(text: string): { suggested_agents: string[]; reasons: string[] } {
  const t = text.toLowerCase();
  const suggested_agents: string[] = [];
  const reasons: string[] = [];

  const consider = (id: string, cond: boolean, reason: string) => {
    if (cond && !suggested_agents.includes(id)) { suggested_agents.push(id); reasons.push(reason); }
  };

  consider('18_mobile_engineer_agent', kw(t, ['mobile', 'app', 'ios', 'android', 'fitness', 'delivery', 'rider', 'camera', 'offline']),
    'Mobile-first signals → dedicated Mobile Engineer.');
  consider('16_product_analyst_agent', kw(t, ['marketplace', 'b2b', 'saas', 'enterprise', 'launch', 'pricing']),
    'Competitive market → market validation & pricing analyst.');
  consider('19_appsec_engineer_agent', kw(t, ['payment', 'fintech', 'bank', 'upi', 'card', 'medical', 'health', 'healthcare', 'insurance']),
    'Sensitive data → AppSec engineer to bake in security.');
  consider('24_legal_privacy_agent', kw(t, ['payment', 'fintech', 'health', 'healthcare', 'medical', 'data', 'global', 'europe', 'eu', 'gdpr']),
    'Regulated / personal data → legal & privacy pack.');
  consider('21_data_analytics_agent', kw(t, ['saas', 'dashboard', 'analytics', 'marketplace', 'subscription', 'e-commerce', 'ecommerce']),
    'Measurable growth → analytics & funnels engineer.');
  consider('22_customer_success_agent', kw(t, ['saas', 'subscription', 'marketplace', 'b2b', 'enterprise', 'crm']),
    'Recurring customers → customer success & support triage.');
  consider('23_growth_experiment_agent', kw(t, ['consumer', 'social', 'marketplace', 'e-commerce', 'ecommerce', 'growth', 'retention']),
    'Consumer growth → experimentation agent.');
  consider('26_content_seo_agent', kw(t, ['blog', 'content', 'seo', 'saas', 'e-commerce', 'ecommerce', 'guide', 'how-to', 'education']),
    'Content-driven acquisition → content & SEO publisher (WordPress/blog).');
  consider('17_ux_designer_agent', kw(t, ['consumer', 'app', 'mobile', 'brand', 'design', 'marketplace']),
    'Consumer-facing → dedicated UX/UI designer for a consistent design system.');
  consider('20_perf_sre_agent', kw(t, ['real-time', 'live', 'streaming', 'high-traffic', 'scale', '5000', 'performance']),
    'Scale/real-time → performance & SRE engineer.');
  consider('25_product_evolution_agent', kw(t, ['roadmap', 'v2', 'iteration', 'continuous', 'evolve']),
    'Iterative roadmap → product evolution agent.');

  return { suggested_agents, reasons };
}

export function inferFromIdea(idea: string): IdeaSuggestion {
  const platforms = inferPlatforms(idea);
  const complexity = inferComplexity(idea);
  const market = inferMarket(idea);
  const monetization = inferMonetization(idea);
  const agents = inferAgents(idea);

  return {
    platforms: platforms.platforms,
    complexity: complexity.complexity,
    market_scope: market.market_scope,
    monetization: monetization.monetization,
    suggested_agents: agents.suggested_agents,
    reasons: [platforms.reason, complexity.reason, market.reason, monetization.reason, ...agents.reasons],
  };
}

export function suggestedAgentEntries(idea: string): AgentRosterEntry[] {
  const ids = inferFromIdea(idea).suggested_agents;
  return AGENT_ROSTER.filter((a) => ids.includes(a.id));
}