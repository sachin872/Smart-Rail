import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { PassengerPage } from "./pages/PassengerPage";
import { StationBoardPage } from "./pages/StationBoardPage";
import { ControlRoomPage } from "./pages/ControlRoomPage";
import { SimulatorPage } from "./pages/SimulatorPage";
import { LearningPage } from "./pages/LearningPage";
import { DataSourcesPage } from "./pages/DataSourcesPage";
import { api, type TrainState } from "./api";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("passenger");
  const [simTime, setSimTime] = useState<string>("2026-09-26T16:10:00");
  const [activeScenario, setActiveScenario] = useState<string>("CLEAN_RUN");
  const [trains, setTrains] = useState<TrainState[]>([]);

  const fetchGlobalState = async () => {
    try {
      const health = await api.getHealth();
      setSimTime(health.sim_time || "2026-09-26T16:10:00");
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
  }, []);

  const handleStep = async () => {
    try {
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
      const res = await api.resetSimulation(42);
      setSimTime(res.sim_time);
      setActiveScenario("CLEAN_RUN");
      await fetchGlobalState();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        simTime={simTime}
        scenario={activeScenario}
        onStep={handleStep}
        onReset={handleReset}
      />

      <main className="flex-1 pb-12">
        {activeTab === "passenger" && <PassengerPage simTime={simTime} />}
        {activeTab === "station" && <StationBoardPage simTime={simTime} />}
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
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong>SMART RAIL AI</strong> &bull; Enterprise Railway ETA & Operations Platform
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Stateless Workers &bull; Sectional Running Time &bull; Conformal Uncertainty &bull; Advisory Decision Support
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
