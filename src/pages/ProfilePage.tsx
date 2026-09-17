import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Save } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../components/Header';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useGame();
  const [name, setName] = useState(user.name);
  const [avatarId, setAvatarId] = useState(user.avatarId);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const winRate = user.matchesPlayed > 0 ? Math.round((user.wins / user.matchesPlayed) * 100) : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile(name.trim(), avatarId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        <h1 className="text-lg font-bold text-slate-100">Player Profile</h1>
      </div>

      <div className="space-y-4">
        {/* Profile Edit Card */}
        <form onSubmit={handleSave} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-center space-y-4">
          {/* Big Avatar */}
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 border-cyan-400/50 shadow-xl shadow-cyan-500/10"
            style={{ backgroundColor: AVATAR_COLORS[avatarId % AVATAR_COLORS.length].replace('bg-', '') }}
          >
            {AVATAR_EMOJIS[avatarId % AVATAR_EMOJIS.length]}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">CHOOSE AVATAR</span>
            <div className="flex items-center justify-center space-x-2 mt-2">
              {AVATAR_EMOJIS.map((emoji, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarId(idx)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-transform ${
                    avatarId === idx
                      ? 'scale-110 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
                      : 'opacity-70 hover:opacity-100'
                  } ${AVATAR_COLORS[idx]}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Field */}
          <div className="text-left">
            <label className="text-xs text-slate-400 block mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Player ID Pill */}
          <div className="bg-[#1E293B] rounded-xl p-3 flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">UNIQUE PLAYER ID</span>
              <p className="text-sm font-black font-mono text-cyan-400">{user.playerId}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-cyan-300"
              title="Copy ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Profile Saved!' : 'Save Changes'}</span>
          </button>
        </form>

        {/* Career Statistics */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">CAREER STATISTICS</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400">COINS BALANCE</span>
              <p className="text-lg font-black font-mono text-amber-400 mt-0.5">
                🪙 {user.coins.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400">WIN RATE</span>
              <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                {winRate}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400">MATCHES</span>
              <p className="text-base font-black text-slate-100 mt-0.5">{user.matchesPlayed}</p>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400">WINS</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">{user.wins}</p>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400">LOSSES</span>
              <p className="text-base font-black text-rose-400 mt-0.5">{user.losses}</p>
            </div>
          </div>
        </div>

        {/* View History CTA */}
        <button
          onClick={() => onNavigate('/history')}
          className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold transition-colors"
        >
          View Complete Match History
        </button>
      </div>
    </div>
  );
};
