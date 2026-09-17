import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Save, LogOut } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../components/Header';

interface ProfilePageProps {
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfile, logoutUser } = useGame();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <p className="text-slate-400 text-sm">Please log in to view profile.</p>
      </div>
    );
  }

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

  const handleLogout = () => {
    logoutUser();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col p-4 max-w-md mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('/')}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-100">Player Profile</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Profile Edit Card */}
        <form onSubmit={handleSave} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 text-center space-y-4 shadow-xl">
          {/* Big Avatar */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 border-cyan-400/50 shadow-xl shadow-cyan-500/10 ${AVATAR_COLORS[avatarId % AVATAR_COLORS.length]}`}>
            {AVATAR_EMOJIS[avatarId % AVATAR_EMOJIS.length]}
          </div>

          {/* Avatar Selector */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Avatar
            </span>
            <div className="flex items-center justify-center space-x-2.5">
              {AVATAR_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarId(idx)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-transform ${
                    avatarId === idx
                      ? 'scale-125 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0F172A]'
                      : 'opacity-70 hover:opacity-100'
                  } ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Field */}
          <div className="text-left">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Player Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-slate-100 focus:outline-none focus:border-cyan-400"
              maxLength={16}
            />
          </div>

          {/* Player ID & Email Display */}
          <div className="bg-slate-900/90 rounded-xl p-3 text-left border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PERMANENT PLAYER ID
                </span>
                <span className="text-base font-black font-mono text-cyan-400 tracking-wider">
                  {user.playerId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {user.email && (
              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
                Registered Email: <span className="text-slate-200">{user.email}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Saved Successfully!' : 'Save Profile Changes'}</span>
          </button>
        </form>

        {/* Career Statistics */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
            CAREER PERFORMANCE
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400">CURRENT COINS</span>
              <p className="text-lg font-black font-mono text-amber-400 mt-0.5">
                🪙 {user.coins.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-400">WIN RATE</span>
              <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                {winRate}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400">MATCHES</span>
              <p className="text-base font-black text-slate-100 mt-0.5">{user.matchesPlayed}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400">WINS</span>
              <p className="text-base font-black text-emerald-400 mt-0.5">{user.wins}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
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
