import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { missingFirebaseKeys } from '../firebase/config';

interface FirebaseSetupErrorProps {
  onEnableDevDemo?: () => void;
}

export const FirebaseSetupError: React.FC<FirebaseSetupErrorProps> = ({ onEnableDevDemo }) => {
  const [copied, setCopied] = useState(false);

  const envSnippet = `VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_DEMO_MODE=false`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-xl bg-[#0B132B] border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Icon */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100">
              Firebase is not configured
            </h1>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">
              Please configure Firebase environment variables
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-300 leading-relaxed">
          8BALL PRO requires Firebase Authentication and a Firestore database to maintain verified user identities, permanent Player IDs, starting coin grants, and secure administrative operations.
        </p>

        {/* Missing Keys Table */}
        <div className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Missing Environment Variables:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {missingFirebaseKeys.map(key => (
              <div
                key={key}
                className="bg-slate-900/90 border border-rose-500/40 px-3 py-2 rounded-lg flex items-center justify-between text-rose-300"
              >
                <span>{key}</span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">
                  Required
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
          <h3 className="font-bold text-slate-200 flex items-center space-x-2">
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>How to configure for Vercel deployment:</span>
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 text-[11px] leading-relaxed">
            <li>Open the <strong>Firebase Console</strong> and create or select your project.</li>
            <li>In <strong>Project Settings → General</strong>, scroll down to <strong>Your apps</strong> and copy the Web App configuration.</li>
            <li>In <strong>Vercel Dashboard</strong>, navigate to <strong>Your Project → Settings → Environment Variables</strong>.</li>
            <li>Add each environment variable listed above with your project's credentials.</li>
            <li>Redeploy the application in Vercel to activate production Firebase mode.</li>
          </ol>
        </div>

        {/* Copy Env Template */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Environment Variables Template (.env)
            </span>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Template'}</span>
            </button>
          </div>
          <pre className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-cyan-300/90 overflow-x-auto">
            {envSnippet}
          </pre>
        </div>

        {/* Development Demo Option (Disabled in production unless explicitly triggered) */}
        {onEnableDevDemo && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-[11px] text-slate-400 text-center sm:text-left flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Development Testing Only (VITE_DEMO_MODE=true)</span>
            </span>
            <button
              onClick={onEnableDevDemo}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              Preview Dev Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
