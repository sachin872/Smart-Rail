import React from 'react';
import type { ETAResponse, TrainState } from '../api';
import { Clock, CheckCircle2, ArrowRight, Zap, Navigation } from 'lucide-react';

interface EventTimelineProps {
  train: TrainState;
  etaData: ETAResponse | null;
  activeScenario: string;
  onInjectScenario: (scenario: string) => void;
  lastDeltaMsg?: string | null;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  train,
  etaData,
  activeScenario,
  onInjectScenario,
  lastDeltaMsg
}) => {
  const stops = etaData?.stops || [];
  const finalStop = stops[stops.length - 1];

  return (
    <div className="space-y-6">
      {/* Interactive Disruption Injection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Real-Time Dynamic Event Simulator & Disruption Injection
            </h3>
            <p className="text-xs text-slate-400">
              Inject operational events into train <span className="text-cyan-300 font-mono font-bold">{train.train_id} ({train.train_name})</span> to see instant multi-station ETA recalculations.
            </p>
          </div>
          <span className="text-[11px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-2.5 py-1 rounded-full font-bold">
            Scenario: {activeScenario.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => onInjectScenario('STOPPAGE_10M')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-lg ${
              activeScenario === 'STOPPAGE_10M' || activeScenario === 'UNSCHEDULED_STOP'
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                : 'bg-slate-800/80 hover:bg-amber-950/40 border-slate-700 text-amber-300 hover:border-amber-600/60'
            }`}
          >
            <span className="text-sm mb-1">🚨</span>
            <span>+10 min Stop</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">Unexpected Halt</span>
          </button>

          <button
            onClick={() => onInjectScenario('CONGESTION_HIGH')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-lg ${
              activeScenario === 'CONGESTION_HIGH' || activeScenario === 'SPEED_RESTRICTION'
                ? 'bg-orange-600/30 border-orange-500 text-orange-300 ring-2 ring-orange-500/30'
                : 'bg-slate-800/80 hover:bg-orange-950/40 border-slate-700 text-orange-300 hover:border-orange-600/60'
            }`}
          >
            <span className="text-sm mb-1">⚠️</span>
            <span>High Congestion</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">Speed 35 km/h</span>
          </button>

          <button
            onClick={() => onInjectScenario('HEAVY_RAIN')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-lg ${
              activeScenario === 'HEAVY_RAIN'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                : 'bg-slate-800/80 hover:bg-blue-950/40 border-slate-700 text-blue-300 hover:border-blue-600/60'
            }`}
          >
            <span className="text-sm mb-1">🌧️</span>
            <span>Monsoon Rain</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">Ghat Weather</span>
          </button>

          <button
            onClick={() => onInjectScenario('RECOVERY_5M')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-lg ${
              activeScenario === 'RECOVERY_5M'
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                : 'bg-slate-800/80 hover:bg-emerald-950/40 border-slate-700 text-emerald-300 hover:border-emerald-600/60'
            }`}
          >
            <span className="text-sm mb-1">⚡</span>
            <span>Recover 5 min</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">Priority Clearance</span>
          </button>

          <button
            onClick={() => onInjectScenario('NORMAL_RUNNING')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-lg col-span-2 sm:col-span-1 ${
              activeScenario === 'NORMAL_RUNNING' || activeScenario === 'CLEAN_RUN'
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                : 'bg-slate-800/80 hover:bg-cyan-950/40 border-slate-700 text-cyan-300 hover:border-cyan-600/60'
            }`}
          >
            <span className="text-sm mb-1">🟢</span>
            <span>Normal Run</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5">Reset Baseline</span>
          </button>
        </div>

        {/* Live Delta Banner */}
        {lastDeltaMsg && (
          <div className="mt-4 bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 animate-pulse shadow-md">
            <span className="font-mono font-bold">{lastDeltaMsg}</span>
          </div>
        )}
      </div>

      {/* Corridor Progress Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Corridor Event Timeline & Station Milestones
            </h3>
            <p className="text-xs text-slate-400">
              Live journey tracking showing completed milestones, current position at <span className="text-amber-400 font-bold">Lonavala</span> (+{Math.round(train.delay)}m delay), and ML-forecasted arrivals.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-300">Final Destination ETA:</div>
            <div className="text-base font-mono font-black text-cyan-400">
              {finalStop?.b3_eta || '--:--'} <span className="text-xs text-slate-400 font-normal">[{finalStop?.low || '--:--'} – {finalStop?.high || '--:--'}]</span>
            </div>
          </div>
        </div>

        {/* Vertical Stepper Timeline */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-amber-500 before:to-cyan-500">
          {stops.map((st, idx) => {
            const isPassed = st.status === 'PASSED';
            const isCurrent = st.seq === train.current_stop_idx;
            const isDestination = idx === stops.length - 1;

            return (
              <div key={st.station} className="relative group">
                {/* Status Dot */}
                <div
                  className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isPassed
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : isCurrent
                      ? 'bg-amber-500 border-amber-400 text-slate-950 ring-4 ring-amber-500/30 animate-pulse'
                      : isDestination
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Navigation className="w-3 h-3 fill-current" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold">{st.seq}</span>
                  )}
                </div>

                {/* Content Card */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-950/90 border-amber-500/60 shadow-lg shadow-amber-950/20'
                      : isPassed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-100">{st.station}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          Current Position (+{Math.round(st.delay_min || train.delay)}m Late)
                        </span>
                      )}
                      {isDestination && (
                        <span className="text-[10px] font-extrabold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                          Destination
                        </span>
                      )}
                    </div>

                    {/* Times */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Scheduled</span>
                        <span className="text-slate-300">{st.scheduled_arr || st.scheduled_dep}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      <div>
                        <span className="text-[10px] text-cyan-400 block uppercase font-bold">Smart Rail ETA</span>
                        <span className={`font-bold ${isPassed ? 'text-slate-400' : isCurrent ? 'text-amber-400' : 'text-cyan-300'}`}>
                          {st.b3_eta}
                        </span>
                      </div>
                      {!isPassed && (
                        <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-400">
                          [{st.low} – {st.high}]
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reasons / Operational Status */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Status Factor:</span>
                      <span className="font-mono text-slate-300">
                        {st.reasons?.join(', ') || 'Normal Running'}
                      </span>
                    </div>
                    {st.delay_min > 0 && !isPassed && (
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50 font-bold">
                        Expected Delay: +{Math.round(st.delay_min)} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
