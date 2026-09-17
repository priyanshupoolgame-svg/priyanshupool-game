import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, RotateCw, Play, AlertTriangle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { PoolTableCanvas } from '../components/PoolTableCanvas';
import { GameOverModal } from '../components/Modals';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../components/Header';

interface GamePageProps {
  onNavigate: (route: string) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const {
    gameState,
    players,
    currentPlayerIndex,
    balls,
    aimAngle,
    cuePower,
    aimGuide,
    isBallInHand,
    foulMessage,
    winner,
    entryFee,
    turnTimeRemaining,
    setAimAngle,
    setCuePower,
    shoot,
    repositionCueBall,
    confirmBallInHand,
    dismissFoul,
    rematch,
    leaveGame
  } = useGame();

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const activePlayer = players[currentPlayerIndex];
  const isHumanTurn = activePlayer?.isHuman && gameState === 'PLAYER_TURN';

  const handleLeave = () => {
    leaveGame();
    onNavigate('/');
  };

  const handleFineAim = (delta: number) => {
    setAimAngle(aimAngle + delta);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-between overflow-hidden">
      {/* Top Bar */}
      <header className="bg-[#0F172A] border-b border-slate-800 px-4 py-2 flex items-center justify-between z-30">
        <button
          onClick={() => setShowLeaveConfirm(true)}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
          title="Leave Match"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-black text-cyan-400">8BALL PRO</span>
          <div className="text-xs font-bold text-amber-400 font-mono">
            Pot: 🪙 {(entryFee * players.length).toLocaleString()} Coins
          </div>
        </div>

        {/* Turn Timer Badge */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
            turnTimeRemaining <= 10
              ? 'border-rose-500 text-rose-400 bg-rose-500/20 animate-pulse'
              : 'border-cyan-400 text-cyan-300 bg-slate-800'
          }`}
        >
          {turnTimeRemaining}s
        </div>
      </header>

      {/* 4-Players Status Row */}
      <div className="bg-[#0F172A]/90 border-b border-slate-800/80 px-2 py-1.5 grid grid-cols-4 gap-1 z-20">
        {players.map((p, idx) => {
          const isTurn = idx === currentPlayerIndex;

          return (
            <div
              key={p.playerId}
              className={`flex items-center space-x-1.5 p-1 rounded-lg border transition-all ${
                isTurn
                  ? 'bg-slate-800 border-cyan-400 shadow-sm'
                  : 'bg-transparent border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 border ${AVATAR_COLORS[p.avatarId % AVATAR_COLORS.length]}`}
                style={{ borderColor: p.themeColor }}
              >
                {AVATAR_EMOJIS[p.avatarId % AVATAR_EMOJIS.length]}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-bold truncate ${isTurn ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {p.isHuman ? 'You' : p.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono truncate">{p.playerId.slice(0, 5)}</span>
                  <span className="text-amber-400 font-bold ml-1">●{p.score}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Foul Alert Banner */}
      {foulMessage && (
        <div
          onClick={dismissFoul}
          className="bg-rose-500 text-white px-4 py-2 flex items-center justify-between text-xs font-bold cursor-pointer animate-fadeIn"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{foulMessage}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">DISMISS</span>
        </div>
      )}

      {/* Pool Table Canvas */}
      <main className="flex-1 flex items-center justify-center w-full px-2 py-1">
        <PoolTableCanvas
          balls={balls}
          aimAngle={aimAngle}
          cuePower={cuePower}
          aimGuide={aimGuide}
          isHumanTurn={!!isHumanTurn}
          isBallInHand={isBallInHand}
          onAimChange={setAimAngle}
          onRepositionCueBall={repositionCueBall}
        />
      </main>

      {/* Bottom Controls */}
      <footer className="bg-[#0F172A] border-t border-slate-800 p-3 max-w-lg w-full mx-auto rounded-t-2xl z-20">
        {isBallInHand && isHumanTurn ? (
          <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-cyan-500/40">
            <div>
              <p className="text-xs font-bold text-cyan-400">Ball in Hand</p>
              <p className="text-[11px] text-slate-300">Drag cue ball to desired position</p>
            </div>
            <button
              onClick={confirmBallInHand}
              className="py-1.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-lg transition-colors"
            >
              Place Ball
            </button>
          </div>
        ) : isHumanTurn ? (
          <div className="space-y-2.5">
            {/* Fine Aim Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleFineAim(-0.04)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700"
                  title="Aim Left"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-400 px-1">FINE AIM</span>
                <button
                  onClick={() => handleFineAim(0.04)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700"
                  title="Aim Right"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-black text-amber-400 tracking-wider">
                YOUR TURN
              </span>

              <div className="text-xs font-mono text-slate-400">
                Power: <strong className="text-amber-400">{Math.round(cuePower * 100)}%</strong>
              </div>
            </div>

            {/* Power Slider & Shoot CTA */}
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.02"
                value={cuePower}
                onChange={e => setCuePower(parseFloat(e.target.value))}
                className="flex-1 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <button
                onClick={shoot}
                disabled={gameState !== 'PLAYER_TURN'}
                className="py-2.5 px-6 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-xl flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span className="text-sm">SHOOT</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 py-3 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{activePlayer?.name || 'Opponent'}'s turn... Aiming shot</span>
          </div>
        )}
      </footer>

      {/* Leave Game Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Leave Match?</h3>
            <p className="text-xs text-slate-400 mb-5">
              If you leave now, your match entry fee will be forfeited.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleLeave}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-colors"
              >
                Leave Match
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          isWin={winner?.isHuman || false}
          winner={winner}
          entryFee={entryFee}
          playerCount={players.length}
          onRematch={rematch}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
};
