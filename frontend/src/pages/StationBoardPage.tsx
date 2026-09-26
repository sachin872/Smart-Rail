import React, { useState, useEffect } from "react";
import { Radio, Clock } from "lucide-react";
import { api, type StationBoardResponse } from "../api";

interface StationBoardPageProps {
  simTime: string;
}

export const StationBoardPage: React.FC<StationBoardPageProps> = ({ simTime }) => {
  const [selectedStation, setSelectedStation] = useState<string>("ST02");
  const [boardData, setBoardData] = useState<StationBoardResponse | null>(null);

  const stations = [
    { code: "ST01", name: "Station A (Mumbai CST)" },
    { code: "ST02", name: "Station B (Kalyan Jn)" },
    { code: "ST03", name: "Station C (Karjat Jn)" },
    { code: "ST04", name: "Station D (Lonavala)" },
  ];

  const fetchBoard = async (code: string) => {
    try {
      const data = await api.getStationBoard(code);
      setBoardData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBoard(selectedStation);
  }, [selectedStation, simTime]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Station Selector */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse-soft" />
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              Live Station Passenger Information Display (PIDS)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform allocation, Smart ETAs, and verified disruption causes.
          </p>
        </div>

        <div className="flex gap-2">
          {stations.map((st) => (
            <button
              key={st.code}
              onClick={() => setSelectedStation(st.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                selectedStation === st.code
                  ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {st.code} - {st.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* High Contrast Terminal Board */}
      <div className="bg-slate-950 border-4 border-slate-900 rounded-2xl p-6 shadow-2xl text-amber-400 font-mono">
        <div className="flex justify-between items-center pb-4 border-b-2 border-slate-800 mb-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-white font-sans text-lg font-black tracking-wide">
            <span>{boardData?.station.code}</span>
            <span className="text-amber-400">•</span>
            <span>{boardData?.station.name}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">ZONE: {boardData?.station.zone}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> AUTO-REFRESH ACTIVE
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-sans uppercase">
                <th className="py-3 px-2">Train No.</th>
                <th className="py-3 px-2">Train Name</th>
                <th className="py-3 px-2">Platform</th>
                <th className="py-3 px-2">Scheduled</th>
                <th className="py-3 px-2 text-white font-bold">Smart ETA</th>
                <th className="py-3 px-2">Window</th>
                <th className="py-3 px-2">Delay</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Attribution / Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {boardData?.arrivals_departures && boardData.arrivals_departures.length > 0 ? (
                boardData.arrivals_departures.map((row) => (
                  <tr key={row.train_id} className="hover:bg-slate-900/60 transition">
                    <td className="py-4 px-2 font-bold text-white text-base">{row.train_id}</td>
                    <td className="py-4 px-2 text-slate-200 font-sans font-semibold">{row.train_name}</td>
                    <td className="py-4 px-2">
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded font-bold">
                        {row.platform}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-slate-400">{row.scheduled_time}</td>
                    <td className="py-4 px-2 text-white font-black text-lg">{row.smart_eta}</td>
                    <td className="py-4 px-2 text-xs text-slate-300">{row.eta_window}</td>
                    <td className="py-4 px-2">
                      {row.delay_min > 0 ? (
                        <span className="text-rose-400 font-bold">+{row.delay_min} min</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">ON TIME</span>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-sans font-bold ${
                          row.status === "ON_TIME"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-xs text-slate-300 font-sans">{row.primary_reason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No active train movements currently scheduled at this station.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
