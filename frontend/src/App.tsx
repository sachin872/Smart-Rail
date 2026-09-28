import { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { PassengerPage } from "./pages/PassengerPage";
import { StationBoardPage } from "./pages/StationBoardPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { CorridorMapPage } from "./pages/CorridorMapPage";
import { ControlRoomPage } from "./pages/ControlRoomPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { LearningPage } from "./pages/LearningPage";
import { DataSourcesPage } from "./pages/DataSourcesPage";
import { api, type TrainState } from "./api";
import { AlertTriangle, ArrowRight, User, Shield } from "lucide-react";

const getLocalISOString = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function App() {
  const [portal, setPortal] = useState<"user" | "admin">("user");
  const [activeTab, setActiveTab] = useState<string>("passenger");
  const [simTime, setSimTime] = useState<string>(() => getLocalISOString());
  const [activeScenario, setActiveScenario] = useState<string>("CLEAN_RUN");
  const [trains, setTrains] = useState<TrainState[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStepped, setIsStepped] = useState<boolean>(false);
  const playIntervalRef = useRef<any>(null);

  // Live real-time clock ticker: updates every second when in normal real-time mode
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlaying && !isStepped && activeScenario === "CLEAN_RUN") {
        setSimTime(getLocalISOString());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isStepped, activeScenario]);

  const fetchGlobalState = async () => {
    try {
      const health = await api.getHealth();
      if (isPlaying || isStepped || health.active_scenario !== "CLEAN_RUN") {
        setSimTime(health.sim_time || getLocalISOString());
      }
      setActiveScenario(health.active_scenario || "CLEAN_RUN");
      const trainsRes = await api.getTrains();
      setTrains(trainsRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGlobalState();
    const interval = setInterval(fetchGlobalState, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, isStepped]);

  const handleStep = async () => {
    try {
      setIsStepped(true);
      const res = await api.stepSimulation();
      setSimTime(res.clock);
      setActiveScenario(res.scenario);
      setTrains(res.trains);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      setIsPlaying(false);
      setIsStepped(false);
      await api.resetSimulation(42);
      setSimTime(getLocalISOString());
      setActiveScenario("CLEAN_RUN");
      await fetchGlobalState();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Continuous Auto-Play Simulation loop
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        handleStep();
      }, 2500); // 1 virtual minute every 2.5 seconds
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar
        portal={portal}
        setPortal={setPortal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        simTime={simTime}
        scenario={activeScenario}
        isPlaying={isPlaying}
        onTogglePlay={toggleAutoPlay}
        onStep={handleStep}
        onReset={handleReset}
      />

      {/* Cross-Panel Interconnected Live Status Banner */}
      {portal === "user" && activeScenario !== "CLEAN_RUN" && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-sm border-b border-amber-600">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 fill-current animate-bounce" />
              <span>
                <strong>OPERATIONAL ADVISORY IN EFFECT:</strong> Traffic Controllers injected disruption:{" "}
                <span className="font-mono underline">{activeScenario.replace(/_/g, " ")}</span>. Smart ETA forecasts are recalculating live arrival windows.
              </span>
            </div>
            <button
              onClick={() => {
                setPortal("admin");
                setActiveTab("control");
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Controller Action</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {portal === "admin" && (
        <div className="bg-indigo-950 text-indigo-200 px-4 py-1.5 text-xs font-mono border-b border-indigo-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong>OPERATIONS COMMAND ACTIVE:</strong> All controller dispatches directly update passenger ETAs and station boards in real time.
              </span>
            </div>
            <button
              onClick={() => {
                setPortal("user");
                setActiveTab("passenger");
              }}
              className="text-indigo-300 hover:text-white underline text-[11px] cursor-pointer flex items-center gap-1"
            >
              <User className="w-3 h-3" />
              <span>Switch to Passenger View</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-12">
        {/* User Portal Pages */}
        {portal === "user" && (
          <>
            {activeTab === "passenger" && <PassengerPage simTime={simTime} />}
            {activeTab === "station" && <StationBoardPage simTime={simTime} />}
            {activeTab === "announcements" && <AnnouncementsPage simTime={simTime} />}
            {activeTab === "map" && <CorridorMapPage simTime={simTime} trains={trains} />}
          </>
        )}

        {/* Admin / Operations Portal Pages */}
        {portal === "admin" && (
          <>
            {activeTab === "control" && <ControlRoomPage simTime={simTime} trains={trains} />}
            {activeTab === "simulator" && (
              <SimulatorPage
                simTime={simTime}
                activeScenario={activeScenario}
                onRefresh={fetchGlobalState}
              />
            )}
            {activeTab === "learning" && <LearningPage />}
            {activeTab === "sources" && <DataSourcesPage />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <strong>SMART RAIL AI</strong> &bull;
            <span className="text-slate-500">
              {portal === "user" ? "Passenger Portal Connected" : "Operations & Dispatch Deck Connected"}
            </span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Real-Time Sync &bull; Multi-Station ETA &bull; Conformal Uncertainty &bull; Advisory What-If Decision Support
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
