import React from "react";
import { Train, Activity, LayoutDashboard, Sliders, BrainCircuit, Database, RotateCcw, Play, Clock } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  simTime: string;
  scenario: string;
  onStep: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  simTime,
  scenario,
  onStep,
  onReset,
}) => {
  const tabs = [
    { id: "passenger", label: "Passenger ETA", icon: Train },
    { id: "station", label: "Station Board", icon: LayoutDashboard },
    { id: "control", label: "Control Room", icon: Activity },
    { id: "simulator", label: "Simulator & Scenarios", icon: Sliders },
    { id: "learning", label: "Continuous Learning", icon: BrainCircuit },
    { id: "sources", label: "Data Sources & Provenance", icon: Database },
  ];

  // Format Sim Time HH:MM:SS
  const formatTime = (iso: string) => {
    try {
      const parts = iso.split("T");
      return parts[1]?.substring(0, 8) || "16:10:00";
    } catch {
      return "16:10:00";
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50">
      {/* Top Banner with Watermark & Status */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs flex flex-wrap justify-between items-center border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-blue-400 tracking-wider uppercase text-sm">SMART RAIL AI</span>
          <span className="text-slate-400 hidden sm:inline">• Intelligent Railway Operations & Dynamic ETA</span>
          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE SYSTEM ONLINE
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Sim Clock:</span>
            <span className="font-mono font-bold text-emerald-400">{formatTime(simTime)}</span>
          </div>

          <div className="text-slate-400">
            Scenario: <span className="text-slate-200 font-semibold">{scenario}</span>
          </div>

          <div className="flex items-center space-x-2 pl-2">
            <button
              onClick={onStep}
              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
              title="Advance discrete simulation by 1 minute"
            >
              <Play className="w-3 h-3 fill-current" />
              Step +1m
            </button>
            <button
              onClick={onReset}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Reset simulation to deterministic seed 42"
            >
              <RotateCcw className="w-3 h-3" />
              Reset (Seed 42)
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-inner font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
