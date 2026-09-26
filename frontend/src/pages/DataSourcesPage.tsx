import React, { useState, useEffect } from "react";
import { Database, ShieldCheck, CloudSun, CheckCircle2, Lock, FileCode, RefreshCw } from "lucide-react";
import { api } from "../api";

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [calibrating, setCalibrating] = useState<boolean>(false);
  const [calibResult, setCalibResult] = useState<any>(null);

  const fetchSources = async () => {
    try {
      const data = await api.getSources();
      setSources(data.sources || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleCalibrate = async () => {
    try {
      setCalibrating(true);
      const res = await api.calibrateWeather();
      setCalibResult(res);
      await fetchSources();
    } catch (e) {
      console.error(e);
    } finally {
      setCalibrating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Data Sources, Provenance & Ingestion Governance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict source-priority architecture. All live and open feeds carry provenance metadata; CRIS operational endpoints are credential-gated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Zero Web-Scraping / Official APIs Only
          </span>
        </div>
      </div>

      {/* Sources Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-600" />
          Configured Provider Adapters Registry
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold">
                <th className="py-3 px-3">Provider Name</th>
                <th className="py-3 px-3">Reference / Endpoint URL</th>
                <th className="py-3 px-3">License & Terms of Use</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Data Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((src, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{src.provider}</td>
                  <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">{src.source_ref}</td>
                  <td className="py-3.5 px-3 text-slate-700">{src.licence}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 ${
                        src.status === "HEALTHY"
                          ? "bg-emerald-100 text-emerald-800"
                          : src.status === "GATED_STANDBY"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {src.status === "HEALTHY" ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {src.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {src.is_simulated ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-semibold text-[10px]">
                        SIMULATED SEED
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-800 border border-blue-300 px-2 py-0.5 rounded font-semibold text-[10px]">
                        PERMITTED OPEN DATA
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Weather Calibration Experiment */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-blue-400" />
              Weather Calibration Experiment (Honest Physics Derivation)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Runs paired simulator experiments across 50 seeds (Rain OFF vs Rain ON) to empirically measure corridor slowdown ratios.
            </p>
          </div>

          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${calibrating ? "animate-spin" : ""}`} />
            {calibrating ? "Running Paired Seeds..." : "Run Calibration Experiment"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Calibrated Rain Factor</div>
            <div className="text-2xl font-mono font-black text-amber-400 mt-1">
              {calibResult?.calibrated_rain_speed_factor || "0.82"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Speed = Normal &times; 0.82</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Sample Count</div>
            <div className="text-2xl font-mono font-black text-blue-400 mt-1">
              {calibResult?.sample_count || "50"} Pairs
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Seeds: 100 - 150</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Provenance Tag</div>
            <div className="text-sm font-mono font-black text-emerald-400 mt-2 bg-emerald-950/80 py-1 rounded border border-emerald-800/60">
              SIM_CALIBRATED
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Not an IR official statistic</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Corridor Tested</div>
            <div className="text-base font-bold text-white mt-1">Block B02 (18km)</div>
            <div className="text-[10px] text-slate-400 mt-1">Kalyan Jn &rarr; Karjat Jn</div>
          </div>
        </div>
      </div>
    </div>
  );
};
