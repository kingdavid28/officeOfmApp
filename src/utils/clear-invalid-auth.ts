import { authService } from '../lib/auth';

/**
 * Clear invalid authentication states on app startup
 * This prevents users from being automatically signed in with cached sessions
 * that don't have valid profiles
 */
export const clearInvalidAuthState = async () => {
    try {
        const currentUser = authService.getCurrentUser();

        if (currentUser) {
            console.log('Checking cached user:', currentUser.email);

            // Try to get user profile
            const profile = await authService.getUserProfile(currentUser.uid);

            if (!profile) {
                console.log('Cached user has no profile, clearing session');
                await authService.signOut();
                localStorage.clear();
                sessionStorage.clear();
                return true; // Indicates session was cleared
            }

            console.log('Cached user has valid profile:', profile.email);
            return false; // Session is valid
        }

        return false; // No cached user
    } catch (error) {
        console.error('Error checking cached auth state:', error);
        // If there's an error, clear the session to be safe
        await authService.signOut();
        localStorage.clear();
        sessionStorage.clear();
        return true;
    }
};