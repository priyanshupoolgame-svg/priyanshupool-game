import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import {
  UserProfile,
  CoinTransaction,
  WithdrawalRequest,
  CoinRequest,
  SuspensionRecord,
  MatchRecord
} from '../types';

/**
 * Subscribes in real-time to a player's user document
 * Automatically triggers whenever coins, stats, or status change!
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  if (!db || !uid) {
    return () => {};
  }

  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('subscribeToUserProfile error:', error);
    }
  );
}

/**
 * Subscribes in real-time to the Admin Wallet balance in /system/adminWallet
 */
export function subscribeToAdminWallet(
  callback: (balance: number) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const walletRef = doc(db, 'system', 'adminWallet');
  return onSnapshot(
    walletRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data().balance ?? 1000000);
      } else {
        // Initialize if not present
        setDoc(walletRef, {
          balance: 1000000,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(() => {});
        callback(1000000);
      }
    },
    (error) => {
      console.error('subscribeToAdminWallet error:', error);
    }
  );
}

/**
 * Subscribes in real-time to all registered players for the Admin Directory
 */
export function subscribeToAllUsers(
  callback: (users: UserProfile[]) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(
    q,
    (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      callback(list);
    },
    (error) => {
      console.error('subscribeToAllUsers error:', error);
    }
  );
}

/**
 * Subscribes in real-time to all coin transactions
 */
export function subscribeToTransactions(
  callback: (txns: CoinTransaction[]) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const txnsRef = collection(db, 'coinTransactions');
  const q = query(txnsRef, orderBy('timestamp', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const list: CoinTransaction[] = [];
      snap.forEach((d) => {
        list.push(d.data() as CoinTransaction);
      });
      callback(list);
    },
    (error) => {
      console.error('subscribeToTransactions error:', error);
    }
  );
}

/**
 * Subscribes in real-time to all withdrawal requests
 */
export function subscribeToWithdrawalRequests(
  callback: (reqs: WithdrawalRequest[]) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const reqsRef = collection(db, 'withdrawalRequests');
  const q = query(reqsRef, orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as WithdrawalRequest);
      });
      callback(list);
    },
    (error) => {
      console.error('subscribeToWithdrawalRequests error:', error);
    }
  );
}

/**
 * Subscribes in real-time to all coin requests (deposits)
 */
export function subscribeToCoinRequests(
  callback: (reqs: CoinRequest[]) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const reqsRef = collection(db, 'coinRequests');
  const q = query(reqsRef, orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      const list: CoinRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as CoinRequest);
      });
      callback(list);
    },
    (error) => {
      console.error('subscribeToCoinRequests error:', error);
    }
  );
}

/**
 * Subscribes in real-time to all player suspensions
 */
export function subscribeToSuspensions(
  callback: (suspensions: SuspensionRecord[]) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const suspRef = collection(db, 'suspensions');
  const q = query(suspRef, orderBy('suspendedAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list: SuspensionRecord[] = [];
      snap.forEach((d) => {
        list.push(d.data() as SuspensionRecord);
      });
      callback(list);
    },
    (error) => {
      console.error('subscribeToSuspensions error:', error);
    }
  );
}

/**
 * Subscribes in real-time to match records
 */
export function subscribeToMatches(
  callback: (matches: MatchRecord[]) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const matchRef = collection(db, 'matches');
  const q = query(matchRef, orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list: MatchRecord[] = [];
      snap.forEach((d) => {
        list.push(d.data() as MatchRecord);
      });
      callback(list);
    },
    (error) => {
      console.error('subscribeToMatches error:', error);
    }
  );
}
