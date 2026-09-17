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
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  name: string;
  avatarId: number;
  coins: number;
  status: 'ACTIVE' | 'SUSPENDED';
  matchesPlayed: number;
  wins: number;
  losses: number;
  createdAt: number;
  updatedAt: number;
  lastActive: number;
  isBlocked: boolean; // Alias for suspended for compatibility
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
  processedAt?: number;
  adminId?: string;
}

export type TransactionType =
  | 'ADMIN_ADD'
  | 'ADMIN_DEDUCT'
  | 'MATCH_ENTRY'
  | 'MATCH_REWARD'
  | 'USER_REQUEST'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_PAYOUT'
  | 'WITHDRAWAL_REFUND'
  | 'OTHER';

export interface CoinTransaction {
  id: string; // e.g. TXN928374
  adminId: string;
  playerId: string;
  playerName: string;
  type: TransactionType;
  amount: number;
  previousPlayerBalance: number;
  newPlayerBalance: number;
  previousAdminBalance: number;
  newAdminBalance: number;
  timestamp: number;
  reason: string;
  status: 'COMPLETED' | 'FAILED';
}

export interface WithdrawalRequest {
  id: string; // e.g. WDR748291
  playerId: string;
  playerName: string;
  coinsRequested: number;
  currencyValue: number; // In INR ₹
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: number;
  processedAt?: number;
  adminId?: string;
  notes?: string;
}

export interface SuspensionRecord {
  id: string;
  playerId: string;
  adminId: string;
  timestamp: number;
  reason: string;
  action: 'SUSPEND' | 'UNSUSPEND';
}

export interface AdminUser {
  adminId: string;
  role: 'SUPER_ADMIN' | 'SUPPORT_ADMIN';
  name: string;
  status: 'ACTIVE';
  createdAt: number;
}
