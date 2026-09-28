import React, { useState } from "react";
import {
  MapPin,
  Train,
  ShieldCheck,
  Radio,
  Layers
} from "lucide-react";
import { type TrainState } from "../api";

interface CorridorMapPageProps {
  simTime?: string;
  trains: TrainState[];
}

export const CorridorMapPage: React.FC<CorridorMapPageProps> = ({ trains }) => {
  const [selectedTrainId, setSelectedTrainId] = useState<string>("T101");

  const stations = [
    { code: "ST01", name: "Mumbai CST", km: 0, lat: 19.0760, lon: 72.8777, platforms: ["PF1", "PF2", "PF3", "PF4"], line: "Terminus" },
    { code: "ST02", name: "Kalyan Jn", km: 15, lat: 19.0178, lon: 73.0160, platforms: ["PF1", "PF2", "PF3", "PF4"], line: "Interchange Hub" },
    { code: "ST03", name: "Karjat Jn", km: 33, lat: 18.9894, lon: 73.1175, platforms: ["PF1", "PF2", "PF3"], line: "Ghats Gateway" },
    { code: "ST04", name: "Lonavala", km: 63, lat: 18.7500, lon: 73.4200, platforms: ["PF1", "PF2"], line: "Plateau Section" },
  ];

  const blocks = [
    { id: "B01", from: "ST01", to: "ST02", length: "15.0 km", maxSpeed: "100 km/h", status: "CLEAR", line: "UP Main" },
    { id: "B02", from: "ST02", to: "ST03", length: "18.0 km", maxSpeed: "80 km/h", status: "CLEAR", line: "Single Track Section" },
    { id: "B03", from: "ST03", to: "ST04", length: "30.0 km", maxSpeed: "75 km/h", status: "CLEAR", line: "Ghat Gradient Line" },
  ];

  const activeTrain = trains.find((t) => t.train_id === selectedTrainId) || trains[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            Live Corridor Telemetry
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">
            Mumbai ➔ Lonavala Railway Corridor Visualizer
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live geographic schematic of double-track sections, single-track bottlenecks (B02), station platforms, and moving train rakes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Live Trains Active:</span>
          <span className="bg-blue-100 text-blue-800 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
            {trains.length || 4} Rakes
          </span>
        </div>
      </div>

      {/* Main Visual Corridor Map Canvas */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Corridor Block Schematic (63.0 km)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Clear</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Occupied</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Held</span>
          </div>
        </div>

        {/* Track Line Diagram */}
        <div className="relative py-12 px-4 overflow-x-auto scrollbar-none">
          {/* Main Track Line */}
          <div className="relative min-w-[700px] h-3 bg-slate-800 rounded-full border border-slate-700 mx-8">
            {/* Progress fill */}
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full opacity-60 w-full"></div>

            {/* Stations on Track */}
            {stations.map((st) => {
              const leftPercent = (st.km / 63) * 100;
              return (
                <div
                  key={st.code}
                  className="absolute -top-3 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                  style={{ left: `${leftPercent}%` }}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-blue-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-3 text-center">
                    <div className="font-extrabold text-xs text-white whitespace-nowrap">{st.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{st.code} &bull; {st.km} km</div>
                    <div className="text-[9px] text-blue-300/80 bg-blue-950/80 border border-blue-800 px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap">
                      {st.line}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Moving Train Markers on Track */}
            {trains.map((t) => {
              let posPercent = 25;
              if (t.train_id === "T101") posPercent = 22;
              else if (t.train_id === "T102") posPercent = 3;
              else if (t.train_id === "T103") posPercent = 26;
              else if (t.train_id === "T104") posPercent = 75;

              const isSelected = selectedTrainId === t.train_id;

              return (
                <div
                  key={t.train_id}
                  onClick={() => setSelectedTrainId(t.train_id)}
                  className={`absolute -top-7 -translate-x-1/2 flex flex-col items-center cursor-pointer transition-all z-20 ${
                    isSelected ? "scale-125 z-30" : "hover:scale-110"
                  }`}
                  style={{ left: `${posPercent}%` }}
                >
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-md flex items-center gap-1 ${
                      t.delay > 0
                        ? "bg-rose-600 text-white animate-bounce"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    <Train className="w-3 h-3" />
                    <span>{t.train_id}</span>
                  </div>
                  <div className="w-2.5 h-2.5 rotate-45 bg-slate-900 border border-slate-700 -mt-1"></div>
                </div>
              );
            })}
          </div>

          {/* Block Section Labels Below */}
          <div className="min-w-[700px] grid grid-cols-3 gap-4 mt-20 mx-8">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-xs flex justify-between items-center"
              >
                <div>
                  <div className="font-bold font-mono text-blue-400">{b.id} Section</div>
                  <div className="text-[11px] text-slate-400">{b.from} ➔ {b.to} ({b.length})</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    Max {b.maxSpeed}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Train Telemetry Details */}
      {activeTrain && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                {activeTrain.train_id}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{activeTrain.train_name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{activeTrain.class}</span> &bull;
                  <span>Priority {activeTrain.priority}</span> &bull;
                  <span>Block: <strong className="font-mono text-slate-800">{activeTrain.block_id}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                activeTrain.delay > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {activeTrain.delay > 0 ? `Delayed +${activeTrain.delay.toFixed(1)}m` : "Running On-Time"}
              </span>
              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                Status: {activeTrain.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Live Speed</div>
              <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
                {activeTrain.speed.toFixed(1)} <span className="text-xs font-normal text-slate-500">km/h</span>
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Coordinates</div>
              <div className="text-xs font-mono font-bold text-slate-900 mt-1 truncate">
                {activeTrain.lat.toFixed(4)}, {activeTrain.lon.toFixed(4)}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Target Station</div>
              <div className="text-sm font-bold text-blue-700 mt-0.5">
                {activeTrain.target_station} (Stop #{activeTrain.current_stop_idx})
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Signal Quality</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {activeTrain.quality}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
