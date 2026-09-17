import React, { useState } from 'react';
import { Copy, Check, Coins } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const AVATAR_COLORS = [
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-blue-500'
];

export const AVATAR_EMOJIS = ['🎱', '👑', '⚡', '🔥', '🎯', '💎'];

export const Header: React.FC<{ onOpenProfile: () => void; onOpenCoins: () => void }> = ({
  onOpenProfile,
  onOpenCoins
}) => {
  const { user } = useGame();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-[#0F172A] border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Profile Snippet */}
      <div 
        onClick={onOpenProfile}
        className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-cyan-400/50 shadow-sm ${AVATAR_COLORS[user.avatarId % AVATAR_COLORS.length]}`}>
          {AVATAR_EMOJIS[user.avatarId % AVATAR_EMOJIS.length]}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-1">
            <span>{user.name}</span>
          </h2>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span>ID: <strong className="text-cyan-400 font-mono">{user.playerId}</strong></span>
            <button
              onClick={handleCopy}
              className="p-1 hover:text-cyan-300 text-slate-400 rounded transition-colors"
              title="Copy Player ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Coins Badge */}
      <button
        onClick={onOpenCoins}
        className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-full px-3.5 py-1.5 hover:border-amber-400 transition-all shadow-sm"
      >
        <Coins className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-black text-amber-300 font-mono">
          {user.coins.toLocaleString()}
        </span>
        <span className="text-xs bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">+</span>
      </button>
    </header>
  );
};
