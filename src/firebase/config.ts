import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Environment variables configuration
export const firebaseEnvConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Check which mandatory keys are missing
export const missingFirebaseKeys: string[] = [];
if (!firebaseEnvConfig.apiKey) missingFirebaseKeys.push('VITE_FIREBASE_API_KEY');
if (!firebaseEnvConfig.authDomain) missingFirebaseKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseEnvConfig.projectId) missingFirebaseKeys.push('VITE_FIREBASE_PROJECT_ID');
if (!firebaseEnvConfig.appId) missingFirebaseKeys.push('VITE_FIREBASE_APP_ID');

export const isFirebaseConfigured: boolean = missingFirebaseKeys.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseEnvConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.info('[8BALL PRO] Firebase successfully initialized with project:', firebaseEnvConfig.projectId);
  } catch (error) {
    console.error('[8BALL PRO] Firebase initialization error:', error);
  }
} else {
  console.warn(
    '[8BALL PRO] Firebase environment variables not fully configured. Missing:',
    missingFirebaseKeys.join(', '),
    'Running in graceful offline/demo mode until Vercel environment variables are populated.'
  );
}

export { app, auth, db };
