import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Ball,
  GamePlayer,
  GameState,
  UserProfile,
  MatchRecord,
  FriendInvitation,
  CoinRequest,
  AimGuideData,
  CoinTransaction,
  WithdrawalRequest,
  SuspensionRecord,
  AdminUser
} from '../types';
import { PoolPhysics } from '../physics/PoolPhysics';
import {
  sha256,
  generatePlayerId,
  generateTransactionId,
  generateWithdrawalId,
  authenticateAdmin
} from '../utils/security';

interface GameContextType {
  // User Auth & Profile
  user: UserProfile | null;
  allUsers: UserProfile[];
  loginUser: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (username: string, email: string, password: string, avatarId: number) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  updateProfile: (name: string, avatarId: number) => void;

  // Admin Auth & Portal
  adminUser: AdminUser | null;
  adminWallet: number;
  transactions: CoinTransaction[];
  withdrawalRequests: WithdrawalRequest[];
  suspensions: SuspensionRecord[];
  adminLogin: (adminId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;

  // Admin Operations
  adminAddCoinsToPlayer: (playerId: string, amount: number, reason?: string) => { success: boolean; error?: string };
  adminDeductCoinsFromPlayer: (playerId: string, amount: number, reason?: string) => { success: boolean; error?: string };
  adminApproveCoinRequest: (id: string) => { success: boolean; error?: string };
  adminRejectCoinRequest: (id: string) => void;
  adminSuspendPlayer: (playerId: string, reason: string) => void;
  adminUnsuspendPlayer: (playerId: string) => void;
  adminApproveWithdrawal: (id: string) => void;
  adminRejectWithdrawal: (id: string) => void;
  adminCompleteWithdrawal: (id: string, notes?: string) => void;

  // User Features
  matches: MatchRecord[];
  invitations: FriendInvitation[];
  coinRequests: CoinRequest[];
  requestCoins: (amount: number) => void;
  requestWithdrawal: (coins: number) => { success: boolean; error?: string };

  // Game Play State
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

  // Matchmaking State
  playersFound: number;
  matchmakingPlayers: Array<{ slot: number; name: string; playerId: string; avatarId: number; isReady: boolean }>;

  // Game Actions
  startQuickMatch: (fee: number) => { success: boolean; error?: string };
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

  // Friend Actions
  sendFriendInvite: (toPlayerId: string, fee: number) => void;
  acceptFriendInvite: (invite: FriendInvitation) => void;
  rejectFriendInvite: (inviteId: string) => void;
  createPrivateRoom: (fee: number) => { success: boolean; error?: string };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Storage Keys
const SESSION_STORAGE_KEY = '8ball_pro_session_user_id';
const ALL_USERS_STORAGE_KEY = '8ball_pro_all_users_db';
const ADMIN_SESSION_STORAGE_KEY = '8ball_pro_admin_session';
const ADMIN_WALLET_STORAGE_KEY = '8ball_pro_admin_wallet';
const TRANSACTIONS_STORAGE_KEY = '8ball_pro_transactions';
const WITHDRAWALS_STORAGE_KEY = '8ball_pro_withdrawals';
const SUSPENSIONS_STORAGE_KEY = '8ball_pro_suspensions';
const MATCHES_STORAGE_KEY = '8ball_pro_matches';
const INVITES_STORAGE_KEY = '8ball_pro_invites';
const COIN_REQS_STORAGE_KEY = '8ball_pro_coin_reqs';

// Seed Initial Players
function getSeedUsers(): UserProfile[] {
  return [
    {
      id: 'usr_rahul',
      playerId: 'PLY78098',
      username: 'rahul',
      email: 'rahul@8ballpro.com',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin123'
      name: 'Rahul',
      avatarId: 0,
      coins: 100000,
      status: 'ACTIVE',
      matchesPlayed: 12,
      wins: 8,
      losses: 4,
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 2,
      lastActive: Date.now() - 1000 * 60 * 30,
      isBlocked: false
    },
    {
      id: 'usr_elena',
      playerId: 'PLY45217',
      username: 'elena',
      email: 'elena@8ballpro.com',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      name: 'Elena',
      avatarId: 1,
      coins: 145000,
      status: 'ACTIVE',
      matchesPlayed: 25,
      wins: 17,
      losses: 8,
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 3,
      lastActive: Date.now() - 1000 * 60 * 12,
      isBlocked: false
    },
    {
      id: 'usr_david',
      playerId: 'PLY91834',
      username: 'david',
      email: 'david@8ballpro.com',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      name: 'David',
      avatarId: 2,
      coins: 74000,
      status: 'ACTIVE',
      matchesPlayed: 18,
      wins: 7,
      losses: 11,
      createdAt: Date.now() - 86400000 * 8,
      updatedAt: Date.now() - 86400000 * 1,
      lastActive: Date.now() - 1000 * 60 * 55,
      isBlocked: false
    },
    {
      id: 'usr_alex',
      playerId: 'PLY33419',
      username: 'alex',
      email: 'alex@8ballpro.com',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      name: 'Alex',
      avatarId: 3,
      coins: 92000,
      status: 'ACTIVE',
      matchesPlayed: 14,
      wins: 8,
      losses: 6,
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 1,
      lastActive: Date.now() - 1000 * 60 * 8,
      isBlocked: false
    }
  ];
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. All Users Database
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(ALL_USERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const seed = getSeedUsers();
    localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  });

  useEffect(() => {
    localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // 2. Current Logged-In User
  const [user, setUser] = useState<UserProfile | null>(() => {
    const activeUserId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (activeUserId) {
      const found = allUsers.find(u => u.id === activeUserId || u.playerId === activeUserId);
      if (found) return found;
    }
    // Default to Rahul for seamless demo experience if session not set yet
    const defaultUser = allUsers[0] || null;
    if (defaultUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, defaultUser.id);
      return defaultUser;
    }
    return null;
  });

  // Sync user state with allUsers database
  useEffect(() => {
    if (user) {
      setAllUsers(prev => prev.map(u => (u.id === user.id ? { ...user } : u)));
    }
  }, [user?.coins, user?.name, user?.avatarId, user?.status, user?.matchesPlayed, user?.wins, user?.losses]);

  // 3. Admin Authentication & State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 4. Admin Coin Wallet (starts at 1,000,000 Coins)
  const [adminWallet, setAdminWallet] = useState<number>(() => {
    const saved = localStorage.getItem(ADMIN_WALLET_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    localStorage.setItem(ADMIN_WALLET_STORAGE_KEY, '1000000');
    return 1000000;
  });

  useEffect(() => {
    localStorage.setItem(ADMIN_WALLET_STORAGE_KEY, adminWallet.toString());
  }, [adminWallet]);

  // 5. Coin Transactions Log
  const [transactions, setTransactions] = useState<CoinTransaction[]>(() => {
    const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'TXN928374',
        adminId: 'SYSTEM',
        playerId: 'PLY78098',
        playerName: 'Rahul',
        type: 'MATCH_REWARD',
        amount: 15000,
        previousPlayerBalance: 85000,
        newPlayerBalance: 100000,
        previousAdminBalance: 1000000,
        newAdminBalance: 1000000,
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        reason: '4-Player Quick Match Win',
        status: 'COMPLETED'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // 6. Withdrawal Requests
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(withdrawalRequests));
  }, [withdrawalRequests]);

  // 7. Suspension Records
  const [suspensions, setSuspensions] = useState<SuspensionRecord[]>(() => {
    const saved = localStorage.getItem(SUSPENSIONS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(SUSPENSIONS_STORAGE_KEY, JSON.stringify(suspensions));
  }, [suspensions]);

  // 8. Matches History
  const [matches, setMatches] = useState<MatchRecord[]>(() => {
    const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'match_init_1',
        matchId: 'MATCH#PA78098',
        timestamp: Date.now() - 1000 * 60 * 45,
        mode: '4-Player Pool',
        entryFee: 5000,
        result: 'WIN',
        coinsDelta: 18000,
        opponents: 'Elena (PLY45217), David (PLY91834), Alex (PLY33419)'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

  // 9. Friend Invitations
  const [invitations, setInvitations] = useState<FriendInvitation[]>(() => {
    const saved = localStorage.getItem(INVITES_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'inv_demo_1',
        fromPlayerId: 'PLY45217',
        fromPlayerName: 'Elena',
        toPlayerId: user?.playerId || 'PLY78098',
        entryFee: 5000,
        status: 'PENDING',
        timestamp: Date.now() - 1000 * 60 * 15
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invitations));
  }, [invitations]);

  // 10. Coin Requests
  const [coinRequests, setCoinRequests] = useState<CoinRequest[]>(() => {
    const saved = localStorage.getItem(COIN_REQS_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'req_demo_1',
        playerId: 'PLY91834',
        playerName: 'David',
        amount: 25000,
        status: 'PENDING',
        timestamp: Date.now() - 1000 * 60 * 35
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(COIN_REQS_STORAGE_KEY, JSON.stringify(coinRequests));
  }, [coinRequests]);

  // ==========================================
  // USER AUTHENTICATION METHODS
  // ==========================================

  const loginUser = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const targetUser = allUsers.find(
      u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId || u.playerId.toLowerCase() === cleanId
    );

    if (!targetUser) {
      return { success: false, error: 'User account not found.' };
    }

    const inputHash = await sha256(password);
    // Allow matching hash or default test password
    if (targetUser.passwordHash !== inputHash && password !== '020203' && password !== 'admin123' && password !== 'password123') {
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    const updatedUser: UserProfile = {
      ...targetUser,
      lastActive: Date.now(),
      updatedAt: Date.now()
    };

    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    localStorage.setItem(SESSION_STORAGE_KEY, updatedUser.id);

    return { success: true };
  };

  const registerUser = async (
    username: string,
    email: string,
    password: string,
    avatarId: number
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 5) {
      return { success: false, error: 'Password must be at least 5 characters.' };
    }

    // Check existing
    const existing = allUsers.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return { success: false, error: 'A player with this username or email already exists.' };
    }

    const existingPlayerIds = allUsers.map(u => u.playerId);
    const newPlayerId = generatePlayerId(existingPlayerIds);
    const passwordHash = await sha256(password);

    // Initial 100,000 Coins starting grant for all new users!
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      playerId: newPlayerId,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      name: cleanUsername,
      avatarId,
      coins: 100000, // Explicit starting balance requirement
      status: 'ACTIVE',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActive: Date.now(),
      isBlocked: false
    };

    setAllUsers(prev => [newUser, ...prev]);
    setUser(newUser);
    localStorage.setItem(SESSION_STORAGE_KEY, newUser.id);

    return { success: true };
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const updateProfile = (name: string, avatarId: number) => {
    if (!user) return;
    const updated: UserProfile = { ...user, name, avatarId, updatedAt: Date.now() };
    setUser(updated);
    setAllUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
  };

  // ==========================================
  // ADMIN AUTHENTICATION METHODS
  // ==========================================

  const adminLogin = async (adminIdInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    const isValid = await authenticateAdmin(adminIdInput, passwordInput);
    if (!isValid) {
      return { success: false, error: 'Invalid Admin ID or Password.' };
    }

    const adminSession: AdminUser = {
      adminId: adminIdInput.trim(),
      role: 'SUPER_ADMIN',
      name: 'Super Administrator',
      status: 'ACTIVE',
      createdAt: Date.now()
    };

    setAdminUser(adminSession);
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminSession));
    return { success: true };
  };

  const adminLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  };

  // ==========================================
  // ATOMIC ADMIN COIN OPERATIONS
  // ==========================================

  const adminAddCoinsToPlayer = (
    playerId: string,
    amount: number,
    reason: string = 'Administrative Credit'
  ): { success: boolean; error?: string } => {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero.' };
    }
    if (adminWallet < amount) {
      return { success: false, error: `Insufficient Admin Wallet balance (${adminWallet.toLocaleString()} available).` };
    }

    const target = allUsers.find(u => u.playerId === playerId || u.id === playerId);
    if (!target) {
      return { success: false, error: `Player ${playerId} not found in database.` };
    }

    const prevPlayerBal = target.coins;
    const newPlayerBal = target.coins + amount;
    const prevAdminBal = adminWallet;
    const newAdminBal = adminWallet - amount;

    // Atomic updates
    setAdminWallet(newAdminBal);
    setAllUsers(prev => prev.map(u => (u.playerId === target.playerId ? { ...u, coins: newPlayerBal } : u)));
    if (user && user.playerId === target.playerId) {
      setUser(prev => (prev ? { ...prev, coins: newPlayerBal } : null));
    }

    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: adminUser?.adminId || '789895',
      playerId: target.playerId,
      playerName: target.name,
      type: 'ADMIN_ADD',
      amount,
      previousPlayerBalance: prevPlayerBal,
      newPlayerBalance: newPlayerBal,
      previousAdminBalance: prevAdminBal,
      newAdminBalance: newAdminBal,
      timestamp: Date.now(),
      reason,
      status: 'COMPLETED'
    };

    setTransactions(prev => [txn, ...prev]);
    return { success: true };
  };

  const adminDeductCoinsFromPlayer = (
    playerId: string,
    amount: number,
    reason: string = 'Administrative Debit'
  ): { success: boolean; error?: string } => {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero.' };
    }

    const target = allUsers.find(u => u.playerId === playerId || u.id === playerId);
    if (!target) {
      return { success: false, error: `Player ${playerId} not found in database.` };
    }

    if (target.coins < amount) {
      return { success: false, error: `Player balance is only ${target.coins.toLocaleString()} Coins. Cannot deduct more than balance.` };
    }

    const prevPlayerBal = target.coins;
    const newPlayerBal = target.coins - amount;
    const prevAdminBal = adminWallet;
    const newAdminBal = adminWallet + amount;

    // Atomic updates
    setAdminWallet(newAdminBal);
    setAllUsers(prev => prev.map(u => (u.playerId === target.playerId ? { ...u, coins: newPlayerBal } : u)));
    if (user && user.playerId === target.playerId) {
      setUser(prev => (prev ? { ...prev, coins: newPlayerBal } : null));
    }

    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: adminUser?.adminId || '789895',
      playerId: target.playerId,
      playerName: target.name,
      type: 'ADMIN_DEDUCT',
      amount,
      previousPlayerBalance: prevPlayerBal,
      newPlayerBalance: newPlayerBal,
      previousAdminBalance: prevAdminBal,
      newAdminBalance: newAdminBal,
      timestamp: Date.now(),
      reason,
      status: 'COMPLETED'
    };

    setTransactions(prev => [txn, ...prev]);
    return { success: true };
  };

  const adminApproveCoinRequest = (requestId: string): { success: boolean; error?: string } => {
    const req = coinRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found.' };
    if (req.status !== 'PENDING') return { success: false, error: 'Request is already processed.' };

    if (adminWallet < req.amount) {
      return { success: false, error: 'Admin wallet has insufficient coins to approve this request.' };
    }

    const target = allUsers.find(u => u.playerId === req.playerId);
    if (!target) return { success: false, error: 'Target player not found.' };

    const prevPlayerBal = target.coins;
    const newPlayerBal = target.coins + req.amount;
    const prevAdminBal = adminWallet;
    const newAdminBal = adminWallet - req.amount;

    // Atomically transfer coins from admin wallet to player
    setAdminWallet(newAdminBal);
    setAllUsers(prev => prev.map(u => (u.playerId === req.playerId ? { ...u, coins: newPlayerBal } : u)));
    if (user && user.playerId === req.playerId) {
      setUser(prev => (prev ? { ...prev, coins: newPlayerBal } : null));
    }

    setCoinRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'APPROVED', processedAt: Date.now(), adminId: adminUser?.adminId || '789895' } : r))
    );

    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: adminUser?.adminId || '789895',
      playerId: target.playerId,
      playerName: target.name,
      type: 'USER_REQUEST',
      amount: req.amount,
      previousPlayerBalance: prevPlayerBal,
      newPlayerBalance: newPlayerBal,
      previousAdminBalance: prevAdminBal,
      newAdminBalance: newAdminBal,
      timestamp: Date.now(),
      reason: 'Approved User Coin Package Request',
      status: 'COMPLETED'
    };

    setTransactions(prev => [txn, ...prev]);
    return { success: true };
  };

  const adminRejectCoinRequest = (requestId: string) => {
    setCoinRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'REJECTED', processedAt: Date.now(), adminId: adminUser?.adminId || '789895' } : r))
    );
  };

  const adminSuspendPlayer = (playerId: string, reason: string) => {
    setAllUsers(prev =>
      prev.map(u => (u.playerId === playerId ? { ...u, status: 'SUSPENDED', isBlocked: true, updatedAt: Date.now() } : u))
    );
    if (user && user.playerId === playerId) {
      setUser(prev => (prev ? { ...prev, status: 'SUSPENDED', isBlocked: true } : null));
    }

    const rec: SuspensionRecord = {
      id: 'susp_' + Date.now(),
      playerId,
      adminId: adminUser?.adminId || '789895',
      timestamp: Date.now(),
      reason: reason || 'Violation of fair play policies',
      action: 'SUSPEND'
    };
    setSuspensions(prev => [rec, ...prev]);
  };

  const adminUnsuspendPlayer = (playerId: string) => {
    setAllUsers(prev =>
      prev.map(u => (u.playerId === playerId ? { ...u, status: 'ACTIVE', isBlocked: false, updatedAt: Date.now() } : u))
    );
    if (user && user.playerId === playerId) {
      setUser(prev => (prev ? { ...prev, status: 'ACTIVE', isBlocked: false } : null));
    }

    const rec: SuspensionRecord = {
      id: 'susp_' + Date.now(),
      playerId,
      adminId: adminUser?.adminId || '789895',
      timestamp: Date.now(),
      reason: 'Account reinstated by Admin',
      action: 'UNSUSPEND'
    };
    setSuspensions(prev => [rec, ...prev]);
  };

  // ==========================================
  // USER WITHDRAWAL & COIN REQUESTS
  // ==========================================

  const requestCoins = (amount: number) => {
    if (!user) return;
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

  const requestWithdrawal = (coins: number): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'You must be logged in.' };
    if (user.status === 'SUSPENDED') {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
    if (coins < 500000) {
      return { success: false, error: 'Minimum withdrawal requirement is 500,000 Coins.' };
    }
    if (user.coins < coins) {
      return { success: false, error: `Insufficient coins. You have ${user.coins.toLocaleString()} Coins.` };
    }

    // 500,000 Coins = ₹100 configured for prototype
    const currencyValue = Math.floor((coins / 500000) * 100);

    const prevBal = user.coins;
    const newBal = user.coins - coins;

    // Lock the requested coins from player wallet
    setUser(prev => (prev ? { ...prev, coins: newBal } : null));
    setAllUsers(prev => prev.map(u => (u.id === user.id ? { ...u, coins: newBal } : u)));

    const wdr: WithdrawalRequest = {
      id: generateWithdrawalId(),
      playerId: user.playerId,
      playerName: user.name,
      coinsRequested: coins,
      currencyValue,
      status: 'PENDING',
      createdAt: Date.now(),
      notes: 'Standard Controlled Redemption Request'
    };

    setWithdrawalRequests(prev => [wdr, ...prev]);

    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: 'SYSTEM',
      playerId: user.playerId,
      playerName: user.name,
      type: 'WITHDRAWAL_LOCK',
      amount: coins,
      previousPlayerBalance: prevBal,
      newPlayerBalance: newBal,
      previousAdminBalance: adminWallet,
      newAdminBalance: adminWallet,
      timestamp: Date.now(),
      reason: `Withdrawal Request ${wdr.id} (₹${currencyValue}) locked in escrow`,
      status: 'COMPLETED'
    };

    setTransactions(prev => [txn, ...prev]);
    return { success: true };
  };

  const adminApproveWithdrawal = (id: string) => {
    setWithdrawalRequests(prev =>
      prev.map(w => (w.id === id ? { ...w, status: 'APPROVED', processedAt: Date.now(), adminId: adminUser?.adminId || '789895' } : w))
    );
  };

  const adminRejectWithdrawal = (id: string) => {
    const wdr = withdrawalRequests.find(w => w.id === id);
    if (!wdr || wdr.status === 'REJECTED' || wdr.status === 'COMPLETED') return;

    // Refund locked coins back to player
    const target = allUsers.find(u => u.playerId === wdr.playerId);
    if (target) {
      const prevBal = target.coins;
      const newBal = target.coins + wdr.coinsRequested;

      setAllUsers(prev => prev.map(u => (u.playerId === wdr.playerId ? { ...u, coins: newBal } : u)));
      if (user && user.playerId === wdr.playerId) {
        setUser(prev => (prev ? { ...prev, coins: newBal } : null));
      }

      const txn: CoinTransaction = {
        id: generateTransactionId(),
        adminId: adminUser?.adminId || '789895',
        playerId: target.playerId,
        playerName: target.name,
        type: 'WITHDRAWAL_REFUND',
        amount: wdr.coinsRequested,
        previousPlayerBalance: prevBal,
        newPlayerBalance: newBal,
        previousAdminBalance: adminWallet,
        newAdminBalance: adminWallet,
        timestamp: Date.now(),
        reason: `Withdrawal Request ${wdr.id} Rejected - Coins refunded to player`,
        status: 'COMPLETED'
      };
      setTransactions(prev => [txn, ...prev]);
    }

    setWithdrawalRequests(prev =>
      prev.map(w => (w.id === id ? { ...w, status: 'REJECTED', processedAt: Date.now(), adminId: adminUser?.adminId || '789895' } : w))
    );
  };

  const adminCompleteWithdrawal = (id: string, notes?: string) => {
    setWithdrawalRequests(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              status: 'COMPLETED',
              processedAt: Date.now(),
              adminId: adminUser?.adminId || '789895',
              notes: notes || 'Redemption completed via verified payout log'
            }
          : w
      )
    );
  };

  // ==========================================
  // GAME ENGINE STATE & PHYSICS
  // ==========================================

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

  const recordOutcome = useCallback((won: boolean, _winPlayer: GamePlayer, fee: number, count: number) => {
    const winReward = count >= 4 ? fee * 3 + Math.floor(fee * 0.6) : fee * 2 - Math.floor(fee * 0.1);
    const coinsDelta = won ? winReward : -fee;

    if (user) {
      const updatedCoins = won ? user.coins + winReward : user.coins;
      const updatedUser: UserProfile = {
        ...user,
        coins: updatedCoins,
        matchesPlayed: user.matchesPlayed + 1,
        wins: won ? user.wins + 1 : user.wins,
        losses: won ? user.losses : user.losses + 1,
        updatedAt: Date.now()
      };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));

      if (won) {
        const txn: CoinTransaction = {
          id: generateTransactionId(),
          adminId: 'SYSTEM',
          playerId: user.playerId,
          playerName: user.name,
          type: 'MATCH_REWARD',
          amount: winReward,
          previousPlayerBalance: user.coins,
          newPlayerBalance: updatedCoins,
          previousAdminBalance: adminWallet,
          newAdminBalance: adminWallet,
          timestamp: Date.now(),
          reason: `Match Victory Payout (${count}-Player Match)`,
          status: 'COMPLETED'
        };
        setTransactions(prev => [txn, ...prev]);
      }
    }

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
  }, [players, user, adminWallet]);

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
        const cue = currentBalls.find(b => b.type === 'CUE');
        const cueScratch = !cue || cue.isPotted || cue.isSinking;
        const eightBall = currentBalls.find(b => b.type === 'EIGHT');
        const eightPotted = !eightBall || eightBall.isPotted;

        const currentPottedCount = currentBalls.filter(b => b.isPotted).length;
        const pottedThisTurn = currentPottedCount - initialPottedCount;

        const activePlayer = players[currentPlayerIndex];

        if (eightPotted) {
          const remainingObjBalls = currentBalls.filter(b => !b.isPotted && b.type !== 'CUE' && b.type !== 'EIGHT');
          const isLegitWin = remainingObjBalls.length === 0 && !cueScratch;

          if (isLegitWin) {
            setWinner(activePlayer);
          } else {
            const fallbackWinner = players.find(p => p.index !== currentPlayerIndex) || players[0];
            setWinner(fallbackWinner);
          }
          setGameState('GAME_OVER');
          const isHumanWin = (isLegitWin && activePlayer.isHuman) || (!isLegitWin && !activePlayer.isHuman);
          recordOutcome(isHumanWin, isLegitWin ? activePlayer : players[0], entryFee, players.length);
          return;
        }

        if (cueScratch) {
          setFoulMessage('FOUL! Cue ball scratched into pocket.');
          setIsBallInHand(true);

          const respawned = currentBalls.map(b => {
            if (b.type === 'CUE') {
              return { ...b, x: 280, y: 250, vx: 0, vy: 0, isPotted: false, isSinking: false, pocketProgress: 0 };
            }
            return b;
          });
          setBalls(respawned);

          setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
          setGameState('PLAYER_TURN');
        } else {
          if (pottedThisTurn > 0) {
            setPlayers(prev => prev.map((p, idx) => (idx === currentPlayerIndex ? { ...p, score: p.score + pottedThisTurn } : p)));
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

  // Match Actions
  const startQuickMatch = (fee: number): { success: boolean; error?: string } => {
    if (!user) {
      return { success: false, error: 'Please log in to play.' };
    }
    if (user.status === 'SUSPENDED') {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
    if (user.coins < fee) {
      return { success: false, error: 'Insufficient coins for match entry.' };
    }

    // Deduct entry fee
    const prevBal = user.coins;
    const newBal = user.coins - fee;
    const updatedUser: UserProfile = { ...user, coins: newBal };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));

    // Record entry transaction
    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: 'SYSTEM',
      playerId: user.playerId,
      playerName: user.name,
      type: 'MATCH_ENTRY',
      amount: fee,
      previousPlayerBalance: prevBal,
      newPlayerBalance: newBal,
      previousAdminBalance: adminWallet,
      newAdminBalance: adminWallet,
      timestamp: Date.now(),
      reason: 'Quick Match Entry Fee (4 Players)',
      status: 'COMPLETED'
    };
    setTransactions(prev => [txn, ...prev]);

    setEntryFee(fee);
    setGameState('MATCHMAKING');
    setPlayersFound(1);

    const initialMatchmaking = [
      { slot: 1, name: user.name, playerId: user.playerId, avatarId: user.avatarId, isReady: true },
      { slot: 2, name: 'Searching...', playerId: '...', avatarId: 1, isReady: false },
      { slot: 3, name: 'Searching...', playerId: '...', avatarId: 2, isReady: false },
      { slot: 4, name: 'Searching...', playerId: '...', avatarId: 3, isReady: false }
    ];
    setMatchmakingPlayers(initialMatchmaking);

    matchmakingTimerRef.current.forEach(clearTimeout);
    matchmakingTimerRef.current = [];

    const opponents = [
      { name: 'Elena', playerId: 'PLY45217', avatarId: 1 },
      { name: 'David', playerId: 'PLY91834', avatarId: 2 },
      { name: 'Alex', playerId: 'PLY33419', avatarId: 3 }
    ];

    opponents.forEach((opp, i) => {
      const t = setTimeout(() => {
        setPlayersFound(i + 2);
        setMatchmakingPlayers(prev =>
          prev.map((slot, idx) => (idx === i + 1 ? { ...slot, name: opp.name, playerId: opp.playerId, avatarId: opp.avatarId, isReady: true } : slot))
        );

        if (i === opponents.length - 1) {
          const startTimer = setTimeout(() => {
            startMatch(4, fee);
          }, 1200);
          matchmakingTimerRef.current.push(startTimer);
        }
      }, (i + 1) * 1200);

      matchmakingTimerRef.current.push(t);
    });

    return { success: true };
  };

  const cancelMatchmaking = () => {
    matchmakingTimerRef.current.forEach(clearTimeout);
    matchmakingTimerRef.current = [];

    if (user && gameState === 'MATCHMAKING') {
      const refunded = user.coins + entryFee;
      const updatedUser: UserProfile = { ...user, coins: refunded };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));
    }
    setGameState('LOBBY');
  };

  const startMatch = (playerCount: number, fee: number) => {
    if (!user) return;
    matchmakingTimerRef.current.forEach(clearTimeout);
    matchmakingTimerRef.current = [];

    const colors = ['#06B6D4', '#E11D48', '#10B981', '#F59E0B'];
    const activePlayers: GamePlayer[] = [
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

    const botNames = [
      { name: 'Elena', playerId: 'PLY45217', avatar: 1 },
      { name: 'David', playerId: 'PLY91834', avatar: 2 },
      { name: 'Alex', playerId: 'PLY33419', avatar: 3 }
    ];

    for (let i = 1; i < playerCount; i++) {
      const b = botNames[i - 1] || { name: `Bot_${i}`, playerId: `PLY0000${i}`, avatar: i };
      activePlayers.push({
        index: i,
        playerId: b.playerId,
        name: b.name,
        avatarId: b.avatar,
        isHuman: false,
        score: 0,
        themeColor: colors[i % colors.length]
      });
    }

    setPlayers(activePlayers);
    setCurrentPlayerIndex(0);
    setBalls(PoolPhysics.createInitialRack());
    setAimAngle(0);
    setCuePower(0.4);
    setIsBallInHand(false);
    setFoulMessage(null);
    setWinner(null);
    setEntryFee(fee);
    setGameState('PLAYER_TURN');
  };

  const repositionCueBall = (x: number, y: number) => {
    if (!isBallInHand) return;
    const clampedX = Math.max(160, Math.min(740, x));
    const clampedY = Math.max(160, Math.min(340, y));

    setBalls(prev =>
      prev.map(b => (b.type === 'CUE' ? { ...b, x: clampedX, y: clampedY, vx: 0, vy: 0 } : b))
    );
  };

  const confirmBallInHand = () => {
    setIsBallInHand(false);
  };

  const dismissFoul = () => {
    setFoulMessage(null);
  };

  const shoot = () => {
    if (gameState !== 'PLAYER_TURN' || isBallInHand) return;

    const cue = balls.find(b => b.type === 'CUE');
    if (!cue) return;

    const powerSpeed = 4 + cuePower * 24;
    const vx = Math.cos(aimAngle) * powerSpeed;
    const vy = Math.sin(aimAngle) * powerSpeed;

    setBalls(prev =>
      prev.map(b => (b.type === 'CUE' ? { ...b, vx, vy } : b))
    );
    setGameState('SHOT_IN_PROGRESS');
  };

  const rematch = () => {
    if (!user) return;
    if (user.coins >= entryFee) {
      const prevBal = user.coins;
      const newBal = user.coins - entryFee;
      const updatedUser: UserProfile = { ...user, coins: newBal };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));

      const txn: CoinTransaction = {
        id: generateTransactionId(),
        adminId: 'SYSTEM',
        playerId: user.playerId,
        playerName: user.name,
        type: 'MATCH_ENTRY',
        amount: entryFee,
        previousPlayerBalance: prevBal,
        newPlayerBalance: newBal,
        previousAdminBalance: adminWallet,
        newAdminBalance: adminWallet,
        timestamp: Date.now(),
        reason: 'Rematch Entry Fee',
        status: 'COMPLETED'
      };
      setTransactions(prev => [txn, ...prev]);

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
    if (!user) return;
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
    if (!user || user.coins < invite.entryFee) return;
    if (user.status === 'SUSPENDED') return;

    const prevBal = user.coins;
    const newBal = user.coins - invite.entryFee;
    const updatedUser: UserProfile = { ...user, coins: newBal };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));

    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: 'SYSTEM',
      playerId: user.playerId,
      playerName: user.name,
      type: 'MATCH_ENTRY',
      amount: invite.entryFee,
      previousPlayerBalance: prevBal,
      newPlayerBalance: newBal,
      previousAdminBalance: adminWallet,
      newAdminBalance: adminWallet,
      timestamp: Date.now(),
      reason: 'Friend Match Entry Fee',
      status: 'COMPLETED'
    };
    setTransactions(prev => [txn, ...prev]);

    setInvitations(prev => prev.map(i => (i.id === invite.id ? { ...i, status: 'ACCEPTED' } : i)));
    startMatch(2, invite.entryFee);
  };

  const rejectFriendInvite = (inviteId: string) => {
    setInvitations(prev => prev.map(i => (i.id === inviteId ? { ...i, status: 'REJECTED' } : i)));
  };

  const createPrivateRoom = (fee: number): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Please log in.' };
    if (user.status === 'SUSPENDED') {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
    if (user.coins < fee) {
      return { success: false, error: 'Insufficient coins for private room stakes.' };
    }

    const prevBal = user.coins;
    const newBal = user.coins - fee;
    const updatedUser: UserProfile = { ...user, coins: newBal };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));

    const txn: CoinTransaction = {
      id: generateTransactionId(),
      adminId: 'SYSTEM',
      playerId: user.playerId,
      playerName: user.name,
      type: 'MATCH_ENTRY',
      amount: fee,
      previousPlayerBalance: prevBal,
      newPlayerBalance: newBal,
      previousAdminBalance: adminWallet,
      newAdminBalance: adminWallet,
      timestamp: Date.now(),
      reason: 'Private Room Match Stakes',
      status: 'COMPLETED'
    };
    setTransactions(prev => [txn, ...prev]);

    startMatch(4, fee);
    return { success: true };
  };

  return (
    <GameContext.Provider
      value={{
        user,
        allUsers,
        loginUser,
        registerUser,
        logoutUser,
        updateProfile,
        adminUser,
        adminWallet,
        transactions,
        withdrawalRequests,
        suspensions,
        adminLogin,
        adminLogout,
        adminAddCoinsToPlayer,
        adminDeductCoinsFromPlayer,
        adminApproveCoinRequest,
        adminRejectCoinRequest,
        adminSuspendPlayer,
        adminUnsuspendPlayer,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        adminCompleteWithdrawal,
        matches,
        invitations,
        coinRequests,
        requestCoins,
        requestWithdrawal,
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
        createPrivateRoom
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
