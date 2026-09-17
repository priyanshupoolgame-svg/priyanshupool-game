import React from 'react';
import { Trophy, Frown, RotateCcw, LogOut, Coins } from 'lucide-react';
import { GamePlayer } from '../types';

interface GameOverModalProps {
  isWin: boolean;
  winner: GamePlayer | null;
  entryFee: number;
  playerCount: number;
  onRematch: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isWin,
  winner,
  entryFee,
  playerCount,
  onRematch,
  onLeave
}) => {
  const winReward = playerCount >= 4 ? entryFee * 3 + Math.floor(entryFee * 0.6) : entryFee * 2 - Math.floor(entryFee * 0.1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg"
          style={{
            background: isWin 
              ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
              : 'linear-gradient(135deg, #475569, #1E293B)'
          }}
        >
          {isWin ? <Trophy className="w-8 h-8 text-white" /> : <Frown className="w-8 h-8 text-slate-300" />}
        </div>

        <h3 className={`text-2xl font-black mb-1 ${isWin ? 'text-amber-400' : 'text-slate-200'}`}>
          {isWin ? 'VICTORY!' : 'MATCH FINISHED'}
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          {isWin ? 'You won the 4-Player Match!' : `Winner: ${winner?.name || 'Opponent'}`}
        </p>

        {/* Breakdown Card */}
        <div className="bg-[#1E293B] rounded-xl p-4 mb-5 text-sm space-y-2.5 text-left border border-slate-700/60">
          <div className="flex justify-between text-slate-400">
            <span>Entry Fee:</span>
            <span className="text-slate-200 font-mono">{entryFee.toLocaleString()} Coins</span>
          </div>
          <div className="border-t border-slate-700/60 pt-2 flex justify-between items-center">
            <span className="text-slate-400">Match Result:</span>
            <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWin ? 'WIN' : 'LOSS'}
            </span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-slate-300">Coins Payout:</span>
            <span className={`text-base font-mono font-black ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isWin ? `+${winReward.toLocaleString()}` : `-${entryFee.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onRematch}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Rematch</span>
          </button>
          <button
            onClick={onLeave}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const LowCoinsModal: React.FC<{ onDismiss: () => void; onAddCoins: () => void }> = ({
  onDismiss,
  onAddCoins
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-amber-500/50 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/40">
          <Coins className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Insufficient Coins</h3>
        <p className="text-sm text-slate-400 mb-5">
          You don't have enough coins for this match entry fee. Claim free coins to keep playing!
        </p>
        <div className="space-y-2.5">
          <button
            onClick={onAddCoins}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-colors"
          >
            Get Free Coins
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const MatchEntryConfirmModal: React.FC<{
  fee: number;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ fee, balance, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Confirm Match Entry</h3>
        <p className="text-sm text-slate-400 mb-5">
          Entry stake will be deducted from your virtual coin balance before matchmaking begins.
        </p>
        <div className="bg-[#1E293B] rounded-xl p-4 mb-5 space-y-2 text-left text-sm border border-slate-700/60">
          <div className="flex justify-between text-slate-400">
            <span>Entry Stake:</span>
            <span className="font-mono text-amber-400 font-bold">{fee.toLocaleString()} Coins</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Current Balance:</span>
            <span className="font-mono text-slate-200">{balance.toLocaleString()} Coins</span>
          </div>
          <div className="border-t border-slate-700 pt-2 flex justify-between text-slate-300 font-semibold">
            <span>Balance After Entry:</span>
            <span className="font-mono text-cyan-400">{(balance - fee).toLocaleString()} Coins</span>
          </div>
        </div>
        <div className="space-y-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-colors shadow-lg"
          >
            Confirm & Find Match
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
