import React, { useState } from 'react';
import { ArrowLeft, Landmark, AlertTriangle, CheckCircle2, History, ShieldAlert } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface WithdrawCoinsPageProps {
  onNavigate: (route: string) => void;
}

export const WithdrawCoinsPage: React.FC<WithdrawCoinsPageProps> = ({ onNavigate }) => {
  const { user, withdrawalRequests, requestWithdrawal } = useGame();
  const [selectedCoins, setSelectedCoins] = useState(500000);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <p className="text-slate-400 text-sm">Please log in to access the withdrawal interface.</p>
      </div>
    );
  }

  const minRequirement = 500000;
  const isEligible = user.coins >= minRequirement;
  const inrValue = Math.floor((selectedCoins / 500000) * 100);

  const handleRequestSubmit = () => {
    setFeedback(null);
    if (!isEligible) {
      setFeedback({
        type: 'error',
        message: 'Minimum withdrawal requirement is 500,000 Coins.'
      });
      return;
    }

    setIsSubmitting(true);
    const result = requestWithdrawal(selectedCoins);
    setIsSubmitting(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: `Withdrawal request for ${selectedCoins.toLocaleString()} Coins (₹${inrValue}) submitted! Request stored for verification.`
      });
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Unable to submit withdrawal request.'
      });
    }
  };

  const myWithdrawals = withdrawalRequests.filter(w => w.playerId === user.playerId);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col p-4 max-w-md mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <button
          onClick={() => onNavigate('/')}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Withdraw Coins</h1>
          <p className="text-xs text-slate-400">Controlled In-Game Redemption System</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-emerald-500/30 rounded-2xl p-5 text-center shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider">YOUR BALANCE</span>
          <div className="flex items-center justify-center space-x-2 my-1">
            <span className="text-3xl font-black font-mono text-emerald-400">
              🪙 {user.coins.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs mt-2 text-slate-300">
            <span>Minimum Withdrawal:</span>
            <span className="font-mono font-bold text-amber-400">500,000 Coins</span>
            <span>(Value: <strong className="text-emerald-400">₹100</strong>)</span>
          </div>
        </div>

        {/* Withdrawal Form Card */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              SELECT REDEMPTION AMOUNT
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[500000, 1000000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedCoins(amt)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCoins === amt
                      ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-mono font-bold text-sm text-slate-100">
                    🪙 {(amt / 1000).toLocaleString()}K
                  </p>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Value: ₹{Math.floor((amt / 500000) * 100)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="bg-slate-900/80 rounded-xl p-3.5 space-y-2 text-xs border border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Coins Requested:</span>
              <span className="font-mono font-bold text-slate-200">{selectedCoins.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Equivalent Valuation:</span>
              <span className="font-mono font-bold text-emerald-400">₹{inrValue} INR</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-slate-300">
              <span>Balance After Request:</span>
              <span className="font-mono font-bold text-cyan-400">
                {Math.max(0, user.coins - selectedCoins).toLocaleString()} Coins
              </span>
            </div>
          </div>

          {/* Eligibility Status Alert */}
          {!isEligible ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Minimum withdrawal requirement is 500,000 Coins.</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  You need {(minRequirement - user.coins).toLocaleString()} more coins to request a withdrawal.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Eligible for Redemption Request</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Your coins will be placed in pending escrow while administrative verification occurs.
                </p>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
              }`}
            >
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action CTA Button */}
          <button
            onClick={handleRequestSubmit}
            disabled={!isEligible || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg ${
              isEligible
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing...' : 'REQUEST WITHDRAWAL'}</span>
          </button>
        </div>

        {/* Regulatory & Prototype Compliance Notice */}
        <div className="bg-[#0F172A]/70 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-2.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Controlled Redemption Notice:</strong> This feature represents an in-game prototype redemption mechanism. Payout requests are verified and audited administratively and do not perform automated banking wire operations without compliant external gateway authorization.
          </p>
        </div>

        {/* User Withdrawal Requests History */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-2 flex items-center space-x-1.5">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>YOUR WITHDRAWAL REQUESTS ({myWithdrawals.length})</span>
          </h3>

          {myWithdrawals.length === 0 ? (
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
              No withdrawal requests placed yet.
            </div>
          ) : (
            <div className="space-y-2">
              {myWithdrawals.map(req => (
                <div
                  key={req.id}
                  className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-200">{req.id}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        req.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : req.status === 'APPROVED'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800/80">
                    <span className="font-mono text-amber-400 font-bold">
                      🪙 {req.coinsRequested.toLocaleString()} Coins
                    </span>
                    <span className="font-bold text-emerald-400">
                      ₹{req.currencyValue} INR
                    </span>
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
