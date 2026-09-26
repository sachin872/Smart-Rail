import React, { useState, useEffect } from "react";
import { Train, Clock, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Navigation, MessageSquare } from "lucide-react";
import { api, type ETAResponse } from "../api";

interface PassengerPageProps {
  simTime: string;
}

export const PassengerPage: React.FC<PassengerPageProps> = ({ simTime }) => {
  const [selectedTrain, setSelectedTrain] = useState<string>("T101");
  const [etaData, setEtaData] = useState<ETAResponse | null>(null);
  const [notifData, setNotifData] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "mr">("en");

  const trainOptions = [
    { id: "T101", name: "12124 Deccan Superfast (CST -> Lonavala)", class: "EXPRESS", prio: 1 },
    { id: "T102", name: "95102 Local Commuter (CST -> Karjat)", class: "PASSENGER", prio: 2 },
    { id: "T103", name: "95203 Karjat Shuttle (Kalyan -> Karjat)", class: "PASSENGER", prio: 2 },
    { id: "T104", name: "12125 Pragati Express (Lonavala -> CST - Down)", class: "EXPRESS", prio: 1 },
  ];

  const fetchETA = async (tId: string) => {
    try {
      const data = await api.getETA(tId);
      setEtaData(data);
      const notifs = await api.getNotifications(tId);
      setNotifData(notifs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchETA(selectedTrain);
  }, [selectedTrain, simTime]);

  const upcomingStops = etaData?.stops?.filter((s) => s.status === "UPCOMING") || [];
  const nextStop = upcomingStops[0] || etaData?.stops?.[etaData.stops.length - 1];
  const finalStop = etaData?.stops?.[etaData.stops.length - 1];

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "FRESH":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live GPS: FRESH
          </span>
        );
      case "STALE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" /> GPS Delayed: STALE (Window Widened)
          </span>
        );
      case "LOST":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5" /> Signal LOST: Timetable Fallback
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {quality}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Train Selector Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Train className="w-6 h-6 text-blue-600" />
            Passenger Train Status & Dynamic ETA
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated Sectional Running Time + Deterministic Rules + ML Residual ETA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Service:</label>
          <select
            value={selectedTrain}
            onChange={(e) => setSelectedTrain(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {trainOptions.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.id}] {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Smart ETA Card */}
      {nextStop && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl shadow-lg p-6 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600/80 text-white text-xs uppercase px-2.5 py-0.5 rounded font-bold tracking-wider">
                  {etaData?.class}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {etaData?.train_id}</span>
                {getQualityBadge(etaData?.quality || "FRESH")}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {etaData?.train_name}
              </h1>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-400" />
                Next Stop: <span className="font-semibold text-white">{nextStop.station}</span>
                {finalStop && finalStop.station !== nextStop.station && (
                  <span className="text-slate-400"> (Terminating at {finalStop.station})</span>
                )}
              </p>
            </div>

            {/* Smart ETA Hero Display */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-5 py-4 text-right min-w-[200px]">
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center justify-end gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Smart ETA
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white mt-1">
                {nextStop.b3_eta}
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono">
                Window: <span className="text-emerald-400 font-semibold">{nextStop.low} - {nextStop.high}</span>
              </div>
              <div className="mt-2 text-xs font-semibold">
                {nextStop.delay_min > 2 ? (
                  <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    +{nextStop.delay_min} min delay
                  </span>
                ) : (
                  <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    On Schedule
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Operational Reasons Breakdown */}
          <div className="mt-6 pt-5 border-t border-slate-800/90">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Operational Cause Breakdown (Explainability)
            </h4>
            <div className="flex flex-wrap gap-2">
              {nextStop.reasons && nextStop.reasons.length > 0 ? (
                nextStop.reasons.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs font-medium bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    • {r}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Normal corridor sectional running (No active disruptions).</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Station Route ETA Vector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Corridor Multi-Station ETA Vector</span>
          <span className="text-xs font-normal text-slate-500">
            Model Version: <span className="font-mono font-semibold text-blue-600">{etaData?.model_version}</span>
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Scheduled</th>
                <th className="py-2.5 px-3">B0 (Sched)</th>
                <th className="py-2.5 px-3">B1 (Incumbent)</th>
                <th className="py-2.5 px-3">B2 (Rules)</th>
                <th className="py-2.5 px-3 font-bold text-blue-600">B3 (Smart ETA)</th>
                <th className="py-2.5 px-3">80% Window</th>
                <th className="py-2.5 px-3">Delay</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {etaData?.stops?.map((stop) => (
                <tr
                  key={stop.seq}
                  className={`hover:bg-slate-50 transition ${
                    stop.status === "UPCOMING" && stop === nextStop ? "bg-blue-50/60 font-semibold" : ""
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-slate-400">{stop.seq}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{stop.station}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{stop.scheduled_arr || stop.scheduled_dep}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{stop.b0_eta}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{stop.b1_eta}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{stop.b2_eta}</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">{stop.b3_eta}</td>
                  <td className="py-3 px-3 font-mono text-xs text-emerald-700 bg-emerald-50/50 px-2 rounded">
                    {stop.low} - {stop.high}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {stop.delay_min > 0 ? (
                      <span className="text-amber-600 font-bold">+{stop.delay_min}m</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">0m</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        stop.status === "PASSED"
                          ? "bg-slate-100 text-slate-500"
                          : stop === nextStop
                          ? "bg-blue-600 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {stop.status === "PASSED" ? "Departed" : stop === nextStop ? "Next Stop" : "Upcoming"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multilingual Passenger Notification Preview (i18n) */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Multilingual Notification Broadcast Preview
          </h3>

          <div className="flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedLang("en")}
              className={`px-3 py-1 rounded-md transition ${selectedLang === "en" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLang("hi")}
              className={`px-3 py-1 rounded-md transition ${selectedLang === "hi" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => setSelectedLang("mr")}
              className={`px-3 py-1 rounded-md transition ${selectedLang === "mr" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              मराठी (Marathi)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 text-sm font-medium text-slate-800 shadow-sm leading-relaxed">
          {notifData ? notifData[selectedLang] : "Loading notification template..."}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          * Broadcast triggered when smart ETA shift &ge; 5 minutes. Real SMS gateway is gated behind authorized provider.
        </p>
      </div>
    </div>
  );
};
