import React from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface MatchHistoryPageProps {
  onNavigate: (route: string) => void;
}

export const MatchHistoryPage: React.FC<MatchHistoryPageProps> = ({ onNavigate }) => {
  const { matches } = useGame();

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <button
          onClick={() => onNavigate('/')}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-100">Match History</h1>
      </div>

      {matches.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Matches Played Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Jump into a Quick Match or challenge a friend to record your first game results!
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="mt-2 py-2 px-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
          >
            Play Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => {
            const isWin = m.result === 'WIN';
            const dateStr = new Date(m.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={m.id}
                className={`bg-[#0F172A] border rounded-xl p-3.5 space-y-2 transition-all ${
                  isWin ? 'border-emerald-500/40' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {m.result}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200">{m.matchId}</span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isWin ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isWin ? `+${m.coinsDelta.toLocaleString()}` : `${m.coinsDelta.toLocaleString()}`} Coins
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Mode: <strong className="text-slate-300">{m.mode}</strong></span>
                    <span>Fee: <strong className="text-amber-400 font-mono">🪙 {m.entryFee.toLocaleString()}</strong></span>
                  </div>
                  <div className="truncate">Opponents: {m.opponents}</div>
                </div>

                <div className="border-t border-slate-800/80 pt-1.5 text-[10px] text-slate-500 font-mono">
                  {dateStr}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
