// Debug script for Google Sign-In issues
// Run this in the browser console to check configuration

console.log('=== Google Sign-In Debug Information ===');

// Check Firebase configuration
console.log('1. Firebase Config:');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing');
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Check current URL
console.log('2. Current URL:', window.location.href);
console.log('Domain:', window.location.hostname);
console.log('Port:', window.location.port);

// Check if running on localhost
const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost');
console.log('3. Running on localhost:', isLocalhost);

// Check Firebase Auth
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('4. Firebase Auth initialized:', !!auth);
console.log('Current user:', auth.currentUser?.email || 'None');

// Test Google Auth Provider
import { GoogleAuthProvider } from 'firebase/auth';
try {
    const provider = new GoogleAuthProvider();
    console.log('5. Google Auth Provider created successfully');
} catch (error) {
    console.error('5. Error creating Google Auth Provider:', error);
}

console.log('=== End Debug Information ===');
console.log('Next steps:');
console.log('1. Ensure Google Sign-In is enabled in Firebase Console');
console.log('2. Add your domain to authorized domains in Firebase Console');
console.log('3. Check browser console for additional errors');