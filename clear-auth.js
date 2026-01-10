// Run this in browser console to clear authentication state
// This will force a fresh sign-in

import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();

// Sign out current user
signOut(auth).then(() => {
    console.log('User signed out');

    // Clear local storage
    localStorage.clear();

    // Clear session storage
    sessionStorage.clear();

    // Reload page
    window.location.reload();
}).catch((error) => {
    console.error('Error signing out:', error);
});