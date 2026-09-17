import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { isFirebaseConfigured, isDemoMode } from './firebase/config';
import { FirebaseSetupError } from './components/FirebaseSetupError';
import { LobbyPage } from './pages/LobbyPage';
import { MatchmakingPage } from './pages/MatchmakingPage';
import { GamePage } from './pages/GamePage';
import { PlayWithFriendPage } from './pages/PlayWithFriendPage';
import { ProfilePage } from './pages/ProfilePage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { AddCoinsPage } from './pages/AddCoinsPage';
import { WithdrawCoinsPage } from './pages/WithdrawCoinsPage';
import { AuthPage } from './pages/AuthPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { PlayerLayout } from './layouts/PlayerLayout';

export const AppContent: React.FC = () => {
  const { user, adminUser, adminLogout } = useGame();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [devDemoOverride, setDevDemoOverride] = useState<boolean>(() => {
    return sessionStorage.getItem('8ball_dev_preview') === 'true';
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

  // ========================================================
  // FIREBASE CONFIGURATION GUARD (PRODUCTION)
  // In production, if Firebase environment variables are missing,
  // do NOT start fake demo mode. Show clear configuration error.
  // ========================================================
  if (!isFirebaseConfigured && !isDemoMode && !devDemoOverride) {
    return (
      <FirebaseSetupError
        onEnableDevDemo={() => {
          sessionStorage.setItem('8ball_dev_preview', 'true');
          setDevDemoOverride(true);
        }}
      />
    );
  }

  // ========================================================
  // ROUTE PARTITION: ADMIN PORTAL (/admin)
  // Completely isolated from Player Application
  // ========================================================
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    // 1. If authenticated as verified Admin, show Admin Dashboard
    if (adminUser) {
      return (
        <AdminDashboardPage
          onLogout={() => {
            adminLogout();
            navigate('/admin');
          }}
        />
      );
    }

    // 2. Otherwise show dedicated Admin Login screen
    return (
      <AdminLoginPage
        onSuccess={() => {
          navigate('/admin');
        }}
      />
    );
  }

  // ========================================================
  // ROUTE PARTITION: USER / PLAYER APPLICATION (/)
  // Completely separated from Admin Portal
  // ========================================================
  if (!user) {
    return <AuthPage onSuccess={() => navigate('/')} />;
  }

  const renderUserScreen = () => {
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
      case '/withdraw':
        return <WithdrawCoinsPage onNavigate={navigate} />;
      case '/':
      case '/lobby':
      default:
        return <LobbyPage onNavigate={navigate} />;
    }
  };

  return (
    <PlayerLayout currentPath={currentPath} onNavigate={navigate}>
      {renderUserScreen()}
    </PlayerLayout>
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
