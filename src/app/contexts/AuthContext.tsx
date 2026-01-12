import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService, UserProfile } from '../../lib/auth';
import { useToast } from '../hooks/useToast';
import { appInitialization } from '../../lib/app-initialization';
import '../../utils/debug-profile'; // Import debug utilities

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Clear any invalid cached authentication state first
    const initializeAuth = async () => {
      // Handle Google Sign-In redirect result on app load
      const handleRedirectResult = async () => {
        try {
          console.log('Checking for Google Sign-In redirect result...');
          const result = await authService.handleRedirectResult();
          if (result) {
            console.log('Google redirect sign-in completed for:', result.user.email);
            // The auth state change handler will process this user
          } else {
            console.log('No redirect result found');
          }
        } catch (error: any) {
          console.error('Google redirect error:', error);

          // Ensure user is signed out if redirect fails
          try {
            await authService.signOut();
          } catch (signOutError) {
            console.error('Error signing out after redirect failure:', signOutError);
          }

          // Handle specific error types
          if (error.message === 'PENDING_APPROVAL') {
            console.log('User needs approval after redirect');
            setAuthError('pending_approval');
          } else {
            // Use toast for other errors
            toast.error('Authentication Failed', error.message || 'Please try again.');
          }
        }
      };

      await handleRedirectResult();
    };

    initializeAuth();

    const unsubscribe = authService.onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? `${user.email} (${user.uid})` : 'signed out');
      setUser(user);

      if (user) {
        console.log('User authenticated:', user.uid);

        // Add a small delay to ensure Firestore is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          // Retry profile fetch with exponential backoff for first-time sign-ins
          let profile = null;
          let retries = 0;
          const maxRetries = 5; // Increased retries for better reliability

          while (!profile && retries < maxRetries) {
            try {
              profile = await authService.getUserProfile(user.uid);
              if (profile) {
                console.log('User profile found:', profile);
                break;
              }

              // Wait before retry with exponential backoff
              const delay = 100 * Math.pow(2, retries); // 100ms, 200ms, 400ms, 800ms, 1600ms
              console.log(`Profile not found, retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retries++;
            } catch (fetchError) {
              console.error(`Profile fetch attempt ${retries + 1} failed:`, fetchError);
              retries++;
              if (retries < maxRetries) {
                const delay = 100 * Math.pow(2, retries - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          if (!profile) {
            console.log('No user profile found for UID after all retries:', user.uid);
            console.log('User details:', {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              emailVerified: user.emailVerified,
              providerData: user.providerData
            });

            // Check if this is a Google user who might need approval
            const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');

            if (isGoogleUser) {
              console.log('Google user without profile detected - checking if user is pre-approved');

              // First check if user is pre-approved for Google sign-in
              try {
                const { getDoc, doc, setDoc, deleteDoc } = await import('firebase/firestore');
                const { db } = await import('../../lib/firebase');

                const approvedGoogleDoc = await getDoc(doc(db, 'approved_google_users', user.email!));

                if (approvedGoogleDoc.exists()) {
                  console.log('Pre-approved Google user found in AuthContext, creating profile');
                  const approvedData = approvedGoogleDoc.data() as UserProfile;

                  // Create the actual user profile with the real UID
                  const profile: UserProfile = {
                    ...approvedData,
                    uid: user.uid,
                    name: user.displayName || approvedData.name,
                    lastLogin: new Date()
                  };

                  await setDoc(doc(db, 'users', user.uid), profile);

                  // Remove from pre-approved collection
                  await deleteDoc(doc(db, 'approved_google_users', user.email!));

                  console.log('Pre-approved user profile created successfully in AuthContext');

                  // Set the profile and continue with normal flow
                  setUserProfile(profile);
                  setAuthError(null);
                  await authService.updateLastLogin(user.uid);

                  // Initialize app components (categories, etc.)
                  await appInitialization.initializeApp();

                  console.log('User successfully authenticated with pre-approved profile:', {
                    email: profile.email,
                    role: profile.role,
                    name: profile.name
                  });

                  setLoading(false);
                  return;
                }
              } catch (approvedError) {
                console.error('Error checking pre-approved users in AuthContext:', approvedError);
                // Continue with normal flow if pre-approved check fails
              }

              // Check if user has pending request
              try {
                const hasPending = await authService.checkExistingPendingRequest(user.email!);
                if (hasPending) {
                  console.log('User has pending approval request - signing out and showing pending approval page');
                  await authService.signOut();
                  setAuthError('pending_approval');
                  return;
                } else {
                  console.log('No pending request found - this user may need to go through role selection again');
                  // Don't set auth error here, let them try role selection again
                  await authService.signOut();
                  return;
                }
              } catch (pendingError) {
                console.error('Error checking pending requests:', pendingError);
                console.log('Assuming user needs approval due to pending check failure');
                await authService.signOut();
                setAuthError('pending_approval');
                return;
              }
            }

            // Sign out user without profile to prevent app crashes
            console.log('Signing out user without profile');
            await authService.signOut();
            setAuthError('pending_approval');
            return;
          }

          // Profile found, set it and clear any auth errors
          setUserProfile(profile);
          setAuthError(null);

          // Initialize app components (categories, etc.)
          await appInitialization.initializeApp();

          console.log('User successfully authenticated with profile:', {
            email: profile.email,
            role: profile.role,
            name: profile.name
          });

        } catch (error) {
          console.error('Error in auth state change handler:', error);

          // Sign out user if profile processing fails to prevent using cached invalid sessions
          console.log('Signing out user due to profile processing error');
          try {
            await authService.signOut();
          } catch (signOutError) {
            console.error('Error signing out after profile error:', signOutError);
          }

          toast.error('Authentication Error', 'Please try signing in again.');
          return;
        }
      } else {
        // User signed out
        setUserProfile(null);
        setAuthError(null); // Clear auth error when user signs out
        console.log('User signed out, cleared profile and auth errors');
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setAuthError(null); // Clear any auth errors
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signOut,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}