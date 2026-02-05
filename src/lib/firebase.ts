import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const realtimeDb = getDatabase(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  console.log('🔥 Development mode detected, connecting to emulators...');

  // Connect Auth Emulator
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('🔥 Connected to Auth Emulator at http://127.0.0.1:9099');
  } catch (error) {
    console.log('Auth Emulator connection failed:', error);
  }

  // Connect Firestore Emulator
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8081);
    console.log('🔥 Connected to Firestore Emulator at 127.0.0.1:8081');
  } catch (error) {
    console.log('Firestore Emulator connection failed:', error);
  }

  // Connect Storage Emulator
  try {
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('🔥 Connected to Storage Emulator at 127.0.0.1:9199');
  } catch (error) {
    console.log('Storage Emulator connection failed:', error);
  }

  // Connect Functions Emulator
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5002);
    console.log('🔥 Connected to Functions Emulator at 127.0.0.1:5002');
  } catch (error) {
    console.log('Functions Emulator connection failed:', error);
  }

  // Connect Realtime Database Emulator
  try {
    connectDatabaseEmulator(realtimeDb, '127.0.0.1', 9000);
    console.log('🔥 Connected to Realtime Database Emulator at 127.0.0.1:9000');
  } catch (error) {
    console.log('Realtime Database Emulator connection failed:', error);
  }
}

export default app;