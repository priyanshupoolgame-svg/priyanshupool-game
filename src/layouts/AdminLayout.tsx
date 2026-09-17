import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Coins,
  FileText,
  Clock,
  ArrowDownCircle,
  Trophy,
  ShieldAlert,
  Wallet,
  Activity,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AdminUser } from '../types';

export type AdminTab =
  | 'OVERVIEW'
  | 'PLAYERS'
  | 'COINS'
  | 'TRANSACTIONS'
  | 'COIN_REQUESTS'
  | 'WITHDRAWALS'
  | 'MATCHES'
  | 'SUSPENSIONS'
  | 'WALLET'
  | 'LOGS';

interface AdminLayoutProps {
  adminUser: AdminUser;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  adminWalletBalance: number;
  pendingRequestsCount: number;
  pendingWithdrawalsCount: number;
  suspendedCount: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  adminUser,
  activeTab,
  onSelectTab,
  onLogout,
  adminWalletBalance,
  pendingRequestsCount,
  pendingWithdrawalsCount,
  suspendedCount,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{
    tab: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      tab: 'OVERVIEW',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      tab: 'PLAYERS',
      label: 'Players Directory',
      icon: <Users className="w-4 h-4" />
    },
    {
      tab: 'COINS',
      label: 'Coin Management',
      icon: <Coins className="w-4 h-4" />
    },
    {
      tab: 'TRANSACTIONS',
      label: 'Coin Transactions',
      icon: <FileText className="w-4 h-4" />
    },
    {
      tab: 'COIN_REQUESTS',
      label: 'Coin Requests',
      icon: <Clock className="w-4 h-4" />,
      badge: pendingRequestsCount,
      badgeColor: 'bg-amber-500 text-slate-950'
    },
    {
      tab: 'WITHDRAWALS',
      label: 'Withdrawals Queue',
      icon: <ArrowDownCircle className="w-4 h-4" />,
      badge: pendingWithdrawalsCount,
      badgeColor: 'bg-cyan-500 text-slate-950'
    },
    {
      tab: 'MATCHES',
      label: 'Matches Audit',
      icon: <Trophy className="w-4 h-4" />
    },
    {
      tab: 'SUSPENSIONS',
      label: 'Suspended Users',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: suspendedCount,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      tab: 'WALLET',
      label: 'Admin Wallet',
      icon: <Wallet className="w-4 h-4" />
    },
    {
      tab: 'LOGS',
      label: 'Activity Logs',
      icon: <Activity className="w-4 h-4" />
    }
  ];

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-[#0F172A] border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-slate-100 uppercase">8BALL PRO ADMIN</h1>
            <p className="text-[10px] text-purple-400 font-mono">ID: {adminUser.adminId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-mono text-amber-300 font-bold">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{adminWalletBalance.toLocaleString()}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-30 h-screen w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black tracking-wider text-slate-100 uppercase">ADMIN PORTAL</h2>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">System Online</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Identity Card */}
          <div className="bg-slate-900/90 border border-purple-500/20 rounded-xl p-3 mb-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged In As</span>
              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                SUPER ADMIN
              </span>
            </div>
            <p className="font-bold text-slate-200 text-xs truncate">{adminUser.name}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Admin ID:</span>
              <strong className="text-purple-300">{adminUser.adminId}</strong>
            </div>
          </div>

          {/* Admin Wallet Quick Widget */}
          <div
            onClick={() => handleTabClick('WALLET')}
            className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-xl p-3 mb-5 cursor-pointer hover:border-amber-400/50 transition-colors"
          >
            <span className="text-[10px] font-bold text-amber-400/80 tracking-wider uppercase block">
              Admin Coin Reservoir
            </span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-base font-black font-mono text-amber-300">
                {adminWalletBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1.5 block">
              MANAGEMENT MODULES
            </span>
            {navItems.map(item => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleTabClick(item.tab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                        item.badgeColor || 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Logout */}
          <div className="pt-4 mt-auto border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Admin Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* DESKTOP TOP HEADER */}
        <header className="hidden md:flex bg-[#0F172A] border-b border-slate-800 px-6 py-3 items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-black text-slate-100 tracking-wide uppercase">
              {navItems.find(i => i.tab === activeTab)?.label || 'Admin Portal'}
            </h2>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              8-Ball Pro Multiplayer Administration
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Admin Reservoir */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Admin Wallet</span>
                <span className="text-xs font-black font-mono text-amber-300">
                  {adminWalletBalance.toLocaleString()} Coins
                </span>
              </div>
            </div>

            {/* Sync Status */}
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Real-Time Sync</span>
            </div>

            {/* Quick Logout */}
            <button
              onClick={onLogout}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-colors"
              title="Logout Administrator Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* VIEW BODY */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
