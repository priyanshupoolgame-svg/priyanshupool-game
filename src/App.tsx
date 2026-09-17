import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
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
import { AdminAccessDenied } from './pages/admin/AdminAccessDenied';
import { PlayerLayout } from './layouts/PlayerLayout';

export const AppContent: React.FC = () => {
  const { user, adminUser, adminLogout } = useGame();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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
            setShowAdminLogin(false);
            navigate('/admin');
          }}
        />
      );
    }

    // 2. If authenticated as a normal player, but NOT admin:
    // Display Access Denied security screen unless explicitly proceeding to Admin Login
    if (user && !adminUser && !showAdminLogin) {
      return (
        <AdminAccessDenied
          player={user}
          onBackToGame={() => navigate('/')}
          onAdminLogin={() => setShowAdminLogin(true)}
        />
      );
    }

    // 3. Otherwise show dedicated Admin Login screen
    return (
      <AdminLoginPage
        onSuccess={() => {
          setShowAdminLogin(false);
          navigate('/admin');
        }}
        onBackToPlayer={() => {
          setShowAdminLogin(false);
          navigate('/');
        }}
      />
    );
  }

  // ========================================================
  // ROUTE PARTITION: USER / PLAYER APPLICATION
  // No admin controls, links, badges, or leakage
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
