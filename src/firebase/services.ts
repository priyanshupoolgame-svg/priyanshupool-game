import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './config';
import {
  UserProfile,
  CoinTransaction,
  WithdrawalRequest,
  FriendInvitation
} from '../types';

// ============================================================================
// 1. UNIQUE PLAYER ID GENERATION
// ============================================================================
export async function generateUniquePlayerIdFirebase(): Promise<string> {
  if (!db) {
    return 'PLY' + Math.floor(10000 + Math.random() * 90000);
  }

  // Try up to 10 times to claim an unclaimed Player ID
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidateId = 'PLY' + Math.floor(10000 + Math.random() * 90000);
    const idDocRef = doc(db, 'playerIds', candidateId);
    const existing = await getDoc(idDocRef);
    if (!existing.exists()) {
      return candidateId;
    }
  }
  return 'PLY' + Date.now().toString().slice(-5);
}

// ============================================================================
// 2. USER PROFILE & WALLET INITIALIZATION
// ============================================================================
export async function registerPlayerInFirebase(
  email: string,
  pass: string,
  username: string,
  name: string,
  avatarId: number
): Promise<{ userProfile: UserProfile; firebaseUser: FirebaseUser }> {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized.');
  }

  // 1. Create Auth Account
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = userCredential.user;
  const uid = fbUser.uid;

  // 2. Claim Player ID
  const playerId = await generateUniquePlayerIdFirebase();
  const playerRef = doc(db, 'playerIds', playerId);
  await setDoc(playerRef, {
    uid,
    createdAt: serverTimestamp()
  });

  // 3. Initialize Wallet exactly once with 100,000 starting coins
  const walletRef = doc(db, 'wallets', uid);
  await setDoc(walletRef, {
    uid,
    playerId,
    balance: 100000,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Record initial grant transaction
  const txnId = 'TXN_GRANT_' + Date.now();
  const txnRef = doc(db, 'coinTransactions', txnId);
  await setDoc(txnRef, {
    id: txnId,
    adminId: 'SYSTEM',
    playerId,
    playerName: name,
    type: 'ADMIN_ADD',
    amount: 100000,
    previousPlayerBalance: 0,
    newPlayerBalance: 100000,
    previousAdminBalance: 1000000,
    newAdminBalance: 1000000,
    timestamp: Date.now(),
    reason: 'New Player Welcome Grant (100,000 Free Coins)',
    status: 'COMPLETED'
  });

  // 4. Create User Profile Doc
  const userDocRef = doc(db, 'users', uid);
  const now = Date.now();
  const profileData: UserProfile = {
    id: uid,
    playerId,
    username,
    email,
    passwordHash: 'FIREBASE_AUTH_MANAGED',
    name,
    avatarId,
    coins: 100000,
    status: 'ACTIVE',
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    createdAt: now,
    updatedAt: now,
    lastActive: now,
    isBlocked: false
  };

  await setDoc(userDocRef, {
    ...profileData,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp()
  });

  return { userProfile: profileData, firebaseUser: fbUser };
}

// ============================================================================
// 3. ADMIN WALLET MANAGEMENT
// ============================================================================
export async function getAdminWalletBalance(): Promise<number> {
  if (!db) return 1000000;
  const adminRef = doc(db, 'system', 'adminWallet');
  const snap = await getDoc(adminRef);
  if (snap.exists()) {
    return snap.data().balance ?? 1000000;
  }
  // Initialize with exactly 1,000,000 coins
  await setDoc(adminRef, {
    balance: 1000000,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return 1000000;
}

// Atomic transfer from Admin to Player
export async function atomicAdminAddCoins(
  targetPlayerId: string,
  amount: number,
  adminId: string,
  reason: string = 'Administrative Credit'
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  const firestore = db;

  try {
    return await runTransaction(firestore, async (transaction) => {
      // 1. Find user by playerId
      const usersQuery = query(collection(firestore, 'users'), where('playerId', '==', targetPlayerId), limit(1));
      const userSnap = await getDocs(usersQuery);
      if (userSnap.empty) return { success: false, error: 'Target player not found' };

      const userDoc = userSnap.docs[0];
      const uid = userDoc.id;
      const userData = userDoc.data() as UserProfile;

      // 2. Admin Wallet
      const adminWalletRef = doc(firestore, 'system', 'adminWallet');
      const adminSnap = await transaction.get(adminWalletRef);
      const currentAdminBal = adminSnap.exists() ? adminSnap.data().balance : 1000000;

      if (currentAdminBal < amount) {
        return { success: false, error: 'Admin wallet has insufficient coin reserves' };
      }

      // 3. Player Wallet
      const walletRef = doc(firestore, 'wallets', uid);
      const walletSnap = await transaction.get(walletRef);
      const currentPlayerBal = walletSnap.exists() ? walletSnap.data().balance : (userData.coins || 0);

      const newAdminBal = currentAdminBal - amount;
      const newPlayerBal = currentPlayerBal + amount;

      // Update Admin Wallet
      transaction.set(adminWalletRef, { balance: newAdminBal, updatedAt: serverTimestamp() }, { merge: true });

      // Update Player Wallet
      transaction.set(walletRef, { balance: newPlayerBal, updatedAt: serverTimestamp() }, { merge: true });

      // Update User Doc
      transaction.update(userDoc.ref, { coins: newPlayerBal, updatedAt: Date.now() });

      // Record Transaction
      const txnId = 'TXN_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const txnRef = doc(firestore, 'coinTransactions', txnId);
      const txnData: CoinTransaction = {
        id: txnId,
        adminId,
        playerId: targetPlayerId,
        playerName: userData.name,
        type: 'ADMIN_ADD',
        amount,
        previousPlayerBalance: currentPlayerBal,
        newPlayerBalance: newPlayerBal,
        previousAdminBalance: currentAdminBal,
        newAdminBalance: newAdminBal,
        timestamp: Date.now(),
        reason,
        status: 'COMPLETED'
      };
      transaction.set(txnRef, { ...txnData, serverTimestamp: serverTimestamp() });

      return { success: true };
    });
  } catch (err: any) {
    console.error('atomicAdminAddCoins error:', err);
    return { success: false, error: err.message || 'Transaction failed' };
  }
}

// Atomic transfer from Player to Admin
export async function atomicAdminDeductCoins(
  targetPlayerId: string,
  amount: number,
  adminId: string,
  reason: string = 'Administrative Deduction'
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  const firestore = db;

  try {
    return await runTransaction(firestore, async (transaction) => {
      const usersQuery = query(collection(firestore, 'users'), where('playerId', '==', targetPlayerId), limit(1));
      const userSnap = await getDocs(usersQuery);
      if (userSnap.empty) return { success: false, error: 'Target player not found' };

      const userDoc = userSnap.docs[0];
      const uid = userDoc.id;
      const userData = userDoc.data() as UserProfile;

      const walletRef = doc(firestore, 'wallets', uid);
      const walletSnap = await transaction.get(walletRef);
      const currentPlayerBal = walletSnap.exists() ? walletSnap.data().balance : (userData.coins || 0);

      if (currentPlayerBal < amount) {
        return { success: false, error: `Player only has ${currentPlayerBal.toLocaleString()} coins` };
      }

      const adminWalletRef = doc(firestore, 'system', 'adminWallet');
      const adminSnap = await transaction.get(adminWalletRef);
      const currentAdminBal = adminSnap.exists() ? adminSnap.data().balance : 1000000;

      const newPlayerBal = currentPlayerBal - amount;
      const newAdminBal = currentAdminBal + amount;

      transaction.set(adminWalletRef, { balance: newAdminBal, updatedAt: serverTimestamp() }, { merge: true });
      transaction.set(walletRef, { balance: newPlayerBal, updatedAt: serverTimestamp() }, { merge: true });
      transaction.update(userDoc.ref, { coins: newPlayerBal, updatedAt: Date.now() });

      const txnId = 'TXN_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const txnRef = doc(firestore, 'coinTransactions', txnId);
      const txnData: CoinTransaction = {
        id: txnId,
        adminId,
        playerId: targetPlayerId,
        playerName: userData.name,
        type: 'ADMIN_DEDUCT',
        amount,
        previousPlayerBalance: currentPlayerBal,
        newPlayerBalance: newPlayerBal,
        previousAdminBalance: currentAdminBal,
        newAdminBalance: newAdminBal,
        timestamp: Date.now(),
        reason,
        status: 'COMPLETED'
      };
      transaction.set(txnRef, { ...txnData, serverTimestamp: serverTimestamp() });

      return { success: true };
    });
  } catch (err: any) {
    console.error('atomicAdminDeductCoins error:', err);
    return { success: false, error: err.message || 'Transaction failed' };
  }
}

// ============================================================================
// 4. ATOMIC MATCH ENTRY & REWARD
// ============================================================================
export async function atomicDeductMatchEntryFee(
  uid: string,
  playerId: string,
  name: string,
  fee: number,
  matchDescription: string = 'Match Entry Stakes'
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  const firestore = db;

  try {
    return await runTransaction(firestore, async (transaction) => {
      const walletRef = doc(firestore, 'wallets', uid);
      const walletSnap = await transaction.get(walletRef);
      if (!walletSnap.exists()) return { success: false, error: 'Wallet not found' };

      const currentBal = walletSnap.data().balance || 0;
      if (currentBal < fee) {
        return { success: false, error: 'Insufficient coins for match entry' };
      }

      const newBal = currentBal - fee;
      transaction.update(walletRef, { balance: newBal, updatedAt: serverTimestamp() });

      const userDocRef = doc(firestore, 'users', uid);
      transaction.update(userDocRef, { coins: newBal, updatedAt: Date.now() });

      const txnId = 'TXN_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const txnRef = doc(firestore, 'coinTransactions', txnId);
      const txnData: CoinTransaction = {
        id: txnId,
        adminId: 'SYSTEM',
        playerId,
        playerName: name,
        type: 'MATCH_ENTRY',
        amount: fee,
        previousPlayerBalance: currentBal,
        newPlayerBalance: newBal,
        previousAdminBalance: 1000000,
        newAdminBalance: 1000000,
        timestamp: Date.now(),
        reason: matchDescription,
        status: 'COMPLETED'
      };
      transaction.set(txnRef, { ...txnData, serverTimestamp: serverTimestamp() });

      return { success: true, newBalance: newBal };
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to deduct entry fee' };
  }
}

// Atomic Winner Payout (idempotent, server-authoritative)
export async function atomicPayoutMatchWinner(
  matchId: string,
  winnerUid: string,
  winnerPlayerId: string,
  winnerName: string,
  payoutAmount: number
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  const firestore = db;

  try {
    return await runTransaction(firestore, async (transaction) => {
      const matchRef = doc(firestore, 'matches', matchId);
      const matchSnap = await transaction.get(matchRef);
      if (matchSnap.exists()) {
        const matchData = matchSnap.data();
        if (matchData.status === 'COMPLETED' && matchData.paidOut) {
          return { success: true }; // Already paid out, idempotent protection!
        }
        transaction.update(matchRef, {
          status: 'COMPLETED',
          winnerUid,
          winnerPlayerId,
          paidOut: true,
          finishedAt: serverTimestamp()
        });
      }

      const walletRef = doc(firestore, 'wallets', winnerUid);
      const walletSnap = await transaction.get(walletRef);
      if (!walletSnap.exists()) return { success: false, error: 'Winner wallet not found' };

      const currentBal = walletSnap.data().balance || 0;
      const newBal = currentBal + payoutAmount;

      transaction.update(walletRef, { balance: newBal, updatedAt: serverTimestamp() });

      const userDocRef = doc(firestore, 'users', winnerUid);
      transaction.update(userDocRef, {
        coins: newBal,
        wins: (walletSnap.data().wins || 0) + 1,
        matchesPlayed: (walletSnap.data().matchesPlayed || 0) + 1,
        updatedAt: Date.now()
      });

      const txnId = 'TXN_WIN_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const txnRef = doc(firestore, 'coinTransactions', txnId);
      const txnData: CoinTransaction = {
        id: txnId,
        adminId: 'SYSTEM',
        playerId: winnerPlayerId,
        playerName: winnerName,
        type: 'MATCH_REWARD',
        amount: payoutAmount,
        previousPlayerBalance: currentBal,
        newPlayerBalance: newBal,
        previousAdminBalance: 1000000,
        newAdminBalance: 1000000,
        timestamp: Date.now(),
        reason: `1st Place Prize Payout for Match ${matchId}`,
        status: 'COMPLETED'
      };
      transaction.set(txnRef, { ...txnData, serverTimestamp: serverTimestamp() });

      return { success: true };
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Winner payout failed' };
  }
}

// ============================================================================
// 5. WITHDRAWAL REQUESTS (MIN 500,000 COINS = ₹100)
// ============================================================================
export async function atomicRequestWithdrawal(
  uid: string,
  playerId: string,
  playerName: string,
  coins: number
): Promise<{ success: boolean; withdrawalId?: string; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  const firestore = db;

  if (coins < 500000) {
    return { success: false, error: 'Minimum withdrawal requirement is 500,000 Coins.' };
  }

  try {
    return await runTransaction(firestore, async (transaction) => {
      const walletRef = doc(firestore, 'wallets', uid);
      const walletSnap = await transaction.get(walletRef);
      if (!walletSnap.exists()) return { success: false, error: 'Wallet not found' };

      const currentBal = walletSnap.data().balance || 0;
      if (currentBal < coins) {
        return { success: false, error: `Insufficient coins. You have ${currentBal.toLocaleString()} Coins.` };
      }

      const currencyValue = Math.floor((coins / 500000) * 100);
      const newBal = currentBal - coins;

      // Lock coins in escrow
      transaction.update(walletRef, { balance: newBal, updatedAt: serverTimestamp() });

      const userDocRef = doc(firestore, 'users', uid);
      transaction.update(userDocRef, { coins: newBal, updatedAt: Date.now() });

      const wdrId = 'WDR' + Date.now().toString().slice(-6);
      const wdrRef = doc(firestore, 'withdrawalRequests', wdrId);
      const wdrData: WithdrawalRequest = {
        id: wdrId,
        playerId,
        playerName,
        coinsRequested: coins,
        currencyValue,
        status: 'PENDING',
        createdAt: Date.now(),
        notes: 'Controlled In-Game Redemption Request'
      };
      transaction.set(wdrRef, { ...wdrData, serverTimestamp: serverTimestamp() });

      const txnId = 'TXN_WDR_LOCK_' + Date.now();
      const txnRef = doc(firestore, 'coinTransactions', txnId);
      const txnData: CoinTransaction = {
        id: txnId,
        adminId: 'SYSTEM',
        playerId,
        playerName,
        type: 'WITHDRAWAL_LOCK',
        amount: coins,
        previousPlayerBalance: currentBal,
        newPlayerBalance: newBal,
        previousAdminBalance: 1000000,
        newAdminBalance: 1000000,
        timestamp: Date.now(),
        reason: `Withdrawal Request ${wdrId} (₹${currencyValue}) locked in escrow`,
        status: 'COMPLETED'
      };
      transaction.set(txnRef, { ...txnData, serverTimestamp: serverTimestamp() });

      return { success: true, withdrawalId: wdrId };
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Withdrawal submission failed' };
  }
}

// Refund rejected withdrawal back to user
export async function atomicAdminRejectWithdrawal(
  wdrId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  const firestore = db;

  try {
    return await runTransaction(firestore, async (transaction) => {
      const wdrRef = doc(firestore, 'withdrawalRequests', wdrId);
      const wdrSnap = await transaction.get(wdrRef);
      if (!wdrSnap.exists()) return { success: false, error: 'Request not found' };

      const wdrData = wdrSnap.data() as WithdrawalRequest;
      if (wdrData.status === 'REJECTED' || wdrData.status === 'COMPLETED') {
        return { success: false, error: 'Request is already resolved' };
      }

      // Find user
      const usersQuery = query(collection(firestore, 'users'), where('playerId', '==', wdrData.playerId), limit(1));
      const userSnap = await getDocs(usersQuery);
      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        const uid = userDoc.id;
        const walletRef = doc(firestore, 'wallets', uid);
        const walletSnap = await transaction.get(walletRef);
        const currentBal = walletSnap.exists() ? walletSnap.data().balance : 0;
        const newBal = currentBal + wdrData.coinsRequested;

        transaction.set(walletRef, { balance: newBal, updatedAt: serverTimestamp() }, { merge: true });
        transaction.update(userDoc.ref, { coins: newBal, updatedAt: Date.now() });

        const txnId = 'TXN_WDR_REFUND_' + Date.now();
        const txnRef = doc(firestore, 'coinTransactions', txnId);
        const txnData: CoinTransaction = {
          id: txnId,
          adminId,
          playerId: wdrData.playerId,
          playerName: wdrData.playerName,
          type: 'WITHDRAWAL_REFUND',
          amount: wdrData.coinsRequested,
          previousPlayerBalance: currentBal,
          newPlayerBalance: newBal,
          previousAdminBalance: 1000000,
          newAdminBalance: 1000000,
          timestamp: Date.now(),
          reason: `Withdrawal ${wdrId} rejected by Admin - Coins refunded`,
          status: 'COMPLETED'
        };
        transaction.set(txnRef, { ...txnData, serverTimestamp: serverTimestamp() });
      }

      transaction.update(wdrRef, {
        status: 'REJECTED',
        processedAt: Date.now(),
        adminId
      });

      return { success: true };
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Rejection failed' };
  }
}

// ============================================================================
// 6. REAL-TIME MULTIPLAYER MATCHMAKING QUEUE
// ============================================================================
export interface MatchmakingQueueEntry {
  id: string;
  uid: string;
  playerId: string;
  name: string;
  avatarId: number;
  entryFee: number;
  status: 'WAITING' | 'MATCHED';
  matchId?: string;
  createdAt: number;
}

export async function joinMatchmakingQueue(
  uid: string,
  playerId: string,
  name: string,
  avatarId: number,
  entryFee: number
): Promise<{ queueId: string }> {
  if (!db) throw new Error('Database offline');

  const queueId = 'queue_' + uid;
  const queueRef = doc(db, 'matchmaking', queueId);
  await setDoc(queueRef, {
    id: queueId,
    uid,
    playerId,
    name,
    avatarId,
    entryFee,
    status: 'WAITING',
    createdAt: Date.now(),
    serverTimestamp: serverTimestamp()
  });

  return { queueId };
}

export async function leaveMatchmakingQueue(uid: string): Promise<void> {
  if (!db) return;
  const queueRef = doc(db, 'matchmaking', 'queue_' + uid);
  await deleteDoc(queueRef).catch(() => {});
}

// ============================================================================
// 7. REAL-TIME LISTENERS
// ============================================================================
export function listenToUserWallet(
  uid: string,
  onUpdate: (balance: number) => void
): () => void {
  if (!db) return () => {};
  const walletRef = doc(db, 'wallets', uid);
  return onSnapshot(walletRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data().balance ?? 0);
    }
  }, (err) => console.warn('Wallet listener error:', err));
}

export function listenToUserProfile(
  uid: string,
  onUpdate: (profile: Partial<UserProfile>) => void
): () => void {
  if (!db) return () => {};
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as UserProfile);
    }
  }, (err) => console.warn('Profile listener error:', err));
}

export function listenToAllUsers(
  onUpdate: (users: UserProfile[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    const list: UserProfile[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as UserProfile);
    });
    onUpdate(list);
  }, (err) => console.warn('All users listener error:', err));
}

export function listenToCoinTransactions(
  onUpdate: (txns: CoinTransaction[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'coinTransactions'), orderBy('timestamp', 'desc'), limit(150));
  return onSnapshot(q, (snap) => {
    const list: CoinTransaction[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as CoinTransaction);
    });
    onUpdate(list);
  }, (err) => console.warn('Transactions listener error:', err));
}

export function listenToWithdrawalRequests(
  onUpdate: (reqs: WithdrawalRequest[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'withdrawalRequests'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const list: WithdrawalRequest[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as WithdrawalRequest);
    });
    onUpdate(list);
  }, (err) => console.warn('Withdrawals listener error:', err));
}

export function listenToInvitations(
  toPlayerId: string,
  onUpdate: (invites: FriendInvitation[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(
    collection(db, 'invitations'),
    where('toPlayerId', '==', toPlayerId),
    where('status', '==', 'PENDING'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const list: FriendInvitation[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as FriendInvitation);
    });
    onUpdate(list);
  }, (err) => console.warn('Invitations listener error:', err));
}

export function listenToAdminWallet(
  onUpdate: (balance: number) => void
): () => void {
  if (!db) return () => {};
  const adminRef = doc(db, 'system', 'adminWallet');
  return onSnapshot(adminRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data().balance ?? 1000000);
    }
  }, (err) => console.warn('Admin wallet listener error:', err));
}

export async function atomicSuspendPlayer(
  targetPlayerId: string,
  reason: string,
  adminId: string = '789895'
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  try {
    const usersQuery = query(collection(db, 'users'), where('playerId', '==', targetPlayerId), limit(1));
    const userSnap = await getDocs(usersQuery);
    if (userSnap.empty) return { success: false, error: 'Player not found' };

    const userDoc = userSnap.docs[0];
    await updateDoc(userDoc.ref, {
      status: 'SUSPENDED',
      isBlocked: true,
      updatedAt: Date.now()
    });

    const suspId = 'SUSP_' + Date.now();
    await setDoc(doc(db, 'suspensions', suspId), {
      id: suspId,
      playerId: targetPlayerId,
      playerName: userDoc.data().name || targetPlayerId,
      reason,
      suspendedBy: adminId,
      suspendedAt: Date.now(),
      isActive: true,
      serverTimestamp: serverTimestamp()
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Suspension failed' };
  }
}

export async function atomicUnsuspendPlayer(
  targetPlayerId: string,
  _adminId: string = '789895'
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database offline' };
  try {
    const usersQuery = query(collection(db, 'users'), where('playerId', '==', targetPlayerId), limit(1));
    const userSnap = await getDocs(usersQuery);
    if (userSnap.empty) return { success: false, error: 'Player not found' };

    const userDoc = userSnap.docs[0];
    await updateDoc(userDoc.ref, {
      status: 'ACTIVE',
      isBlocked: false,
      updatedAt: Date.now()
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unsuspension failed' };
  }
}

