import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type ReceiptViewScope = 'personal' | 'team' | 'all';

export interface UserPreferences {
    uid: string;
    receiptViewScope: ReceiptViewScope;
    defaultReceiptView: ReceiptViewScope;
    aiDashboardViewScope: ReceiptViewScope;
    createdAt: Date;
    updatedAt: Date;
}

export const userPreferencesService = {
    // Get user preferences with defaults
    async getUserPreferences(userId: string): Promise<UserPreferences> {
        if (!userId) {
            throw new Error('User ID is required to get preferences');
        }

        try {
            const docRef = doc(db, 'user_preferences', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as UserPreferences;
            } else {
                // Return default preferences for new users
                const defaultPreferences: UserPreferences = {
                    uid: userId,
                    receiptViewScope: 'all', // Default to combined view
                    defaultReceiptView: 'all',
                    aiDashboardViewScope: 'all',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Save default preferences
                await setDoc(docRef, defaultPreferences);
                return defaultPreferences;
            }
        } catch (error: any) {
            console.error('Error getting user preferences:', error);

            // If it's a permissions error, provide more context
            if (error?.code === 'permission-denied') {
                console.error('Permission denied accessing user preferences. Check Firestore rules.');
            }

            // Return safe defaults on error
            return {
                uid: userId,
                receiptViewScope: 'all',
                defaultReceiptView: 'all',
                aiDashboardViewScope: 'all',
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
    },

    // Update specific preference
    async updateReceiptViewScope(userId: string, viewScope: ReceiptViewScope): Promise<void> {
        try {
            const docRef = doc(db, 'user_preferences', userId);
            await updateDoc(docRef, {
                receiptViewScope: viewScope,
                updatedAt: new Date()
            });
            console.log(`Updated receipt view scope for ${userId}: ${viewScope}`);
        } catch (error) {
            console.error('Error updating receipt view scope:', error);
            throw error;
        }
    },

    // Update AI dashboard view scope
    async updateAIDashboardViewScope(userId: string, viewScope: ReceiptViewScope): Promise<void> {
        try {
            const docRef = doc(db, 'user_preferences', userId);
            await updateDoc(docRef, {
                aiDashboardViewScope: viewScope,
                updatedAt: new Date()
            });
            console.log(`Updated AI dashboard view scope for ${userId}: ${viewScope}`);
        } catch (error) {
            console.error('Error updating AI dashboard view scope:', error);
            throw error;
        }
    },

    // Update default receipt view
    async updateDefaultReceiptView(userId: string, viewScope: ReceiptViewScope): Promise<void> {
        try {
            const docRef = doc(db, 'user_preferences', userId);
            await updateDoc(docRef, {
                defaultReceiptView: viewScope,
                receiptViewScope: viewScope, // Also update current view
                updatedAt: new Date()
            });
            console.log(`Updated default receipt view for ${userId}: ${viewScope}`);
        } catch (error) {
            console.error('Error updating default receipt view:', error);
            throw error;
        }
    },

    // Bulk update preferences
    async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<void> {
        try {
            const docRef = doc(db, 'user_preferences', userId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date()
            });
            console.log(`Updated preferences for ${userId}:`, updates);
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }
};