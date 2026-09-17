import React, { useState } from 'react';
import {
  X,
  Coins,
  Trophy,
  ShieldAlert,
  Calendar,
  Clock,
  Mail,
  Phone,
  PlusCircle,
  MinusCircle,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { UserProfile, CoinTransaction, MatchRecord } from '../../types';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../../components/Header';

interface PlayerDetailsModalProps {
  player: UserProfile | null;
  onClose: () => void;
  onAddCoins: (player: UserProfile) => void;
  onDeductCoins: (player: UserProfile) => void;
  onSuspend: (player: UserProfile) => void;
  onUnsuspend: (playerId: string) => void;
  transactions: CoinTransaction[];
  matches: MatchRecord[];
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  player,
  onClose,
  onAddCoins,
  onDeductCoins,
  onSuspend,
  onUnsuspend,
  transactions,
  matches
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'STATS' | 'TXNS' | 'MATCHES'>('STATS');

  if (!player) return null;

  const isSuspended = player.status === 'SUSPENDED' || player.isBlocked;
  const winRate = player.matchesPlayed > 0 ? Math.round((player.wins / player.matchesPlayed) * 100) : 0;

  const playerTxns = transactions.filter(t => t.playerId === player.playerId);
  const playerMatches = matches.filter(m => m.opponents.includes(player.name) || m.id.includes(player.playerId));

  const handleCopyId = () => {
    navigator.clipboard.writeText(player.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0F172A] border border-purple-500/30 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${AVATAR_COLORS[player.avatarId % AVATAR_COLORS.length]}`}>
              {AVATAR_EMOJIS[player.avatarId % AVATAR_EMOJIS.length]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-100">{player.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isSuspended
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 font-mono">
                <span>Player ID: <strong className="text-cyan-400">{player.playerId}</strong></span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:text-cyan-300 text-slate-500 rounded transition-colors"
                  title="Copy Player ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onAddCoins(player)}
            className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Coins</span>
          </button>

          <button
            onClick={() => onDeductCoins(player)}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Deduct Coins</span>
          </button>

          {isSuspended ? (
            <button
              onClick={() => onUnsuspend(player.playerId)}
              className="py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors col-span-2 sm:col-span-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Unsuspend Player</span>
            </button>
          ) : (
            <button
              onClick={() => onSuspend(player)}
              className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors col-span-2 sm:col-span-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Suspend Player</span>
            </button>
          )}
        </div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Coins Balance
            </span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-base font-black font-mono text-amber-300">
                {player.coins.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Matches / Win Rate
            </span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-slate-200">
                {player.wins}W / {player.losses}L ({winRate}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Date
            </span>
            <div className="flex items-center space-x-1.5 mt-1 text-slate-300 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date(player.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-4 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Mail className="w-3.5 h-3.5 text-purple-400" />
            <span>Email: <strong className="text-slate-200">{player.email || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phone: <strong className="text-slate-200">{player.phone || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last Active: <strong className="text-slate-200">{player.lastActive ? new Date(player.lastActive).toLocaleString() : 'Recent'}</strong></span>
          </div>
        </div>

        {/* Sub tabs: History / Transactions */}
        <div className="border-b border-slate-800 flex items-center space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('STATS')}
            className={`pb-2 transition-colors ${
              activeSubTab === 'STATS' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('TXNS')}
            className={`pb-2 transition-colors ${
              activeSubTab === 'TXNS' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Coin Ledger ({playerTxns.length})
          </button>
          <button
            onClick={() => setActiveSubTab('MATCHES')}
            className={`pb-2 transition-colors ${
              activeSubTab === 'MATCHES' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Match Records
          </button>
        </div>

        {/* Sub tab content */}
        {activeSubTab === 'STATS' && (
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Player <strong>{player.name}</strong> is registered under unique Player ID <code>{player.playerId}</code>.
            </p>
            <p className="text-slate-400">
              Account status: {isSuspended ? (
                <span className="text-rose-400 font-bold">Suspended (Access to multiplayer and matchmaking restricted)</span>
              ) : (
                <span className="text-emerald-400 font-bold">Active and authorized for all matches</span>
              )}
            </p>
          </div>
        )}

        {activeSubTab === 'TXNS' && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {playerTxns.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No individual coin transactions logged.</p>
            ) : (
              playerTxns.map(t => (
                <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{t.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.reason}</p>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span className="text-amber-400">🪙 {t.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === 'MATCHES' && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {playerMatches.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No match history found for this player.</p>
            ) : (
              playerMatches.map(m => (
                <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{m.mode}</span>
                    <p className="text-[11px] text-slate-400">{m.opponents}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${m.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.result}
                    </span>
                    <p className="text-[10px] font-mono text-amber-300">Stake: 🪙 {m.entryFee.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
