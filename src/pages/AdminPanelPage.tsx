import React, { useState } from 'react';
import { ArrowLeft, Users, Coins, History, Check, X, Ban, Shield } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface AdminPanelPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ onNavigate }) => {
  const {
    allUsers,
    coinRequests,
    matches,
    adminApproveCoinRequest,
    adminRejectCoinRequest,
    adminAdjustCoins,
    adminToggleBlockUser
  } = useGame();

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'PLAYERS' | 'MATCHES'>('REQUESTS');

  const totalCoins = allUsers.reduce((sum, u) => sum + u.coins, 0);
  const pendingRequests = coinRequests.filter(r => r.status === 'PENDING');

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={() => onNavigate('/')}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-1.5">
            <span>Admin Architecture Console</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </h1>
          <p className="text-xs text-slate-400">8BALL PRO Management & Telemetry</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>TOTAL PLAYERS</span>
          </div>
          <p className="text-lg font-black text-slate-100 mt-1">{allUsers.length}</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>COINS IN CIRCULATION</span>
          </div>
          <p className="text-sm font-black font-mono text-amber-400 mt-1 truncate">
            🪙 {totalCoins.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>MATCH AUDIT LOGS</span>
          </div>
          <p className="text-lg font-black text-slate-100 mt-1">{matches.length}</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-bold">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            <span>PENDING REQUESTS</span>
          </div>
          <p className="text-lg font-black text-purple-400 mt-1">{pendingRequests.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0F172A] border border-slate-800 rounded-xl p-1 mb-4">
        {(['REQUESTS', 'PLAYERS', 'MATCHES'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto space-y-2.5">
        {activeTab === 'REQUESTS' && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">
              COIN REQUESTS ({coinRequests.length})
            </h3>
            {coinRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No coin requests in database.</p>
            ) : (
              <div className="space-y-2">
                {coinRequests.map(req => (
                  <div
                    key={req.id}
                    className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-100">{req.playerName} ({req.playerId})</p>
                        <span className="font-mono text-amber-400 font-bold">+{req.amount.toLocaleString()} Coins</span>
                      </div>
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

                    {req.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => adminApproveCoinRequest(req.id, req.playerId, req.amount)}
                          className="py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Credit</span>
                        </button>
                        <button
                          onClick={() => adminRejectCoinRequest(req.id)}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold rounded-lg text-xs flex items-center justify-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'PLAYERS' && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">
              REGISTERED PLAYERS ({allUsers.length})
            </h3>
            <div className="space-y-2">
              {allUsers.map(p => (
                <div
                  key={p.id}
                  className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100">{p.name}</h4>
                      <p className="font-mono text-slate-400 text-[11px]">ID: {p.playerId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-amber-400 font-bold">🪙 {p.coins.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400">{p.wins}W / {p.losses}L</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div className="space-x-1">
                      <button
                        onClick={() => adminAdjustCoins(p.id, p.coins + 10000)}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded text-[11px]"
                      >
                        +10K
                      </button>
                      <button
                        onClick={() => adminAdjustCoins(p.id, Math.max(0, p.coins - 10000))}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[11px]"
                      >
                        -10K
                      </button>
                    </div>

                    <button
                      onClick={() => adminToggleBlockUser(p.id, !p.isBlocked)}
                      className={`py-1 px-2.5 rounded text-[11px] font-bold flex items-center space-x-1 ${
                        p.isBlocked
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{p.isBlocked ? 'Blocked' : 'Block User'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'MATCHES' && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">
              MATCH AUDIT RECORDS ({matches.length})
            </h3>
            {matches.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No matches recorded in audit log yet.</p>
            ) : (
              <div className="space-y-2">
                {matches.map(m => (
                  <div
                    key={m.id}
                    className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-xs space-y-1 font-mono"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-cyan-400">{m.matchId}</span>
                      <span className={m.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.result} ({m.coinsDelta > 0 ? `+${m.coinsDelta}` : m.coinsDelta})
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate">Opponents: {m.opponents}</p>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Stake: 🪙 {m.entryFee.toLocaleString()}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
