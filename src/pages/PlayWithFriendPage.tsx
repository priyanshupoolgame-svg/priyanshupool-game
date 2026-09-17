import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Send, PlusCircle, Mail } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface PlayWithFriendPageProps {
  onNavigate: (route: string) => void;
}

export const PlayWithFriendPage: React.FC<PlayWithFriendPageProps> = ({ onNavigate }) => {
  const { user, invitations, sendFriendInvite, acceptFriendInvite, rejectFriendInvite, createPrivateRoom } = useGame();
  const [targetId, setTargetId] = useState('');
  const [selectedFee, setSelectedFee] = useState(5000);
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  if (!user) return null;

  const pendingInvites = invitations.filter(i => i.status === 'PENDING' && i.toPlayerId === user.playerId);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.playerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    sendFriendInvite(targetId.trim().toUpperCase(), selectedFee);
    setSentNotice(`Invitation sent to ${targetId.trim().toUpperCase()}!`);
    setTargetId('');
    setTimeout(() => setSentNotice(null), 3000);
  };

  const handleAccept = (invite: any) => {
    acceptFriendInvite(invite);
    onNavigate('/game');
  };

  const handleCreateRoom = () => {
    createPrivateRoom(selectedFee);
    onNavigate('/game');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col p-4 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center space-x-3 mb-5">
        <button
          onClick={() => onNavigate('/')}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-100">Play With Friend</h1>
      </div>

      <div className="space-y-4">
        {/* Your ID Card */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider">YOUR UNIQUE PLAYER ID</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black font-mono text-cyan-400">{user.playerId}</span>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSendInvite} className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-100">Invite a Friend</h3>

          <input
            type="text"
            placeholder="Enter Player ID (e.g. PA882314)"
            value={targetId}
            onChange={e => setTargetId(e.target.value.toUpperCase())}
            className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Match Entry Stake</label>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 25000].map(fee => (
                <button
                  type="button"
                  key={fee}
                  onClick={() => setSelectedFee(fee)}
                  className={`py-1 rounded-md text-xs font-mono font-bold ${
                    selectedFee === fee
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {fee >= 1000 ? `${fee / 1000}K` : fee}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!targetId.trim()}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send Match Invitation</span>
          </button>

          {sentNotice && (
            <p className="text-xs font-bold text-emerald-400 text-center animate-fadeIn">{sentNotice}</p>
          )}
        </form>

        {/* Direct Private Room */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-100">Create Private Table</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create a private 4-player game table with your selected stakes.
          </p>
          <button
            onClick={handleCreateRoom}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Private Table ({selectedFee.toLocaleString()} Coins)</span>
          </button>
        </div>

        {/* Received Invitations List */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">
            RECEIVED INVITATIONS ({pendingInvites.length})
          </h3>

          {pendingInvites.length === 0 ? (
            <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-6 text-center text-xs text-slate-400">
              No pending invitations right now.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingInvites.map(inv => (
                <div
                  key={inv.id}
                  className="bg-[#0F172A] border border-cyan-500/40 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">
                        Player {inv.fromPlayerName} ({inv.fromPlayerId})
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      🪙 {inv.entryFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleAccept(inv)}
                      className="py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFriendInvite(inv.id)}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium rounded-lg text-xs"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
