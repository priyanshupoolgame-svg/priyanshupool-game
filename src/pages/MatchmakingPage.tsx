import React, { useEffect } from 'react';
import { Loader2, X, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../components/Header';

interface MatchmakingPageProps {
  onNavigate: (route: string) => void;
}

export const MatchmakingPage: React.FC<MatchmakingPageProps> = ({ onNavigate }) => {
  const {
    gameState,
    playersFound,
    matchmakingPlayers,
    entryFee,
    cancelMatchmaking
  } = useGame();

  useEffect(() => {
    if (gameState === 'PLAYER_TURN' || gameState === 'SHOT_IN_PROGRESS') {
      onNavigate('/game');
    }
  }, [gameState, onNavigate]);

  const handleCancel = () => {
    cancelMatchmaking();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Top Details */}
      <div className="text-center pt-4">
        <h2 className="text-sm font-black text-cyan-400 tracking-wider">8BALL PRO</h2>
        <h1 className="text-2xl font-black text-slate-100 mt-1">
          {playersFound < 4 ? 'Finding Players...' : 'All Players Ready!'}
        </h1>
        <p className="text-xs text-amber-400 font-mono mt-1">
          Entry Fee: {entryFee.toLocaleString()} Coins • Total Pot: 🪙 {(entryFee * 4).toLocaleString()}
        </p>

        {/* Progress Pill */}
        <div className="inline-flex items-center space-x-2 bg-[#0F172A] border border-slate-700/80 rounded-full px-4 py-1.5 mt-5">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-sm font-bold text-slate-200">
            Players Found: <strong className="text-cyan-400">{playersFound}</strong> / 4
          </span>
        </div>
      </div>

      {/* 4 Player Slots */}
      <div className="space-y-3 my-auto">
        {[0, 1, 2, 3].map(index => {
          const player = matchmakingPlayers[index];
          const isFilled = !!player;

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isFilled
                  ? 'bg-[#0F172A] border-cyan-500/50 shadow-md'
                  : 'bg-[#0F172A]/40 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isFilled ? (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-cyan-400/60 ${AVATAR_COLORS[player.avatarId % AVATAR_COLORS.length]}`}>
                    {AVATAR_EMOJIS[player.avatarId % AVATAR_EMOJIS.length]}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    {isFilled ? player.name : `Searching Slot ${index + 1}...`}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {isFilled ? `ID: ${player.playerId}` : 'Waiting for connection'}
                  </p>
                </div>
              </div>

              {isFilled ? (
                <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  READY
                </span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/60 animate-ping" />
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel Button */}
      <button
        onClick={handleCancel}
        className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-slate-300 font-bold border border-slate-700 rounded-xl flex items-center justify-center space-x-2 transition-colors"
      >
        <X className="w-4 h-4" />
        <span>Cancel Matchmaking</span>
      </button>
    </div>
  );
};
