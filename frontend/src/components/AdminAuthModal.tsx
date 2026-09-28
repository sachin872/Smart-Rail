import React, { useState } from "react";
import { Shield, Lock, Key, AlertCircle, UserCheck, X, Loader2 } from "lucide-react";
import { api } from "../api";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState<string>("");
  const [operatorId, setOperatorId] = useState<string>("CR-DISPATCH-9401");
  const [role, setRole] = useState<string>("Chief Train Controller (OCC)");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login(operatorId, pin);
      if (res.success) {
        sessionStorage.setItem("smart_rail_admin_auth", "true");
        sessionStorage.setItem("smart_rail_admin_role", res.role || role);
        sessionStorage.setItem("smart_rail_admin_operator", res.operator_id || operatorId);
        onSuccess(res.role || role);
      } else {
        setError(res.error || "Invalid Authority Passcode. Please check your credentials.");
      }
    } catch {
      setError("Database connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setPin("sachin123");
    setOperatorId("CR-DISPATCH-9401");
    setLoading(true);
    setError("");
    try {
      const res = await api.login("CR-DISPATCH-9401", "sachin123");
      if (res.success) {
        sessionStorage.setItem("smart_rail_admin_auth", "true");
        sessionStorage.setItem("smart_rail_admin_role", "Senior Section Controller");
        sessionStorage.setItem("smart_rail_admin_operator", "CR-DISPATCH-9401");
        onSuccess("Senior Section Controller");
      } else {
        setError("Demo login failed.");
      }
    } catch {
      setError("Database login error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl relative space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono tracking-widest text-indigo-400 uppercase">
              Central Railway &bull; Mumbai Division (CR-BB)
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">
              Operations Control Centre (OCC)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted Area. Authorized railway dispatchers and traffic controllers only.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operator ID</label>
            <input
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="Chief Train Controller (OCC)">Chief Train Controller (OCC)</option>
              <option value="Section Traffic Dispatcher">Section Traffic Dispatcher (Kalyan-Karjat)</option>
              <option value="Senior Operations Engineer">Senior Operations Engineer</option>
              <option value="Safety & Precedence Auditor">Safety & Precedence Auditor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Authority Passcode / PIN
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition pr-10"
                required
                autoFocus
              />
              <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            <span>{loading ? "Verifying with Database..." : "Authenticate & Unlock Admin Deck"}</span>
          </button>
        </form>

        {/* Demo Quick Unlock Helper for Evaluators */}
        <div className="pt-2 border-t border-slate-800/80 text-center space-y-2">
          <div className="text-[11px] text-slate-400">
            For evaluation / demonstration access:
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>1-Click Controller Demo Login (PIN: sachin123)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
