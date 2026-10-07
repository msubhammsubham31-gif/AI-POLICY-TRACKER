import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Globe2,
  GitCompare,
  Sparkles,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    'EMISSIONS', 'CARBON', 'CLIMATE', 'CHEMICALS', 'WASTE', 'PACKAGING',
    'WATER', 'ENERGY', 'AIR_QUALITY', 'HAZARDOUS_MATERIALS', 'PRODUCT_STEWARDSHIP',
    'RECYCLING', 'DEFORESTATION', 'BIODIVERSITY', 'ESG_DISCLOSURE', 'SUPPLY_CHAIN'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 font-bold text-lg tracking-tight">
              <span>Regula</span>
              <span className="text-emerald-400">Map</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
            >
              <span>Explore Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Google Maps for Global Regulations & Environmental Compliance</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Detect Regulatory Drift.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Shield Company Operations.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            RegulaMap bridges the gap between complex legal texts and physical manufacturing reality.
            Ingest versioned laws, compute deterministic text & threshold diffs, evaluate multi-factor supply chain risks,
            and map impacts to facilities, materials, and processes with grounded Gemini intelligence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all shadow-xl shadow-emerald-500/30 flex items-center gap-2 group"
            >
              <span>Launch Live Workspace (Apex Industrial Corp.)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/app/map')}
              className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <span>Interactive Regulatory Map</span>
            </button>
          </div>

          <div className="pt-8 max-w-2xl mx-auto">
            <LegalDisclaimer />
          </div>
        </div>
      </section>

      {/* Target Domains Bar */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="text-center text-xs font-mono uppercase tracking-wider text-slate-500">
            Monitored Regulatory Domains & Environmental Standards
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 text-[11px] font-mono text-slate-300 hover:border-emerald-500/30 hover:text-emerald-300 transition-colors cursor-default"
              >
                {cat.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Architecture Designed for Regulatory Certainty
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            From official gazette ingestion to facility-level engineering work orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-card-hover space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Deterministic Diff Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dual-pane side-by-side legal text comparison with SHA-256 version hashes. Detects threshold shifts (e.g. 25 ppb down to 1.0 ppb) and structural clause amendments instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-card-hover space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Grounded Gemini AI Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Server-side @google/genai analysis strictly grounded against source law. Synthesizes operational impacts, potential liabilities, and remediation steps with zero hallucinations.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 glass-card-hover space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Company Asset Knowledge Graph</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps regulations to operating facilities (Dresden, Austin, Antwerp, Osaka), product BOMs, chemical processes, and suppliers. Translates law into operational exposure.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">RegulaMap Intelligence Corp.</span>
        </div>
        <p>Enterprise AI Regulatory & Environmental Compliance Drift Tracking Platform • Supabase & PostgreSQL Engine</p>
      </footer>
    </div>
  );
};
