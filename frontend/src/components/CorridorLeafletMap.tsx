import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CORRIDOR_STATIONS, type TrainState, type ETAResponse } from '../api';
import { Train, ZoomIn, Compass } from 'lucide-react';

interface CorridorLeafletMapProps {
  trains: TrainState[];
  selectedTrainId: string;
  onSelectTrain: (trainId: string) => void;
  etaData?: ETAResponse | null;
  onSelectStation?: (stationCode: string) => void;
}

export const CorridorLeafletMap: React.FC<CorridorLeafletMapProps> = ({
  trains,
  selectedTrainId,
  onSelectTrain,
  etaData
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker | L.CircleMarker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered along the Mumbai - Pune corridor
    const map = L.map(mapContainerRef.current, {
      center: [18.88, 73.35],
      zoom: 10,
      zoomControl: false
    });

    // Tile layers (CartoDB Dark Matter for sleek modern railway telemetry)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Draw corridor railway line
    const coords: [number, number][] = CORRIDOR_STATIONS.map(s => [s.lat, s.lon]);
    const polyline = L.polyline(coords, {
      color: '#06b6d4',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(map);

    polylineRef.current = polyline;

    // Add station markers
    CORRIDOR_STATIONS.forEach(st => {
      const isLonavala = st.code === 'LNL';
      const isPune = st.code === 'PUNE';
      const isMumbai = st.code === 'CSMT';

      const stationIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 rounded-full ${isLonavala ? 'bg-amber-400 ring-4 ring-amber-400/30' : isPune || isMumbai ? 'bg-emerald-400 ring-4 ring-emerald-400/30' : 'bg-cyan-400 ring-2 ring-cyan-400/40'} shadow-lg"></div>
            <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider text-slate-200 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow">
              ${st.code}
            </span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([st.lat, st.lon], { icon: stationIcon }).addTo(map);
      
      marker.bindPopup(`
        <div class="p-2 bg-slate-900 text-slate-100 rounded-lg text-xs font-sans min-w-[180px]">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span class="font-bold text-cyan-400 text-sm">${st.name}</span>
            <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">${st.code}</span>
          </div>
          <div class="text-[11px] text-slate-300 space-y-1">
            <div class="flex justify-between"><span>Division:</span><span class="font-semibold text-slate-200">${st.division}</span></div>
            <div class="flex justify-between"><span>Distance:</span><span class="font-mono text-cyan-300">${st.km} km</span></div>
            <div class="flex justify-between"><span>Platforms:</span><span>${st.platforms.join(', ')}</span></div>
          </div>
        </div>
      `);

      markersRef.current[`station_${st.code}`] = marker;
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Train Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    trains.forEach(t => {
      const isSelected = t.train_id === selectedTrainId;
      const markerKey = `train_${t.train_id}`;

      const isDelayed = t.delay > 0;
      const delayColor = isDelayed ? 'bg-amber-500' : 'bg-emerald-500';
      const delayBadge = isDelayed ? `+${Math.round(t.delay)}m` : 'ON TIME';

      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div class="relative group cursor-pointer transition-transform duration-300 hover:scale-125 ${isSelected ? 'scale-110 z-50' : 'z-40'}">
            <div class="absolute -inset-2 bg-cyan-500/20 rounded-full animate-ping"></div>
            <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-cyan-500 ring-4 ring-cyan-400/40 text-slate-950' : 'bg-slate-900 border-2 border-cyan-400 text-cyan-400'} flex items-center justify-center shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>
              </svg>
            </div>
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-950/95 text-slate-100 border border-slate-700 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-lg whitespace-nowrap">
              <span>${t.train_id}</span>
              <span class="${delayColor} text-slate-950 px-1 rounded text-[8px] font-extrabold">${delayBadge}</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (markersRef.current[markerKey]) {
        (markersRef.current[markerKey] as L.Marker).setLatLng([t.lat, t.lon]);
        (markersRef.current[markerKey] as L.Marker).setIcon(trainIcon);
      } else {
        const marker = L.marker([t.lat, t.lon], { icon: trainIcon }).addTo(map);
        marker.on('click', () => {
          onSelectTrain(t.train_id);
        });
        markersRef.current[markerKey] = marker;
      }
    });
  }, [trains, selectedTrainId, onSelectTrain]);

  // Focus on selected train
  const handleFocusTrain = (tId: string) => {
    const t = trains.find(tr => tr.train_id === tId);
    if (t && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([t.lat, t.lon], 12, { duration: 1.2 });
    }
  };

  const handleResetCorridor = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([18.88, 73.35], 10, { duration: 1.0 });
    }
  };

  const selectedTrain = trains.find(t => t.train_id === selectedTrainId) || trains[0];

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Telemetry Pill */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Corridor Geo-Telemetry</div>
            <div className="text-xs font-mono font-bold text-slate-200">
              Mumbai CSMT ➔ Pune Jn Corridor (192 km)
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800 mx-1"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded font-mono font-bold">
              8 STATIONS
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono font-bold">
              {trains.length} ACTIVE TRAINS
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => handleFocusTrain(selectedTrainId)}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg transition-all active:scale-95 border border-cyan-400/40"
          >
            <Compass className="w-3.5 h-3.5" />
            Track Train {selectedTrainId}
          </button>
          <button
            onClick={handleResetCorridor}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-medium px-3 py-2 rounded-xl border border-slate-800 shadow-lg transition-all"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            Fit Corridor
          </button>
        </div>
      </div>

      {/* Train Quick Switcher Bar */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto max-w-xl">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-2xl flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase text-slate-400 px-2 whitespace-nowrap">Select Train:</span>
          {trains.map(t => {
            const isSel = t.train_id === selectedTrainId;
            return (
              <button
                key={t.train_id}
                onClick={() => {
                  onSelectTrain(t.train_id);
                  handleFocusTrain(t.train_id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  isSel
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                <Train className="w-3.5 h-3.5" />
                <span>{t.train_id}</span>
                {t.delay > 0 ? (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded font-bold">+{Math.round(t.delay)}m</span>
                ) : (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">OT</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Train Info Card Overlay */}
      {selectedTrain && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-auto w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-cyan-400">{selectedTrain.train_name}</div>
              <div className="text-[10px] font-mono text-slate-400">{selectedTrain.train_id} • {selectedTrain.class}</div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              selectedTrain.delay > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {selectedTrain.delay > 0 ? `Late by ${Math.round(selectedTrain.delay)} min` : 'On Time'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Current Speed</span>
              <span className="font-mono font-bold text-cyan-300">{Math.round(selectedTrain.speed)} km/h</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 block">Heading To</span>
              <span className="font-mono font-bold text-slate-200">{selectedTrain.target_station}</span>
            </div>
          </div>

          {etaData?.stops && (
            <div className="mt-3 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Final Station ETA Forecast:</span>
                <span className="text-emerald-400 font-mono">Pune Jn (PUNE)</span>
              </div>
              <div className="flex items-baseline justify-between bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-300">Smart ETA:</span>
                <span className="text-sm font-mono font-black text-cyan-400">
                  {etaData.stops[etaData.stops.length - 1]?.b3_eta || '--:--'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  [{etaData.stops[etaData.stops.length - 1]?.low || '--:--'} - {etaData.stops[etaData.stops.length - 1]?.high || '--:--'}]
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
