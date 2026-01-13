import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    getStorage
} from 'firebase/storage';
import { db } from './firebase';
import { authService, UserProfile } from './auth';
import {
    Receipt,
    ReceiptCategory,
    ReceiptFilter,
    ReceiptStats,
    ReceiptType,
    ReceiptStatus,
    DEFAULT_RECEIPT_CATEGORIES
} from './receipt-types';

const storage = getStorage();

export const receiptService = {
    // Category Management
    async initializeCategories(createdBy: string): Promise<void> {
        const batch = writeBatch(db);

        for (const category of DEFAULT_RECEIPT_CATEGORIES) {
            const categoryDoc = doc(collection(db, 'receipt_categories'));
            batch.set(categoryDoc, {
                ...category,
                id: categoryDoc.id,
                createdBy,
                createdAt: new Date()
            });
        }

        await batch.commit();
        console.log('Default receipt categories initialized');
    },

    async getCategories(): Promise<ReceiptCategory[]> {
        try {
            const q = query(
                collection(db, 'receipt_categories'),
                where('isActive', '==', true),
                orderBy('name')
            );
            const snapshot = await getDocs(q);
            const categories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ReceiptCategory));

            console.log(`Loaded ${categories.length} categories from database`);
            return categories;
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    },

    async createCategory(category: Omit<ReceiptCategory, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'receipt_categories'), {
            ...category,
            createdAt: new Date()
        });
        return docRef.id;
    },

    async updateCategory(categoryId: string, updates: Partial<ReceiptCategory>): Promise<void> {
        await updateDoc(doc(db, 'receipt_categories', categoryId), updates);
    },

    async deleteCategory(categoryId: string): Promise<void> {
        await updateDoc(doc(db, 'receipt_categories', categoryId), {
            isActive: false
        });
    },

    // File Upload
    async uploadReceiptFile(file: File, userId: string): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `receipts/${userId}/${fileName}`);

        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        return {
            url,
            fileName,
            fileSize: file.size,
            mimeType: file.type
        };
    },

    async deleteReceiptFile(filePath: string): Promise<void> {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
    },

    // Receipt CRUD Operations
    async createReceipt(receiptData: Omit<Receipt, 'id' | 'uploadedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'receipts'), {
            ...receiptData,
            uploadedAt: new Date()
        });

        console.log(`Receipt created: ${receiptData.title} by ${receiptData.uploadedByName}`);
        return docRef.id;
    },

    async updateReceipt(receiptId: string, updates: Partial<Receipt>): Promise<void> {
        await updateDoc(doc(db, 'receipts', receiptId), updates);
        console.log(`Receipt updated: ${receiptId}`);
    },

    async deleteReceipt(receiptId: string, deletedBy: string): Promise<void> {
        const receiptDoc = await getDoc(doc(db, 'receipts', receiptId));
        if (!receiptDoc.exists()) {
            throw new Error('Receipt not found');
        }

        const receipt = receiptDoc.data() as Receipt;

        // Security check: Only owner, assigned admin, or super admin can delete
        const userProfile = await authService.getUserProfile(deletedBy);
        if (!userProfile) {
            throw new Error('User profile not found');
        }

        const canDelete =
            receipt.ownerId === deletedBy || // Owner
            (receipt.assignedAdminId === deletedBy && userProfile.role === 'admin') || // Assigned admin
            userProfile.role === 'super_admin'; // Super admin

        if (!canDelete) {
            throw new Error('Insufficient permissions to delete this receipt');
        }

        // Delete the file from storage
        try {
            await this.deleteReceiptFile(`receipts/${receipt.ownerId}/${receipt.fileName}`);
        } catch (error) {
            console.warn('Failed to delete receipt file from storage:', error);
        }

        // Delete the document
        await deleteDoc(doc(db, 'receipts', receiptId));
        console.log(`Receipt deleted: ${receiptId} by ${userProfile.name}`);
    },

    async getReceipt(receiptId: string): Promise<Receipt | null> {
        const docSnap = await getDoc(doc(db, 'receipts', receiptId));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Receipt : null;
    },

    // Receipt Queries with Access Control
    async getUserReceipts(userId: string, filter?: ReceiptFilter): Promise<Receipt[]> {
        let q = query(
            collection(db, 'receipts'),
            where('ownerId', '==', userId),
            orderBy('uploadedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        let receipts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));

        // Apply filters
        if (filter) {
            receipts = this.applyFilters(receipts, filter);
        }

        return receipts;
    },

    async getAdminReceipts(adminId: string, filter?: ReceiptFilter): Promise<Receipt[]> {
        // Get receipts from staff assigned to this admin
        let q = query(
            collection(db, 'receipts'),
            where('assignedAdminId', '==', adminId),
            orderBy('uploadedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        let receipts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));

        // Apply filters
        if (filter) {
            receipts = this.applyFilters(receipts, filter);
        }

        return receipts;
    },

    async getAllReceipts(requestingUserId: string, filter?: ReceiptFilter): Promise<Receipt[]> {
        // Only super admins can see all receipts
        const userProfile = await authService.getUserProfile(requestingUserId);
        if (!userProfile || userProfile.role !== 'super_admin') {
            throw new Error('Only super administrators can view all receipts');
        }

        let q = query(
            collection(db, 'receipts'),
            orderBy('uploadedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        let receipts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));

        // Apply filters
        if (filter) {
            receipts = this.applyFilters(receipts, filter);
        }

        return receipts;
    },

    async getVisibleReceipts(requestingUserId: string, filter?: ReceiptFilter, viewScope?: 'personal' | 'team' | 'all'): Promise<Receipt[]> {
        const userProfile = await authService.getUserProfile(requestingUserId);
        if (!userProfile) {
            throw new Error('User profile not found');
        }

        switch (userProfile.role) {
            case 'super_admin':
                return this.getAllReceipts(requestingUserId, filter);

            case 'admin':
                // Handle different view scopes for admins
                switch (viewScope) {
                    case 'personal':
                        return this.getUserReceipts(requestingUserId, filter);

                    case 'team':
                        return this.getAdminReceipts(requestingUserId, filter);

                    case 'all':
                    default:
                        // Get own receipts + receipts from assigned staff (default behavior)
                        const [ownReceipts, staffReceipts] = await Promise.all([
                            this.getUserReceipts(requestingUserId, filter),
                            this.getAdminReceipts(requestingUserId, filter)
                        ]);
                        return [...ownReceipts, ...staffReceipts];
                }

            case 'staff':
            default:
                return this.getUserReceipts(requestingUserId, filter);
        }
    },

    // Receipt Approval (Admin/Super Admin only)
    async approveReceipt(receiptId: string, approvedBy: string): Promise<void> {
        const userProfile = await authService.getUserProfile(approvedBy);
        if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
            throw new Error('Only administrators can approve receipts');
        }

        const receipt = await this.getReceipt(receiptId);
        if (!receipt) {
            throw new Error('Receipt not found');
        }

        // Check if admin can approve this receipt (must be assigned admin or super admin)
        if (userProfile.role === 'admin' && receipt.assignedAdminId !== approvedBy) {
            throw new Error('You can only approve receipts from your assigned staff');
        }

        await this.updateReceipt(receiptId, {
            status: 'approved',
            approvedBy,
            approvedByName: userProfile.name,
            approvedAt: new Date()
        });

        console.log(`Receipt approved: ${receiptId} by ${userProfile.name}`);
    },

    async rejectReceipt(receiptId: string, rejectedBy: string, reason: string): Promise<void> {
        const userProfile = await authService.getUserProfile(rejectedBy);
        if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
            throw new Error('Only administrators can reject receipts');
        }

        const receipt = await this.getReceipt(receiptId);
        if (!receipt) {
            throw new Error('Receipt not found');
        }

        // Check if admin can reject this receipt (must be assigned admin or super admin)
        if (userProfile.role === 'admin' && receipt.assignedAdminId !== rejectedBy) {
            throw new Error('You can only reject receipts from your assigned staff');
        }

        await this.updateReceipt(receiptId, {
            status: 'rejected',
            rejectedBy,
            rejectedByName: userProfile.name,
            rejectedAt: new Date(),
            rejectionReason: reason
        });

        console.log(`Receipt rejected: ${receiptId} by ${userProfile.name} - Reason: ${reason}`);
    },

    // Statistics and Analytics
    async getReceiptStats(userId: string, viewScope?: 'personal' | 'team' | 'all'): Promise<ReceiptStats> {
        const receipts = await this.getVisibleReceipts(userId, undefined, viewScope);

        const stats: ReceiptStats = {
            totalReceipts: receipts.length,
            totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
            officialReceipts: receipts.filter(r => r.type === 'official').length,
            unofficialReceipts: receipts.filter(r => r.type === 'unofficial').length,
            pendingApprovals: receipts.filter(r => r.status === 'pending').length,
            approvedReceipts: receipts.filter(r => r.status === 'approved').length,
            rejectedReceipts: receipts.filter(r => r.status === 'rejected').length,
            categoriesBreakdown: {}
        };

        // Calculate categories breakdown
        receipts.forEach(receipt => {
            if (!stats.categoriesBreakdown[receipt.category]) {
                stats.categoriesBreakdown[receipt.category] = { count: 0, amount: 0 };
            }
            stats.categoriesBreakdown[receipt.category].count++;
            stats.categoriesBreakdown[receipt.category].amount += receipt.amount;
        });

        return stats;
    },

    // Utility Functions
    applyFilters(receipts: Receipt[], filter: ReceiptFilter): Receipt[] {
        return receipts.filter(receipt => {
            if (filter.category && receipt.category !== filter.category) return false;
            if (filter.type && receipt.type !== filter.type) return false;
            if (filter.status && receipt.status !== filter.status) return false;
            if (filter.uploadedBy && receipt.uploadedBy !== filter.uploadedBy) return false;

            if (filter.dateFrom && new Date(receipt.date) < new Date(filter.dateFrom)) return false;
            if (filter.dateTo && new Date(receipt.date) > new Date(filter.dateTo)) return false;

            if (filter.amountMin && receipt.amount < filter.amountMin) return false;
            if (filter.amountMax && receipt.amount > filter.amountMax) return false;

            if (filter.tags && filter.tags.length > 0) {
                const hasMatchingTag = filter.tags.some(tag =>
                    receipt.tags.some(receiptTag =>
                        receiptTag.toLowerCase().includes(tag.toLowerCase())
                    )
                );
                if (!hasMatchingTag) return false;
            }

            return true;
        });
    },

    // Download receipt file
    async downloadReceipt(receiptId: string, userId: string): Promise<string> {
        const receipt = await this.getReceipt(receiptId);
        if (!receipt) {
            throw new Error('Receipt not found');
        }

        // Check access permissions
        const userProfile = await authService.getUserProfile(userId);
        if (!userProfile) {
            throw new Error('User profile not found');
        }

        const canAccess =
            receipt.ownerId === userId || // Owner
            (receipt.assignedAdminId === userId && userProfile.role === 'admin') || // Assigned admin
            userProfile.role === 'super_admin'; // Super admin

        if (!canAccess) {
            throw new Error('Insufficient permissions to download this receipt');
        }

        return receipt.imageUrl;
    }
};