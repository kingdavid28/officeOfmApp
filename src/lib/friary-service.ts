// Friary Service - Manage friary data in Firestore
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Friary, Ministry, FriaryStats, SAMPLE_FRIARIES } from './friary-types';

// Collection names
const FRIARIES_COLLECTION = 'friaries';
const MINISTRIES_COLLECTION = 'ministries';

/**
 * Get all friaries
 */
export const getAllFriaries = async (): Promise<Friary[]> => {
    try {
        const friariesRef = collection(db, FRIARIES_COLLECTION);
        const snapshot = await getDocs(friariesRef);

        if (snapshot.empty) {
            // Return sample data if no friaries exist yet
            console.log('No friaries found, returning sample data');
            return SAMPLE_FRIARIES;
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as Friary[];
    } catch (error) {
        console.error('Error getting friaries:', error);
        // Return sample data on error
        return SAMPLE_FRIARIES;
    }
};

/**
 * Get friary by ID
 */
export const getFriaryById = async (friaryId: string): Promise<Friary | null> => {
    try {
        const friaryRef = doc(db, FRIARIES_COLLECTION, friaryId);
        const friaryDoc = await getDoc(friaryRef);

        if (!friaryDoc.exists()) {
            // Check sample data
            const sampleFriary = SAMPLE_FRIARIES.find(f => f.id === friaryId);
            return sampleFriary || null;
        }

        return {
            id: friaryDoc.id,
            ...friaryDoc.data(),
            createdAt: friaryDoc.data().createdAt?.toDate(),
            updatedAt: friaryDoc.data().updatedAt?.toDate()
        } as Friary;
    } catch (error) {
        console.error('Error getting friary:', error);
        return null;
    }
};

/**
 * Get friaries by type
 */
export const getFriariesByType = async (type: Friary['type']): Promise<Friary[]> => {
    try {
        const friariesRef = collection(db, FRIARIES_COLLECTION);
        const q = query(friariesRef, where('type', '==', type));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Return filtered sample data
            return SAMPLE_FRIARIES.filter(f => f.type === type);
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as Friary[];
    } catch (error) {
        console.error('Error getting friaries by type:', error);
        return SAMPLE_FRIARIES.filter(f => f.type === type);
    }
};

/**
 * Create a new friary
 */
export const createFriary = async (friaryData: Omit<Friary, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const friariesRef = collection(db, FRIARIES_COLLECTION);
        const docRef = await addDoc(friariesRef, {
            ...friaryData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating friary:', error);
        throw error;
    }
};

/**
 * Update friary
 */
export const updateFriary = async (friaryId: string, updates: Partial<Friary>): Promise<void> => {
    try {
        const friaryRef = doc(db, FRIARIES_COLLECTION, friaryId);

        // Filter out undefined values - Firestore doesn't allow undefined
        const cleanUpdates: any = {};
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        });

        await updateDoc(friaryRef, {
            ...cleanUpdates,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating friary:', error);
        throw error;
    }
};

/**
 * Delete friary
 */
export const deleteFriary = async (friaryId: string): Promise<void> => {
    try {
        const friaryRef = doc(db, FRIARIES_COLLECTION, friaryId);
        await deleteDoc(friaryRef);
    } catch (error) {
        console.error('Error deleting friary:', error);
        throw error;
    }
};

/**
 * Get friary statistics
 */
export const getFriaryStats = async (friaryId: string): Promise<FriaryStats> => {
    try {
        // Get files count
        const filesQuery = query(
            collection(db, 'files'),
            where('friaryId', '==', friaryId)
        );
        const filesSnapshot = await getDocs(filesQuery);

        // Get expenses
        const expensesQuery = query(
            collection(db, 'receipts'),
            where('friaryId', '==', friaryId)
        );
        const expensesSnapshot = await getDocs(expensesQuery);

        const totalExpenses = expensesSnapshot.docs.reduce((sum, doc) => {
            return sum + (doc.data().amount || 0);
        }, 0);

        // Get recent documents
        const recentDocsQuery = query(
            collection(db, 'files'),
            where('friaryId', '==', friaryId),
            orderBy('uploadedAt', 'desc')
        );
        const recentDocsSnapshot = await getDocs(recentDocsQuery);
        const recentDocs = recentDocsSnapshot.docs.slice(0, 5).map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Get recent expenses
        const recentExpensesQuery = query(
            collection(db, 'receipts'),
            where('friaryId', '==', friaryId),
            orderBy('receiptDate', 'desc')
        );
        const recentExpensesSnapshot = await getDocs(recentExpensesQuery);
        const recentExpenses = recentExpensesSnapshot.docs.slice(0, 5).map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Get friary budget
        const friary = await getFriaryById(friaryId);
        const monthlyBudget = friary?.budget?.monthly || 50000;

        return {
            totalFiles: filesSnapshot.size,
            totalExpenses,
            monthlyBudget,
            budgetUtilization: monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0,
            recentDocuments: recentDocs,
            recentExpenses,
            memberCount: friary?.memberCount || friary?.members?.length || 0
        };
    } catch (error) {
        console.error('Error getting friary stats:', error);
        return {
            totalFiles: 0,
            totalExpenses: 0,
            monthlyBudget: 50000,
            budgetUtilization: 0,
            recentDocuments: [],
            recentExpenses: [],
            memberCount: 0
        };
    }
};

/**
 * Get all ministries for a friary
 */
export const getFriaryMinistries = async (friaryId: string): Promise<Ministry[]> => {
    try {
        const ministriesRef = collection(db, MINISTRIES_COLLECTION);
        const q = query(ministriesRef, where('friaryId', '==', friaryId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as Ministry[];
    } catch (error) {
        console.error('Error getting friary ministries:', error);
        return [];
    }
};

/**
 * Create a new ministry
 */
export const createMinistry = async (ministryData: Omit<Ministry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const ministriesRef = collection(db, MINISTRIES_COLLECTION);
        const docRef = await addDoc(ministriesRef, {
            ...ministryData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating ministry:', error);
        throw error;
    }
};

/**
 * Initialize sample friaries (for development/testing)
 */
export const initializeSampleFriaries = async (): Promise<void> => {
    try {
        const friariesRef = collection(db, FRIARIES_COLLECTION);
        const snapshot = await getDocs(friariesRef);

        // Only initialize if no friaries exist
        if (snapshot.empty) {
            console.log('Initializing sample friaries...');
            for (const friary of SAMPLE_FRIARIES) {
                const { id, ...friaryData } = friary;
                await addDoc(friariesRef, {
                    ...friaryData,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            }
            console.log('Sample friaries initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing sample friaries:', error);
    }
};
