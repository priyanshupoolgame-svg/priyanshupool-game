import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone (PWA) mode
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Check if previously dismissed
    const dismissed = localStorage.getItem('8ball_pro_pwa_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Don't show again for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 86400000) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } else {
      setIsDismissed(false);
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIOS(isAppleDevice && isSafari);

    // 4. Capture beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('8ball_pro_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show if deferred prompt is captured OR if on iOS device
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between animate-fadeIn">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-[#090D16] border border-cyan-400/40 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
            <img src="/icons/pwa-192x192.png" alt="8BALL PRO" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-sm font-extrabold text-slate-100 tracking-wide">8BALL PRO</h4>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 rounded-full border border-cyan-500/30">PWA</span>
            </div>
            <p className="text-xs text-slate-400 leading-tight">Install for full-screen table & offline play</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Install 8BALL PRO on iOS</h3>
            <p className="text-sm text-slate-400 mb-6">
              Install the app directly on your iPhone / iPad home screen without downloading from the App Store:
            </p>

            <div className="space-y-3 text-left text-xs text-slate-300 mb-6 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">1</span>
                <span>Tap the <strong className="text-cyan-300 inline-flex items-center"><Share2 className="w-3.5 h-3.5 mx-1 inline" /> Share</strong> button in Safari toolbar.</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">2</span>
                <span>Scroll down and select <strong className="text-slate-100">"Add to Home Screen"</strong>.</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">3</span>
                <span>Tap <strong className="text-cyan-300">Add</strong> in the top right corner.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
