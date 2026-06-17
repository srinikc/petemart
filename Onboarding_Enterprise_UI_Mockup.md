# Enterprise Onboarding & Cockpit UI Mockup Design Specification

This document presents a high-fidelity design specification for an intuitive, elegant, and responsive enterprise-grade dashboard and 3-step rapid onboarding wizard for the **Product Builder Platform**.

---

## 1. The "Rapid 3-Step" Onboarding Philosophy
To lower friction and maximize user adoption, the platform compresses complex enterprise initialization into a **3-click onboarding wizard** completed in **under 60 seconds**:

```
 ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
 │   1. Define Product    │ ───> │  2. Key & Tool Integr. │ ───> │  3. Dispatch & Launch  │
 │  (Idea & Domain Box)   │      │   (BYOK / Jira / Git)  │      │  (Autonomous SDLC Run) │
 └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

---

## 2. High-Fidelity Mockup Wireframe (Tailwind CSS & React)

This styled React component mock showcases the modern, dark-themed, sleek "Apple-like" aesthetic of the **Product Builder Platform**.

```tsx
import React, { useState } from 'react';
import { Sparkles, Key, Zap, CheckCircle, Activity, DollarSign, Package, Play, Pause, RotateCcw } from 'lucide-react';

export default function EnterpriseOnboardingCockpit() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState("");
  const [billingModel, setBillingModel] = useState("byok");

  const handleLaunch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4); // Move to active Cockpit Dashboard
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PETEMART
            </span>
            <span className="text-xs text-indigo-400 font-medium ml-2 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Product Builder
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <span>Docs</span>
          <span>Support</span>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-500/20">
            JD
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Onboarding Wizard (Steps 1-3) */}
        {step < 4 && (
          <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-900 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    step === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' :
                    step > s ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/30' :
                    'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}>
                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`h-0.5 flex-1 mx-4 transition-colors duration-300 ${
                      step > s ? 'bg-indigo-600/50' : 'bg-slate-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Ideation Box */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Launch your idea into reality</h2>
                  <p className="text-slate-400 text-sm">Provide a high-level description of your product. Our 16 autonomous agents will analyze and build it.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product Idea Box</label>
                  <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Example: An automated on-demand delivery app for local flower merchants in Chickpet, with WhatsApp integration, customer routing, and payment verification..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                  />
                </div>
                <button
                  disabled={!idea}
                  onClick={() => setStep(2)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                >
                  <span>Continue to Integration</span>
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Keys & Tools Integration */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Connect Your Keys & Enterprise Tools</h2>
                  <p className="text-slate-400 text-sm">We support secure, direct integration. Bring your own keys to maximize your margin.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setBillingModel("byok")}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      billingModel === "byok" ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Key className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-white text-sm">BYOK Model</span>
                    </div>
                    <p className="text-xs text-slate-500">Provide your own API keys. Best for scale, 0% platform markup.</p>
                  </div>
                  <div
                    onClick={() => setBillingModel("bundled")}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      billingModel === "bundled" ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-white text-sm">Bundled Model</span>
                    </div>
                    <p className="text-xs text-slate-500">Pre-paid credits. Easy configuration, platform handles billing.</p>
                  </div>
                </div>

                {billingModel === "byok" && (
                  <div className="space-y-4 animate-slideDown">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jira API Endpoint (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://company.atlassian.net"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Continue to Launch
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Analyze & Dispatch */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Analyzing Product Strategy</h2>
                  <p className="text-slate-400 text-sm">We are analyzing your roles, estimating tokens, mapping tools, and dispatching the pipeline.</p>
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Estimated Complexity</span>
                    <span className="text-indigo-400 font-semibold uppercase tracking-wide">Medium-High</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Active Pipeline Scope</span>
                    <span className="text-indigo-400 font-semibold uppercase tracking-wide">Full SDLC (16 Agents)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Recommended Models</span>
                    <span className="text-indigo-400 font-semibold uppercase tracking-wide">GPT-4o-mini (80%) / GPT-4o (20%)</span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="w-1/3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleLaunch}
                    className="w-2/3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Dispatch Pipeline</span>
                        <Play className="w-4 h-4 fill-current" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post-Onboarding: Active SDLC Cockpit Dashboard (Step 4) */}
        {step === 4 && (
          <div className="space-y-8 animate-fadeIn">
            {/* Project Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">E-Commerce PeteMart</h1>
                <p className="text-slate-400 text-sm mt-1">Autonomous SDLC Pipeline Execution • Chickpet, Bangalore</p>
              </div>
              <div className="flex space-x-3">
                <button className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all">
                  <Pause className="w-4 h-4" />
                  <span>Pause Project</span>
                </button>
                <button className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Run</span>
                </button>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 flex items-center space-x-4">
                <div className="bg-emerald-500/10 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Pipeline Status</span>
                  <span className="text-lg font-bold text-white">Active Run</span>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 flex items-center space-x-4">
                <div className="bg-indigo-500/10 p-3 rounded-lg">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Agents Completed</span>
                  <span className="text-lg font-bold text-white">8 / 16</span>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 flex items-center space-x-4">
                <div className="bg-amber-500/10 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Total Estimated Cost</span>
                  <span className="text-lg font-bold text-white">$14.50</span>
                </div>
              </div>
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-5 flex items-center space-x-4">
                <div className="bg-purple-500/10 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Artifacts Emitted</span>
                  <span className="text-lg font-bold text-white">24 Files</span>
                </div>
              </div>
            </div>

            {/* Split Screen Layout: Left (Pipeline Flow), Right (Active Logs) */}
            <div className="grid grid-cols-3 gap-8">
              {/* Pipeline Flow Graph Mockup */}
              <div className="col-span-2 bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
                <h3 className="font-bold text-lg text-white mb-6">Interactive Agent Pipeline</h3>
                <div className="space-y-4">
                  {/* Phase 1 Async Pool */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phase 1: Architecture & Design</h4>
                    <div className="flex space-x-3">
                      <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-center">
                        <span className="text-xs block text-slate-500">01 Ideation</span>
                        <span className="text-xs font-semibold text-emerald-400">Approved</span>
                      </div>
                      <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-center">
                        <span className="text-xs block text-slate-500">02 Requirement</span>
                        <span className="text-xs font-semibold text-emerald-400">Approved</span>
                      </div>
                      <div className="flex-1 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl text-center animate-pulse">
                        <span className="text-xs block text-slate-400">03 Architect</span>
                        <span className="text-xs font-semibold text-indigo-400">In Progress</span>
                      </div>
                      <div className="flex-1 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-center opacity-40">
                        <span className="text-xs block text-slate-500">04 Prototype</span>
                        <span className="text-xs font-semibold text-slate-600">Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phase 2: Project Orchestration</h4>
                    <div className="flex space-x-3">
                      <div className="flex-1 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-center opacity-40">
                        <span className="text-xs block text-slate-500">05 Agile Mgmt</span>
                        <span className="text-xs font-semibold text-slate-600">Pending</span>
                      </div>
                      <div className="flex-1 bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-center opacity-40">
                        <span className="text-xs block text-slate-500">06 DevOps</span>
                        <span className="text-xs font-semibold text-slate-600">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Log Terminal Mockup */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 font-mono text-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white mb-4 font-sans">Active Agent Logs</h3>
                  <div className="space-y-2 text-slate-400 max-h-64 overflow-y-auto">
                    <div><span className="text-slate-600">[12:00:15]</span> <span className="text-indigo-400">[01_ideation]</span> Research complete for Bangalore markets.</div>
                    <div><span className="text-slate-600">[12:01:22]</span> <span className="text-indigo-400">[02_requirement]</span> Formulating enterprise-grade PRD.</div>
                    <div><span className="text-slate-600">[12:02:44]</span> <span className="text-indigo-400">[02_requirement]</span> Successfully mapped 103 requirements.</div>
                    <div className="animate-pulse"><span className="text-slate-600">[12:03:10]</span> <span className="text-indigo-400">[03_architect]</span> Initializing systems context diagram...</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-900 font-sans text-xs flex justify-between text-slate-500">
                  <span>Tokens used: 1,452,002</span>
                  <span>RPM: 12 / 20</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## 3. Design Highlights & Latest Technologies Included
To ensure an elegant, cutting-edge corporate feel, the frontend utilizes modern interface engineering techniques:

*   **Dark Mode Native (Sleek Space Theme):** Deep `slate-950` backgrounds with glowing, semi-transparent indigo/purple gradients for a high-end visual look.
*   **Minimal Steps & Ultra-Low Friction:** Condenses typical software workspace deployment into a rapid, 3-click wizard (Idea Box, Secure Key Box, Dispatch).
*   **Intelligent Auto-Analysis:** An active recommendation card informs customers of their estimated complexity, optimal LLM models, and suggested routing to manage API budgets.
*   **Visual Pipeline Graph:** A real-time, interactive flow graph showcasing exactly which agents are idle, in progress, or successfully approved.
*   **Modern Interactive Dashboard:** Features dedicated panels for active metrics (status, active agents, token expenditure, artifact storage counts), interactive logs with rate limiting alerts (RPM), and project lifecycle management controls (pause/resume/reset).
