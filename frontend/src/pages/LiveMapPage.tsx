import React, { useState, useEffect } from 'react';
import { api, type TrainState, type ETAResponse, CORRIDOR_STATIONS } from '../api';
import { CorridorLeafletMap } from '../components/CorridorLeafletMap';
import { MapPin, Compass } from 'lucide-react';

interface LiveMapPageProps {
  selectedTrainId: string;
  onSelectTrain: (trainId: string) => void;
  onSelectStation?: (stationCode: string) => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  selectedTrainId,
  onSelectTrain,
  onSelectStation
}) => {
  const [trains, setTrains] = useState<TrainState[]>([]);
  const [etaData, setEtaData] = useState<ETAResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getTrains();
        setTrains(res.data);
        const eta = await api.getETA(selectedTrainId);
        setEtaData(eta);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [selectedTrainId]);

  const selectedTrain = trains.find(t => t.train_id === selectedTrainId) || trains[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              Interactive High-Resolution Railway Corridor Map
            </h2>
            <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              OPENSTREETMAP + LEAFLET
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial telemetry tracking trains, track occupancy, signal aspects, and station boards across Mumbai CSMT ➔ Pune Jn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Active Track Section:</span>
          <span className="text-xs font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-xl">
            Karjat ➔ Lonavala ➔ Pune (Bhor Ghat Corridor)
          </span>
        </div>
      </div>

      {/* Main Map Container */}
      <CorridorLeafletMap
        trains={trains}
        selectedTrainId={selectedTrainId}
        onSelectTrain={onSelectTrain}
        etaData={etaData}
        onSelectStation={onSelectStation}
      />

      {/* Station Corridor Quick Overview Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <MapPin className="w-4 h-4 text-cyan-400" />
          Corridor Station Lineup & Telemetry Reference (192 km)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {CORRIDOR_STATIONS.map((st, i) => {
            const isTrainHere = (selectedTrain?.current_stop_idx === i + 1) || (st.code === 'LNL' && selectedTrain?.train_id === '12123');
            return (
              <div
                key={st.code}
                className={`p-3 rounded-xl border transition-all ${
                  isTrainHere
                    ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-100 text-sm">{st.code}</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{st.km}k</span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium truncate mt-1">{st.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{st.division}</div>

                {isTrainHere && (
                  <div className="mt-2 pt-1.5 border-t border-amber-500/40 text-[9px] font-mono font-extrabold text-amber-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    Train {selectedTrain?.train_id} Here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
