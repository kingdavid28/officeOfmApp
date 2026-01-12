import { receiptService } from './receipt-service';
import { authService } from './auth';

export const appInitialization = {
    async initializeApp(): Promise<void> {
        try {
            console.log('Initializing application...');

            // Check if we have a super admin user
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                console.log('No authenticated user found, skipping initialization');
                return;
            }

            const userProfile = await authService.getUserProfile(currentUser.uid);
            if (!userProfile) {
                console.log('No user profile found, skipping initialization');
                return;
            }

            // Only super admins can initialize the system
            if (userProfile.role === 'super_admin') {
                await this.initializeReceiptCategories(currentUser.uid);
            }

            console.log('Application initialization completed');
        } catch (error) {
            console.error('Error during app initialization:', error);
            // Don't throw error to prevent app from breaking
        }
    },

    async initializeReceiptCategories(createdBy: string): Promise<void> {
        try {
            // Check if categories already exist
            const existingCategories = await receiptService.getCategories();

            if (existingCategories.length === 0) {
                console.log('Initializing default receipt categories...');
                await receiptService.initializeCategories(createdBy);
                console.log('Receipt categories initialized successfully');
            } else {
                console.log('Receipt categories already exist, skipping initialization');
            }
        } catch (error) {
            console.error('Error initializing receipt categories:', error);
        }
    }
};