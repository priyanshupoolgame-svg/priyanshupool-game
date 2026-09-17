import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Ball, GamePlayer, GameState, UserProfile, MatchRecord, FriendInvitation, CoinRequest, AimGuideData } from '../types';
import { PoolPhysics } from '../physics/PoolPhysics';
import { Vector2 } from '../physics/Vector2';

interface GameContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  matches: MatchRecord[];
  invitations: FriendInvitation[];
  coinRequests: CoinRequest[];
  allUsers: UserProfile[];
  
  // Game State
  gameState: GameState;
  players: GamePlayer[];
  currentPlayerIndex: number;
  balls: Ball[];
  aimAngle: number;
  cuePower: number;
  aimGuide: AimGuideData | null;
  isBallInHand: boolean;
  foulMessage: string | null;
  winner: GamePlayer | null;
  entryFee: number;
  turnTimeRemaining: number;
  
  // Matchmaking
  playersFound: number;
  matchmakingPlayers: Array<{ slot: number; name: string; playerId: string; avatarId: number; isReady: boolean }>;
  
  // Actions
  startQuickMatch: (fee: number) => boolean;
  cancelMatchmaking: () => void;
  startMatch: (playerCount: number, fee: number) => void;
  setAimAngle: (angle: number) => void;
  setCuePower: (power: number) => void;
  shoot: () => void;
  repositionCueBall: (x: number, y: number) => void;
  confirmBallInHand: () => void;
  dismissFoul: () => void;
  rematch: () => void;
  leaveGame: () => void;
  
  // Friend System
  sendFriendInvite: (toPlayerId: string, fee: number) => void;
  acceptFriendInvite: (invite: FriendInvitation) => void;
  rejectFriendInvite: (inviteId: string) => void;
  createPrivateRoom: (fee: number) => void;
  
  // Economy & Admin
  requestCoins: (amount: number) => void;
  updateProfile: (name: string, avatarId: number) => void;
  adminApproveCoinRequest: (id: string, playerId: string, amount: number) => void;
  adminRejectCoinRequest: (id: string) => void;
  adminAdjustCoins: (userId: string, newCoins: number) => void;
  adminToggleBlockUser: (userId: string, isBlocked: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const USER_STORAGE_KEY = '8ball_pro_user';
const MATCHES_STORAGE_KEY = '8ball_pro_matches';
const INVITES_STORAGE_KEY = '8ball_pro_invites';
const COIN_REQS_STORAGE_KEY = '8ball_pro_coin_reqs';

function createDefaultUser(): UserProfile {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return {
    id: 'user_1',
    playerId: `PA${rand}`,
    name: `Player_${rand.toString().slice(-4)}`,
    avatarId: 0,
    coins: 100000,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: Date.now(),
    isBlocked: false
  };
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const initial = createDefaultUser();
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  });

  const [matches, setMatches] = useState<MatchRecord[]>(() => {
    const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [invitations, setInvitations] = useState<FriendInvitation[]>(() => {
    const saved = localStorage.getItem(INVITES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    // Seed initial demo invite
    return [
      {
        id: 'inv_demo_1',
        fromPlayerId: 'PA882314',
        fromPlayerName: 'Marcus',
        toPlayerId: user.playerId,
        entryFee: 5000,
        status: 'PENDING',
        timestamp: Date.now() - 1000 * 60 * 15
      }
    ];
  });

  const [coinRequests, setCoinRequests] = useState<CoinRequest[]>(() => {
    const saved = localStorage.getItem(COIN_REQS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([
    user,
    {
      id: 'bot_1',
      playerId: 'PA892144',
      name: 'Alex',
      avatarId: 1,
      coins: 92000,
      matchesPlayed: 14,
      wins: 8,
      losses: 6,
      createdAt: Date.now() - 86400000 * 5,
      isBlocked: false
    },
    {
      id: 'bot_2',
      playerId: 'PA334190',
      name: 'Elena',
      avatarId: 2,
      coins: 145000,
      matchesPlayed: 25,
      wins: 17,
      losses: 8,
      createdAt: Date.now() - 86400000 * 12,
      isBlocked: false
    },
    {
      id: 'bot_3',
      playerId: 'PA551209',
      name: 'David',
      avatarId: 3,
      coins: 74000,
      matchesPlayed: 18,
      wins: 7,
      losses: 11,
      createdAt: Date.now() - 86400000 * 3,
      isBlocked: false
    }
  ]);

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem(COIN_REQS_STORAGE_KEY, JSON.stringify(coinRequests));
  }, [coinRequests]);

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [balls, setBalls] = useState<Ball[]>(() => PoolPhysics.createInitialRack());
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [aimAngle, setAimAngle] = useState(0);
  const [cuePower, setCuePower] = useState(0.4);
  const [aimGuide, setAimGuide] = useState<AimGuideData | null>(null);
  const [isBallInHand, setIsBallInHand] = useState(false);
  const [foulMessage, setFoulMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<GamePlayer | null>(null);
  const [entryFee, setEntryFee] = useState(5000);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(30);

  // Matchmaking State
  const [playersFound, setPlayersFound] = useState(1);
  const [matchmakingPlayers, setMatchmakingPlayers] = useState<Array<{ slot: number; name: string; playerId: string; avatarId: number; isReady: boolean }>>([]);
  const matchmakingTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Calculate Aim Guide when aimAngle or cueBall changes
  useEffect(() => {
    if (gameState !== 'PLAYER_TURN') {
      setAimGuide(null);
      return;
    }
    const cue = balls.find(b => b.type === 'CUE');
    if (!cue || cue.isPotted || cue.isSinking) {
      setAimGuide(null);
      return;
    }
    const guide = PoolPhysics.calculateAimGuide(cue, balls, aimAngle);
    setAimGuide(guide);
  }, [aimAngle, balls, gameState]);

  // Turn Countdown Timer
  useEffect(() => {
    if (gameState !== 'PLAYER_TURN') return;
    setTurnTimeRemaining(30);

    const timer = setInterval(() => {
      setTurnTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timeout shot
          shoot();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentPlayerIndex]);

  // Bot Turn Logic
  useEffect(() => {
    if (gameState !== 'PLAYER_TURN') return;
    const current = players[currentPlayerIndex];
    if (!current || current.isHuman) return;

    const botTimer = setTimeout(() => {
      const cue = balls.find(b => b.type === 'CUE');
      if (!cue) return;

      // Find an active target ball
      const activeBalls = balls.filter(b => !b.isPotted && !b.isSinking && b.type !== 'CUE');
      if (activeBalls.length === 0) return;

      const target = activeBalls[Math.floor(Math.random() * activeBalls.length)];
      const dx = target.x - cue.x;
      const dy = target.y - cue.y;
      const targetAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;

      setAimAngle(targetAngle);
      setCuePower(0.45 + Math.random() * 0.35);

      setTimeout(() => {
        shoot();
      }, 500);
    }, 1200);

    return () => clearTimeout(botTimer);
  }, [gameState, currentPlayerIndex, players, balls]);

  // Physics Simulation Loop
  const ballsRef = useRef(balls);
  ballsRef.current = balls;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const recordOutcome = useCallback((won: boolean, _winPlayer: GamePlayer, fee: number, count: number) => {
    const winReward = count >= 4 ? fee * 3 + Math.floor(fee * 0.6) : fee * 2 - Math.floor(fee * 0.1);
    const coinsDelta = won ? winReward : -fee;

    setUser(prev => ({
      ...prev,
      coins: won ? prev.coins + winReward : prev.coins,
      matchesPlayed: prev.matchesPlayed + 1,
      wins: won ? prev.wins + 1 : prev.wins,
      losses: won ? prev.losses : prev.losses + 1
    }));

    const newRecord: MatchRecord = {
      id: 'match_' + Date.now(),
      matchId: `MATCH#PA${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: Date.now(),
      mode: `${count}-Player Pool`,
      entryFee: fee,
      result: won ? 'WIN' : 'LOSS',
      coinsDelta,
      opponents: players.filter(p => !p.isHuman).map(p => `${p.name} (${p.playerId})`).join(', ')
    };

    setMatches(prev => [newRecord, ...prev]);
  }, [players]);

  useEffect(() => {
    if (gameState !== 'SHOT_IN_PROGRESS') return;

    let animId: number;
    let initialPottedCount = ballsRef.current.filter(b => b.isPotted).length;

    const loop = () => {
      const currentBalls = [...ballsRef.current.map(b => ({ ...b }))];
      const isMoving = PoolPhysics.stepSimulation(currentBalls, 4);
      setBalls(currentBalls);

      if (isMoving) {
        animId = requestAnimationFrame(loop);
      } else {
        // Shot concluded! Resolve rules
        const cue = currentBalls.find(b => b.type === 'CUE');
        const cueScratch = !cue || cue.isPotted || cue.isSinking;
        const eightBall = currentBalls.find(b => b.type === 'EIGHT');
        const eightPotted = !eightBall || eightBall.isPotted;

        const currentPottedCount = currentBalls.filter(b => b.isPotted).length;
        const pottedThisTurn = currentPottedCount - initialPottedCount;

        const activePlayer = players[currentPlayerIndex];

        if (eightPotted) {
          // Eight ball sank!
          const remainingObjBalls = currentBalls.filter(b => !b.isPotted && b.type !== 'CUE' && b.type !== 'EIGHT');
          const isLegitWin = remainingObjBalls.length === 0 && !cueScratch;

          if (isLegitWin) {
            setWinner(activePlayer);
          } else {
            // Foul on 8-ball: next player or human wins
            const fallbackWinner = players.find(p => p.index !== currentPlayerIndex) || players[0];
            setWinner(fallbackWinner);
          }
          setGameState('GAME_OVER');
          const isHumanWin = (isLegitWin && activePlayer.isHuman) || (!isLegitWin && !activePlayer.isHuman);
          recordOutcome(isHumanWin, isLegitWin ? activePlayer : players[0], entryFee, players.length);
          return;
        }

        if (cueScratch) {
          // Foul: Scratch
          setFoulMessage('FOUL! Cue ball scratched into pocket.');
          setIsBallInHand(true);

          // Respawn cue ball
          const respawned = currentBalls.map(b => {
            if (b.type === 'CUE') {
              return { ...b, x: 280, y: 250, vx: 0, vy: 0, isPotted: false, isSinking: false, pocketProgress: 0 };
            }
            return b;
          });
          setBalls(respawned);

          // Rotate turn
          setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
          setGameState('PLAYER_TURN');
        } else {
          // If potted a ball legitimately, same player shoots again! Else next player
          if (pottedThisTurn > 0) {
            setPlayers(prev => prev.map((p, idx) => idx === currentPlayerIndex ? { ...p, score: p.score + pottedThisTurn } : p));
          } else {
            setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
          }
          setGameState('PLAYER_TURN');
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, currentPlayerIndex, players, entryFee, recordOutcome]);

  // Actions
  const startQuickMatch = (fee: number): boolean => {
    if (user.coins < fee) {
      return false;
    }

    // Deduct entry fee
    setUser(prev => ({ ...prev, coins: prev.coins - fee }));
    setEntryFee(fee);
    setGameState('MATCHMAKING');
    setPlayersFound(1);

    const initialSlots = [
      { slot: 1, name: user.name, playerId: user.playerId, avatarId: user.avatarId, isReady: true }
    ];
    setMatchmakingPlayers(initialSlots);

    // Clear any previous timers
    matchmakingTimerRef.current.forEach(t => clearTimeout(t));
    matchmakingTimerRef.current = [];

    const bots = [
      { name: 'Alex', playerId: 'PA892144', avatarId: 1 },
      { name: 'Elena', playerId: 'PA334190', avatarId: 2 },
      { name: 'David', playerId: 'PA551209', avatarId: 3 }
    ];

    bots.forEach((bot, index) => {
      const timer = setTimeout(() => {
        setMatchmakingPlayers(prev => [
          ...prev,
          { slot: index + 2, name: bot.name, playerId: bot.playerId, avatarId: bot.avatarId, isReady: true }
        ]);
        setPlayersFound(index + 2);

        if (index === 2) {
          // 4/4 ready!
          const startTimer = setTimeout(() => {
            startMatch(4, fee);
          }, 600);
          matchmakingTimerRef.current.push(startTimer);
        }
      }, (index + 1) * 750);

      matchmakingTimerRef.current.push(timer);
    });

    return true;
  };

  const cancelMatchmaking = () => {
    matchmakingTimerRef.current.forEach(t => clearTimeout(t));
    matchmakingTimerRef.current = [];
    // Refund entry fee
    setUser(prev => ({ ...prev, coins: prev.coins + entryFee }));
    setGameState('LOBBY');
  };

  const startMatch = (playerCount: number, fee: number) => {
    setEntryFee(fee);
    const colors = ['#06B6D4', '#F59E0B', '#10B981', '#A855F7'];
    const botNames = ['Alex', 'Elena', 'David'];

    const gamePlayers: GamePlayer[] = [
      {
        index: 0,
        playerId: user.playerId,
        name: user.name,
        avatarId: user.avatarId,
        isHuman: true,
        score: 0,
        themeColor: colors[0]
      }
    ];

    for (let i = 1; i < playerCount; i++) {
      gamePlayers.push({
        index: i,
        playerId: `PA${Math.floor(100000 + Math.random() * 900000)}`,
        name: botNames[(i - 1) % botNames.length],
        avatarId: i % 6,
        isHuman: false,
        score: 0,
        themeColor: colors[i % colors.length]
      });
    }

    setPlayers(gamePlayers);
    setCurrentPlayerIndex(0);
    setBalls(PoolPhysics.createInitialRack());
    setAimAngle(0);
    setCuePower(0.4);
    setIsBallInHand(false);
    setFoulMessage(null);
    setWinner(null);
    setGameState('PLAYER_TURN');
  };

  const shoot = () => {
    if (gameState !== 'PLAYER_TURN') return;
    const cue = balls.find(b => b.type === 'CUE');
    if (!cue || cue.isPotted) return;

    const impulseSpeed = 12 + cuePower * 30;
    const impulse = Vector2.fromAngle(aimAngle, impulseSpeed);

    setBalls(prev => prev.map(b => b.type === 'CUE' ? { ...b, vx: impulse.x, vy: impulse.y } : b));
    setGameState('SHOT_IN_PROGRESS');
  };

  const repositionCueBall = (x: number, y: number) => {
    const clampedX = Math.max(PoolPhysics.MIN_X + PoolPhysics.BALL_RADIUS, Math.min(PoolPhysics.MAX_X - PoolPhysics.BALL_RADIUS, x));
    const clampedY = Math.max(PoolPhysics.MIN_Y + PoolPhysics.BALL_RADIUS, Math.min(PoolPhysics.MAX_Y - PoolPhysics.BALL_RADIUS, y));

    setBalls(prev => prev.map(b => b.type === 'CUE' ? { ...b, x: clampedX, y: clampedY, vx: 0, vy: 0 } : b));
  };

  const confirmBallInHand = () => {
    setIsBallInHand(false);
  };

  const dismissFoul = () => {
    setFoulMessage(null);
  };

  const rematch = () => {
    if (user.coins >= entryFee) {
      setUser(prev => ({ ...prev, coins: prev.coins - entryFee }));
      startMatch(players.length, entryFee);
    } else {
      setGameState('LOBBY');
    }
  };

  const leaveGame = () => {
    setGameState('LOBBY');
  };

  // Friend System
  const sendFriendInvite = (toPlayerId: string, fee: number) => {
    const newInvite: FriendInvitation = {
      id: 'inv_' + Date.now(),
      fromPlayerId: user.playerId,
      fromPlayerName: user.name,
      toPlayerId,
      entryFee: fee,
      status: 'PENDING',
      timestamp: Date.now()
    };
    setInvitations(prev => [newInvite, ...prev]);
  };

  const acceptFriendInvite = (invite: FriendInvitation) => {
    if (user.coins < invite.entryFee) return;
    setUser(prev => ({ ...prev, coins: prev.coins - invite.entryFee }));
    setInvitations(prev => prev.map(i => i.id === invite.id ? { ...i, status: 'ACCEPTED' } : i));
    startMatch(2, invite.entryFee);
  };

  const rejectFriendInvite = (inviteId: string) => {
    setInvitations(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'REJECTED' } : i));
  };

  const createPrivateRoom = (fee: number) => {
    if (user.coins < fee) return;
    setUser(prev => ({ ...prev, coins: prev.coins - fee }));
    startMatch(4, fee);
  };

  // Economy & Admin
  const requestCoins = (amount: number) => {
    const newReq: CoinRequest = {
      id: 'req_' + Date.now(),
      playerId: user.playerId,
      playerName: user.name,
      amount,
      status: 'PENDING',
      timestamp: Date.now()
    };
    setCoinRequests(prev => [newReq, ...prev]);
  };

  const updateProfile = (name: string, avatarId: number) => {
    setUser(prev => ({ ...prev, name, avatarId }));
  };

  const adminApproveCoinRequest = (id: string, playerId: string, amount: number) => {
    setCoinRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    if (playerId === user.playerId) {
      setUser(prev => ({ ...prev, coins: prev.coins + amount }));
    }
    setAllUsers(prev => prev.map(u => u.playerId === playerId ? { ...u, coins: u.coins + amount } : u));
  };

  const adminRejectCoinRequest = (id: string) => {
    setCoinRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
  };

  const adminAdjustCoins = (userId: string, newCoins: number) => {
    if (userId === user.id) {
      setUser(prev => ({ ...prev, coins: newCoins }));
    }
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: newCoins } : u));
  };

  const adminToggleBlockUser = (userId: string, isBlocked: boolean) => {
    if (userId === user.id) {
      setUser(prev => ({ ...prev, isBlocked }));
    }
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked } : u));
  };

  return (
    <GameContext.Provider
      value={{
        user,
        setUser,
        matches,
        invitations,
        coinRequests,
        allUsers,
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
        playersFound,
        matchmakingPlayers,
        startQuickMatch,
        cancelMatchmaking,
        startMatch,
        setAimAngle,
        setCuePower,
        shoot,
        repositionCueBall,
        confirmBallInHand,
        dismissFoul,
        rematch,
        leaveGame,
        sendFriendInvite,
        acceptFriendInvite,
        rejectFriendInvite,
        createPrivateRoom,
        requestCoins,
        updateProfile,
        adminApproveCoinRequest,
        adminRejectCoinRequest,
        adminAdjustCoins,
        adminToggleBlockUser
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
