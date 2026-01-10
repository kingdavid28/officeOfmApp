import { authService } from '../lib/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Debug utility to check user profile status
 */
export const debugUserProfile = async (email?: string) => {
    try {
        const currentUser = auth.currentUser;
        const targetEmail = email || currentUser?.email;

        if (!targetEmail) {
            console.log('No user email provided and no current user');
            return;
        }

        console.log('=== User Profile Debug ===');
        console.log('Email:', targetEmail);

        if (currentUser) {
            console.log('Firebase Auth User:', {
                uid: currentUser.uid,
                email: currentUser.email,
                emailVerified: currentUser.emailVerified,
                displayName: currentUser.displayName
            });

            // Check Firestore profile
            try {
                const profile = await authService.getUserProfile(currentUser.uid);
                console.log('Firestore Profile:', profile);
            } catch (error) {
                console.error('Error fetching Firestore profile:', error);
            }
        }

        // Check pending users
        const pendingQuery = query(
            collection(db, 'pending_users'),
            where('email', '==', targetEmail)
        );
        const pendingSnapshot = await getDocs(pendingQuery);

        if (!pendingSnapshot.empty) {
            console.log('Pending User Requests:');
            pendingSnapshot.forEach(doc => {
                console.log('- ', doc.id, doc.data());
            });
        } else {
            console.log('No pending user requests found');
        }

        // Check approved Google users
        try {
            const approvedGoogleDoc = await getDoc(doc(db, 'approved_google_users', targetEmail));
            if (approvedGoogleDoc.exists()) {
                console.log('Approved Google User:', approvedGoogleDoc.data());
            } else {
                console.log('No approved Google user record found');
            }
        } catch (error) {
            console.error('Error checking approved Google users:', error);
        }

        console.log('=== End Debug ===');

    } catch (error) {
        console.error('Debug error:', error);
    }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).debugUserProfile = debugUserProfile;
}