import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { useGame } from '../../context/GameContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToPlayer?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBackToPlayer }) => {
  const { adminLogin } = useGame();
  const [adminId, setAdminId] = useState('789895');
  const [password, setPassword] = useState('020203');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminId.trim() || !password.trim()) {
      setError('Please enter Admin ID and Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(adminId, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during admin authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-4 py-8">
      {/* Admin Branding Header */}
      <div className="text-center mb-6 max-w-sm w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 shadow-xl shadow-purple-500/20 mb-3 border border-purple-400/40">
          <ShieldCheck className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-wider text-slate-100">8BALL PRO</h1>
        <p className="text-xs font-bold tracking-widest text-purple-400 uppercase mt-0.5">
          ADMINISTRATION PORTAL
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Restricted access. Authorized system administrators only.
        </p>
      </div>

      {/* Admin Login Card */}
      <div className="w-full max-w-sm bg-[#0F172A] border border-purple-500/30 rounded-2xl shadow-2xl p-6 backdrop-blur-md">
        <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-purple-400" />
          <span>System Security Authentication</span>
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center space-x-2.5 text-xs text-rose-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Admin ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                placeholder="Admin ID (e.g. 789895)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-purple-500/20 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating Admin...' : 'Enter Admin Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          Prototype Master Credentials: <span className="text-purple-300 font-mono">789895</span> / <span className="text-purple-300 font-mono">020203</span>
        </div>

        {onBackToPlayer && (
          <button
            type="button"
            onClick={onBackToPlayer}
            className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Return to Player Game
          </button>
        )}
      </div>
    </div>
  );
};
