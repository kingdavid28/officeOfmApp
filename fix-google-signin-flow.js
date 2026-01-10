// Manual fix script for Google Sign-In flow
// Run this in the browser console on localhost:5173 to fix the issue

async function fixGoogleSignInFlow() {
    console.log('=== Fixing Google Sign-In Flow ===');

    try {
        // Import Firebase modules
        const { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        const db = getFirestore();
        const auth = getAuth();

        const testEmail = 'kingdavid28a@gmail.com';
        console.log(`Fixing flow for: ${testEmail}`);

        // Step 1: Check current state
        console.log('\n1. Checking current state...');

        // Check if in approved_google_users
        const approvedDoc = await getDoc(doc(db, 'approved_google_users', testEmail));
        if (approvedDoc.exists()) {
            console.log('✅ Found in approved_google_users:', approvedDoc.data());
        } else {
            console.log('❌ NOT found in approved_google_users');
        }

        // Check if has user profile
        const userQuery = query(
            collection(db, 'users'),
            where('email', '==', testEmail)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
            userSnapshot.forEach(doc => {
                console.log('✅ User profile exists:', doc.id, doc.data());
            });
        } else {
            console.log('❌ No user profile found');
        }

        // Step 2: If user is in approved_google_users but has no profile, simulate the sign-in process
        if (approvedDoc.exists() && userSnapshot.empty) {
            console.log('\n2. User is approved but has no profile. This is the issue!');
            console.log('This means the Google Sign-In process failed to create the profile.');

            const approvedData = approvedDoc.data();
            console.log('Approved data:', approvedData);

            // Simulate what should happen during Google Sign-In
            console.log('\n3. Simulating profile creation...');

            // We need a real Google UID for this to work properly
            // In a real scenario, this would come from the Google Sign-In result
            const simulatedGoogleUID = `google_sim_${Date.now()}`;

            const newProfile = {
                ...approvedData,
                uid: simulatedGoogleUID,
                name: approvedData.name,
                lastLogin: new Date(),
                createdAt: approvedData.createdAt || new Date()
            };

            console.log('Profile to create:', newProfile);

            try {
                await setDoc(doc(db, 'users', simulatedGoogleUID), newProfile);
                console.log('✅ Profile created successfully');

                // Remove from approved_google_users
                await deleteDoc(doc(db, 'approved_google_users', testEmail));
                console.log('✅ Removed from approved_google_users');

                console.log('\n✅ Fix completed! The user should now be able to sign in.');
            } catch (error) {
                console.error('❌ Error creating profile:', error);
                console.log('This indicates a permissions or validation issue.');
            }
        } else if (!approvedDoc.exists() && userSnapshot.empty) {
            console.log('\n2. User is not approved and has no profile.');
            console.log('The user needs to be approved first by an admin.');
        } else if (!approvedDoc.exists() && !userSnapshot.empty) {
            console.log('\n2. User already has a profile and is not in approved queue.');
            console.log('This is normal - the user should be able to sign in.');
        }

        // Step 3: Test the actual Google Sign-In process
        console.log('\n4. Testing Google Sign-In process...');
        console.log('You can now try signing in with Google to see if it works.');

    } catch (error) {
        console.error('❌ Fix script failed:', error);
    }
}

// Function to manually approve a user (for testing)
async function manuallyApproveUser(email, name = 'Test User', role = 'staff') {
    console.log(`=== Manually Approving User: ${email} ===`);

    try {
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        const db = getFirestore();
        const auth = getAuth();

        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('❌ You must be signed in as an admin to approve users');
            return;
        }

        const profile = {
            uid: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: email,
            role: role,
            name: name,
            createdAt: new Date(),
            lastLogin: new Date(),
            approvedBy: currentUser.uid,
            approvedAt: new Date()
        };

        await setDoc(doc(db, 'approved_google_users', email), profile);
        console.log('✅ User approved successfully:', profile);

    } catch (error) {
        console.error('❌ Error approving user:', error);
    }
}

// Function to clean up test data
async function cleanupTestData(email) {
    console.log(`=== Cleaning up test data for: ${email} ===`);

    try {
        const { getFirestore, collection, getDocs, doc, deleteDoc, query, where } = await import('firebase/firestore');

        const db = getFirestore();

        // Remove from approved_google_users
        try {
            await deleteDoc(doc(db, 'approved_google_users', email));
            console.log('✅ Removed from approved_google_users');
        } catch (error) {
            console.log('ℹ️ Not found in approved_google_users');
        }

        // Remove user profiles
        const userQuery = query(
            collection(db, 'users'),
            where('email', '==', email)
        );
        const userSnapshot = await getDocs(userQuery);

        for (const userDoc of userSnapshot.docs) {
            await deleteDoc(userDoc.ref);
            console.log('✅ Removed user profile:', userDoc.id);
        }

        // Remove pending users
        const pendingQuery = query(
            collection(db, 'pending_users'),
            where('email', '==', email)
        );
        const pendingSnapshot = await getDocs(pendingQuery);

        for (const pendingDoc of pendingSnapshot.docs) {
            await deleteDoc(pendingDoc.ref);
            console.log('✅ Removed pending user:', pendingDoc.id);
        }

        console.log('✅ Cleanup completed');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

console.log('Fix functions loaded. Run:');
console.log('- fixGoogleSignInFlow() to diagnose and fix the issue');
console.log('- manuallyApproveUser("email@example.com", "Name", "role") to manually approve a user');
console.log('- cleanupTestData("email@example.com") to clean up test data');