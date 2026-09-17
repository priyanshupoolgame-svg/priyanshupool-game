import React, { useState } from 'react';
import {
  ShieldCheck,
  LogOut,
  Users,
  Coins,
  Search,
  History,
  FileText,
  Landmark,
  PlusCircle,
  MinusCircle,
  Ban,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../../components/Header';
import { UserProfile } from '../../types';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

type TabType = 'OVERVIEW' | 'PLAYERS' | 'COIN_REQUESTS' | 'WITHDRAWALS' | 'TRANSACTIONS' | 'SUSPENSIONS';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  const {
    adminUser,
    adminWallet,
    allUsers,
    coinRequests,
    withdrawalRequests,
    transactions,
    suspensions,
    adminAddCoinsToPlayer,
    adminDeductCoinsFromPlayer,
    adminApproveCoinRequest,
    adminRejectCoinRequest,
    adminSuspendPlayer,
    adminUnsuspendPlayer,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminCompleteWithdrawal
  } = useGame();

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerFilter, setPlayerFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Modal State for Coin Add/Deduct
  const [coinActionTarget, setCoinActionTarget] = useState<{ player: UserProfile; type: 'ADD' | 'DEDUCT' } | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(10000);
  const [coinReason, setCoinReason] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State for Player Suspension
  const [suspendTarget, setSuspendTarget] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('Fair play violation');

  // Overview Calculations
  const totalCirculatingCoins = allUsers.reduce((sum, u) => sum + u.coins, 0);
  const pendingCoinRequests = coinRequests.filter(r => r.status === 'PENDING');
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'PENDING');
  const suspendedCount = allUsers.filter(u => u.status === 'SUSPENDED' || u.isBlocked).length;

  // Filtered Players
  const filteredPlayers = allUsers.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.playerId.toLowerCase().includes(playerSearch.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(playerSearch.toLowerCase()));

    if (playerFilter === 'ACTIVE') return matchesSearch && p.status !== 'SUSPENDED' && !p.isBlocked;
    if (playerFilter === 'SUSPENDED') return matchesSearch && (p.status === 'SUSPENDED' || p.isBlocked);
    return matchesSearch;
  });

  const handleCoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!coinActionTarget) return;
    if (coinAmount <= 0) {
      setActionError('Amount must be greater than 0.');
      return;
    }

    if (coinActionTarget.type === 'ADD') {
      const res = adminAddCoinsToPlayer(coinActionTarget.player.playerId, coinAmount, coinReason || 'Administrative Credit');
      if (!res.success) {
        setActionError(res.error || 'Failed to add coins.');
      } else {
        setActionSuccess(`Successfully added ${coinAmount.toLocaleString()} coins to ${coinActionTarget.player.name}.`);
        setTimeout(() => setCoinActionTarget(null), 1200);
      }
    } else {
      const res = adminDeductCoinsFromPlayer(coinActionTarget.player.playerId, coinAmount, coinReason || 'Administrative Debit');
      if (!res.success) {
        setActionError(res.error || 'Failed to deduct coins.');
      } else {
        setActionSuccess(`Successfully deducted ${coinAmount.toLocaleString()} coins from ${coinActionTarget.player.name}.`);
        setTimeout(() => setCoinActionTarget(null), 1200);
      }
    }
  };

  const handleSuspendConfirm = () => {
    if (!suspendTarget) return;
    adminSuspendPlayer(suspendTarget.playerId, suspendReason);
    setSuspendTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="bg-[#0B1329] border-b border-purple-500/20 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-400 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black text-slate-100">8BALL PRO</h1>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-purple-500/40">
                ADMIN PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Admin ID: <strong className="text-purple-300 font-mono">{adminUser?.adminId || '789895'}</strong> • Role: Super Admin
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Admin Coin Wallet */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-4 py-1.5 flex items-center space-x-3 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-yellow-400 flex items-center justify-center font-bold">
              🪙
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
                ADMIN COIN WALLET
              </span>
              <span className="text-base font-black font-mono text-amber-400">
                {adminWallet.toLocaleString()} <span className="text-xs text-slate-400">Coins</span>
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
            title="Exit Admin Portal"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#0F172A] border-b border-slate-800 px-6 py-2 flex items-center space-x-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'OVERVIEW', label: 'Dashboard Overview', icon: History },
          { id: 'PLAYERS', label: `Player Management (${allUsers.length})`, icon: Users },
          { id: 'COIN_REQUESTS', label: `Coin Requests (${pendingCoinRequests.length})`, icon: Coins },
          { id: 'WITHDRAWALS', label: `Withdrawals (${pendingWithdrawals.length})`, icon: Landmark },
          { id: 'TRANSACTIONS', label: `Transaction Ledger (${transactions.length})`, icon: FileText },
          { id: 'SUSPENSIONS', label: `Suspensions (${suspensions.length})`, icon: Ban }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ======================================================== */}
        {/* 1. OVERVIEW TAB */}
        {/* ======================================================== */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Players</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black font-mono text-slate-100 mt-2">{allUsers.length}</p>
                <p className="text-[11px] text-slate-500 mt-1">Starting balance: 100,000 Coins / player</p>
              </div>

              <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Admin Coin Wallet</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-yellow-400 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black font-mono text-amber-400 mt-2">{adminWallet.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-1">Starting reservoir: 1,000,000 Coins</p>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Circulating Player Coins</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black font-mono text-emerald-400 mt-2">{totalCirculatingCoins.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500 mt-1">Sum of all active player balances</p>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Withdrawals</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black font-mono text-purple-400 mt-2">{pendingWithdrawals.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Threshold: 500,000 Coins = ₹100</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Pending Coin Package Requests ({pendingCoinRequests.length})</span>
                </h3>
                {pendingCoinRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No pending coin package requests.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingCoinRequests.slice(0, 3).map(req => (
                      <div key={req.id} className="bg-slate-900/80 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-800">
                        <div>
                          <p className="font-bold text-slate-200">{req.playerName} ({req.playerId})</p>
                          <p className="text-[11px] text-amber-400 font-mono">🪙 {req.amount.toLocaleString()} Coins requested</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => adminApproveCoinRequest(req.id)}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg font-bold hover:bg-emerald-500/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => adminRejectCoinRequest(req.id)}
                            className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg font-bold hover:bg-rose-500/30"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('COIN_REQUESTS')}
                  className="text-xs text-purple-400 font-bold hover:underline block pt-1"
                >
                  View all requests →
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Controlled Withdrawal Queue ({pendingWithdrawals.length})</span>
                </h3>
                {pendingWithdrawals.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No pending redemption requests.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingWithdrawals.slice(0, 3).map(w => (
                      <div key={w.id} className="bg-slate-900/80 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-800">
                        <div>
                          <p className="font-bold text-slate-200">{w.playerName} ({w.playerId})</p>
                          <p className="text-[11px] text-emerald-400 font-mono">
                            🪙 {w.coinsRequested.toLocaleString()} Coins (₹{w.currencyValue} INR)
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => adminApproveWithdrawal(w.id)}
                            className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-lg font-bold"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => adminRejectWithdrawal(w.id)}
                            className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg font-bold"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('WITHDRAWALS')}
                  className="text-xs text-purple-400 font-bold hover:underline block pt-1"
                >
                  Manage withdrawals →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. PLAYERS MANAGEMENT TAB */}
        {/* ======================================================== */}
        {activeTab === 'PLAYERS' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                  placeholder="Search by Player ID, Username, or Email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center space-x-2">
                {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => setPlayerFilter(flt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      playerFilter === flt
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {flt} ({flt === 'ALL' ? allUsers.length : flt === 'ACTIVE' ? allUsers.length - suspendedCount : suspendedCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Players Table */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1329] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Player</th>
                      <th className="p-4">Player ID</th>
                      <th className="p-4">Coins Balance</th>
                      <th className="p-4">Matches (W/L)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Registered</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No players match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map(p => {
                        const isSusp = p.status === 'SUSPENDED' || p.isBlocked;
                        const winRate = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${AVATAR_COLORS[p.avatarId % AVATAR_COLORS.length]}`}>
                                  {AVATAR_EMOJIS[p.avatarId % AVATAR_EMOJIS.length]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">{p.name}</p>
                                  {p.email && <p className="text-[10px] text-slate-400">{p.email}</p>}
                                </div>
                              </div>
                            </td>

                            <td className="p-4 font-mono font-bold text-cyan-400">
                              {p.playerId}
                            </td>

                            <td className="p-4 font-mono font-black text-amber-400">
                              🪙 {p.coins.toLocaleString()}
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-slate-200">{p.matchesPlayed}</span>
                              <span className="text-slate-400 text-[11px] ml-1">
                                ({p.wins}W / {p.losses}L • {winRate}%)
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isSusp
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                }`}
                              >
                                {isSusp ? 'SUSPENDED' : 'ACTIVE'}
                              </span>
                            </td>

                            <td className="p-4 text-slate-400 text-[11px]">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {/* Add Coins */}
                                <button
                                  onClick={() => {
                                    setCoinActionTarget({ player: p, type: 'ADD' });
                                    setCoinAmount(10000);
                                    setCoinReason('');
                                    setActionError(null);
                                    setActionSuccess(null);
                                  }}
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors"
                                  title="Add Coins (From Admin Wallet)"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>

                                {/* Deduct Coins */}
                                <button
                                  onClick={() => {
                                    setCoinActionTarget({ player: p, type: 'DEDUCT' });
                                    setCoinAmount(10000);
                                    setCoinReason('');
                                    setActionError(null);
                                    setActionSuccess(null);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
                                  title="Deduct Coins (To Admin Wallet)"
                                >
                                  <MinusCircle className="w-4 h-4" />
                                </button>

                                {/* Suspend / Unsuspend */}
                                {isSusp ? (
                                  <button
                                    onClick={() => adminUnsuspendPlayer(p.playerId)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                                    title="Unsuspend Account"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSuspendTarget(p);
                                      setSuspendReason('Fair play / Anti-fraud policy violation');
                                    }}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                                    title="Suspend Account"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. COIN PACKAGE REQUESTS TAB */}
        {/* ======================================================== */}
        {activeTab === 'COIN_REQUESTS' && (
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Player Coin Requests</h3>
                <p className="text-xs text-slate-400">
                  Approved packages transfer virtual coins directly from the Admin Wallet ({adminWallet.toLocaleString()} available).
                </p>
              </div>
            </div>

            {coinRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No coin requests in database.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {coinRequests.map(req => (
                  <div key={req.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200">{req.playerName}</span>
                        <span className="font-mono text-cyan-400 text-xs">({req.playerId})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                        🪙 {req.amount.toLocaleString()} Coins
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Requested {new Date(req.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => adminApproveCoinRequest(req.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                        >
                          Approve Request
                        </button>
                        <button
                          onClick={() => adminRejectCoinRequest(req.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold rounded-lg text-xs transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. WITHDRAWALS TAB */}
        {/* ======================================================== */}
        {activeTab === 'WITHDRAWALS' && (
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Controlled Coin Withdrawal Queue</h3>
              <p className="text-xs text-slate-400">
                Redemption Threshold: 500,000 Coins = ₹100 INR. Rejected requests automatically refund coins back to the player wallet.
              </p>
            </div>

            {withdrawalRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No withdrawal requests placed yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {withdrawalRequests.map(wdr => (
                  <div key={wdr.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-200">{wdr.id}</span>
                        <span className="text-xs text-slate-400">by <strong>{wdr.playerName}</strong> ({wdr.playerId})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            wdr.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : wdr.status === 'APPROVED'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                              : wdr.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {wdr.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs mt-1">
                        <span className="font-mono font-bold text-amber-400">
                          🪙 {wdr.coinsRequested.toLocaleString()} Coins
                        </span>
                        <span className="font-bold text-emerald-400">
                          ₹{wdr.currencyValue} INR
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Submitted: {new Date(wdr.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {wdr.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          Notes: {wdr.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {wdr.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => adminApproveWithdrawal(wdr.id)}
                            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => adminRejectWithdrawal(wdr.id)}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs border border-rose-500/30"
                          >
                            Reject & Refund
                          </button>
                        </>
                      )}

                      {wdr.status === 'APPROVED' && (
                        <button
                          onClick={() => adminCompleteWithdrawal(wdr.id, 'Disbursed via prototype audit ledger')}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. TRANSACTION AUDIT LEDGER TAB */}
        {/* ======================================================== */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Coin Operations Audit Ledger</h3>
              <p className="text-xs text-slate-400">
                Immutable record of all coin transfers, match entry fees, rewards, redemptions, and admin adjustments.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1329] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Txn ID</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Player</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Player Bal (Before → After)</th>
                    <th className="p-3">Admin Bal</th>
                    <th className="p-3">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono font-bold text-slate-300">{txn.id}</td>
                      <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(txn.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            txn.type === 'ADMIN_ADD' || txn.type === 'MATCH_REWARD' || txn.type === 'USER_REQUEST'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : txn.type === 'ADMIN_DEDUCT' || txn.type === 'MATCH_ENTRY'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-200">
                        {txn.playerName} <span className="text-slate-400 font-mono">({txn.playerId})</span>
                      </td>
                      <td className="p-3 font-mono font-black text-amber-400">
                        {txn.amount.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {txn.previousPlayerBalance.toLocaleString()} → <strong className="text-slate-200">{txn.newPlayerBalance.toLocaleString()}</strong>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {txn.newAdminBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {txn.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. SUSPENSION RECORDS TAB */}
        {/* ======================================================== */}
        {activeTab === 'SUSPENSIONS' && (
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Suspension Audit Log</h3>
              <p className="text-xs text-slate-400">
                Log of all player account suspensions and reinstatements.
              </p>
            </div>

            {suspensions.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No account suspensions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {suspensions.map(s => (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.action === 'SUSPEND' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {s.action}
                        </span>
                        <span className="font-mono font-bold text-cyan-400">{s.playerId}</span>
                        <span className="text-slate-400">by Admin {s.adminId}</span>
                      </div>
                      <p className="text-slate-300 mt-1">Reason: {s.reason}</p>
                      <span className="text-[10px] text-slate-500">{new Date(s.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: ADD / DEDUCT COINS */}
      {coinActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              {coinActionTarget.type === 'ADD' ? (
                <>
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <span>Credit Player Coins (Admin Wallet)</span>
                </>
              ) : (
                <>
                  <MinusCircle className="w-5 h-5 text-rose-400" />
                  <span>Deduct Player Coins</span>
                </>
              )}
            </h3>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-300">
                Target: <strong>{coinActionTarget.player.name}</strong> ({coinActionTarget.player.playerId})
              </p>
              <p className="text-slate-400 font-mono">
                Current Balance: 🪙 {coinActionTarget.player.coins.toLocaleString()} Coins
              </p>
              {coinActionTarget.type === 'ADD' && (
                <p className="text-amber-400 font-mono text-[11px]">
                  Admin Wallet Available: 🪙 {adminWallet.toLocaleString()}
                </p>
              )}
            </div>

            {actionError && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs">
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleCoinSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Amount
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[5000, 25000, 100000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCoinAmount(val)}
                      className={`py-1 rounded text-xs font-mono font-bold border transition-colors ${
                        coinAmount === val
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      +{val >= 1000 ? `${val / 1000}K` : val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={e => setCoinAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Audit Reason / Justification
                </label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={e => setCoinReason(e.target.value)}
                  placeholder="e.g. VIP tournament bonus / adjustment"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCoinActionTarget(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow ${
                    coinActionTarget.type === 'ADD'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  Execute Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUSPEND PLAYER */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-rose-500/40 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider">
                Suspend Player Account
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Player <strong>{suspendTarget.name}</strong> ({suspendTarget.playerId}) will be barred from matchmaking and playing matches.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Reason for Suspension
              </label>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendConfirm}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
