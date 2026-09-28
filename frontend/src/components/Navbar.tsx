import React from "react";
import {
  Train,
  LayoutDashboard,
  Activity,
  Sliders,
  BrainCircuit,
  Database,
  RotateCcw,
  Play,
  Pause,
  Clock,
  ChevronRight,
  User,
  Shield,
  Volume2,
  MapPin,
  Lock,
  LogOut
} from "lucide-react";

interface NavbarProps {
  portal: "user" | "admin";
  setPortal: (portal: "user" | "admin") => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  simTime: string;
  scenario: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  isAuthorized: boolean;
  adminRole: string;
  onRequestAuth: () => void;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  setPortal,
  activeTab,
  setActiveTab,
  simTime,
  scenario,
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  isAuthorized,
  adminRole,
  onRequestAuth,
  onLogoutAdmin,
}) => {
  // Tabs for Passenger / User Portal (Read-only, Passenger tools)
  const userTabs = [
    { id: "passenger", label: "Live Trains & ETA", icon: Train, badge: "Live" },
    { id: "map", label: "Live Leaflet Map", icon: MapPin, badge: "OSM" },
    { id: "station", label: "Station Display Board", icon: LayoutDashboard },
    { id: "delay-analysis", label: "Why Delayed?", icon: Activity, badge: "Root Cause" },
    { id: "announcements", label: "Audio Announcements", icon: Volume2, badge: "Trilingual" },
    { id: "about", label: "About Platform", icon: BrainCircuit },
  ];

  // Tabs for Admin / Controller Portal (Authority tools)
  const adminTabs = [
    { id: "control", label: "OCC Control Room", icon: Activity, badge: "Advisory" },
    { id: "simulator", label: "Event Simulator Lab", icon: Sliders, badge: "Scenario Lab" },
    { id: "learning", label: "ML & Model Analytics", icon: BrainCircuit },
    { id: "api-docs", label: "API Explorer", icon: Database, badge: "REST" },
    { id: "sources", label: "Data Sources & Auth", icon: Database },
  ];

  // Format Sim Time HH:MM:SS in Local Time
  const formatTime = (iso: string) => {
    try {
      if (!iso) {
        return new Date().toLocaleTimeString("en-GB", { hour12: false });
      }
      const parts = iso.split("T");
      if (parts[1]) {
        if (iso.endsWith("Z") || (!iso.includes("+") && parts[1].length > 8 && !iso.includes("-", 10))) {
          const d = new Date(iso);
          if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString("en-GB", { hour12: false });
          }
        }
        return parts[1].substring(0, 8);
      }
      return new Date().toLocaleTimeString("en-GB", { hour12: false });
    } catch {
      return new Date().toLocaleTimeString("en-GB", { hour12: false });
    }
  };

  const getScenarioBadge = (sc: string) => {
    if (sc === "CLEAN_RUN") {
      return (
        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Normal Running
        </span>
      );
    }
    return (
      <span className="bg-amber-950/80 text-amber-300 border border-amber-600/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
        {sc.replace(/_/g, " ")}
      </span>
    );
  };

  const handleAdminPortalClick = () => {
    if (!isAuthorized) {
      onRequestAuth();
    } else {
      setPortal("admin");
      if (userTabs.some((t) => t.id === activeTab)) {
        setActiveTab("control");
      }
    }
  };

  const currentTabs = portal === "user" ? userTabs : adminTabs;

  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 sticky top-0 z-50">
      {/* Top Telemetry & Control Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap justify-between items-center gap-3 border-b border-slate-800/60 text-xs">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Train className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-white">SMART RAIL AI</span>
              <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold">
                v3.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Dynamic ETA Forecast & Traffic Decision Support Platform
            </p>
          </div>
        </div>

        {/* Center Portal Switcher Toggle (Passenger Portal vs Protected Admin Panel) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => {
              setPortal("user");
              if (adminTabs.some((t) => t.id === activeTab)) {
                setActiveTab("passenger");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              portal === "user"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Passenger Portal</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Live passenger feed"></span>
          </button>

          <button
            onClick={handleAdminPortalClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              portal === "admin"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {isAuthorized ? <Shield className="w-3.5 h-3.5 text-indigo-300" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span>Admin & Operations</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
              isAuthorized ? "bg-indigo-900 text-indigo-200 border border-indigo-700" : "bg-amber-950 text-amber-300 border border-amber-800"
            }`}>
              {isAuthorized ? "OCC AUTH" : "PROTECTED"}
            </span>
          </button>
        </div>

        {/* Live Simulation Clock & Quick Scenario Controls */}
        <div className="flex items-center space-x-3">
          {/* Active Scenario Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5">
            <span className="text-slate-400">State:</span>
            {getScenarioBadge(scenario)}
          </div>

          {/* Virtual Sim Clock */}
          <div className="flex items-center space-x-1.5 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 text-[11px]">Clock:</span>
            <span className="font-mono font-bold text-emerald-400 text-xs tracking-wider">
              {formatTime(simTime)}
            </span>
          </div>

          {/* Authority-Only Simulation Controls (Visible when in Admin mode) */}
          {portal === "admin" && isAuthorized ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onTogglePlay}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                  isPlaying
                    ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
                title={isPlaying ? "Pause automatic simulation" : "Start continuous automatic simulation"}
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlaying ? "Pause" : "Auto-Run"}</span>
              </button>

              <button
                onClick={onStep}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
                title="Advance virtual train movement by 1 minute"
              >
                <ChevronRight className="w-3 h-3" />
                <span>+1m</span>
              </button>

              <button
                onClick={onReset}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title="Reset simulation to deterministic clean state"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={onLogoutAdmin}
                className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Lock and sign out of Admin Deck"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center text-[11px] text-slate-400 font-mono bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
              <span>Public Transit Stream</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs per Portal */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto py-1.5 scrollbar-none border-t border-slate-800/40">
        <div className="flex space-x-1">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? portal === "user"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-black/30 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel Mode Indicator Badge */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono pl-4 text-slate-400 whitespace-nowrap">
          {portal === "admin" && isAuthorized ? (
            <span className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>{adminRole}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Passenger Live Synced</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
