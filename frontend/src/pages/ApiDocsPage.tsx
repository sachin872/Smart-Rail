import React, { useState } from 'react';
import { api } from '../api';
import { Terminal, CheckCircle, Copy, Code, Play, RefreshCw } from 'lucide-react';

interface EndpointDef {
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  description: string;
  sampleBody?: any;
  defaultCall: () => Promise<any>;
}

export const ApiDocsPage: React.FC = () => {
  const [activeEndpointIndex, setActiveEndpointIndex] = useState(0);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints: EndpointDef[] = [
    {
      method: 'GET',
      path: '/api/v1/health',
      summary: 'System Health & Engine Telemetry',
      description: 'Returns operational status of database, active simulator scenario, live simulation clock, and data cleaner metrics.',
      defaultCall: () => api.getHealth()
    },
    {
      method: 'GET',
      path: '/api/v1/trains',
      summary: 'Live Train Positions & Telemetry',
      description: 'Returns list of active coaching trains with geospatial coordinates, current speed, assigned block segment, and delay minutes.',
      defaultCall: () => api.getTrains()
    },
    {
      method: 'GET',
      path: '/api/v1/eta/12123',
      summary: 'Multi-Station Conformal ETA Vector for Train 12123',
      description: 'Computes multi-horizon arrival predictions for all stops across B0 (Schedule), B1 (Incumbent), B2 (Deterministic), and B3 (Smart Rail AI) with [Low, High] 80% conformal uncertainty intervals.',
      defaultCall: () => api.getETA('12123')
    },
    {
      method: 'GET',
      path: '/api/v1/stations/LNL/board',
      summary: 'Lonavala Electronic Station Board',
      description: 'Returns live departure and arrival listings with platform numbers, smart ETAs, delay status, and named operational reasons.',
      defaultCall: () => api.getStationBoard('LNL')
    },
    {
      method: 'POST',
      path: '/api/v1/simulation/scenario',
      summary: 'Inject Operational Disruption Scenario',
      description: 'Injects live simulated disruptions (e.g. STOPPAGE_10M, CONGESTION_HIGH, HEAVY_RAIN) causing instantaneous dynamic ETA updates.',
      sampleBody: { scenario: 'STOPPAGE_10M', seed: 42 },
      defaultCall: () => api.injectScenario('STOPPAGE_10M')
    },
    {
      method: 'GET',
      path: '/api/v1/sources',
      summary: 'Data Sources & Provenance Registry',
      description: 'Returns data governance registry showing source licenses (Open-Meteo, data.gov.in, OpenStreetMap, CRIS Adapter) and health status.',
      defaultCall: () => api.getSources()
    },
    {
      method: 'GET',
      path: '/api/v1/metrics',
      summary: 'Model Accuracy & Residual Drift Metrics',
      description: 'Returns MAE, RMSE, 5-minute share, and conformal interval coverage metrics across models.',
      defaultCall: () => api.getMetrics()
    }
  ];

  const activeEp = endpoints[activeEndpointIndex];

  const handleExecute = async () => {
    setLoading(true);
    setResponseOutput(null);
    try {
      const res = await activeEp.defaultCall();
      setResponseOutput(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setResponseOutput(JSON.stringify({ error: err.message || 'Execution failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (responseOutput) {
      navigator.clipboard.writeText(responseOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-slate-100">
              Interactive REST & WebSocket API Explorer
            </h2>
            <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              OpenAPI 3.1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized endpoints for railway operations dispatchers, third-party passenger apps, and research engineers.
          </p>
        </div>

        <button
          onClick={handleExecute}
          disabled={loading}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          Execute Request
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
            Available Endpoints
          </div>
          {endpoints.map((ep, i) => {
            const isSel = i === activeEndpointIndex;
            return (
              <button
                key={ep.path}
                onClick={() => {
                  setActiveEndpointIndex(i);
                  setResponseOutput(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSel
                    ? 'bg-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg'
                    : 'bg-slate-950/60 hover:bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                    ep.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-200 truncate">{ep.path}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{ep.summary}</div>
              </button>
            );
          })}
        </div>

        {/* Request / Response Details Panel */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                  activeEp.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {activeEp.method}
                </span>
                <span className="text-sm font-mono font-bold text-slate-100">{activeEp.path}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Send
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeEp.description}
            </p>

            {activeEp.sampleBody && (
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">Request Payload:</span>
                <pre className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(activeEp.sampleBody, null, 2)}
                </pre>
              </div>
            )}

            {/* Live Output Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  Live Response Output (200 OK)
                </span>
                {responseOutput && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                )}
              </div>

              <div className="relative min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-xs text-slate-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    Fetching live railway intelligence response...
                  </div>
                ) : responseOutput ? (
                  <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                    {responseOutput}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-500">
                    <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                    <span>Click <strong>"Execute Request"</strong> above to send live request to backend.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
