import { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { AdminAuthModal } from "./components/AdminAuthModal";
import { PassengerPage } from "./pages/PassengerPage";
import { StationBoardPage } from "./pages/StationBoardPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { LiveMapPage } from "./pages/LiveMapPage";
import { DelayAnalysisPage } from "./pages/DelayAnalysisPage";
import { AboutPage } from "./pages/AboutPage";
import { ControlRoomPage } from "./pages/ControlRoomPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { LearningPage } from "./pages/LearningPage";
import { ApiDocsPage } from "./pages/ApiDocsPage";
import { DataSourcesPage } from "./pages/DataSourcesPage";
import { api, type TrainState } from "./api";
import { AlertTriangle, ArrowRight, User, Shield, Lock } from "lucide-react";

const getLocalISOString = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function App() {
  const [portal, setPortal] = useState<"user" | "admin">("user");
  const [activeTab, setActiveTab] = useState<string>("passenger");
  const [selectedTrainId, setSelectedTrainId] = useState<string>("12123");
  const [simTime, setSimTime] = useState<string>(() => getLocalISOString());
  const [activeScenario, setActiveScenario] = useState<string>("CLEAN_RUN");
  const [trains, setTrains] = useState<TrainState[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStepped, setIsStepped] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem("smart_rail_admin_auth") === "true";
  });
  const [adminRole, setAdminRole] = useState<string>(() => {
    return sessionStorage.getItem("smart_rail_admin_role") || "Chief Section Controller";
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
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

  const handleAuthSuccess = (role: string) => {
    setIsAuthorized(true);
    setAdminRole(role);
    setIsAuthModalOpen(false);
    setPortal("admin");
    setActiveTab("control");
  };

  const handleLogoutAdmin = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("smart_rail_admin_auth");
    sessionStorage.removeItem("smart_rail_admin_role");
    sessionStorage.removeItem("smart_rail_admin_operator");
    setPortal("user");
    setActiveTab("passenger");
  };

  const handleRequestAuth = () => {
    setIsAuthModalOpen(true);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
        isAuthorized={isAuthorized}
        adminRole={adminRole}
        onRequestAuth={handleRequestAuth}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Password Authentication Modal for Admin Deck */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Cross-Panel Interconnected Live Status Banner in User Portal */}
      {portal === "user" && activeScenario !== "CLEAN_RUN" && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-sm border-b border-amber-600">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 fill-current animate-bounce" />
              <span>
                <strong>OPERATIONAL ADVISORY IN EFFECT:</strong> Disruption injected:{" "}
                <span className="font-mono underline">{activeScenario.replace(/_/g, " ")}</span>. Smart ETA forecasts and station displays are actively adjusting.
              </span>
            </div>
            <button
              onClick={() => {
                if (isAuthorized) {
                  setPortal("admin");
                  setActiveTab("control");
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>{isAuthorized ? "View Controller Action" : "Controller Login"}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Central Mode Top Status Banner */}
      {portal === "admin" && isAuthorized && (
        <div className="bg-indigo-950 text-indigo-200 px-4 py-1.5 text-xs font-mono border-b border-indigo-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong>OPERATIONS COMMAND ACTIVE:</strong> Dispatches and scenario injections automatically update passenger ETAs and station boards in real time.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPortal("user");
                  setActiveTab("passenger");
                }}
                className="text-indigo-300 hover:text-white underline text-[11px] cursor-pointer flex items-center gap-1"
              >
                <User className="w-3 h-3" />
                <span>Preview Passenger View</span>
              </button>
              <button
                onClick={handleLogoutAdmin}
                className="text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer font-bold flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unauthorized Admin Access Guard Screen */}
      {portal === "admin" && !isAuthorized && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Admin & Control Room Protected
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This area is restricted to authorized Railway Controllers, Chief Train Dispatchers, and Section Engineers. Passcode authentication is required to view and modify operational parameters.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Enter Authority Passcode</span>
              </button>
              <button
                onClick={() => setPortal("user")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Return to Passenger Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* User Portal Pages */}
        {portal === "user" && (
          <>
            {activeTab === "passenger" && <PassengerPage simTime={simTime} />}
            {activeTab === "map" && (
              <LiveMapPage
                selectedTrainId={selectedTrainId}
                onSelectTrain={setSelectedTrainId}
              />
            )}
            {activeTab === "station" && <StationBoardPage simTime={simTime} />}
            {activeTab === "delay-analysis" && (
              <DelayAnalysisPage
                selectedTrainId={selectedTrainId}
                onSelectTrain={setSelectedTrainId}
              />
            )}
            {activeTab === "announcements" && <AnnouncementsPage simTime={simTime} />}
            {activeTab === "about" && <AboutPage />}
          </>
        )}

        {/* Admin / Operations Portal Pages (Accessible when authorized) */}
        {portal === "admin" && isAuthorized && (
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
            {activeTab === "api-docs" && <ApiDocsPage />}
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
              {portal === "user" ? "Public Commuter Stream" : `Operations Control Room (${adminRole})`}
            </span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            {isAuthorized ? "🔒 Authority Session Active" : "Public Mode Active"} &bull; Real-Time Sync &bull; Multi-Station ETA &bull; What-If Decision Support
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
