// Fix script to update existing pending users with missing authProvider
// Run this in browser console while signed in as admin

async function fixPendingUserAuthProvider() {
    console.log('=== Fixing Pending User AuthProvider ===');

    try {
        // Import Firebase modules
        const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = await import('firebase/firestore');
        const db = getFirestore();

        console.log('1. Getting all pending users...');
        const q = query(collection(db, 'pending_users'), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);

        console.log(`Found ${snapshot.size} pending users`);

        for (const docSnapshot of snapshot.docs) {
            const userData = docSnapshot.data();
            const userId = docSnapshot.id;

            console.log(`Checking user: ${userData.email}`);
            console.log(`Current authProvider: ${userData.authProvider}`);

            // If authProvider is undefined or missing, try to determine it
            if (!userData.authProvider) {
                let newAuthProvider = 'email'; // default

                // Check if this looks like a Google user
                // Google users typically have Gmail addresses or were created via Google Sign-In
                if (userData.email.includes('@gmail.com') ||
                    userData.name === userData.email.split('@')[0] || // Google often uses email prefix as name
                    !userData.email.includes('test-')) { // Our test users have 'test-' prefix

                    newAuthProvider = 'google';
                    console.log(`🔍 Detected Google user: ${userData.email}`);
                }

                try {
                    await updateDoc(doc(db, 'pending_users', userId), {
                        authProvider: newAuthProvider
                    });
                    console.log(`✅ Updated ${userData.email} with authProvider: ${newAuthProvider}`);
                } catch (error) {
                    console.error(`❌ Failed to update ${userData.email}:`, error);
                }
            } else {
                console.log(`✅ ${userData.email} already has authProvider: ${userData.authProvider}`);
            }
        }

        console.log('2. Verifying updates...');

        // Re-fetch to verify
        const verifySnapshot = await getDocs(q);
        verifySnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`${data.email}: authProvider = ${data.authProvider}`);
        });

    } catch (error) {
        console.error('❌ Fix failed:', error);
    }

    console.log('=== Fix Complete ===');
}

// Function to manually set authProvider for a specific user
async function setAuthProvider(email, authProvider) {
    console.log(`=== Setting AuthProvider for ${email} ===`);

    try {
        const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = await import('firebase/firestore');
        const db = getFirestore();

        const q = query(
            collection(db, 'pending_users'),
            where('email', '==', email),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`❌ No pending user found with email: ${email}`);
            return;
        }

        const userDoc = snapshot.docs[0];
        await updateDoc(userDoc.ref, {
            authProvider: authProvider
        });

        console.log(`✅ Updated ${email} with authProvider: ${authProvider}`);

    } catch (error) {
        console.error('❌ Manual update failed:', error);
    }
}

console.log('AuthProvider fix functions loaded:');
console.log('- fixPendingUserAuthProvider() - Auto-fix all pending users');
console.log('- setAuthProvider("email@example.com", "google") - Manually set authProvider');

// Auto-run the fix
fixPendingUserAuthProvider();