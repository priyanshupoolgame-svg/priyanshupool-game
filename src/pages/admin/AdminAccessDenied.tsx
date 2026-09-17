import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminAccessDeniedProps {
  player: UserProfile;
  onBackToGame: () => void;
  onAdminLogin: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  player,
  onBackToGame,
  onAdminLogin
}) => {
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-4 py-8 text-slate-100">
      <div className="w-full max-w-md bg-[#0F172A] border border-rose-500/40 rounded-2xl shadow-2xl p-6 backdrop-blur-md text-center space-y-5 animate-fadeIn">
        {/* Security Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-mono font-bold tracking-wide border border-rose-500/30 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>403 FORBIDDEN • UNAUTHORIZED</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-wide">
            Access Denied
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Restricted Administrative Area
          </p>
        </div>

        {/* Player Identity Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Signed in Player:
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
              ROLE: PLAYER
            </span>
          </div>
          <p className="font-bold text-slate-200 text-sm">
            {player.name}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Player ID: <strong className="text-cyan-400">{player.playerId}</strong>
          </p>
          {player.email && (
            <p className="text-[10px] text-slate-500">
              Email: {player.email}
            </p>
          )}
        </div>

        {/* Notice */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-300 text-left leading-relaxed">
          You are currently logged into the <strong>Player Application</strong>. You do not have administrator permissions or custom claims to view or manage the 8BALL PRO administration portal.
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onBackToGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Player Game</span>
          </button>

          <button
            onClick={onAdminLogin}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Switch to Admin Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
