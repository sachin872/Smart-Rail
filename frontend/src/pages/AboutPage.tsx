import React from 'react';
import { Cpu, Database, Network, Layers, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI & Railway Intelligence Architecture
          </span>
          <span className="text-xs font-mono text-slate-400">Version 3.1.0 (Production Blueprint)</span>
        </div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">
          Smart Rail AI — Dynamic ETA Forecasting Platform
        </h1>
        <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-3xl">
          An advanced railway predictive intelligence platform engineered to replace static, linear train arrival estimations with <strong>multi-horizon conformal uncertainty predictions</strong>, physics-based section running profiles, and real-time operational disruption modeling for Indian Railways coaching networks.
        </p>
      </div>

      {/* Core Prediction Engine Hierarchy (B0 -> B1 -> B2 -> B3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Four-Tier Predictive Forecasting Hierarchy
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Smart Rail continuously benchmarks predictions across four progressive model tiers:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* B0 */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-slate-300">B0: Master Schedule (Static)</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">Baseline 0</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Published static working timetable without dynamic delay feedback. Assumes zero network disruptions or speed variations.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
              Formula: <code className="text-slate-400 font-mono">ETA_B0 = T_scheduled_arr</code>
            </div>
          </div>

          {/* B1 */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-slate-300">B1: Incumbent Linear Propagation</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">Baseline 1</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard legacy railway system approach: simple linear addition of current station delay with constant buffer decay factor.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
              Formula: <code className="text-slate-400 font-mono">ETA_B1 = T_sched + Delay_curr × (1 - buffer_decay)</code>
            </div>
          </div>

          {/* B2 */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-cyan-300">B2: Section Running Time + Deterministic Rules</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-mono font-bold">Rule Engine</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates deterministic physics travel times per block segment (SRT), adding known red signals, level crossing gate closures, speed restrictions, and weather factors.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
              Formula: <code className="text-cyan-400 font-mono">ETA_B2 = T_depart + SRT_median + Sum(Delays_rules)</code>
            </div>
          </div>

          {/* B3 */}
          <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/40 ring-1 ring-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-cyan-400">B3: Smart Rail AI + Conformal Uncertainty</span>
              <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded font-mono font-bold">Champion Model</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gradient Boosted Residual Regressor predicting non-linear recovery / cascade patterns + <strong>80% Conformal Uncertainty Interval [Low, High]</strong> calibrated to prediction horizon.
            </p>
            <div className="text-[11px] font-mono text-cyan-300 pt-2 border-t border-slate-900">
              Formula: <code className="text-cyan-300 font-mono">ETA_B3 = ETA_B2 + ML_Residual ± q_80%(horizon, quality)</code>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Pure NumPy AI Runtime</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eliminates heavy external C-extensions for zero-dependency execution across Windows App Control, Linux cloud containers, and browser web workers with sub-5ms latency.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">SQLite WAL Architecture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            High-concurrency Write-Ahead Logging database supporting 1,000+ train telemetry transactions/sec, password-hashed role guards, and instantaneous schema migrations.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Network className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">CRIS / RTIS Integration Ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standardized provider abstraction layer ready for production connection to CRIS RTIS / NTES APIs, live GPS data streams, and Open-Meteo precipitation feeds.
          </p>
        </div>
      </div>
    </div>
  );
};
