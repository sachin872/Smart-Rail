import React, { useState, useEffect } from "react";
import {
  Train,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Navigation,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { api, type ETAResponse } from "../api";

interface PassengerPageProps {
  simTime: string;
}

export const PassengerPage: React.FC<PassengerPageProps> = ({ simTime }) => {
  const [selectedTrain, setSelectedTrain] = useState<string>("T101");
  const [etaData, setEtaData] = useState<ETAResponse | null>(null);
  const [notifData, setNotifData] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "mr">("en");
  const [copied, setCopied] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const trainOptions = [
    { id: "T101", name: "12124 Deccan Superfast Express", route: "Mumbai CST ➔ Lonavala", class: "EXPRESS", prio: 1 },
    { id: "T102", name: "95102 Local Commuter Fast", route: "Mumbai CST ➔ Karjat", class: "PASSENGER", prio: 2 },
    { id: "T103", name: "95203 Karjat Siding Shuttle", route: "Kalyan ➔ Karjat", class: "PASSENGER", prio: 2 },
    { id: "T104", name: "12125 Pragati Express (Down Line)", route: "Lonavala ➔ Mumbai CST", class: "EXPRESS", prio: 1 },
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

  const handleCopyNotification = () => {
    if (notifData && notifData[selectedLang]) {
      navigator.clipboard.writeText(notifData[selectedLang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "FRESH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Live GPS: Fresh Signal
          </span>
        );
      case "STALE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            GPS Delayed (Window Widened)
          </span>
        );
      case "LOST":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Signal Lost (Schedule Fallback)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {quality}
          </span>
        );
    }
  };

  const formatReasonText = (r: string) => {
    if (r.includes("RED_SIGNAL")) return "Signal Halt: Waiting for section clearance ahead";
    if (r.includes("SPEED_RESTRICTION")) return "Speed Restriction: Track caution slowdown";
    if (r.includes("MONSOON") || r.includes("RAIN")) return "Weather: Monsoon track wetting slowdown";
    if (r.includes("LEVEL_CROSSING")) return "Level Crossing: Gate closure hold";
    if (r.includes("UNSCHEDULED_STOP")) return "Technical Stop: Unscheduled operational halt";
    if (r.includes("HEADWAY")) return "Preceding Train: Maintaining safe spacing";
    return r;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Search & Service Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Passenger Live Enquiry</span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
              <Train className="w-5 h-5 text-blue-600" />
              Real-Time Train Arrival Status
            </h1>
          </div>

          <div className="w-full md:w-80">
            <label className="text-xs font-bold text-slate-600 block mb-1">Select Train / Service:</label>
            <select
              value={selectedTrain}
              onChange={(e) => setSelectedTrain(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2.5 transition focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {trainOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.id}] {t.name} ({t.route})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hero Smart ETA Card */}
      {nextStop && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-800 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Train Details & Next Stop */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {etaData?.class}
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {etaData?.train_id}</span>
                {getQualityBadge(etaData?.quality || "FRESH")}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {etaData?.train_name}
              </h2>

              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Next Station: <strong className="text-white font-bold">{nextStop.station}</strong>
                  {finalStop && finalStop.station !== nextStop.station && (
                    <span className="text-slate-400 text-xs ml-1.5">&rarr; Terminating at {finalStop.station}</span>
                  )}
                </span>
              </div>

              {/* Station Progress Stepper */}
              <div className="pt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  {etaData?.stops?.map((stop) => {
                    const isPassed = stop.status === "PASSED";
                    const isCurrent = stop === nextStop;
                    return (
                      <div key={stop.seq} className="flex flex-col items-center relative">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isCurrent
                              ? "bg-blue-500 text-white ring-4 ring-blue-500/30 scale-110"
                              : isPassed
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {isPassed ? <Check className="w-3 h-3" /> : stop.seq}
                        </div>
                        <span className={`text-[11px] mt-1 font-sans ${isCurrent ? "text-blue-400 font-bold" : "text-slate-400"}`}>
                          {stop.station}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Smart ETA Display Box */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 text-center md:text-right flex flex-col justify-center space-y-2 shadow-inner">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center justify-center md:justify-end gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Expected Time of Arrival
              </div>

              <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                {nextStop.b3_eta}
              </div>

              <div className="text-xs text-slate-300 font-mono">
                Confidence Window: <span className="text-emerald-400 font-bold">{nextStop.low} – {nextStop.high}</span>
              </div>

              <div className="pt-1">
                {nextStop.delay_min > 2 ? (
                  <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold">
                    ⚠️ Running +{nextStop.delay_min} min late
                  </span>
                ) : (
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold">
                    🟢 Running On Time
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Operational Causes (Explainability) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Why this arrival time? (Operational Breakdown)
            </h4>
            <div className="flex flex-wrap gap-2">
              {nextStop.reasons && nextStop.reasons.length > 0 ? (
                nextStop.reasons.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {formatReasonText(r)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">All track sections clear. Moving under normal operating speed.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Station Timetable Vector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Full Journey Station-by-Station Forecast
            </h3>
            <p className="text-xs text-slate-500">Live dynamic ETA updated for every upcoming stop</p>
          </div>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            {showTechnicalDetails ? "Hide Baseline Models" : "Compare Baseline Models (B0-B3)"}
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Scheduled</th>
                {showTechnicalDetails && (
                  <>
                    <th className="py-3 px-3 text-slate-400">B0 (Timetable)</th>
                    <th className="py-3 px-3 text-slate-500">B1 (Incumbent)</th>
                    <th className="py-3 px-3 text-slate-700">B2 (Rules)</th>
                  </>
                )}
                <th className="py-3 px-3 font-bold text-blue-600">Smart ETA</th>
                <th className="py-3 px-3">80% Window</th>
                <th className="py-3 px-3">Delay</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {etaData?.stops?.map((stop) => (
                <tr
                  key={stop.seq}
                  className={`transition ${
                    stop === nextStop ? "bg-blue-50/60 font-semibold" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-slate-400">{stop.seq}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{stop.station}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{stop.scheduled_arr || stop.scheduled_dep}</td>
                  {showTechnicalDetails && (
                    <>
                      <td className="py-3 px-3 font-mono text-slate-400">{stop.b0_eta}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{stop.b1_eta}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{stop.b2_eta}</td>
                    </>
                  )}
                  <td className="py-3 px-3 font-mono font-black text-blue-600 text-sm">{stop.b3_eta}</td>
                  <td className="py-3 px-3 font-mono text-xs text-emerald-800">
                    <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {stop.low} – {stop.high}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {stop.delay_min > 0 ? (
                      <span className="text-amber-600 font-bold">+{stop.delay_min} min</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">On Time</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        stop.status === "PASSED"
                          ? "bg-slate-100 text-slate-500"
                          : stop === nextStop
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-emerald-100 text-emerald-800"
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

      {/* Multilingual Passenger SMS & WhatsApp Preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Automated Passenger SMS / App Broadcast Template
            </h3>
            <p className="text-xs text-slate-500">Live multi-lingual broadcast format dispatched upon delay &ge; 5m</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-700">
              <button
                onClick={() => setSelectedLang("en")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedLang === "en" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLang("hi")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedLang === "hi" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setSelectedLang("mr")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedLang === "mr" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                मराठी
              </button>
            </div>

            <button
              onClick={handleCopyNotification}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Copy message text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed font-sans shadow-inner">
          {notifData ? notifData[selectedLang] : "Loading live message template..."}
        </div>
      </div>
    </div>
  );
};
