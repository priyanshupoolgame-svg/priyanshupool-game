import React, { useState } from 'react';
import { PlayCircle, Users, Key, History, User, Coins, ShieldCheck, ChevronRight } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Header } from '../components/Header';
import { MatchEntryConfirmModal, LowCoinsModal } from '../components/Modals';

interface LobbyPageProps {
  onNavigate: (route: string) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onNavigate }) => {
  const { user, invitations, startQuickMatch } = useGame();
  const [selectedFee, setSelectedFee] = useState(5000);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLowCoinsModal, setShowLowCoinsModal] = useState(false);

  const pendingInvites = invitations.filter(i => i.status === 'PENDING').length;

  const handleQuickMatchClick = () => {
    if (user.coins < selectedFee) {
      setShowLowCoinsModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmMatch = () => {
    setShowConfirmModal(false);
    const success = startQuickMatch(selectedFee);
    if (!success) {
      setShowLowCoinsModal(true);
    } else {
      onNavigate('/matchmaking');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col pb-8">
      <Header
        onOpenProfile={() => onNavigate('/profile')}
        onOpenCoins={() => onNavigate('/add-coins')}
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-cyan-400">8BALL PRO</h1>
              <p className="text-xs text-slate-300">4-Player Online Billiards Championship</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-900/90 border-2 border-cyan-400 flex items-center justify-center font-black text-xl text-white shadow-inner">
              8
            </div>
          </div>
          <p className="text-xs text-slate-200/90 mt-3 leading-relaxed">
            Real-time physics, 4-player turn rotation, precision cue aiming, fouls and 8-ball rules.
          </p>
        </div>

        {/* Stake Selector */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-slate-400 font-bold mb-2">
            <span>CHOOSE MATCH STAKE</span>
            <span className="text-amber-400">🪙 {selectedFee.toLocaleString()} Coins</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1000, 5000, 10000, 25000].map(fee => (
              <button
                key={fee}
                onClick={() => setSelectedFee(fee)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
                  selectedFee === fee
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {fee >= 1000 ? `${fee / 1000}K` : fee}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA: Quick Match */}
        <button
          onClick={handleQuickMatchClick}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99]"
        >
          <PlayCircle className="w-6 h-6" />
          <span className="text-base tracking-wide">QUICK MATCH (4 PLAYERS)</span>
        </button>

        {/* Section: Multiplayer Modes */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2.5 px-1">
            MULTIPLAYER MODES
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('/play-with-friend')}
              className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 text-left transition-all relative group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Play With Friend</h4>
              <p className="text-xs text-slate-400">Search ID & Invite</p>
              {pendingInvites > 0 && (
                <span className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {pendingInvites}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('/play-with-friend')}
              className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5">
                <Key className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Private Match</h4>
              <p className="text-xs text-slate-400">Room Stakes</p>
            </button>
          </div>
        </div>

        {/* Section: Player Features */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2.5 px-1">
            PLAYER STATS & COINS
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('/history')}
              className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                <History className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Match History</h4>
              <p className="text-xs text-slate-400">Audit Logs & W/L</p>
            </button>

            <button
              onClick={() => onNavigate('/profile')}
              className="bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2.5">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Player Profile</h4>
              <p className="text-xs text-slate-400">Customization</p>
            </button>
          </div>
        </div>

        {/* Add Coins Row */}
        <button
          onClick={() => onNavigate('/add-coins')}
          className="w-full bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between text-left transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Add Coins (Virtual Currency)</h4>
              <p className="text-xs text-slate-400">Request free coin packages</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>

        {/* Admin Architecture Console */}
        <button
          onClick={() => onNavigate('/admin')}
          className="w-full bg-[#0F172A] border border-purple-500/30 hover:border-purple-500/50 rounded-xl p-3.5 flex items-center justify-between text-left transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Admin Architecture Console</h4>
              <p className="text-xs text-slate-400">Manage players, requests & matches</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400/70" />
        </button>
      </main>

      {/* Confirmation & Alert Modals */}
      {showConfirmModal && (
        <MatchEntryConfirmModal
          fee={selectedFee}
          balance={user.coins}
          onConfirm={handleConfirmMatch}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {showLowCoinsModal && (
        <LowCoinsModal
          onDismiss={() => setShowLowCoinsModal(false)}
          onAddCoins={() => {
            setShowLowCoinsModal(false);
            onNavigate('/add-coins');
          }}
        />
      )}
    </div>
  );
};
