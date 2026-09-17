import React, { useState, useMemo } from 'react';
import {
  Users,
  Coins,
  Search,
  Clock,
  ArrowDownCircle,
  Trophy,
  ShieldAlert,
  Wallet,
  Activity,
  PlusCircle,
  MinusCircle,
  Ban,
  RotateCcw,
  Eye,
  CheckCircle2,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../../components/Header';
import { UserProfile } from '../../types';
import { AdminLayout, AdminTab } from '../../layouts/AdminLayout';
import { PlayerDetailsModal } from './PlayerDetailsModal';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  const {
    adminUser,
    adminWallet,
    allUsers,
    coinRequests,
    withdrawalRequests,
    transactions,
    suspensions,
    matches,
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

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // Player search & pagination
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerFilter, setPlayerFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [playerPage, setPlayerPage] = useState(1);
  const PLAYERS_PER_PAGE = 10;

  // Selected player for details modal
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<UserProfile | null>(null);

  // Modal State for Coin Add/Deduct
  const [coinActionTarget, setCoinActionTarget] = useState<{ player: UserProfile; type: 'ADD' | 'DEDUCT' } | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(10000);
  const [coinReason, setCoinReason] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Dedicated Coin Management Form State
  const [managePlayerId, setManagePlayerId] = useState('');
  const [manageActionType, setManageActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [manageAmount, setManageAmount] = useState<number>(50000);
  const [manageReason, setManageReason] = useState('');
  const [manageStatusMessage, setManageStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State for Player Suspension
  const [suspendTarget, setSuspendTarget] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('Fair play violation');

  // Transactions Search & Filter
  const [txnSearch, setTxnSearch] = useState('');
  const [txnFilter, setTxnFilter] = useState<string>('ALL');
  const [txnPage, setTxnPage] = useState(1);
  const TXNS_PER_PAGE = 15;

  // Overview metrics
  const totalCirculatingCoins = allUsers.reduce((sum, u) => sum + (u.coins || 0), 0);
  const pendingCoinRequests = coinRequests.filter(r => r.status === 'PENDING');
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'PENDING');
  const suspendedPlayersList = allUsers.filter(u => u.status === 'SUSPENDED' || u.isBlocked);
  const suspendedCount = suspendedPlayersList.length;

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    return allUsers.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.playerId.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q));

      if (playerFilter === 'ACTIVE') return matchesSearch && p.status !== 'SUSPENDED' && !p.isBlocked;
      if (playerFilter === 'SUSPENDED') return matchesSearch && (p.status === 'SUSPENDED' || p.isBlocked);
      return matchesSearch;
    });
  }, [allUsers, playerSearch, playerFilter]);

  const totalPlayerPages = Math.max(1, Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE));
  const paginatedPlayers = filteredPlayers.slice(
    (playerPage - 1) * PLAYERS_PER_PAGE,
    playerPage * PLAYERS_PER_PAGE
  );

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const q = txnSearch.trim().toLowerCase();
    return transactions.filter(t => {
      const matchesSearch =
        t.id.toLowerCase().includes(q) ||
        t.playerId.toLowerCase().includes(q) ||
        t.playerName.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q);

      if (txnFilter !== 'ALL') {
        return matchesSearch && t.type === txnFilter;
      }
      return matchesSearch;
    });
  }, [transactions, txnSearch, txnFilter]);

  const totalTxnPages = Math.max(1, Math.ceil(filteredTransactions.length / TXNS_PER_PAGE));
  const paginatedTxns = filteredTransactions.slice(
    (txnPage - 1) * TXNS_PER_PAGE,
    txnPage * TXNS_PER_PAGE
  );

  // Handlers
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
      const res = adminAddCoinsToPlayer(
        coinActionTarget.player.playerId,
        coinAmount,
        coinReason || 'Administrative Credit'
      );
      if (!res.success) {
        setActionError(res.error || 'Failed to add coins.');
      } else {
        setActionSuccess(`Successfully added ${coinAmount.toLocaleString()} coins to ${coinActionTarget.player.name}.`);
        setTimeout(() => setCoinActionTarget(null), 1200);
      }
    } else {
      const res = adminDeductCoinsFromPlayer(
        coinActionTarget.player.playerId,
        coinAmount,
        coinReason || 'Administrative Debit'
      );
      if (!res.success) {
        setActionError(res.error || 'Failed to deduct coins.');
      } else {
        setActionSuccess(`Successfully deducted ${coinAmount.toLocaleString()} coins from ${coinActionTarget.player.name}.`);
        setTimeout(() => setCoinActionTarget(null), 1200);
      }
    }
  };

  const handleDedicatedCoinManagement = (e: React.FormEvent) => {
    e.preventDefault();
    setManageStatusMessage(null);

    const target = allUsers.find(
      u => u.playerId.trim().toUpperCase() === managePlayerId.trim().toUpperCase()
    );

    if (!target) {
      setManageStatusMessage({ type: 'error', text: `Player ID "${managePlayerId}" not found in system.` });
      return;
    }

    if (manageAmount <= 0) {
      setManageStatusMessage({ type: 'error', text: 'Amount must be greater than 0.' });
      return;
    }

    if (manageActionType === 'ADD') {
      const res = adminAddCoinsToPlayer(
        target.playerId,
        manageAmount,
        manageReason || 'Administrative Direct Credit'
      );
      if (!res.success) {
        setManageStatusMessage({ type: 'error', text: res.error || 'Operation failed.' });
      } else {
        setManageStatusMessage({
          type: 'success',
          text: `Success: Transferred ${manageAmount.toLocaleString()} Coins to ${target.name} (${target.playerId}).`
        });
        setManageAmount(50000);
        setManageReason('');
      }
    } else {
      const res = adminDeductCoinsFromPlayer(
        target.playerId,
        manageAmount,
        manageReason || 'Administrative Direct Debit'
      );
      if (!res.success) {
        setManageStatusMessage({ type: 'error', text: res.error || 'Operation failed.' });
      } else {
        setManageStatusMessage({
          type: 'success',
          text: `Success: Deducted ${manageAmount.toLocaleString()} Coins from ${target.name} (${target.playerId}) and returned to Admin Reservoir.`
        });
        setManageAmount(50000);
        setManageReason('');
      }
    }
  };

  const handleSuspendConfirm = () => {
    if (!suspendTarget) return;
    adminSuspendPlayer(suspendTarget.playerId, suspendReason);
    setSuspendTarget(null);
  };

  if (!adminUser) return null;

  return (
    <AdminLayout
      adminUser={adminUser}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLogout={onLogout}
      adminWalletBalance={adminWallet}
      pendingRequestsCount={pendingCoinRequests.length}
      pendingWithdrawalsCount={pendingWithdrawals.length}
      suspendedCount={suspendedCount}
    >
      {/* ======================================================== */}
      {/* 1. OVERVIEW TAB */}
      {/* ======================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Players */}
            <div
              onClick={() => setActiveTab('PLAYERS')}
              className="bg-[#0F172A] border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 cursor-pointer transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Registered Players
                </span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black text-slate-100">{allUsers.length}</span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {allUsers.length - suspendedCount} active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {suspendedCount} suspended
              </p>
            </div>

            {/* Admin Wallet */}
            <div
              onClick={() => setActiveTab('WALLET')}
              className="bg-[#0F172A] border border-amber-500/30 hover:border-amber-400 rounded-2xl p-4 cursor-pointer transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                  Admin Reservoir
                </span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-1.5 font-mono">
                <span className="text-2xl font-black text-amber-300">
                  {adminWallet.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">Coins</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Starting: 1,000,000 Coins
              </p>
            </div>

            {/* Pending Requests */}
            <div
              onClick={() => setActiveTab('COIN_REQUESTS')}
              className="bg-[#0F172A] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 cursor-pointer transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pending Coin Requests
                </span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black text-slate-100">
                  {pendingCoinRequests.length}
                </span>
                <span className="text-[11px] text-amber-400 font-bold">
                  Review queue
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {coinRequests.length} total submitted
              </p>
            </div>

            {/* Pending Withdrawals */}
            <div
              onClick={() => setActiveTab('WITHDRAWALS')}
              className="bg-[#0F172A] border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 cursor-pointer transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Withdrawal Queue
                </span>
                <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black text-slate-100">
                  {pendingWithdrawals.length}
                </span>
                <span className="text-[11px] text-cyan-400 font-bold">
                  500k = ₹100
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {withdrawalRequests.length} all-time redemptions
              </p>
            </div>
          </div>

          {/* Quick Action Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Coin Transfer Box */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                <Coins className="w-4 h-4" />
                <span>Quick Coin Adjustment</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add coins to player from Admin Wallet, or deduct from player back into the Admin Wallet.
              </p>
              <form onSubmit={handleDedicatedCoinManagement} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                    Player ID
                  </label>
                  <input
                    type="text"
                    value={managePlayerId}
                    onChange={e => setManagePlayerId(e.target.value)}
                    placeholder="e.g. PLY88412"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-400 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManageActionType('ADD')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      manageActionType === 'ADD'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    + Add Coins
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageActionType('DEDUCT')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      manageActionType === 'DEDUCT'
                        ? 'bg-slate-800 text-slate-100 border border-purple-500/40 shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    - Deduct Coins
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                    Amount (Coins)
                  </label>
                  <input
                    type="number"
                    value={manageAmount}
                    onChange={e => setManageAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-purple-400"
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                    Audit Reason
                  </label>
                  <input
                    type="text"
                    value={manageReason}
                    onChange={e => setManageReason(e.target.value)}
                    placeholder="Reason for adjustment..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {manageStatusMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs ${
                      manageStatusMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {manageStatusMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-purple-600/20"
                >
                  Execute Atomic Transfer
                </button>
              </form>
            </div>

            {/* Pending Withdrawals Quick Review */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Pending Withdrawals ({pendingWithdrawals.length})</span>
                </div>
                <button
                  onClick={() => setActiveTab('WITHDRAWALS')}
                  className="text-xs text-purple-400 hover:underline font-bold"
                >
                  View All
                </button>
              </div>

              {pendingWithdrawals.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No pending withdrawal redemptions in queue.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {pendingWithdrawals.slice(0, 4).map(w => (
                    <div
                      key={w.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{w.playerName}</p>
                        <p className="text-[11px] text-cyan-400 font-mono">
                          🪙 {w.coinsRequested.toLocaleString()} Coins (₹{w.currencyValue} INR)
                        </p>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => adminApproveWithdrawal(w.id)}
                          className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => adminRejectWithdrawal(w.id)}
                          className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Coin Activity Feed */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Recent Coin Movements</span>
                </div>
                <button
                  onClick={() => setActiveTab('TRANSACTIONS')}
                  className="text-xs text-purple-400 hover:underline font-bold"
                >
                  Ledger
                </button>
              </div>

              {transactions.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No coin transactions recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.slice(0, 5).map(t => (
                    <div
                      key={t.id}
                      className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-200">{t.playerName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({t.playerId})</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{t.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-300">
                          🪙 {t.amount.toLocaleString()}
                        </span>
                        <p className="text-[9px] text-slate-500">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PLAYERS DIRECTORY TAB */}
      {/* ======================================================== */}
      {activeTab === 'PLAYERS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls: Search & Filters */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={playerSearch}
                onChange={e => {
                  setPlayerSearch(e.target.value);
                  setPlayerPage(1);
                }}
                placeholder="Search by Player ID, Name, Phone, or Email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => {
                    setPlayerFilter(flt);
                    setPlayerPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    playerFilter === flt
                      ? 'bg-purple-600 text-white shadow'
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
                    <th className="p-3.5">Player Details</th>
                    <th className="p-3.5">Player ID</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Coins Balance</th>
                    <th className="p-3.5">Matches (W/L)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginatedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No registered players match your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPlayers.map(p => {
                      const isSusp = p.status === 'SUSPENDED' || p.isBlocked;
                      const winRate = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                          onClick={() => setSelectedPlayerForModal(p)}
                        >
                          <td className="p-3.5">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${AVATAR_COLORS[p.avatarId % AVATAR_COLORS.length]}`}>
                                {AVATAR_EMOJIS[p.avatarId % AVATAR_EMOJIS.length]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-200 hover:text-purple-300 transition-colors">
                                  {p.name}
                                </p>
                                {p.email && <p className="text-[10px] text-slate-400">{p.email}</p>}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-cyan-400">
                            {p.playerId}
                          </td>

                          <td className="p-3.5 text-slate-400">
                            {p.phone || 'N/A'}
                          </td>

                          <td className="p-3.5 font-mono font-black text-amber-400">
                            🪙 {p.coins.toLocaleString()}
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-slate-200">{p.matchesPlayed}</span>
                            <span className="text-slate-400 text-[11px] ml-1">
                              ({p.wins}W / {p.losses}L • {winRate}%)
                            </span>
                          </td>

                          <td className="p-3.5">
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

                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>

                          <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* View Details Button */}
                              <button
                                onClick={() => setSelectedPlayerForModal(p)}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-colors"
                                title="View Full Player Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

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
                                title="Add Coins to Player"
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
                                title="Deduct Coins from Player"
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

            {/* Pagination Controls */}
            {totalPlayerPages > 1 && (
              <div className="bg-[#0B1329] border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {playerPage} of {totalPlayerPages} ({filteredPlayers.length} players)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={playerPage <= 1}
                    onClick={() => setPlayerPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={playerPage >= totalPlayerPages}
                    onClick={() => setPlayerPage(prev => Math.min(totalPlayerPages, prev + 1))}
                    className="p-1.5 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. COIN MANAGEMENT DEDICATED TAB */}
      {/* ======================================================== */}
      {activeTab === 'COINS' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Administrative Coin Operations</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Perform atomic transfers between the centralized Admin Coin Reservoir and any registered Player ID.
              </p>
            </div>

            {/* Balance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Admin Wallet Balance
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-2xl font-black font-mono text-amber-300">
                    {adminWallet.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Available for distribution</p>
              </div>

              <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Player Circulating Coins
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-black font-mono text-purple-300">
                    {totalCirculatingCoins.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Across all registered user wallets</p>
              </div>
            </div>

            {/* Transfer Tool */}
            <form onSubmit={handleDedicatedCoinManagement} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Select Player by ID or Username
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={managePlayerId}
                    onChange={e => setManagePlayerId(e.target.value)}
                    placeholder="Enter Player ID (e.g. PLY88412)..."
                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-cyan-400 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    required
                  />
                  <select
                    onChange={e => {
                      if (e.target.value) setManagePlayerId(e.target.value);
                    }}
                    className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Quick Pick Player...</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.playerId}>
                        {u.name} ({u.playerId}) - 🪙 {u.coins.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setManageActionType('ADD')}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    manageActionType === 'ADD'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>ADD COINS (Admin → Player)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManageActionType('DEDUCT')}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                    manageActionType === 'DEDUCT'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>DEDUCT COINS (Player → Admin)</span>
                </button>
              </div>

              {/* Amount and presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Amount to Transfer
                </label>
                <input
                  type="number"
                  value={manageAmount}
                  onChange={e => setManageAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-purple-400"
                  min={1}
                  required
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {[10000, 25000, 50000, 100000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setManageAmount(amt)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Audit Reason / Justification
                </label>
                <input
                  type="text"
                  value={manageReason}
                  onChange={e => setManageReason(e.target.value)}
                  placeholder="e.g. VIP Bonus, Match Dispute Correction, Refund..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {manageStatusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    manageStatusMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {manageStatusMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30"
              >
                Confirm & Record Atomic Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. COIN TRANSACTIONS LEDGER TAB */}
      {/* ======================================================== */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Filter Bar */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={txnSearch}
                onChange={e => {
                  setTxnSearch(e.target.value);
                  setTxnPage(1);
                }}
                placeholder="Search Txn ID, Player ID, Player Name, or Reason..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={txnFilter}
                onChange={e => {
                  setTxnFilter(e.target.value);
                  setTxnPage(1);
                }}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="ADMIN_ADD">ADMIN_ADD</option>
                <option value="ADMIN_DEDUCT">ADMIN_DEDUCT</option>
                <option value="MATCH_ENTRY">MATCH_ENTRY</option>
                <option value="MATCH_REWARD">MATCH_REWARD</option>
                <option value="USER_REQUEST">USER_REQUEST</option>
                <option value="WITHDRAWAL_LOCK">WITHDRAWAL_LOCK</option>
                <option value="WITHDRAWAL_REFUND">WITHDRAWAL_REFUND</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1329] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Txn ID</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Player</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Player Bal (Before → After)</th>
                    <th className="p-3.5">Admin Bal</th>
                    <th className="p-3.5">Audit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginatedTxns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedTxns.map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-900/50">
                        <td className="p-3.5 font-mono font-bold text-slate-300">
                          {txn.id}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(txn.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              txn.type === 'ADMIN_ADD' || txn.type === 'MATCH_REWARD' || txn.type === 'USER_REQUEST'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : txn.type === 'ADMIN_DEDUCT' || txn.type === 'MATCH_ENTRY'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {txn.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">
                          {txn.playerName} <span className="text-slate-400 font-mono text-[11px]">({txn.playerId})</span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-amber-400">
                          🪙 {txn.amount.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {txn.previousPlayerBalance.toLocaleString()} → <strong className="text-slate-200">{txn.newPlayerBalance.toLocaleString()}</strong>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {txn.newAdminBalance.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                          {txn.reason}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Txn Pagination */}
            {totalTxnPages > 1 && (
              <div className="bg-[#0B1329] border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {txnPage} of {totalTxnPages} ({filteredTransactions.length} records)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={txnPage <= 1}
                    onClick={() => setTxnPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={txnPage >= totalTxnPages}
                    onClick={() => setTxnPage(prev => Math.min(totalTxnPages, prev + 1))}
                    className="p-1.5 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. COIN REQUESTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'COIN_REQUESTS' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Player Coin Requests Queue</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Approve or reject coin requests submitted from the player application. Approved packages transfer coins from the Admin Wallet ({adminWallet.toLocaleString()} available).
            </p>
          </div>

          {coinRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No coin requests submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {coinRequests.map(req => (
                <div key={req.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200 text-sm">{req.playerName}</span>
                      <span className="font-mono text-cyan-400 text-xs font-bold">({req.playerId})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-amber-300 font-bold mt-1">
                      🪙 {req.amount.toLocaleString()} Coins Requested
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Submitted: {new Date(req.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adminApproveCoinRequest(req.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/20"
                      >
                        Approve & Disburse
                      </button>
                      <button
                        onClick={() => adminRejectCoinRequest(req.id)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold rounded-xl text-xs transition-colors border border-slate-700"
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
      {/* 6. WITHDRAWALS TAB */}
      {/* ======================================================== */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
              <ArrowDownCircle className="w-5 h-5 text-cyan-400" />
              <span>Controlled Coin Withdrawal Queue</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Redemption Exchange Standard: <strong>500,000 Coins = ₹100 INR</strong>. Minimum redemption is 500,000 Coins. Rejections automatically refund escrowed coins back to the player wallet.
            </p>
          </div>

          {withdrawalRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No withdrawal redemption requests placed yet.</p>
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

                    <div className="flex items-center space-x-3 text-xs mt-1.5">
                      <span className="font-mono font-bold text-amber-300">
                        🪙 {wdr.coinsRequested.toLocaleString()} Coins
                      </span>
                      <span className="font-bold text-emerald-400">
                        ₹{wdr.currencyValue} INR
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Placed: {new Date(wdr.createdAt).toLocaleString()}
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
                          className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-cyan-500/20"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => adminRejectWithdrawal(wdr.id)}
                          className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs border border-rose-500/40 transition-colors"
                        >
                          Reject & Refund
                        </button>
                      </>
                    )}

                    {wdr.status === 'APPROVED' && (
                      <button
                        onClick={() => adminCompleteWithdrawal(wdr.id, 'Disbursed via prototype audit ledger')}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/20"
                      >
                        Mark as Paid / Completed
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
      {/* 7. MATCHES AUDIT TAB */}
      {/* ======================================================== */}
      {activeTab === 'MATCHES' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <span>Multiplayer Pool Matches Audit</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Historical record of all 4-player online matches, private matches, stakes, and prize distributions.
            </p>
          </div>

          {matches.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No pool match records captured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1329] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Match ID</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Mode</th>
                    <th className="p-3.5">Entry Fee / Stakes</th>
                    <th className="p-3.5">Winner / Result</th>
                    <th className="p-3.5">Participants / Opponents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {matches.map(m => (
                    <tr key={m.id} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-mono font-bold text-cyan-400">{m.id}</td>
                      <td className="p-3.5 text-slate-400">{new Date(m.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-slate-200">{m.mode}</td>
                      <td className="p-3.5 font-mono font-bold text-amber-300">
                        🪙 {m.entryFee.toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            m.result === 'WIN'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {m.result} (+{m.coinsDelta.toLocaleString()})
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-sm truncate">{m.opponents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. SUSPENDED USERS TAB */}
      {/* ======================================================== */}
      {activeTab === 'SUSPENSIONS' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>Suspended Player Accounts ({suspendedCount})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Suspended players are strictly blocked from matchmaking, 4-player online matches, private tables, and friend invitations.
              </p>
            </div>
          </div>

          {suspendedPlayersList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-300">No active suspensions</p>
              <p className="text-[11px] text-slate-500 mt-0.5">All registered accounts are currently in good standing.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {suspendedPlayersList.map(sp => {
                const suspRecord = suspensions.find(s => s.playerId === sp.playerId);
                return (
                  <div key={sp.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200 text-sm">{sp.name}</span>
                        <span className="font-mono text-cyan-400 text-xs font-bold">({sp.playerId})</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          SUSPENDED
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Reason: <strong className="text-rose-300">{suspRecord?.reason || 'Fair play policy violation'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Suspended at: {suspRecord ? new Date(suspRecord.timestamp).toLocaleString() : 'Recent'} • Balance: 🪙 {sp.coins.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => adminUnsuspendPlayer(sp.playerId)}
                      className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Unsuspend & Restore Access</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. ADMIN WALLET TAB */}
      {/* ======================================================== */}
      {activeTab === 'WALLET' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
          <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>Admin Coin Reservoir Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The central administrative liquidity pool for 8BALL PRO game coin circulation.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Current Reservoir Balance
              </span>
              <div className="flex items-center justify-center space-x-2 my-2">
                <Coins className="w-8 h-8 text-yellow-400" />
                <span className="text-4xl font-black font-mono text-amber-300">
                  {adminWallet.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">Coins</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Starting Baseline: 1,000,000 Coins • Circulating in economy: {totalCirculatingCoins.toLocaleString()} Coins
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Outflow & Inflow Rules</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Admin adds coins → Transferred from Reservoir to player.</li>
                  <li>Admin deducts coins → Deducted from player and returned to Reservoir.</li>
                  <li>Coin package approval → Deducted from Reservoir to player.</li>
                </ul>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Security & Integrity</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>All adjustments execute via atomic Firestore transactions.</li>
                  <li>Every movement produces an immutable ledger transaction record.</li>
                  <li>Zero browser-side balance manipulation is permitted.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('COINS')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-purple-600/20"
            >
              Open Direct Coin Adjustment Tool
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. ACTIVITY / TRANSACTION LOGS TAB */}
      {/* ======================================================== */}
      {activeTab === 'LOGS' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span>Unified System & Administrative Audit Logs</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Chronological log of administrative actions, player registrations, coin transactions, and policy events.
            </p>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {transactions.map((txn, idx) => (
              <div
                key={txn.id || idx}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-start justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{txn.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{txn.id}]</span>
                    <span className="text-[10px] text-emerald-400 font-bold">BY: {txn.adminId}</span>
                  </div>
                  <p className="text-slate-300">
                    Target: <strong>{txn.playerName}</strong> ({txn.playerId}) — {txn.reason}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Timestamp: {new Date(txn.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-amber-300 font-bold">🪙 {txn.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PLAYER DETAILS MODAL */}
      {/* ======================================================== */}
      <PlayerDetailsModal
        player={selectedPlayerForModal}
        onClose={() => setSelectedPlayerForModal(null)}
        onAddCoins={p => {
          setSelectedPlayerForModal(null);
          setCoinActionTarget({ player: p, type: 'ADD' });
          setCoinAmount(10000);
          setCoinReason('');
          setActionError(null);
          setActionSuccess(null);
        }}
        onDeductCoins={p => {
          setSelectedPlayerForModal(null);
          setCoinActionTarget({ player: p, type: 'DEDUCT' });
          setCoinAmount(10000);
          setCoinReason('');
          setActionError(null);
          setActionSuccess(null);
        }}
        onSuspend={p => {
          setSelectedPlayerForModal(null);
          setSuspendTarget(p);
          setSuspendReason('Fair play / Anti-fraud policy violation');
        }}
        onUnsuspend={playerId => {
          adminUnsuspendPlayer(playerId);
          if (selectedPlayerForModal && selectedPlayerForModal.playerId === playerId) {
            setSelectedPlayerForModal(prev => prev ? { ...prev, status: 'ACTIVE', isBlocked: false } : null);
          }
        }}
        transactions={transactions}
        matches={matches}
      />

      {/* ======================================================== */}
      {/* MODAL 2: COIN ADJUSTMENT MODAL */}
      {/* ======================================================== */}
      {coinActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-purple-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-100">
              {coinActionTarget.type === 'ADD' ? 'Add Coins to' : 'Deduct Coins from'} {coinActionTarget.player.name}
            </h3>
            <p className="text-xs text-slate-400">
              Player ID: <strong className="text-cyan-400 font-mono">{coinActionTarget.player.playerId}</strong> • Current Bal: <strong className="text-amber-400 font-mono">🪙 {coinActionTarget.player.coins.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleCoinSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={e => setCoinAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-purple-400"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={e => setCoinReason(e.target.value)}
                  placeholder="e.g. Compensation, tournament prize..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {actionError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                  {actionSuccess}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCoinActionTarget(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-purple-600/20"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PLAYER SUSPENSION MODAL */}
      {/* ======================================================== */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-rose-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Suspend Player Account</span>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to suspend <strong>{suspendTarget.name}</strong> ({suspendTarget.playerId})?
            </p>
            <p className="text-[11px] text-slate-400">
              Suspended players are barred from matchmaking, 4-player games, private matches, and invitations until reinstated.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">
                Suspension Reason
              </label>
              <input
                type="text"
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-rose-600/20"
              >
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
