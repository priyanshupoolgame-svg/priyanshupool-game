import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, X } from 'lucide-react';
import { isFirebaseConfigured, missingFirebaseKeys } from '../firebase/config';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConfigNotice, setShowConfigNotice] = useState(!isFirebaseConfigured);

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

  return (
    <>
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-rose-950/90 border-b border-rose-600/50 text-rose-200 px-4 py-2 text-xs font-semibold flex items-center justify-center space-x-2 sticky top-0 z-50 backdrop-blur-md">
          <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>Connection lost. Reconnecting to 8BALL PRO servers... Virtual wallet changes & matchmaking disabled offline.</span>
        </div>
      )}

      {/* Firebase Config Notice if environment variables are not yet provided in Vercel */}
      {showConfigNotice && (
        <div className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Firebase Setup Pending:</strong> Missing ({missingFirebaseKeys.join(', ')}). Running in high-performance local demo mode until Vercel environment variables are populated.
            </span>
          </div>
          <button
            onClick={() => setShowConfigNotice(false)}
            className="p-1 hover:text-white transition-colors ml-3"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
