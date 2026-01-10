import { authService } from '../lib/auth';

/**
 * Force sign out and clear all authentication state
 * Useful for development when you want to test different users
 */
export const forceSignOut = async () => {
    try {
        // Sign out from Firebase
        await authService.signOut();

        // Clear local storage
        localStorage.clear();

        // Clear session storage
        sessionStorage.clear();

        console.log('Authentication state cleared successfully');

        // Reload the page to ensure clean state
        window.location.reload();
    } catch (error) {
        console.error('Error clearing authentication state:', error);
    }
};

/**
 * Check if there's a cached user and log details
 */
export const debugCurrentUser = () => {
    const user = authService.getCurrentUser();
    if (user) {
        console.log('Current cached user:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified
        });
    } else {
        console.log('No cached user found');
    }
    return user;
};