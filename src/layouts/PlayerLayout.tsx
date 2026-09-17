import React, { useState } from 'react';
import { PlayCircle, User, Coins, History, BookOpen, LogOut, Copy, Check } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../components/Header';
import { NetworkStatusBanner } from '../components/NetworkStatusBanner';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { RulesSettingsModal } from '../components/RulesSettingsModal';

interface PlayerLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (route: string) => void;
}

export const PlayerLayout: React.FC<PlayerLayoutProps> = ({
  children,
  currentPath,
  onNavigate
}) => {
  const { user, logoutUser } = useGame();
  const [copied, setCopied] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  if (!user || currentPath === '/game') {
    return <>{children}</>;
  }

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutUser();
    onNavigate('/');
  };

  // Check active navigation link
  const isGameActive = currentPath === '/' || currentPath === '/lobby' || currentPath === '/game' || currentPath === '/matchmaking' || currentPath === '/play-with-friend';
  const isProfileActive = currentPath === '/profile';
  const isCoinsActive = currentPath === '/add-coins' || currentPath === '/coins' || currentPath === '/withdraw';
  const isHistoryActive = currentPath === '/history';

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans">
      <NetworkStatusBanner />

      {/* PLAYER TOP HEADER */}
      <header className="w-full bg-[#0F172A] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        {/* Left: Player Profile Snippet */}
        <div
          onClick={() => onNavigate('/profile')}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 border-cyan-400/50 shadow-sm ${AVATAR_COLORS[user.avatarId % AVATAR_COLORS.length]}`}>
            {AVATAR_EMOJIS[user.avatarId % AVATAR_EMOJIS.length]}
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 flex items-center space-x-1">
              <span>{user.name}</span>
            </h2>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <span>ID: <strong className="text-cyan-400 font-mono">{user.playerId}</strong></span>
              <button
                onClick={handleCopyId}
                className="p-0.5 hover:text-cyan-300 text-slate-400 rounded transition-colors"
                title="Copy Player ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              isGameActive ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Game</span>
          </button>

          <button
            onClick={() => onNavigate('/add-coins')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              isCoinsActive ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Coins</span>
          </button>

          <button
            onClick={() => onNavigate('/history')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              isHistoryActive ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Match History</span>
          </button>

          <button
            onClick={() => onNavigate('/profile')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              isProfileActive ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right: Coins Balance + Settings + Logout */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('/add-coins')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-full px-3 py-1 hover:border-amber-400 transition-all shadow-sm"
            title="Coin Balance & Add Coins"
          >
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-black text-amber-300 font-mono">
              {user.coins.toLocaleString()}
            </span>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1 rounded-full">+</span>
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 rounded-lg transition-colors"
            title="8-Ball Rules & Settings"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
            title="Logout of Player Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN PLAYER VIEW CONTAINER */}
      <main className="flex-1 flex flex-col pb-16 md:pb-6">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-bold shadow-lg">
        <button
          onClick={() => onNavigate('/')}
          className={`flex flex-col items-center space-y-0.5 transition-colors ${
            isGameActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Game</span>
        </button>

        <button
          onClick={() => onNavigate('/add-coins')}
          className={`flex flex-col items-center space-y-0.5 transition-colors ${
            isCoinsActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Coins</span>
        </button>

        <button
          onClick={() => onNavigate('/history')}
          className={`flex flex-col items-center space-y-0.5 transition-colors ${
            isHistoryActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>

        <button
          onClick={() => onNavigate('/profile')}
          className={`flex flex-col items-center space-y-0.5 transition-colors ${
            isProfileActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setShowRulesModal(true)}
          className="flex flex-col items-center space-y-0.5 text-slate-400 hover:text-slate-200"
        >
          <BookOpen className="w-4 h-4" />
          <span>Rules</span>
        </button>
      </nav>

      <PWAInstallPrompt />

      <RulesSettingsModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
};
