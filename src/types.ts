export type BallType = 'SOLID' | 'STRIPE' | 'EIGHT' | 'CUE';

export interface Ball {
  id: number;
  number: number;
  type: BallType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseColor: string;
  isPotted: boolean;
  isSinking: boolean;
  pocketProgress: number;
}

export interface GamePlayer {
  index: number;
  playerId: string;
  name: string;
  avatarId: number;
  isHuman: boolean;
  score: number;
  themeColor: string;
}

export type GameState = 
  | 'LOBBY' 
  | 'MATCHMAKING' 
  | 'PLAYER_TURN' 
  | 'SHOT_IN_PROGRESS' 
  | 'GAME_OVER';

export interface AimGuideData {
  rayStartX: number;
  rayStartY: number;
  impactX: number;
  impactY: number;
  ghostCueX: number;
  ghostCueY: number;
  hasBallHit: boolean;
  targetBallX?: number;
  targetBallY?: number;
  cueDeflectX?: number;
  cueDeflectY?: number;
}

export interface UserProfile {
  id: string;
  playerId: string;
  name: string;
  avatarId: number;
  coins: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  createdAt: number;
  isBlocked: boolean;
}

export interface MatchRecord {
  id: string;
  matchId: string;
  timestamp: number;
  mode: string;
  entryFee: number;
  result: 'WIN' | 'LOSS';
  coinsDelta: number;
  opponents: string;
}

export interface FriendInvitation {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  entryFee: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  timestamp: number;
}

export interface CoinRequest {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
}
