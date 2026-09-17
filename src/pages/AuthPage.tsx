import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../components/Header';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { loginUser, registerUser } = useGame();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatarId, setRegAvatarId] = useState(0);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcomePlayer, setWelcomePlayer] = useState<{ name: string; playerId: string; coins: number } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError('Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(loginIdentifier, loginPassword);
      if (!res.success) {
        setError(res.error || 'Authentication failed.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regUsername.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(regUsername, regEmail, regPassword, regAvatarId);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      } else {
        // Show success summary
        setWelcomePlayer({
          name: regUsername.trim(),
          playerId: 'Generated',
          coins: 100000
        });
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-4 py-8">
      {/* Brand Identity */}
      <div className="text-center mb-6 max-w-sm w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-500 shadow-xl shadow-cyan-500/20 mb-3 border border-cyan-400/40">
          <span className="text-3xl font-black text-slate-950 font-mono">8</span>
        </div>
        <h1 className="text-3xl font-black tracking-wider text-cyan-400">8BALL PRO</h1>
        <p className="text-sm font-semibold tracking-wide text-slate-300 mt-1">Play. Compete. Win.</p>
        <p className="text-xs text-slate-400 mt-0.5">4-Player Online Championship & Virtual Stakes</p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 backdrop-blur-md">
        {/* Toggle Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`py-2 text-xs font-black tracking-wider rounded-lg transition-all ${
              mode === 'LOGIN'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`py-2 text-xs font-black tracking-wider rounded-lg transition-all ${
              mode === 'REGISTER'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Welcome Modal Confirmation */}
        {welcomePlayer && (
          <div className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-center space-y-1 text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center justify-center space-x-1 font-bold text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Registration Successful!</span>
            </div>
            <p className="text-slate-200">Welcome, <strong>{welcomePlayer.name}</strong>!</p>
            <p className="text-amber-400 font-bold font-mono">🪙 100,000 Starting Coins Credited</p>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. rahul or rahul@8ballpro.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Login to Game'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-400">
                Demo Accounts Available: <span className="text-cyan-400 font-mono">rahul</span> / <span className="text-cyan-400 font-mono">elena</span> (Pass: <span className="text-slate-300 font-mono">020203</span>)
              </p>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Username
              </label>
              <input
                type="text"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                placeholder="e.g. MasterPool"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="player@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Choose Avatar
              </span>
              <div className="flex items-center justify-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                {AVATAR_EMOJIS.map((emoji, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setRegAvatarId(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-transform ${
                      regAvatarId === idx
                        ? 'scale-110 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
                        : 'opacity-70 hover:opacity-100'
                    } ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min 5 chars"
                  className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Confirm
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat pass"
                  className="w-full px-2.5 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Starting Coins Perk Callout */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-yellow-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                🪙
              </div>
              <div className="text-[11px]">
                <p className="font-bold text-amber-300">100,000 Coins Starting Bonus</p>
                <p className="text-slate-400">Credited automatically with permanent Player ID</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Register & Claim 100,000 Coins'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Security & Integrity Note */}
      <div className="mt-6 flex items-center space-x-2 text-slate-400 text-xs">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>Secure authentication • Permanent Player ID • Safe local persistence</span>
      </div>
    </div>
  );
};
