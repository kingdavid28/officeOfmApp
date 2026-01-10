// Debug script for Google Sign-In and approval request issues
// Run this in browser console to diagnose problems

console.log('=== Authentication Debug Script ===');

// 1. Check Firebase configuration
console.log('1. Firebase Configuration:');
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing');

// 2. Check current URL and domain
console.log('2. Current Environment:');
console.log('URL:', window.location.href);
console.log('Domain:', window.location.hostname);
console.log('Port:', window.location.port);

// 3. Test Firebase Auth initialization
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('3. Firebase Auth:');
console.log('Auth initialized:', !!auth);
console.log('Current user:', auth.currentUser?.email || 'None');

// 4. Test Google Auth Provider
import { GoogleAuthProvider } from 'firebase/auth';
try {
    const provider = new GoogleAuthProvider();
    console.log('4. Google Auth Provider: Created successfully');
} catch (error) {
    console.error('4. Google Auth Provider error:', error);
}

// 5. Test Firestore connection
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const db = getFirestore();
console.log('5. Firestore:', !!db ? 'Connected' : 'Failed');

// 6. Test pending users collection access
async function testFirestoreAccess() {
    try {
        // Try to read from pending_users collection (should be allowed)
        const testDoc = doc(db, 'pending_users', 'test');
        await getDoc(testDoc);
        console.log('6. Firestore Access: Can read pending_users collection');
    } catch (error) {
        console.error('6. Firestore Access Error:', error);
    }
}

testFirestoreAccess();

console.log('=== End Debug Script ===');
console.log('Check Firebase Console for:');
console.log('1. Authentication > Sign-in method > Google enabled');
console.log('2. Authentication > Settings > Authorized domains');
console.log('3. Firestore > Rules > pending_users collection permissions');