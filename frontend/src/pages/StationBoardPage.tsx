import React, { useState, useEffect } from "react";
import { Radio, Search, MapPin } from "lucide-react";
import { api, type StationBoardResponse } from "../api";

interface StationBoardPageProps {
  simTime: string;
}

export const StationBoardPage: React.FC<StationBoardPageProps> = ({ simTime }) => {
  const [selectedStation, setSelectedStation] = useState<string>("ST02");
  const [boardData, setBoardData] = useState<StationBoardResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const stations = [
    { code: "ST01", name: "Mumbai CST", fullName: "Chhatrapati Shivaji Maharaj Terminus" },
    { code: "ST02", name: "Kalyan Jn", fullName: "Kalyan Junction Interchange" },
    { code: "ST03", name: "Karjat Jn", fullName: "Karjat Junction" },
    { code: "ST04", name: "Lonavala", fullName: "Lonavala Hill Station" },
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

  const arrivals = boardData?.arrivals_departures?.filter((row) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      row.train_id.toLowerCase().includes(term) ||
      row.train_name.toLowerCase().includes(term) ||
      row.platform.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Station Selector Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Station Terminal Operations</span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600" />
              Passenger Information Display System (PIDS)
            </h1>
            <p className="text-xs text-slate-500">Live platform assignments, expected arrival times, and delay remarks</p>
          </div>

          {/* Quick Station Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stations.map((st) => (
              <button
                key={st.code}
                onClick={() => setSelectedStation(st.code)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                  selectedStation === st.code
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <div className="font-mono text-[10px] opacity-80">{st.code}</div>
                <div className="truncate">{st.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Display Board */}
      <div className="terminal-board rounded-3xl p-6 md:p-8 text-amber-400 font-mono">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-white font-sans text-xl md:text-2xl font-black tracking-wide">
              <MapPin className="w-6 h-6 text-blue-400" />
              <span>{boardData?.station.code}</span>
              <span className="text-slate-600">•</span>
              <span>{boardData?.station.name}</span>
            </div>
            <div className="text-xs text-slate-400 font-sans mt-1">
              Zone: <span className="text-slate-200 font-bold">{boardData?.station.zone}</span> &bull; Central Railway Division
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Filter Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter train..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-sans font-bold bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE FEED ACTIVE
            </div>
          </div>
        </div>

        {/* Board Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-sans uppercase font-bold tracking-wider">
                <th className="py-3 px-3">Train</th>
                <th className="py-3 px-3">Service Name</th>
                <th className="py-3 px-3 text-center">Platform</th>
                <th className="py-3 px-3">Scheduled</th>
                <th className="py-3 px-3 text-white font-extrabold text-sm">Smart ETA</th>
                <th className="py-3 px-3">Window</th>
                <th className="py-3 px-3">Delay</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Operational Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {arrivals.length > 0 ? (
                arrivals.map((row) => (
                  <tr key={row.train_id} className="hover:bg-slate-900/50 transition">
                    <td className="py-4 px-3 font-bold text-white text-base">{row.train_id}</td>
                    <td className="py-4 px-3 text-slate-200 font-sans font-semibold text-xs sm:text-sm">
                      {row.train_name}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        Class: {row.class}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded-md font-black text-xs shadow-sm">
                        {row.platform}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-400">{row.scheduled_time}</td>
                    <td className="py-4 px-3 text-white font-black text-lg sm:text-xl tracking-tight">
                      {row.smart_eta}
                    </td>
                    <td className="py-4 px-3 text-xs text-slate-300">{row.eta_window}</td>
                    <td className="py-4 px-3 font-bold">
                      {row.delay_min > 0 ? (
                        <span className="text-rose-400">+{row.delay_min} min</span>
                      ) : (
                        <span className="text-emerald-400">On Time</span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-sans font-bold uppercase tracking-wider ${
                          row.status === "ON_TIME"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                            : "bg-rose-950 text-rose-300 border border-rose-700/60"
                        }`}
                      >
                        {row.status === "ON_TIME" ? "On Time" : "Delayed"}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-xs text-slate-300 font-sans max-w-xs truncate">
                      {row.primary_reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    No train arrivals matching your search query.
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
