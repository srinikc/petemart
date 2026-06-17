'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Key, Zap, CheckCircle, Activity, 
  DollarSign, Package, Play, Pause, RotateCcw,
  ArrowRight, Globe, Shield, Cpu, MessageSquare, 
  Terminal, BarChart3, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EnterpriseOnboardingCockpit() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState("");
  const [billingModel, setBillingModel] = useState("byok");
  const [logs, setLogs] = useState<{time: string, agent: string, msg: string}[]>([]);

  // Simulation for active logs
  useEffect(() => {
    if (step === 4) {
      const interval = setInterval(() => {
        const agents = ["01_ideation", "02_requirement", "03_architect", "Supervisor"];
        const msgs = [
          "Analyzing market saturation in Pete areas...",
          "Mapping dependencies for merchant micro-sites...",
          "Validating architectural feasibility for Supabase integration...",
          "Compliance audit passed for REQ-UI-012.",
          "Generating BOM hand-off package structure...",
          "Scanning for security variances in API layer..."
        ];
        const newLog = {
          time: new Date().toLocaleTimeString([], { hour12: false }),
          agent: agents[Math.floor(Math.random() * agents.length)],
          msg: msgs[Math.floor(Math.random() * msgs.length)]
        };
        setLogs(prev => [newLog, ...prev].slice(0, 8));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleLaunch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4); 
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
              PETEMART
            </span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] -mt-1">
              Enterprise Builder
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <nav className="hidden md:flex space-x-6 text-slate-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">Marketplace</a>
            <a href="#" className="hover:text-white transition-colors">Templates</a>
            <a href="#" className="hover:text-white transition-colors">Costs</a>
          </nav>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold">SD</div>
            <span className="text-xs font-semibold">Srinikc</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-12">
        {step < 4 ? (
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Intro Header */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-white">
                Turn your vision into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">deployed reality.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                The industry's first autonomous SDLC engine. 16 agents. Zero manual code. Full Enterprise control.
              </p>
            </div>

            {/* Stepper Container */}
            <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/50 via-fuchsia-500/50 to-indigo-500/50" />
              
              <div className="flex items-center justify-center space-x-12 mb-12">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${
                      step === s ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' :
                      step > s ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-950 text-slate-600 border border-white/5'
                    }`}>
                      {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                    </div>
                    <span className={`text-xs uppercase tracking-widest font-bold ${step === s ? 'text-white' : 'text-slate-600'}`}>
                      {s === 1 ? 'Concept' : s === 2 ? 'Integration' : 'Review'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Describe your product idea</h2>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                      <textarea
                        className="relative w-full h-40 bg-black border border-white/10 rounded-2xl p-6 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-lg leading-relaxed"
                        placeholder="e.g., A multi-tenant B2B marketplace for silk wholesalers in Bangalore with real-time inventory, credit-based payments, and automated shipping..."
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center overflow-hidden">
                           <div className="w-full h-full bg-gradient-to-br from-indigo-500/50 to-slate-800" />
                        </div>
                      ))}
                      <div className="pl-4 text-xs text-slate-500 font-medium">+12 agents analyzing...</div>
                    </div>
                    <Button 
                      disabled={!idea}
                      onClick={() => setStep(2)}
                      className="bg-white text-black hover:bg-slate-200 rounded-xl px-8 py-6 font-bold flex items-center space-x-2 h-auto"
                    >
                      <span>Build Strategy</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Infrastructure & Governance</h2>
                    <p className="text-slate-400 text-sm">Choose your delivery model and connect enterprise tools.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'byok', title: 'Enterprise BYOK', icon: Key, desc: 'Bring your own LLM keys. 0% platform markup.' },
                      { id: 'bundled', title: 'Managed SaaS', icon: DollarSign, desc: 'Pre-paid credits. Full platform management.' }
                    ].map(model => (
                      <div 
                        key={model.id}
                        onClick={() => setBillingModel(model.id)}
                        className={`p-6 rounded-2xl border transition-all cursor-pointer group ${
                          billingModel === model.id ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <model.icon className={`w-8 h-8 mb-4 ${billingModel === model.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <h3 className="font-bold text-lg">{model.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{model.desc}</p>
                      </div>
                    ))}
                  </div>

                  {billingModel === 'byok' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">OpenAI Key</label>
                        <input type="password" placeholder="sk-..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">GitHub Org</label>
                        <input type="text" placeholder="enterprise-repo" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 py-6 border border-white/5 rounded-xl hover:bg-white/5">Back</Button>
                    <Button onClick={() => setStep(3)} className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold">Review Pipeline</Button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="bg-black/60 rounded-3xl p-8 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                       <Zap className="w-20 h-20 text-indigo-500/10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-6">Orchestration Plan Ready</h2>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Complexity</span>
                        <div className="text-lg font-black text-white">ENTERPRISE</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agents</span>
                        <div className="text-lg font-black text-white">16 ACTIVE</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Build Time</span>
                        <div className="text-lg font-black text-white">45 MINS</div>
                      </div>
                    </div>

                    <div className="mt-10 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center space-x-4 text-sm text-indigo-200">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <span>Security scan & RLS policies enabled by Agent 15.</span>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 py-6 border border-white/5 rounded-xl">Back</Button>
                    <Button 
                      onClick={handleLaunch} 
                      className="flex-[3] py-6 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 rounded-xl font-black text-lg shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Play className="w-5 h-5 fill-current" />
                          <span>DISPATCH AUTONOMOUS PIPELINE</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Cockpit Interface */
          <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Project Title Bar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">PIPELINE LIVE</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Silk Road Marketplace <span className="text-slate-600 font-light not-italic">v1.0</span></h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Multi-tenant wholesaling hub for Bangalore silk merchants • Active Sprint: 01</p>
              </div>
              <div className="flex space-x-3 bg-white/5 p-1 rounded-2xl border border-white/5">
                <Button variant="ghost" className="rounded-xl px-4 py-2 hover:bg-white/5">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
                <Button variant="ghost" className="rounded-xl px-4 py-2 hover:bg-white/5 text-slate-400">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 py-2 font-bold">
                  <Settings className="w-4 h-4 mr-2" /> Configure
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Active Agents', value: '4/16', icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Platform ROI', value: '8.4x', icon: BarChart3, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
                { label: 'Total Credits', value: '4.2k', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Artifacts', value: '42 Files', icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex items-center space-x-5">
                  <div className={`${m.bg} p-3 rounded-xl`}>
                    <m.icon className={`w-6 h-6 ${m.color}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                    <div className="text-2xl font-black text-white">{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pipeline View */}
              <div className="lg:col-span-2 bg-slate-900/20 border border-white/5 rounded-3xl p-8 backdrop-blur-3xl overflow-hidden relative">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="font-black text-lg tracking-tight uppercase italic text-slate-400">Pipeline Flow Graph</h3>
                    <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold uppercase tracking-widest">Phase 1 Active</div>
                 </div>

                 <div className="relative space-y-16">
                    {/* Visual connections would be here in a real SVG/React Flow */}
                    <div className="grid grid-cols-4 gap-4">
                       {[
                         { id: '01', name: 'Ideation', status: 'Done' },
                         { id: '02', name: 'PRD', status: 'Done' },
                         { id: '03', name: 'Architect', status: 'Live' },
                         { id: '04', name: 'Prototype', status: 'Wait' },
                       ].map(a => (
                         <div key={a.id} className={`relative p-4 rounded-2xl border text-center transition-all duration-700 ${
                           a.status === 'Done' ? 'bg-emerald-500/10 border-emerald-500/30' :
                           a.status === 'Live' ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-105 z-10' :
                           'bg-black/40 border-white/5 opacity-40'
                         }`}>
                           <span className="text-[10px] font-bold text-slate-500 block mb-1">AGENT {a.id}</span>
                           <span className="text-xs font-black uppercase text-white truncate">{a.name}</span>
                           {a.status === 'Live' && (
                             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />
                           )}
                         </div>
                       ))}
                    </div>

                    <div className="grid grid-cols-2 gap-8 px-20">
                        <div className="p-4 rounded-2xl border border-white/5 bg-black/40 opacity-40 text-center">
                           <span className="text-[10px] font-bold text-slate-500 block">PHASE 2</span>
                           <span className="text-xs font-black uppercase text-slate-400">Development</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-white/5 bg-black/40 opacity-40 text-center text-slate-400">
                           <span className="text-[10px] font-bold text-slate-500 block">PHASE 3</span>
                           <span className="text-xs font-black uppercase text-slate-400">Verification</span>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Logs */}
              <div className="bg-black/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 italic">Agentic Message Bus</h3>
                  </div>
                  
                  <div className="space-y-4 font-mono text-[11px] leading-relaxed">
                    {logs.map((l, i) => (
                      <div key={i} className="animate-in slide-in-from-bottom-2 duration-500">
                        <span className="text-slate-600 mr-2">{l.time}</span>
                        <span className="text-indigo-500 font-bold mr-2">[{l.agent}]</span>
                        <span className="text-slate-300">{l.msg}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-700 italic">Initializing bus connection...</div>}
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between text-[10px] font-bold">
                     <span className="text-slate-600 uppercase tracking-widest">Rate Limit</span>
                     <span className="text-indigo-400">12 / 20 RPM</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[60%]" />
                  </div>
                  <Button variant="ghost" className="w-full text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] hover:text-white">View Full Audit Trail</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
