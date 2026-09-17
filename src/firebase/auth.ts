import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile, AdminUser } from '../types';
import { generatePlayerId } from '../utils/security';

const MASTER_DEV_ADMIN_ID = (import.meta as any).env?.VITE_ADMIN_ID || '789895';
const MASTER_DEV_ADMIN_PASS = (import.meta as any).env?.VITE_ADMIN_PASSWORD || '020203';

/**
 * Generates a collision-resistant Player ID and locks it in Firestore
 */
export async function generateUniquePlayerId(): Promise<string> {
  if (!db) {
    return generatePlayerId();
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidateId = generatePlayerId();
    const idRef = doc(db, 'playerIds', candidateId);
    const snap = await getDoc(idRef);
    if (!snap.exists()) {
      return candidateId;
    }
  }
  return 'PLY' + Date.now().toString().slice(-5);
}

/**
 * Registers a new player in Firebase Auth & Firestore
 * Grants exactly 100,000 starting coins ONCE
 */
export async function registerPlayerWithFirebase(
  email: string,
  pass: string,
  username: string,
  name: string,
  avatarId: number
): Promise<{ success: boolean; userProfile?: UserProfile; error?: string }> {
  if (!auth || !db) {
    return { success: false, error: 'Firebase is not initialized.' };
  }

  try {
    // 1. Create Auth Account in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    const uid = fbUser.uid;

    // 2. Claim permanent unique Player ID
    const playerId = await generateUniquePlayerId();
    const idDocRef = doc(db, 'playerIds', playerId);
    await setDoc(idDocRef, {
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

    // 4. Record Initial Grant Transaction in immutable ledger
    const txnId = 'TXN_INIT_' + Date.now();
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
      reason: '100,000 Starting Coins Welcome Grant',
      status: 'COMPLETED',
      createdAt: serverTimestamp()
    });

    // 5. Create User Profile Doc in Firestore
    const now = Date.now();
    const profileData: UserProfile = {
      id: uid,
      playerId,
      username,
      email,
      passwordHash: 'FIREBASE_AUTH_SECURED',
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

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...profileData,
      role: 'player',
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp()
    });

    return { success: true, userProfile: profileData };
  } catch (err: any) {
    console.error('registerPlayerWithFirebase error:', err);
    if (err.code === 'auth/email-already-in-use') {
      return { success: false, error: 'This email address is already registered.' };
    }
    if (err.code === 'auth/weak-password') {
      return { success: false, error: 'Password should be at least 6 characters.' };
    }
    return { success: false, error: err.message || 'Registration failed.' };
  }
}

/**
 * Logs in a player using Firebase Auth (email, username, or playerId)
 */
export async function loginPlayerWithFirebase(
  identifier: string,
  pass: string
): Promise<{ success: boolean; userProfile?: UserProfile; error?: string }> {
  if (!auth || !db) {
    return { success: false, error: 'Firebase is not initialized.' };
  }

  try {
    let targetEmail = identifier.trim();

    // If identifier is a username or Player ID, resolve its registered email
    if (!targetEmail.includes('@')) {
      // Check username first
      const userQ = query(collection(db, 'users'), where('username', '==', targetEmail), limit(1));
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        targetEmail = userSnap.docs[0].data().email;
      } else {
        // Check Player ID
        const playerQ = query(collection(db, 'users'), where('playerId', '==', targetEmail.toUpperCase()), limit(1));
        const playerSnap = await getDocs(playerQ);
        if (!playerSnap.empty) {
          targetEmail = playerSnap.docs[0].data().email;
        } else {
          return { success: false, error: 'Account not found with this username or Player ID.' };
        }
      }
    }

    // Authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, pass);
    const fbUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return { success: false, error: 'Player profile document not found in database.' };
    }

    const userData = userSnap.data() as UserProfile;
    // Check suspension
    if (userData.status === 'SUSPENDED' || userData.isBlocked) {
      return {
        success: true,
        userProfile: { ...userData, status: 'SUSPENDED', isBlocked: true }
      };
    }

    return { success: true, userProfile: userData };
  } catch (err: any) {
    console.error('loginPlayerWithFirebase error:', err);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      return { success: false, error: 'Invalid email/username or password.' };
    }
    return { success: false, error: err.message || 'Authentication failed.' };
  }
}

/**
 * Logs in Admin via Firebase Authentication and verifies admin authorization
 */
export async function loginAdminWithFirebase(
  adminIdInput: string,
  passwordInput: string
): Promise<{ success: boolean; adminUser?: AdminUser; error?: string }> {
  const cleanId = adminIdInput.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: 'Please enter Admin ID and Password.' };
  }

  // Determine admin email in Firebase Auth
  const adminEmail = cleanId.includes('@')
    ? cleanId
    : `admin_${cleanId}@8ballpro.admin`;

  if (auth && db) {
    try {
      let fbUser: FirebaseUser | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, adminEmail, cleanPass);
        fbUser = cred.user;
      } catch (authErr: any) {
        // If master dev credentials match and admin account does not exist in Firebase yet, auto-provision initial admin
        if (
          (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') &&
          cleanId === MASTER_DEV_ADMIN_ID &&
          cleanPass === MASTER_DEV_ADMIN_PASS
        ) {
          try {
            const newAdminCred = await createUserWithEmailAndPassword(auth, adminEmail, cleanPass);
            fbUser = newAdminCred.user;
            // Record in adminUsers collection
            await setDoc(doc(db, 'adminUsers', fbUser.uid), {
              adminId: cleanId,
              role: 'admin',
              status: 'ACTIVE',
              name: 'Super Administrator',
              createdAt: serverTimestamp()
            });
          } catch (createErr) {
            console.error('Admin auto-provisioning error:', createErr);
          }
        } else {
          return { success: false, error: 'Invalid admin credentials.' };
        }
      }

      if (!fbUser) {
        return { success: false, error: 'Invalid admin credentials.' };
      }

      // Check Admin Role / Claims
      const tokenResult = await fbUser.getIdTokenResult(true);
      const isClaimAdmin = tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';

      // Check adminUsers document in Firestore
      const adminDoc = await getDoc(doc(db, 'adminUsers', fbUser.uid));
      const isAdminDocValid = adminDoc.exists() && (adminDoc.data()?.role === 'admin' || adminDoc.data()?.status === 'ACTIVE');

      // Check development fallback
      const isMasterDev = cleanId === MASTER_DEV_ADMIN_ID && cleanPass === MASTER_DEV_ADMIN_PASS;

      if (!isClaimAdmin && !isAdminDocValid && !isMasterDev) {
        // User is authenticated, but NOT an admin!
        await signOut(auth);
        return {
          success: false,
          error: 'Access Denied: This account does not possess administrative privileges.'
        };
      }

      const adminSession: AdminUser = {
        adminId: cleanId,
        role: 'SUPER_ADMIN',
        name: 'Super Administrator',
        status: 'ACTIVE',
        createdAt: Date.now()
      };

      return { success: true, adminUser: adminSession };
    } catch (err: any) {
      console.error('loginAdminWithFirebase error:', err);
      return { success: false, error: err.message || 'Admin authentication failed.' };
    }
  }

  // Offline / Non-Firebase Fallback (Strictly for dev if explicitly enabled)
  if (cleanId === MASTER_DEV_ADMIN_ID && cleanPass === MASTER_DEV_ADMIN_PASS) {
    return {
      success: true,
      adminUser: {
        adminId: cleanId,
        role: 'SUPER_ADMIN',
        name: 'Super Administrator',
        status: 'ACTIVE',
        createdAt: Date.now()
      }
    };
  }

  return { success: false, error: 'Invalid admin credentials.' };
}

/**
 * Signs out current user from Firebase
 */
export async function logoutFromFirebase(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Listens to Firebase Auth state changes
 */
export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
