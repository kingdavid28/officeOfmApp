import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { PendingUser } from './types';

export type UserRole = 'super_admin' | 'vice_super_admin' | 'admin' | 'vice_admin' | 'provincial_treasurer' | 'treasurer' | 'staff' | 'guest';
export type UserStatus = 'active' | 'disabled' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  status: UserStatus;
  createdAt: Date;
  lastLogin: Date;
  approvedBy?: string;
  approvedAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface AuditLogEntry {
  id?: string;
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  performedBy: string;
  performedByEmail: string;
  timestamp: Date;
  details: Record<string, any>;
}

class AuthService {
  // Authentication Methods
  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await this.getUserProfile(result.user.uid);

    if (profile?.status === 'disabled') {
      await signOut(auth);
      throw new Error('Account has been disabled. Contact administrator.');
    }

    await this.updateLastLogin(result.user.uid);
    await this.logAuditAction('user_login', result.user.uid, result.user.email!, result.user.uid, result.user.email!, {});
    return result;
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);

      let profile = await this.getUserProfile(result.user.uid);

      if (!profile) {
        const pendingUser: Omit<PendingUser, 'id'> = {
          email: result.user.email!,
          name: result.user.displayName || result.user.email!,
          role: 'staff',
          requestedAt: new Date(),
          status: 'pending'
        };

        await addDoc(collection(db, 'pending_users'), pendingUser);
        await signOut(auth);
        throw new Error('Account request submitted for approval. Please wait for admin approval.');
      }

      if (profile.status === 'disabled') {
        await signOut(auth);
        throw new Error('Account has been disabled. Contact administrator.');
      }

      await this.updateLastLogin(result.user.uid);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // User Management Methods
  async createUser(email: string, password: string, name: string, role: UserRole, createdBy: string) {
    // Use Firebase Admin SDK in production to avoid session interruption
    const result = await createUserWithEmailAndPassword(auth, email, password);

    const creatorProfile = await this.getUserProfile(createdBy);

    const profile: UserProfile = {
      uid: result.user.uid,
      email,
      role,
      name,
      status: 'active',
      createdAt: new Date(),
      lastLogin: new Date(),
      approvedBy: createdBy,
      approvedAt: new Date()
    };

    await setDoc(doc(db, 'users', result.user.uid), profile);

    await this.logAuditAction(
      'user_created',
      result.user.uid,
      email,
      createdBy,
      creatorProfile?.email || 'unknown',
      { role, name }
    );

    // Sign out newly created user to restore admin session
    await signOut(auth);

    return result;
  }

  async updateUserRole(userId: string, newRole: UserRole, updatedBy: string) {
    const userProfile = await this.getUserProfile(userId);
    const updaterProfile = await this.getUserProfile(updatedBy);

    if (!userProfile) throw new Error('User not found');
    if (userProfile.role === 'super_admin') throw new Error('Cannot modify super admin role');

    const oldRole = userProfile.role;

    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: new Date(),
      updatedBy: updatedBy
    });

    await this.logAuditAction(
      'role_changed',
      userId,
      userProfile.email,
      updatedBy,
      updaterProfile?.email || 'unknown',
      { oldRole, newRole }
    );
  }

  async updateUserStatus(userId: string, status: UserStatus, updatedBy: string) {
    const userProfile = await this.getUserProfile(userId);
    const updaterProfile = await this.getUserProfile(updatedBy);

    if (!userProfile) throw new Error('User not found');
    if (userProfile.role === 'super_admin') throw new Error('Cannot modify super admin status');

    const oldStatus = userProfile.status;

    await updateDoc(doc(db, 'users', userId), {
      status,
      updatedAt: new Date(),
      updatedBy: updatedBy
    });

    await this.logAuditAction(
      'status_changed',
      userId,
      userProfile.email,
      updatedBy,
      updaterProfile?.email || 'unknown',
      { oldStatus, newStatus: status }
    );
  }

  async updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'name' | 'email'>>, updatedBy: string) {
    const userProfile = await this.getUserProfile(userId);
    const updaterProfile = await this.getUserProfile(updatedBy);

    if (!userProfile) throw new Error('User not found');

    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date(),
      updatedBy: updatedBy
    });

    await this.logAuditAction(
      'profile_updated',
      userId,
      userProfile.email,
      updatedBy,
      updaterProfile?.email || 'unknown',
      updates
    );
  }

  async resetUserPassword(email: string, resetBy: string) {
    await sendPasswordResetEmail(auth, email);

    const resetterProfile = await this.getUserProfile(resetBy);

    await this.logAuditAction(
      'password_reset_sent',
      undefined,
      email,
      resetBy,
      resetterProfile?.email || 'unknown',
      { email }
    );
  }

  // Approval Methods
  async approveUser(pendingUserId: string, password: string, approverUid: string) {
    const pendingDoc = await getDoc(doc(db, 'pending_users', pendingUserId));
    if (!pendingDoc.exists()) throw new Error('Pending user not found');

    const pendingUser = pendingDoc.data() as PendingUser;
    if (pendingUser.status !== 'pending') throw new Error('User request already processed');

    const result = await createUserWithEmailAndPassword(auth, pendingUser.email, password);

    const profile: UserProfile = {
      uid: result.user.uid,
      email: pendingUser.email,
      role: pendingUser.role,
      name: pendingUser.name,
      status: 'active',
      createdAt: new Date(),
      lastLogin: new Date(),
      approvedBy: approverUid,
      approvedAt: new Date()
    };

    await setDoc(doc(db, 'users', result.user.uid), profile);

    await updateDoc(doc(db, 'pending_users', pendingUserId), {
      status: 'approved',
      approvedBy: approverUid,
      approvedAt: new Date()
    });

    const approverProfile = await this.getUserProfile(approverUid);
    await this.logAuditAction(
      'user_approved',
      result.user.uid,
      pendingUser.email,
      approverUid,
      approverProfile?.email || 'unknown',
      { role: pendingUser.role, name: pendingUser.name }
    );

    await signOut(auth);
    return result;
  }

  // Audit Logging
  async logAuditAction(action: string, targetUserId: string | undefined, targetUserEmail: string, performedBy: string, performedByEmail: string, details: Record<string, any>) {
    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      action,
      targetUserId,
      targetUserEmail,
      performedBy,
      performedByEmail,
      timestamp: new Date(),
      details
    };

    await addDoc(collection(db, 'audit_logs'), {
      ...auditEntry,
      timestamp: serverTimestamp()
    });
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    const q = query(collection(db, 'audit_logs'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
  }

  // Utility Methods
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  }

  async getPendingUsers(): Promise<PendingUser[]> {
    const q = query(collection(db, 'pending_users'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingUser));
  }

  async updateLastLogin(uid: string) {
    await setDoc(doc(db, 'users', uid), { lastLogin: new Date() }, { merge: true });
  }

  async isAdmin(uid: string): Promise<boolean> {
    const profile = await this.getUserProfile(uid);
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  }

  async isSuperAdmin(uid: string): Promise<boolean> {
    const profile = await this.getUserProfile(uid);
    return profile?.role === 'super_admin';
  }

  // Legacy methods for compatibility
  async requestUserCreation(email: string, name: string, role: UserRole = 'staff') {
    if (role === 'super_admin') throw new Error('Super admin accounts cannot be requested');

    const pendingUser: Omit<PendingUser, 'id'> = {
      email, name, role,
      requestedAt: new Date(),
      status: 'pending'
    };

    const docRef = await addDoc(collection(db, 'pending_users'), pendingUser);
    return docRef.id;
  }

  async rejectUser(pendingUserId: string, reason: string, approverUid: string) {
    await updateDoc(doc(db, 'pending_users', pendingUserId), {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: approverUid,
      approvedAt: new Date()
    });
  }

  async deleteUser(userId: string, deletedBy: string) {
    const userProfile = await this.getUserProfile(userId);
    if (userProfile?.role === 'super_admin') throw new Error('Cannot delete super admin');

    await deleteDoc(doc(db, 'users', userId));

    const deleterProfile = await this.getUserProfile(deletedBy);
    await this.logAuditAction(
      'user_deleted',
      userId,
      userProfile?.email || 'unknown',
      deletedBy,
      deleterProfile?.email || 'unknown',
      { deletedUserRole: userProfile?.role }
    );
  }

  async signOut() {
    return signOut(auth);
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();