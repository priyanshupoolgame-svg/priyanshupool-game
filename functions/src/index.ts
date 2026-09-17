import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: onUserCreated
 * Initializes user wallet with 100,000 Starting Coins and assigns permanent Player ID
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const userDocRef = db.collection('users').doc(uid);
  const walletDocRef = db.collection('wallets').doc(uid);

  // Generate unique Player ID
  let playerId = 'PLY' + Math.floor(10000 + Math.random() * 90000);
  const idRef = db.collection('playerIds').doc(playerId);
  const existing = await idRef.get();
  if (existing.exists) {
    playerId = 'PLY' + Date.now().toString().slice(-5);
  }

  await db.runTransaction(async (t) => {
    t.set(idRef, { uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    t.set(walletDocRef, {
      uid,
      playerId,
      balance: 100000,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    t.set(userDocRef, {
      id: uid,
      playerId,
      email: user.email || '',
      name: user.displayName || 'Player',
      avatarId: 0,
      coins: 100000,
      status: 'ACTIVE',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, { merge: true });

    // Log Welcome Grant
    const txnRef = db.collection('coinTransactions').doc('TXN_INIT_' + uid);
    t.set(txnRef, {
      id: 'TXN_INIT_' + uid,
      adminId: 'SYSTEM',
      playerId,
      playerName: user.displayName || 'Player',
      type: 'ADMIN_ADD',
      amount: 100000,
      previousPlayerBalance: 0,
      newPlayerBalance: 100000,
      previousAdminBalance: 1000000,
      newAdminBalance: 1000000,
      timestamp: Date.now(),
      reason: '100,000 Welcome Coins Grant',
      status: 'COMPLETED'
    });
  });
});

/**
 * Callable Function: adminTransferCoins
 * Server-authoritative coin transfer between admin wallet and player
 */
export const adminTransferCoins = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check admin role
  const callerUid = context.auth.uid;
  const adminCheck = await db.collection('adminUsers').doc(callerUid).get();
  if (!adminCheck.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Only authorized admins may transfer coins');
  }

  const { targetPlayerId, amount, type, reason } = data; // type: 'ADD' | 'DEDUCT'
  if (!targetPlayerId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid transfer parameters');
  }

  return await db.runTransaction(async (t) => {
    const userSnap = await db.collection('users').where('playerId', '==', targetPlayerId).limit(1).get();
    if (userSnap.empty) throw new functions.https.HttpsError('not-found', 'Target player not found');

    const userDoc = userSnap.docs[0];
    const targetUid = userDoc.id;
    const walletRef = db.collection('wallets').doc(targetUid);
    const adminWalletRef = db.collection('system').doc('adminWallet');

    const [walletDoc, adminDoc] = await Promise.all([t.get(walletRef), t.get(adminWalletRef)]);
    const playerBal = walletDoc.exists ? walletDoc.data()?.balance : 0;
    const adminBal = adminDoc.exists ? adminDoc.data()?.balance : 1000000;

    let newPlayerBal = playerBal;
    let newAdminBal = adminBal;

    if (type === 'ADD') {
      if (adminBal < amount) throw new functions.https.HttpsError('failed-precondition', 'Insufficient admin reserves');
      newAdminBal = adminBal - amount;
      newPlayerBal = playerBal + amount;
    } else {
      if (playerBal < amount) throw new functions.https.HttpsError('failed-precondition', 'Player balance insufficient');
      newAdminBal = adminBal + amount;
      newPlayerBal = playerBal - amount;
    }

    t.set(adminWalletRef, { balance: newAdminBal, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    t.set(walletRef, { balance: newPlayerBal, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    t.update(userDoc.ref, { coins: newPlayerBal, updatedAt: Date.now() });

    const txnId = 'TXN_' + Date.now();
    t.set(db.collection('coinTransactions').doc(txnId), {
      id: txnId,
      adminId: callerUid,
      playerId: targetPlayerId,
      playerName: userDoc.data()?.name || 'Player',
      type: type === 'ADD' ? 'ADMIN_ADD' : 'ADMIN_DEDUCT',
      amount,
      previousPlayerBalance: playerBal,
      newPlayerBalance: newPlayerBal,
      previousAdminBalance: adminBal,
      newAdminBalance: newAdminBal,
      timestamp: Date.now(),
      reason: reason || 'Administrative Adjustment',
      status: 'COMPLETED'
    });

    return { success: true, newPlayerBalance: newPlayerBal, newAdminBalance: newAdminBal };
  });
});
