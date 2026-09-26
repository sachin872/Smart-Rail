import React, { useState, useEffect } from "react";
import { Activity, ShieldAlert, GitMerge, Sparkles, Check, AlertTriangle, Layers, Bell } from "lucide-react";
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
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-500 animate-pulse-soft" />
            Central Railway Traffic Control Room & Decision Support
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time corridor occupancy, atomic conflict arbitration, delay cascade propagation, and advisory what-if simulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            {conflictsData?.downstream_cascades?.length || 0} Active Cascades
          </span>
          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-lg text-xs font-bold">
            {trains.length} Monitored Trains
          </span>
        </div>
      </div>

      {/* Corridor Track Schematic Visualizer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Corridor Line Topology & Real-Time Block Occupancy
          </span>
          <span className="text-xs font-normal text-slate-500">
            Section B02: <span className="font-semibold text-amber-600">Single Track / Bi-directional Crossing</span>
          </span>
        </h3>

        {/* Visual Track Map */}
        <div className="relative py-8 px-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
          {/* Main Track Line */}
          <div className="relative min-w-[700px] flex items-center justify-between my-8">
            {/* Track rail lines */}
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-700 -translate-y-1/2 z-0" />
            <div className="absolute top-[42%] left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            <div className="absolute top-[58%] left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

            {/* Stations */}
            {[
              { code: "ST01", name: "Mumbai CST", pos: "0%" },
              { code: "ST02", name: "Kalyan Jn (Loop)", pos: "33%" },
              { code: "ST03", name: "Karjat Jn (Loop)", pos: "66%" },
              { code: "ST04", name: "Lonavala", pos: "100%" },
            ].map((st, idx) => (
              <div key={st.code} className="relative z-10 flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-400 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  {idx + 1}
                </div>
                <span className="mt-2 font-mono font-bold text-xs text-white">{st.code}</span>
                <span className="text-[11px] text-slate-400">{st.name}</span>
              </div>
            ))}

            {/* Block Segment Labels */}
            <div className="absolute top-2 left-[16%] -translate-x-1/2 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Block B01 (15km • 80km/h)
            </div>
            <div className="absolute top-2 left-[50%] -translate-x-1/2 text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
              Block B02 (18km • Single Track Loop)
            </div>
            <div className="absolute top-2 left-[83%] -translate-x-1/2 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Block B03 (30km • 80km/h)
            </div>
          </div>

          {/* Render Active Moving Trains on Track */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trains.map((t) => (
              <div
                key={t.train_id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-white text-sm">{t.train_id}</span>
                    <span className="text-[10px] text-slate-400 block">{t.train_name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      t.priority === 1
                        ? "bg-blue-900 text-blue-300 border border-blue-700"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    Prio {t.priority} ({t.class})
                  </span>
                </div>

                <div className="mt-3 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Block / Loc:</span>
                    <span className="text-white font-semibold">{t.block_id}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Speed:</span>
                    <span className="text-white">{t.speed} km/h</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delay:</span>
                    <span className={t.delay > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      +{t.delay} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conflicts & Delay Propagation Cascade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Conflict Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Resource Contention & Concurrency Safe Resolution
            </span>
          </h3>

          <div className="space-y-3">
            {conflictsData?.active_conflicts && conflictsData.active_conflicts.length > 0 ? (
              conflictsData.active_conflicts.map((conf: any) => (
                <div
                  key={conf.conflict_id}
                  onClick={() => setSelectedConflict(conf.conflict_id)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedConflict === conf.conflict_id
                      ? "bg-rose-50 border-rose-300 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{conf.conflict_id} on {conf.resource_id}</span>
                    <span className="text-rose-600">PREEMPTION</span>
                  </div>
                  <p className="text-slate-600 mt-1 font-medium">{conf.reason}</p>
                  <div className="mt-2 text-slate-500 font-mono text-[11px] flex justify-between">
                    <span>Winner: <strong className="text-blue-600">{conf.winning_train}</strong></span>
                    <span>Reassigned: <strong className="text-rose-600">{conf.losing_train}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                No active block or platform collisions. All movements clear within headway bounds.
              </div>
            )}
          </div>

          {/* Downstream Delay Cascade Tree */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5 text-blue-600" />
              Downstream Cascading Effects (Delay Propagation)
            </h4>
            <div className="space-y-2">
              {conflictsData?.downstream_cascades && conflictsData.downstream_cascades.length > 0 ? (
                conflictsData.downstream_cascades.map((casc: any, i: number) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>{casc.cause_train} &rarr; {casc.affected_train}</span>
                      <span className="text-amber-700 font-mono">+{casc.delay_min} min cascade</span>
                    </div>
                    <p className="text-amber-800 text-[11px]">{casc.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No secondary train cascades triggered.</p>
              )}
            </div>
          </div>
        </div>

        {/* What-If Decision Support Advisory */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Advisory What-If Decision Support
              </h3>
              <span className="bg-amber-900/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                ADVISORY ONLY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Counterfactual simulation on cloned railway graph. Evaluates candidate interventions to minimize corridor passenger delay.
            </p>
          </div>

          <div className="space-y-3">
            {whatifData?.candidates?.map((cand: any) => (
              <div
                key={cand.action_id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2 hover:border-blue-500/60 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-slate-100 text-xs">{cand.title}</div>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    Saves ~{cand.saved_delay_min} min
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{cand.impact_summary}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60 font-mono">
                  <span>Target: {cand.affected_trains.join(", ")}</span>
                  <span>Confidence Score: {cand.recommendation_score}/100</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-950/60 border border-amber-800/60 rounded-lg p-3 text-[11px] text-amber-300/90 leading-normal flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Operational Guardrail:</strong> Controllers retain ultimate authority. Smart Rail AI provides advisory rankings and never directly controls interlocking signals.
            </span>
          </div>
        </div>
      </div>

      {/* Resource Planning Alerts Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Downstream Resource Planning Alerts (Station & Crew Logistics)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {resourceAlerts.length > 0 ? (
            resourceAlerts.map((alt, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  alt.severity === "CRITICAL"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : alt.severity === "WARNING"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <div className="flex justify-between font-bold">
                  <span>{alt.resource_type}</span>
                  <span className="font-mono text-[10px]">{alt.severity}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{alt.message}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 col-span-3">All downstream station pit lines, crew reliefs, and feeder dispatches are on standard schedule.</p>
          )}
        </div>
      </div>
    </div>
  );
};
