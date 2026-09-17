import React, { useState } from 'react';
import { ArrowLeft, Coins, CheckCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface AddCoinsPageProps {
  onNavigate: (route: string) => void;
}

export const AddCoinsPage: React.FC<AddCoinsPageProps> = ({ onNavigate }) => {
  const { user, coinRequests, requestCoins } = useGame();
  const [selectedAmount, setSelectedAmount] = useState(50000);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const packages = [10000, 25000, 50000, 100000];

  const handleRequest = () => {
    requestCoins(selectedAmount);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const myRequests = coinRequests.filter(r => r.playerId === user.playerId);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <button
          onClick={() => onNavigate('/')}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-100">Add Coins</h1>
      </div>

      <div className="space-y-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-amber-500/40 rounded-2xl p-5 text-center shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider">CURRENT BALANCE</span>
          <div className="flex items-center justify-center space-x-2 my-1">
            <Coins className="w-7 h-7 text-yellow-400" />
            <span className="text-3xl font-black font-mono text-amber-300">
              {user.coins.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Coins are purely virtual game currency for 8BALL PRO matches.
          </p>
        </div>

        {/* Packages */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">CHOOSE COINS PACKAGE</h3>
          <div className="space-y-2">
            {packages.map(amt => {
              const isSelected = amt === selectedAmount;

              return (
                <div
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 shadow-md'
                      : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">+{amt.toLocaleString()} Coins</h4>
                      <span className="text-xs text-slate-400">Virtual In-Game Credit</span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
                    FREE REQUEST
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Request Button */}
        <button
          onClick={handleRequest}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/10"
        >
          Request {selectedAmount.toLocaleString()} Coins
        </button>

        {submitted && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Coin request submitted! Stored in database for verification.</span>
          </div>
        )}

        {/* Request History */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2">
            YOUR COIN REQUESTS ({myRequests.length})
          </h3>
          {myRequests.length === 0 ? (
            <p className="text-xs text-slate-500">No requests submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {myRequests.map(r => (
                <div
                  key={r.id}
                  className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-amber-400 font-mono">+{r.amount.toLocaleString()} Coins</span>
                    <p className="text-[10px] text-slate-500">{new Date(r.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      r.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : r.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
