import React from 'react';
import { X, BookOpen, Volume2, Sparkles, Trophy, HelpCircle } from 'lucide-react';

interface RulesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesSettingsModal: React.FC<RulesSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0F172A] border border-cyan-500/30 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-slate-100">8-Ball Rules & Game Info</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <Trophy className="w-4 h-4" />
              <span>4-Player Championship Rules</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>Players take turns shooting the cue ball. Turn order rotates on missed shots or fouls.</li>
              <li>Sinking an object ball rewards an extra consecutive shot.</li>
              <li>Groups: Solids (1-7) and Stripes (9-15). Clear your assigned group before targeting the 8-Ball.</li>
              <li>Pots the 8-Ball legally to win the match and claim the prize pool!</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Fouls & Ball-In-Hand</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>Scratching the cue ball into a pocket results in a foul and grants Ball-in-Hand to the next player.</li>
              <li>Hitting an opponent&apos;s ball first or failing to contact any ball is an immediate foul.</li>
              <li>Sinking the 8-Ball early or scratching on the 8-Ball results in immediate loss of the match.</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Virtual Coins & Stakes</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All registered players start with <strong className="text-amber-400 font-mono">100,000 Free Coins</strong>. Match stakes range from 1,000 to 25,000 Coins. 
              Controlled redemptions are available starting at 500,000 Coins = ₹100 INR.
            </p>
          </div>

          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Haptic Feedback & Sound</span>
            </div>
            <span className="text-emerald-400 font-bold font-mono">ACTIVE</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
        >
          Got It, Back to Game
        </button>
      </div>
    </div>
  );
};
