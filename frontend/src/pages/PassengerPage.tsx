import React, { useState, useEffect } from "react";
import {
  Train,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin
} from "lucide-react";
import { api, type ETAResponse, type TrainState } from "../api";
import { EventTimeline } from "../components/EventTimeline";

interface PassengerPageProps {
  simTime: string;
}

export const PassengerPage: React.FC<PassengerPageProps> = ({ simTime }) => {
  const [selectedTrain, setSelectedTrain] = useState<string>("12123");
  const [etaData, setEtaData] = useState<ETAResponse | null>(null);
  const [trainStates, setTrainStates] = useState<TrainState[]>([]);
  const [notifData, setNotifData] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "mr">("en");
  const [copied, setCopied] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>("CLEAN_RUN");
  const [deltaMessage, setDeltaMessage] = useState<string | null>(null);

  const trainOptions = [
    { id: "12123", name: "12123 Mumbai Pune Express", route: "Mumbai CSMT ➔ Pune Jn", class: "EXPRESS", prio: 1, defaultDelay: "+18m at Lonavala" },
    { id: "12124", name: "12124 Deccan Queen (Down)", route: "Pune Jn ➔ Mumbai CSMT", class: "EXPRESS", prio: 1, defaultDelay: "+2m" },
    { id: "11007", name: "11007 Deccan Express", route: "Mumbai CSMT ➔ Pune Jn", class: "EXPRESS", prio: 1, defaultDelay: "+4m at Kalyan" },
    { id: "12127", name: "12127 Mumbai Pune Intercity", route: "Mumbai CSMT ➔ Pune Jn", class: "EXPRESS", prio: 1, defaultDelay: "On Time" },
    { id: "T101", name: "T101 Deccan Superfast", route: "Station A ➔ Station D", class: "EXPRESS", prio: 1, defaultDelay: "On Time" }
  ];

  const fetchETA = async (tId: string) => {
    try {
      const [data, notifs, trainsRes] = await Promise.all([
        api.getETA(tId),
        api.getNotifications(tId),
        api.getTrains()
      ]);
      setEtaData(data);
      setNotifData(notifs);
      setTrainStates(trainsRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchETA(selectedTrain);
  }, [selectedTrain, simTime]);

  const currentTrainState = trainStates.find(t => t.train_id === selectedTrain) || {
    train_id: selectedTrain,
    train_name: "Mumbai Pune Express",
    class: "EXPRESS",
    priority: 1,
    lat: 18.7500,
    lon: 73.4072,
    speed: 65.0,
    block_id: "B_LNL_KMST",
    delay: 18.0,
    quality: "FRESH",
    current_stop_idx: 5,
    target_station: "KMST",
    progress_ratio: 0.15,
    status: "RUNNING",
    timestamp: new Date().toISOString()
  };

  const handleInjectScenario = async (sc: string) => {
    setActiveScenario(sc);
    try {
      await api.injectScenario(sc);
      if (sc === 'STOPPAGE_10M' || sc === 'UNSCHEDULED_STOP') {
        setDeltaMessage("⚠️ ETA updated: +10 minutes added due to unexpected technical stoppage at Lonavala.");
      } else if (sc === 'CONGESTION_HIGH' || sc === 'SPEED_RESTRICTION') {
        setDeltaMessage("⚠️ ETA updated: +7 minutes added due to track speed restriction (35 km/h) ahead.");
      } else if (sc === 'HEAVY_RAIN') {
        setDeltaMessage("🌧️ ETA updated: Monsoon wetting factor applied; uncertainty intervals widened.");
      } else if (sc === 'RECOVERY_5M') {
        setDeltaMessage("⚡ ETA updated: Priority clearance active; train predicted to recover 5 minutes.");
      } else {
        setDeltaMessage("🟢 Baseline operational parameters restored.");
      }
      setTimeout(() => setDeltaMessage(null), 7000);
      await fetchETA(selectedTrain);
    } catch (err) {
      console.error(err);
    }
  };

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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Live Telemetry: Fresh (Sub-second)
          </span>
        );
      case "STALE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            GPS Delayed (Window Widened)
          </span>
        );
      case "LOST":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Signal Lost (Schedule Fallback)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {quality}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Train Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <Train className="w-5 h-5 text-cyan-400" />
                Live Train Tracking & Dynamic ETA Forecasting
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-horizon arrival predictions with 80% conformal uncertainty intervals on the Mumbai–Pune corridor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {getQualityBadge(etaData?.quality || "FRESH")}
          </div>
        </div>

        {/* Train Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-5">
          {trainOptions.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTrain(t.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedTrain === t.id
                  ? "bg-cyan-500/10 border-cyan-500 ring-2 ring-cyan-500/20 shadow"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-100">{t.id}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {t.class}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate mt-1">{t.name}</div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                <span>{t.route}</span>
                <span className="text-amber-400 font-bold">{t.defaultDelay}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Focus Hero: Selected Train Live Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Next Upcoming Station Card */}
        <div className="bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
              <span>Next Approaching Stop</span>
              <span className="font-mono text-cyan-400">Stop #{nextStop?.seq || 6}</span>
            </div>
            <div className="text-2xl font-black text-slate-100 mt-2 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-cyan-400" />
              {nextStop?.station || "KMST (Kamshet)"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Scheduled Arrival: <span className="font-mono text-slate-200">{nextStop?.scheduled_arr || "--:--"}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-semibold">Predicted Arrival (Smart Rail AI):</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-cyan-400">
                {nextStop?.b3_eta || "--:--"}
              </span>
              <span className="text-xs font-mono text-slate-400">
                [{nextStop?.low || "--:--"} – {nextStop?.high || "--:--"}]
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 block mt-1">
              {nextStop?.delay_min && nextStop.delay_min > 0 ? `Late by ~${Math.round(nextStop.delay_min)} min` : "On Time"}
            </span>
          </div>
        </div>

        {/* Final Destination Arrival Card */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
              <span>Final Destination</span>
              <span className="font-mono text-emerald-400">Terminus</span>
            </div>
            <div className="text-2xl font-black text-slate-100 mt-2 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-400" />
              {finalStop?.station || "PUNE (Pune Jn)"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Scheduled Arrival: <span className="font-mono text-slate-200">{finalStop?.scheduled_arr || "--:--"}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-semibold">Destination ETA Forecast:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-emerald-400">
                {finalStop?.b3_eta || "--:--"}
              </span>
              <span className="text-xs font-mono text-slate-400">
                [{finalStop?.low || "--:--"} – {finalStop?.high || "--:--"}]
              </span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 block mt-1">
              Conformal 80% Uncertainty Window
            </span>
          </div>
        </div>

        {/* Real-Time Telemetry Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
              Live Operational Telemetry
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Current Speed:</span>
                <span className="font-mono font-bold text-cyan-300">{Math.round(currentTrainState.speed)} km/h</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Current Block:</span>
                <span className="font-mono font-bold text-slate-200">{currentTrainState.block_id}</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Live Delay:</span>
                <span className="font-mono font-bold text-amber-400">+{Math.round(currentTrainState.delay)} min</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">AI Model Version:</span>
            <span className="font-mono text-cyan-400 font-bold">{etaData?.model_version || "B3-0.1.0"}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Event Timeline & Disruption Injection */}
      <EventTimeline
        train={currentTrainState}
        etaData={etaData}
        activeScenario={activeScenario}
        onInjectScenario={handleInjectScenario}
        lastDeltaMsg={deltaMessage}
      />

      {/* Multi-Station Predictive ETA Vector Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Multi-Station ETA Vector & Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Comparing Scheduled (B0), Incumbent Linear (B1), Rule-Based SRT (B2), and Smart Rail AI (B3).
            </p>
          </div>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all border border-slate-700"
          >
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showTechnicalDetails ? "Hide Baselines (B0/B1/B2)" : "Show Baselines (B0/B1/B2)"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Seq</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Scheduled</th>
                {showTechnicalDetails && (
                  <>
                    <th className="py-3 px-3 text-slate-400">B0 (Sched)</th>
                    <th className="py-3 px-3 text-slate-400">B1 (Linear)</th>
                    <th className="py-3 px-3 text-slate-400">B2 (Rules)</th>
                  </>
                )}
                <th className="py-3 px-3 text-cyan-400">B3 Smart Rail ETA</th>
                <th className="py-3 px-3">80% Conformal Window</th>
                <th className="py-3 px-3">Delay</th>
                <th className="py-3 px-3">Operational Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {etaData?.stops?.map((st) => {
                const isPassed = st.status === "PASSED";
                const isCurrent = st.seq === currentTrainState.current_stop_idx;

                return (
                  <tr
                    key={st.station}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-amber-950/20 text-amber-200 font-bold"
                        : isPassed
                        ? "text-slate-500 opacity-70"
                        : "hover:bg-slate-800/40 text-slate-200"
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold">{st.seq}</td>
                    <td className="py-3 px-3 font-bold font-sans flex items-center gap-1.5">
                      <span>{st.station}</span>
                      {isCurrent && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded">
                          CURRENT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{st.scheduled_arr || st.scheduled_dep}</td>
                    {showTechnicalDetails && (
                      <>
                        <td className="py-3 px-3 text-slate-500">{st.b0_eta}</td>
                        <td className="py-3 px-3 text-slate-400">{st.b1_eta}</td>
                        <td className="py-3 px-3 text-slate-300">{st.b2_eta}</td>
                      </>
                    )}
                    <td className="py-3 px-3 font-black text-cyan-400 text-sm">
                      {st.b3_eta}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans text-xs">
                      [{st.low} – {st.high}]
                    </td>
                    <td className="py-3 px-3">
                      {st.delay_min > 0 ? (
                        <span className="text-amber-400 font-bold">+{Math.round(st.delay_min)}m</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">ON TIME</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans text-[11px] text-slate-400 max-w-xs truncate">
                      {st.reasons?.join(", ") || "Normal Line Transit"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copyable Trilingual Passenger Alerts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Trilingual Automated Passenger Advisory Message (SMS / WhatsApp / NTES)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {(["en", "hi", "mr"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedLang === lang
                    ? "bg-cyan-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {lang === "en" ? "English" : lang === "hi" ? "हिन्दी" : "मराठी"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-200 leading-relaxed font-mono">
            {notifData?.[selectedLang] ||
              (selectedLang === "en"
                ? `Train ${selectedTrain} (Mumbai Pune Express) is running late by approx ${Math.round(currentTrainState.delay)} min. Predicted arrival at Pune Jn: ${finalStop?.b3_eta} [${finalStop?.low} - ${finalStop?.high}].`
                : selectedLang === "hi"
                ? `गाड़ी संख्या ${selectedTrain} (मुंबई पुणे एक्सप्रेस) लगभग ${Math.round(currentTrainState.delay)} मिनट की देरी से चल रही है। पुणे जं. पर अनुमानित आगमन: ${finalStop?.b3_eta}।`
                : `गाडी क्र. ${selectedTrain} (मुंबई पुणे एक्सप्रेस) सुमारे ${Math.round(currentTrainState.delay)} मिनिटे विलंबाने धावत आहे. पुणे जं. येथे अंदाजित आगमन: ${finalStop?.b3_eta}.`)}
          </p>

          <button
            onClick={handleCopyNotification}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700 transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Alert"}
          </button>
        </div>
      </div>
    </div>
  );
};
