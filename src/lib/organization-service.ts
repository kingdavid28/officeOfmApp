import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Organization, PendingOrganization } from './organization-types';

export const organizationService = {
  async requestOrganization(orgData: Omit<PendingOrganization, 'id' | 'requestedAt' | 'status'>) {
    const pendingOrg: Omit<PendingOrganization, 'id'> = {
      ...orgData,
      requestedAt: new Date(),
      status: 'pending'
    };
    
    const docRef = await addDoc(collection(db, 'pending_organizations'), pendingOrg);
    return docRef.id;
  },

  async getPendingOrganizations(): Promise<PendingOrganization[]> {
    const q = query(collection(db, 'pending_organizations'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingOrganization));
  },

  async approveOrganization(pendingOrgId: string, approverUid: string) {
    const pendingDoc = doc(db, 'pending_organizations', pendingOrgId);
    
    await updateDoc(pendingDoc, {
      status: 'approved',
      approvedBy: approverUid,
      approvedAt: new Date()
    });
  },

  async rejectOrganization(pendingOrgId: string, reason: string, approverUid: string) {
    await updateDoc(doc(db, 'pending_organizations', pendingOrgId), {
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: approverUid,
      approvedAt: new Date()
    });
  },

  async getOrganizations(): Promise<Organization[]> {
    const snapshot = await getDocs(collection(db, 'organizations'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization));
  }
};