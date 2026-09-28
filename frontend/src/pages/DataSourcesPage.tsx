import React, { useState, useEffect } from "react";
import {
  Database,
  ShieldCheck,
  CloudSun,
  Lock,
  FileCode,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCheck
} from "lucide-react";
import { api } from "../api";

export const DataSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [calibrating, setCalibrating] = useState<boolean>(false);
  const [calibResult, setCalibResult] = useState<any>(null);

  // Database password management state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("CR-DISPATCH-9401");
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingPwd, setUpdatingPwd] = useState<boolean>(false);

  const fetchSourcesAndUsers = async () => {
    try {
      const data = await api.getSources();
      setSources(data.sources || []);
      const usersData = await api.getAdminUsers();
      setAdminUsers(usersData.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSourcesAndUsers();
  }, []);

  const handleCalibrate = async () => {
    try {
      setCalibrating(true);
      const res = await api.calibrateWeather();
      setCalibResult(res);
      await fetchSourcesAndUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setCalibrating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPwd(true);
    setPwdMsg(null);
    try {
      const res = await api.changePassword(selectedUser, oldPassword, newPassword);
      if (res.success) {
        setPwdMsg({ type: "success", text: `Passcode updated for ${selectedUser} in database!` });
        setOldPassword("");
        setNewPassword("");
        await fetchSourcesAndUsers();
      } else {
        setPwdMsg({ type: "error", text: res.error || "Failed to update password." });
      }
    } catch {
      setPwdMsg({ type: "error", text: "Database connection error." });
    } finally {
      setUpdatingPwd(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Database className="w-4 h-4 text-blue-400" />
            Data Governance & Security Management
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1">
            Data Sources, Provenance & Database Security
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Real-time persistence for CRIS/NTES data feeds and cryptographic password management stored inside SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero Web-Scraping / Official Feeds Only
          </span>
        </div>
      </div>

      {/* Real-Time Database Passcode & Operator Credential Management Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <Lock className="w-4 h-4 text-indigo-600" />
              Database Real-Time Security Engine
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Admin & Operator Credentials in Database (<code className="font-mono text-indigo-700">admin_users</code>)
            </h2>
            <p className="text-xs text-slate-500">
              All passcodes are hashed with SHA-256 and verified against the SQLite database in real time.
            </p>
          </div>
          <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold px-3 py-1 rounded-full w-fit">
            🔒 Persistent Cryptographic Storage
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Operator Table */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Authorized Database Operator Accounts
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Operator ID</th>
                    <th className="py-2.5 px-3">Designation / Role</th>
                    <th className="py-2.5 px-3">Division</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-indigo-50/50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {u.username}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">{u.full_name}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{u.division}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Update Password in Database</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Operator</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="CR-DISPATCH-9401">CR-DISPATCH-9401 (Senior Controller)</option>
                  <option value="CR-CHIEF-01">CR-CHIEF-01 (Chief Controller)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure passcode"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {pwdMsg && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                  pwdMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {pwdMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{pwdMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={updatingPwd}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{updatingPwd ? "Updating Database..." : "Save Password to Database"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sources Registry Table */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-600" />
              Configured Provider Adapter Registry
            </h2>
            <p className="text-xs text-slate-500">
              Provider interfaces translate external payloads into a canonical event schema
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">Provider / Source</th>
                <th className="py-3 px-3">Reference Endpoint</th>
                <th className="py-3 px-3">Licensing / Access Terms</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Data Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((src, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-3 font-mono font-bold text-slate-900">{src.provider}</td>
                  <td className="py-4 px-3 text-slate-600 font-mono text-xs">{src.source_ref}</td>
                  <td className="py-4 px-3 text-slate-700 text-xs">{src.licence}</td>
                  <td className="py-4 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1 ${
                        src.status === "HEALTHY"
                          ? "bg-emerald-100 text-emerald-800"
                          : src.status === "GATED_STANDBY"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {src.status}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {src.data_quality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Weather Calibration Experiment */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <CloudSun className="w-4 h-4 text-blue-400" />
              Empirical Weather Calibration Experiment
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              Paired-Seed Track Adhesion Physics Derivation
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Runs paired simulator experiments across 50 seeds (Rain OFF vs Rain ON) to empirically measure corridor slowdown ratios.
            </p>
          </div>

          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/30 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${calibrating ? "animate-spin" : ""}`} />
            <span>{calibrating ? "Running Paired Seeds..." : "Run Calibration Experiment"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calibrated Rain Factor</div>
            <div className="text-3xl font-mono font-black text-amber-400 mt-1">
              {calibResult?.calibrated_rain_speed_factor || "0.82"}
            </div>
            <div className="text-xs text-slate-300 mt-1">Speed = Normal &times; 0.82</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sample Size</div>
            <div className="text-3xl font-mono font-black text-blue-400 mt-1">
              {calibResult?.sample_count || "50"} Pairs
            </div>
            <div className="text-xs text-slate-300 mt-1">Seeds: 100 &ndash; 150</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Provenance Stamp</div>
            <div className="text-sm font-mono font-black text-emerald-400 mt-2 bg-emerald-950/80 py-1 rounded-lg border border-emerald-800/60">
              SIM_CALIBRATED
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Documented simulation benchmark</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Corridor Tested</div>
            <div className="text-base font-bold text-white mt-1">Block B02 (18km)</div>
            <div className="text-xs text-slate-400 mt-1">Kalyan Jn &rarr; Karjat Jn</div>
          </div>
        </div>
      </div>
    </div>
  );
};
