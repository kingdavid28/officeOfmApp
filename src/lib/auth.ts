import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { PendingUser } from './types';

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'superadmin@office.com';
const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

export type UserRole = 'super_admin' | 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  lastLogin: Date;
  approvedBy?: string;
  approvedAt?: Date;
  assignedAdminId?: string; // For staff members - which admin they belong to
  updatedAt?: Date; // For tracking profile updates
}

export const authService = {
  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Ensure user profile exists after sign-in
    try {
      const profile = await this.getUserProfile(result.user.uid);
      if (!profile) {
        console.error('User authenticated but no profile found:', result.user.email);
        await signOut(auth);
        throw new Error('Account not properly set up. Please contact administrator.');
      }

      await this.updateLastLogin(result.user.uid);
      return result;
    } catch (error) {
      console.error('Error verifying user profile after sign-in:', error);
      await signOut(auth);
      throw error;
    }
  },

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      console.log('Starting Google Sign-In...');

      // Try popup first, fallback to redirect if it fails
      try {
        console.log('Attempting popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        console.log('Popup sign-in successful:', result.user.email);

        // For popup, we need to handle the result differently
        // Don't process immediately, let the caller handle it
        return result;
      } catch (popupError: any) {
        console.log('Popup failed, trying redirect:', popupError.code);

        // Common popup failure codes that should fallback to redirect
        if (
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.message?.includes('popup')
        ) {
          console.log('Using redirect method...');
          await signInWithRedirect(auth, provider);
          return null; // Redirect will handle the rest
        } else {
          // Re-throw other errors
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },

  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (!result) return null;

      console.log('Google redirect sign-in completed for:', result.user.email);

      // Check if user profile exists
      const profile = await this.getUserProfile(result.user.uid);

      if (profile) {
        // User exists, update last login and continue
        await this.updateLastLogin(result.user.uid);
        return result;
      } else {
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

          await this.updateLastLogin(result.user.uid);
          return result;
        }

        // New user from redirect - they need to go through the registration process
        await signOut(auth);
        throw new Error('PENDING_APPROVAL');
      }
    } catch (error) {
      console.error('Google redirect result error:', error);
      throw error;
    }
  },

  async checkExistingPendingRequest(email: string): Promise<boolean> {
    const q = query(
      collection(db, 'pending_users'),
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  async createGoogleUserRequest(email: string, name: string, role: UserRole, requestedAdminId?: string) {
    // Check if user already has a pending request
    const existingPending = await this.checkExistingPendingRequest(email);
    if (existingPending) {
      throw new Error('A request for this email is already pending approval.');
    }

    const pendingUser: Omit<PendingUser, 'id'> = {
      email,
      name,
      role,
      requestedAt: new Date(),
      status: 'pending',
      authProvider: 'google',
      requestedAdminId: role === 'staff' ? requestedAdminId : undefined
    };

    const docRef = await addDoc(collection(db, 'pending_users'), pendingUser);
    return docRef.id;
  },

  async requestUserCreation(email: string, name: string, role: UserRole = 'staff', requestedAdminId?: string) {
    if (role === 'super_admin') {
      throw new Error('Super admin accounts cannot be requested');
    }

    // Check if user already has a pending request
    const existingPending = await this.checkExistingPendingRequest(email);
    if (existingPending) {
      throw new Error('A request for this email is already pending approval.');
    }

    const pendingUser: Omit<PendingUser, 'id'> = {
      email,
      name,
      role,
      requestedAt: new Date(),
      status: 'pending',
      authProvider: 'email',
      requestedAdminId: role === 'staff' ? requestedAdminId : undefined
    };

    const docRef = await addDoc(collection(db, 'pending_users'), pendingUser);
    return docRef.id;
  },

  async approveGoogleUser(pendingUserId: string, approverUid: string) {
    // SECURITY: Admins can approve staff, Super admins can approve all roles
    const approverProfile = await this.getUserProfile(approverUid);
    if (!approverProfile) {
      throw new Error('Approver profile not found');
    }

    if (approverProfile.role !== 'admin' && approverProfile.role !== 'super_admin') {
      throw new Error('Only administrators and super administrators can approve user accounts');
    }

    const pendingDoc = await getDoc(doc(db, 'pending_users', pendingUserId));
    if (!pendingDoc.exists()) {
      throw new Error('Pending user not found');
    }

    const pendingUser = pendingDoc.data() as PendingUser;
    if (pendingUser.status !== 'pending') {
      throw new Error('User request already processed');
    }

    if (pendingUser.authProvider !== 'google') {
      throw new Error('This method is only for Google users');
    }

    // SECURITY: Regular admins can only approve staff accounts
    if (approverProfile.role === 'admin' && pendingUser.role !== 'staff') {
      throw new Error('Administrators can only approve staff accounts. Contact a super admin to approve administrator accounts.');
    }

    // SECURITY: Only super admins can approve admin and super admin accounts
    if ((pendingUser.role === 'admin' || pendingUser.role === 'super_admin') && approverProfile.role !== 'super_admin') {
      throw new Error('Only super administrators can approve administrator and super administrator accounts');
    }

    // For Google users, we create the profile without creating a Firebase Auth account
    // since they'll authenticate through Google OAuth
    const profile: UserProfile = {
      uid: `google_${pendingUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`, // Temporary UID until they sign in
      email: pendingUser.email,
      role: pendingUser.role,
      name: pendingUser.name,
      createdAt: new Date(),
      lastLogin: new Date(),
      approvedBy: approverUid,
      approvedAt: new Date(),
      assignedAdminId: pendingUser.role === 'staff' ? (pendingUser.requestedAdminId || approverUid) : undefined
    };

    // Store in a separate collection for pre-approved Google users
    await setDoc(doc(db, 'approved_google_users', pendingUser.email), profile);

    // Update pending user status
    await updateDoc(doc(db, 'pending_users', pendingUserId), {
      status: 'approved',
      approvedBy: approverUid,
      approvedAt: new Date()
    });

    console.log(`Google user approved: ${pendingUser.email} with role ${pendingUser.role} by ${approverProfile.email} (${approverProfile.role})`);
  },

  async approveUser(pendingUserId: string, password: string, approverUid: string) {
    // SECURITY: Admins can approve staff, Super admins can approve all roles
    const approverProfile = await this.getUserProfile(approverUid);
    if (!approverProfile) {
      throw new Error('Approver profile not found');
    }

    if (approverProfile.role !== 'admin' && approverProfile.role !== 'super_admin') {
      throw new Error('Only administrators and super administrators can approve user accounts');
    }

    const pendingDoc = await getDoc(doc(db, 'pending_users', pendingUserId));
    if (!pendingDoc.exists()) {
      throw new Error('Pending user not found');
    }

    const pendingUser = pendingDoc.data() as PendingUser;
    if (pendingUser.status !== 'pending') {
      throw new Error('User request already processed');
    }

    // SECURITY: Regular admins can only approve staff accounts
    if (approverProfile.role === 'admin' && pendingUser.role !== 'staff') {
      throw new Error('Administrators can only approve staff accounts. Contact a super admin to approve administrator accounts.');
    }

    // SECURITY: Only super admins can approve admin and super admin accounts
    if ((pendingUser.role === 'admin' || pendingUser.role === 'super_admin') && approverProfile.role !== 'super_admin') {
      throw new Error('Only super administrators can approve administrator and super administrator accounts');
    }

    // Store current user to restore later
    const currentUser = auth.currentUser;

    try {
      // Create the actual user account
      const result = await createUserWithEmailAndPassword(auth, pendingUser.email, password);

      // Create user profile
      const profile: UserProfile = {
        uid: result.user.uid,
        email: pendingUser.email,
        role: pendingUser.role,
        name: pendingUser.name,
        createdAt: new Date(),
        lastLogin: new Date(),
        approvedBy: approverUid,
        approvedAt: new Date(),
        assignedAdminId: pendingUser.role === 'staff' ? (pendingUser.requestedAdminId || approverUid) : undefined
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);

      // Verify profile was created successfully
      const verifyProfile = await getDoc(doc(db, 'users', result.user.uid));
      if (!verifyProfile.exists()) {
        throw new Error('Failed to create user profile in database');
      }

      console.log('User profile created successfully for:', result.user.email);

      // Update pending user status
      await updateDoc(doc(db, 'pending_users', pendingUserId), {
        status: 'approved',
        approvedBy: approverUid,
        approvedAt: new Date()
      });

      // Sign out the newly created user to restore admin session
      await signOut(auth);

      if (currentUser) {
        console.warn('Admin session interrupted. Please sign in again.');
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  async updateUserRole(userId: string, newRole: UserRole, updatedBy: string) {
    // Get the user profile first
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // SECURITY: Super admin roles are immutable for security reasons
    if (userProfile.role === 'super_admin') {
      throw new Error('Super administrator roles cannot be modified for security reasons');
    }

    // SECURITY: Only super admins can assign super admin roles
    if (newRole === 'super_admin') {
      const updaterProfile = await this.getUserProfile(updatedBy);
      if (!updaterProfile || updaterProfile.role !== 'super_admin') {
        throw new Error('Only super administrators can assign super admin roles');
      }
    }

    // Prevent removing the last super admin (additional safety check)
    if (userProfile.role === 'super_admin' && newRole !== 'super_admin') {
      const allUsers = await this.getAllUsers();
      const superAdmins = allUsers.filter(u => u.role === 'super_admin');
      if (superAdmins.length <= 1) {
        throw new Error('Cannot remove the last super administrator');
      }
    }

    // Update the user role
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date(),
      updatedBy: updatedBy
    });

    console.log(`User role updated: ${userProfile.email} -> ${newRole}`);
  },

  async deleteUser(userId: string, deletedBy: string) {
    // SECURITY: Get the user profile first to check permissions
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User not found');
    }

    // SECURITY: Super admin accounts cannot be deleted for security reasons
    if (userProfile.role === 'super_admin') {
      throw new Error('Super administrator accounts cannot be deleted for security reasons');
    }

    // SECURITY: Only super admins can delete admin accounts
    const deleterProfile = await this.getUserProfile(deletedBy);
    if (!deleterProfile) {
      throw new Error('Deleter profile not found');
    }

    if (userProfile.role === 'admin' && deleterProfile.role !== 'super_admin') {
      throw new Error('Only super administrators can delete administrator accounts');
    }

    // Delete user profile
    await deleteDoc(doc(db, 'users', userId));

    console.log(`User deleted: ${userProfile.email} by ${deleterProfile.email}`);

    // Note: Firebase Auth user deletion requires admin SDK on server
    // This only deletes the Firestore profile
  },

  async createUser(email: string, password: string, name: string, role: UserRole, createdBy: string) {
    // IMPORTANT: This method signs out the current admin user because Firebase
    // automatically signs in newly created users. In production, use Firebase Admin SDK
    // on the backend to create users without affecting the current session.

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user. Please sign in first.');
    }

    // SECURITY: Admins can create staff, Super admins can create all roles
    const creatorProfile = await this.getUserProfile(createdBy);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    if (creatorProfile.role !== 'admin' && creatorProfile.role !== 'super_admin') {
      throw new Error('Only administrators and super administrators can create user accounts');
    }

    // SECURITY: Regular admins can only create staff accounts
    if (creatorProfile.role === 'admin' && role !== 'staff') {
      throw new Error('Administrators can only create staff accounts. Contact a super admin to create administrator accounts.');
    }

    // SECURITY: Only super admins can create admin and super admin accounts
    if ((role === 'admin' || role === 'super_admin') && creatorProfile.role !== 'super_admin') {
      throw new Error('Only super administrators can create administrator and super administrator accounts');
    }

    // SECURITY: Additional validation for super admin creation
    if (role === 'super_admin') {
      console.log(`Super admin account creation requested by: ${creatorProfile.email}`);
    }

    try {
      // Create the user account (this will sign in the new user automatically)
      const result = await createUserWithEmailAndPassword(auth, email, password);

      const profile: UserProfile = {
        uid: result.user.uid,
        email,
        role,
        name,
        createdAt: new Date(),
        lastLogin: new Date(),
        approvedBy: createdBy,
        approvedAt: new Date(),
        assignedAdminId: role === 'staff' ? createdBy : undefined
      };

      await setDoc(doc(db, 'users', result.user.uid), profile);

      console.log(`User account created: ${email} with role ${role} by ${creatorProfile.email} (${creatorProfile.role})`);

      // Sign out the newly created user
      await signOut(auth);

      // Return result with a warning that admin needs to sign in again
      return { ...result, adminSignedOut: true };
    } catch (error: any) {
      // If user creation failed, ensure we're still signed out to avoid confusion
      await signOut(auth).catch(() => { });

      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email address is already in use');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Use at least 6 characters');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Check your internet connection');
      }

      throw error;
    }
  },

  async rejectUser(pendingUserId: string, reason: string, approverUid: string) {
    await updateDoc(doc(db, 'pending_users', pendingUserId), {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: approverUid,
      approvedAt: new Date()
    });
  },

  async getPendingUsers(): Promise<PendingUser[]> {
    const q = query(collection(db, 'pending_users'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingUser));
  },

  async isAdmin(uid: string): Promise<boolean> {
    const profile = await this.getUserProfile(uid);
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  },

  async getVisibleUsers(requestingUserRole: UserRole): Promise<UserProfile[]> {
    const allUsers = await this.getAllUsers();

    // SECURITY: Only super admins can see other super admins
    // Regular admins cannot see super admin accounts for security reasons
    if (requestingUserRole !== 'super_admin') {
      return allUsers.filter(user => user.role !== 'super_admin');
    }

    return allUsers;
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  },

  async getStaffForAdmin(adminId: string): Promise<UserProfile[]> {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'staff'),
      where('assignedAdminId', '==', adminId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  },

  async getPendingUsersForAdmin(adminId: string): Promise<PendingUser[]> {
    const q = query(
      collection(db, 'pending_users'),
      where('status', '==', 'pending'),
      where('requestedAdminId', '==', adminId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingUser));
  },

  async initializeSuperAdmin() {
    // Check if super admin already exists
    const q = query(collection(db, 'users'), where('role', '==', 'super_admin'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Create super admin account
      const result = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
      const profile: UserProfile = {
        uid: result.user.uid,
        email: SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        name: 'Super Administrator',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      await setDoc(doc(db, 'users', result.user.uid), profile);
      return result;
    }
    return null;
  },

  async signOut() {
    return signOut(auth);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  },

  async createUserProfile(user: User, role: UserRole, name: string) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      role,
      name,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  },

  async updateLastLogin(uid: string) {
    await setDoc(doc(db, 'users', uid), { lastLogin: new Date() }, { merge: true });
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>) {
    // Security: Only allow updating certain fields
    const allowedFields = ['name'];
    const filteredUpdates: any = {};

    for (const field of allowedFields) {
      if (updates[field as keyof UserProfile] !== undefined) {
        filteredUpdates[field] = updates[field as keyof UserProfile];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add update metadata
    filteredUpdates.updatedAt = new Date();

    await setDoc(doc(db, 'users', uid), filteredUpdates, { merge: true });

    console.log(`User profile updated: ${uid}`, filteredUpdates);
    return filteredUpdates;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }

      throw new Error(errorMessage);
    }
  },

  async confirmPasswordReset(code: string, newPassword: string) {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true, message: 'Password reset successfully' };
    } catch (error: any) {
      let errorMessage = 'Failed to reset password';

      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid or expired reset code';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters';
      }

      throw new Error(errorMessage);
    }
  },

  async verifyPasswordResetCode(code: string) {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { success: true, email };
    } catch (error: any) {
      let errorMessage = 'Invalid or expired reset code';

      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid or expired reset code';
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = 'Reset code has expired. Please request a new one';
      }

      throw new Error(errorMessage);
    }
  },

  getCurrentUser() {
    return auth.currentUser;
  }
};