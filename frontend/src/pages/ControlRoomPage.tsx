import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldAlert,
  GitMerge,
  Sparkles,
  Check,
  AlertTriangle,
  Layers,
  Bell,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { api, type TrainState } from "../api";

interface ControlRoomPageProps {
  simTime: string;
  trains: TrainState[];
}

export const ControlRoomPage: React.FC<ControlRoomPageProps> = ({ simTime, trains }) => {
  const [conflictsData, setConflictsData] = useState<any>(null);
  const [whatifData, setWhatifData] = useState<any>(null);
  const [resourceAlerts, setResourceAlerts] = useState<any[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<string>("CONF-DEFAULT");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const conf = await api.getConflicts();
      setConflictsData(conf);
      const alerts = await api.getResourceAlerts();
      setResourceAlerts(alerts.alerts || []);
      const whatif = await api.getWhatIf(selectedConflict);
      setWhatifData(whatif);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [simTime, selectedConflict]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Control Room Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
            Central Operations Control (OCC)
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1">
            Section Traffic Controller & Decision Support
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time track occupancy, automated priority preemption, delay cascade propagation, and what-if simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-center">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Corridor Status</span>
            <span className="text-xs font-bold text-emerald-400">Active Monitoring</span>
          </div>
          <div className="bg-rose-950/80 border border-rose-800/80 rounded-xl px-3.5 py-2 text-center">
            <span className="text-[10px] text-rose-300 uppercase block font-bold">Network Cascades</span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              {conflictsData?.downstream_cascades?.length || 0} Affected
            </span>
          </div>
        </div>
      </div>

      {/* Visual Corridor Track Schematic */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Live Corridor Track Topology & Real-Time Block Occupancy
            </h2>
            <p className="text-xs text-slate-500">
              Interactive schematic showing block sections, station loops, and moving train positions
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Express (P1)
            </span>
            <span className="flex items-center gap-1 text-slate-600 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Passenger (P2)
            </span>
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-2">
              Section B02: Single-Track Loop
            </span>
          </div>
        </div>

        {/* Track Schematic Canvas */}
        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 text-white overflow-x-auto">
          <div className="min-w-[700px] relative py-8">
            {/* Railroad Track Lines */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-800 -translate-y-1/2 rounded-full" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/40 -translate-y-1/2" />

            {/* Station Nodes */}
            <div className="relative flex justify-between items-center z-10">
              {[
                { code: "ST01", name: "Mumbai CST", desc: "Terminal Hub" },
                { code: "ST02", name: "Kalyan Jn", desc: "Crossing Loop" },
                { code: "ST03", name: "Karjat Jn", desc: "Crossing Loop" },
                { code: "ST04", name: "Lonavala", desc: "Terminal End" },
              ].map((st, idx) => (
                <div key={st.code} className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-blue-400 flex items-center justify-center font-mono font-bold text-xs shadow-lg shadow-blue-500/20">
                    {idx + 1}
                  </div>
                  <span className="font-mono font-bold text-xs mt-2 text-white">{st.code}</span>
                  <span className="text-[11px] text-slate-400">{st.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{st.desc}</span>
                </div>
              ))}
            </div>

            {/* Block Segment Annotations */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-6 px-4">
              <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                Block B01 (15km • 80 km/h)
              </span>
              <span className="bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded border border-amber-800">
                Block B02 (18km • Single-Track Bidirectional)
              </span>
              <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                Block B03 (30km • 80 km/h)
              </span>
            </div>
          </div>

          {/* Active Train Cards */}
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trains.map((t) => (
              <div
                key={t.train_id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2 hover:border-blue-500/50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-extrabold text-white text-sm">{t.train_id}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{t.train_name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      t.priority === 1
                        ? "bg-blue-900 text-blue-200 border border-blue-700"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    P{t.priority} ({t.class})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono pt-1 text-slate-300 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT BLOCK</span>
                    <span className="font-bold text-white">{t.block_id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">SPEED</span>
                    <span className="font-bold text-white">{t.speed} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">STATUS</span>
                    <span className="text-blue-400 font-bold">{t.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">DELAY</span>
                    <span className={t.delay > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      +{t.delay} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Conflict Preemption Queue & What-If Advisory Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Resource Conflicts & Cascades */}
        <div className="space-y-6">
          {/* Conflict Arbitration */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Resource Contention & Concurrency Lock
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Atomic SQLite/PostgreSQL Locks</span>
            </div>

            <div className="space-y-3">
              {conflictsData?.active_conflicts && conflictsData.active_conflicts.length > 0 ? (
                conflictsData.active_conflicts.map((conf: any) => (
                  <div
                    key={conf.conflict_id}
                    onClick={() => setSelectedConflict(conf.conflict_id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      selectedConflict === conf.conflict_id
                        ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/30 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900 text-xs">{conf.conflict_id} on {conf.resource_id}</span>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        PRIORITY RESOLVED
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed">{conf.reason}</p>
                    <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-mono flex justify-between text-slate-600">
                      <span>Winner: <strong className="text-blue-600 font-bold">{conf.winning_train}</strong></span>
                      <span>Re-timed: <strong className="text-rose-600 font-bold">{conf.losing_train}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No active headway or platform contentions. All movements clear within safety buffers.</span>
                </div>
              )}
            </div>
          </div>

          {/* Delay Cascade Propagation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-amber-600" />
              Downstream Delay Cascade Propagation
            </h3>

            <div className="space-y-2">
              {conflictsData?.downstream_cascades && conflictsData.downstream_cascades.length > 0 ? (
                conflictsData.downstream_cascades.map((casc: any, i: number) => (
                  <div key={i} className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono">{casc.cause_train}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-mono">{casc.affected_train}</span>
                      </span>
                      <span className="text-amber-800 font-mono font-black">+{casc.delay_min} min</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">{casc.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No cascading delay propagation active across following services.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Advisory What-If Decision Support */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Advisory What-If Decision Support
              </h3>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-600/60 px-2 py-0.5 rounded text-[10px] font-bold">
                ADVISORY ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulates counterfactual interventions on a cloned corridor graph. Ranks candidate actions to reduce total passenger minutes lost.
            </p>
          </div>

          {/* Candidate Action Cards */}
          <div className="space-y-3">
            {whatifData?.candidates?.map((cand: any) => {
              const isSelected = selectedAction === cand.action_id;
              return (
                <div
                  key={cand.action_id}
                  onClick={() => setSelectedAction(cand.action_id)}
                  className={`rounded-2xl p-4 transition cursor-pointer border ${
                    isSelected
                      ? "bg-slate-800 border-blue-500 ring-2 ring-blue-500/40 shadow-md"
                      : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-white text-xs sm:text-sm">{cand.title}</h4>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs shrink-0 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Saves ~{cand.saved_delay_min}m
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{cand.impact_summary}</p>

                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Target: {cand.affected_trains.join(", ")}</span>
                    <span className="text-blue-400 font-bold">Suitability: {cand.recommendation_score}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="bg-amber-950/50 border border-amber-800/60 rounded-2xl p-4 text-xs text-amber-300/90 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Safety Guardrail:</strong> Section controllers retain ultimate operational authority. Smart Rail AI provides advisory simulation rankings and never directly issues interlocking signal controls.
            </div>
          </div>
        </div>
      </div>

      {/* Downstream Resource Planning Logistics Alerts */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Downstream Resource Planning & Logistics Warnings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resourceAlerts.length > 0 ? (
            resourceAlerts.map((alt, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  alt.severity === "CRITICAL"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : alt.severity === "WARNING"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <div className="flex justify-between items-center font-bold">
                  <span>{alt.resource_type.replace(/_/g, " ")}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded uppercase font-extrabold bg-white/80">
                    {alt.severity}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{alt.message}</p>
                <div className="text-[11px] font-mono opacity-80 pt-1 border-t border-black/10">
                  Target Station: {alt.station} &bull; Train: {alt.train_id}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 col-span-3">All downstream station pit lines, crew reliefs, and feeder dispatches are operating on standard schedule.</p>
          )}
        </div>
      </div>
    </div>
  );
};
