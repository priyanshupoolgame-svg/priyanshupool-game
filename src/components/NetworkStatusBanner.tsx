import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-rose-950/90 border-b border-rose-600/50 text-rose-200 px-4 py-2 text-xs font-semibold flex items-center justify-center space-x-2 sticky top-0 z-50 backdrop-blur-md">
      <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
      <span>Connection lost. Reconnecting to 8BALL PRO servers... Virtual wallet changes & matchmaking disabled offline.</span>
    </div>
  );
};
