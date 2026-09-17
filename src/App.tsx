import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { LobbyPage } from './pages/LobbyPage';
import { MatchmakingPage } from './pages/MatchmakingPage';
import { GamePage } from './pages/GamePage';
import { PlayWithFriendPage } from './pages/PlayWithFriendPage';
import { ProfilePage } from './pages/ProfilePage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { AddCoinsPage } from './pages/AddCoinsPage';
import { AdminPanelPage } from './pages/AdminPanelPage';

export const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  const renderScreen = () => {
    switch (currentPath) {
      case '/matchmaking':
        return <MatchmakingPage onNavigate={navigate} />;
      case '/game':
        return <GamePage onNavigate={navigate} />;
      case '/play-with-friend':
      case '/private-match':
        return <PlayWithFriendPage onNavigate={navigate} />;
      case '/profile':
        return <ProfilePage onNavigate={navigate} />;
      case '/history':
        return <MatchHistoryPage onNavigate={navigate} />;
      case '/add-coins':
      case '/coins':
        return <AddCoinsPage onNavigate={navigate} />;
      case '/admin':
        return <AdminPanelPage onNavigate={navigate} />;
      case '/':
      case '/lobby':
      default:
        return <LobbyPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {renderScreen()}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
