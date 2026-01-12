import React, { useState } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { authService, UserRole, UserProfile } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { GoogleRoleSelectionModal } from './GoogleRoleSelectionModal';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    email: string;
    name: string;
  } | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Starting Google Sign-In...');

      // Clear any previous state
      setShowRoleSelection(false);
      setPendingGoogleUser(null);

      const result = await authService.signInWithGoogle();

      if (result) {
        // We got a result from popup, now we need to check if user exists
        console.log('Google Sign-In popup completed, checking user profile...');

        try {
          // Add a small delay to ensure Firestore is ready
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check if user profile exists
          const profile = await authService.getUserProfile(result.user.uid);

          if (profile) {
            // User exists and has profile, sign-in successful
            console.log('Existing user signed in successfully');
            await authService.updateLastLogin(result.user.uid);
            onSuccess?.();
            return;
          } else {
            // No profile found - check if user is pre-approved first
            console.log('No profile found, checking if user is pre-approved...');

            try {
              // Check if user is pre-approved for Google sign-in
              const approvedGoogleDoc = await getDoc(doc(db, 'approved_google_users', result.user.email!));

              if (approvedGoogleDoc.exists()) {
                console.log('Pre-approved Google user found, creating profile');
                const approvedData = approvedGoogleDoc.data() as UserProfile;

                // Create the actual user profile with the real UID
                const profile: UserProfile = {
                  ...approvedData,
                  uid: result.user.uid,
                  name: result.user.displayName || approvedData.name,
                  lastLogin: new Date()
                };

                await setDoc(doc(db, 'users', result.user.uid), profile);

                // Remove from pre-approved collection
                await deleteDoc(doc(db, 'approved_google_users', result.user.email!));

                console.log('Pre-approved user profile created successfully');
                await authService.updateLastLogin(result.user.uid);
                onSuccess?.();
                return;
              }
            } catch (approvedError) {
              console.error('Error checking pre-approved users:', approvedError);
              // Continue with new user flow if pre-approved check fails
            }

            // New user, needs role selection
            console.log('New user detected, checking for existing requests...');

            // Sign out the user first to prevent confusion
            await authService.signOut();

            // Check if user already has pending request
            try {
              const hasPending = await authService.checkExistingPendingRequest(result.user.email!);
              if (hasPending) {
                console.log('User already has pending request');
                onError?.('Your access request is already pending approval. Please wait for admin approval.');
                return;
              }
            } catch (pendingError) {
              console.error('Error checking pending requests:', pendingError);
              // Continue with role selection even if pending check fails
            }

            // Show role selection for new user
            console.log('Showing role selection modal for new user');
            setPendingGoogleUser({
              email: result.user.email!,
              name: result.user.displayName || result.user.email!.split('@')[0]
            });
            setShowRoleSelection(true);
            return;
          }
        } catch (profileError) {
          console.error('Error checking user profile:', profileError);

          // Sign out to prevent stuck state
          await authService.signOut();

          // If profile check fails, check if user is pre-approved before treating as new user
          console.log('Profile check failed, checking if user is pre-approved...');

          try {
            // Check if user is pre-approved for Google sign-in
            const approvedGoogleDoc = await getDoc(doc(db, 'approved_google_users', result.user.email!));

            if (approvedGoogleDoc.exists()) {
              console.log('Pre-approved Google user found after profile error');
              onError?.('Authentication error occurred. Please try signing in again.');
              return;
            }
          } catch (approvedError) {
            console.error('Error checking pre-approved users after profile error:', approvedError);
          }

          // Check if user already has pending request
          try {
            const hasPending = await authService.checkExistingPendingRequest(result.user.email!);
            if (hasPending) {
              onError?.('Your access request is already pending approval. Please wait for admin approval.');
              return;
            }
          } catch (pendingError) {
            console.error('Error checking pending requests:', pendingError);
          }

          // Show role selection
          setPendingGoogleUser({
            email: result.user.email!,
            name: result.user.displayName || result.user.email!.split('@')[0]
          });
          setShowRoleSelection(true);
          return;
        }
      }
      // If result is null, it means redirect was used and will be handled on page reload
      console.log('Google Sign-In using redirect method, will be handled on page reload');
    } catch (error: any) {
      console.error('Google Sign-In error:', error);

      let errorMessage = 'Google Sign-In failed';

      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google Sign-In. Please contact support.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In is not enabled. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message === 'PENDING_APPROVAL') {
        // This will be handled by the AuthContext
        console.log('User needs approval, will be handled by AuthContext');
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: UserRole, selectedAdminId?: string) => {
    if (!pendingGoogleUser) return;

    setLoading(true);
    try {
      console.log(`Creating Google user request for ${pendingGoogleUser.email} with role ${role}${selectedAdminId ? ` assigned to admin ${selectedAdminId}` : ''}`);

      await authService.createGoogleUserRequest(
        pendingGoogleUser.email,
        pendingGoogleUser.name,
        role,
        selectedAdminId
      );

      console.log('Google user request created successfully');

      setShowRoleSelection(false);
      setPendingGoogleUser(null);

      // Show success message - this should trigger the pending approval page
      console.log('Role selection complete, triggering success callback');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating Google user request:', error);
      onError?.(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleCancel = () => {
    setShowRoleSelection(false);
    setPendingGoogleUser(null);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>

      <GoogleRoleSelectionModal
        isOpen={showRoleSelection}
        userEmail={pendingGoogleUser?.email || ''}
        userName={pendingGoogleUser?.name || ''}
        onRoleSelect={handleRoleSelect}
        onCancel={handleRoleCancel}
        loading={loading}
      />
    </>
  );
};