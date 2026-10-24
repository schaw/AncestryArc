import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Reads Vite environment variables or direct project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAaAfXAxxP65TOhQsC2ai4rSan7fTKDuRg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ancestry-arc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ancestry-arc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ancestry-arc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "68140626996",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:68140626996:web:907c0bd4318ff375928661"
};

// Check if valid Firebase credentials have been configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "YOUR_API_KEY"
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { app, auth, db, googleProvider };
