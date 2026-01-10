// Debug script to run in browser console
// Copy and paste this into the browser console when on localhost:5173

async function debugGoogleSignInFlow() {
    console.log('=== Debugging Google Sign-In Flow ===');

    try {
        // Import Firebase modules from the app
        const { getFirestore, collection, getDocs, doc, getDoc, query, where } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        const db = getFirestore();
        const auth = getAuth();

        console.log('1. Current Authentication State:');
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log('✅ User is signed in:', currentUser.email);
            console.log('   UID:', currentUser.uid);
            console.log('   Display Name:', currentUser.displayName);
        } else {
            console.log('❌ No user currently signed in');
        }

        // Check for approved Google users
        console.log('\n2. Checking Approved Google Users:');
        try {
            const approvedCollection = collection(db, 'approved_google_users');
            const approvedSnapshot = await getDocs(approvedCollection);

            console.log(`Found ${approvedSnapshot.size} approved Google users:`);
            approvedSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${doc.id}: ${data.name} (${data.role})`);
                console.log(`     Approved by: ${data.approvedBy}`);
                console.log(`     Temp UID: ${data.uid}`);
                console.log(`     Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'N/A'}`);
            });
        } catch (error) {
            console.error('❌ Error checking approved Google users:', error);
        }

        // Check pending users
        console.log('\n3. Checking Pending Users:');
        try {
            const pendingQuery = query(
                collection(db, 'pending_users'),
                where('authProvider', '==', 'google')
            );
            const pendingSnapshot = await getDocs(pendingQuery);

            console.log(`Found ${pendingSnapshot.size} pending Google users:`);
            pendingSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${data.email}: ${data.name} (${data.status})`);
                console.log(`     Requested: ${data.requestedAt ? new Date(data.requestedAt.seconds * 1000).toLocaleString() : 'N/A'}`);
                if (data.approvedBy) {
                    console.log(`     Approved by: ${data.approvedBy}`);
                }
            });
        } catch (error) {
            console.error('❌ Error checking pending users:', error);
        }

        // Check user profiles
        console.log('\n4. Checking User Profiles:');
        try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);

            console.log(`Found ${usersSnapshot.size} user profiles:`);
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - ${doc.id}: ${data.email} (${data.role})`);
                console.log(`     Name: ${data.name}`);
                console.log(`     Created: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'N/A'}`);
                console.log(`     Last Login: ${data.lastLogin ? new Date(data.lastLogin.seconds * 1000).toLocaleString() : 'N/A'}`);
            });
        } catch (error) {
            console.error('❌ Error checking user profiles:', error);
        }

        // Test specific email
        const testEmail = 'kingdavid28a@gmail.com';
        console.log(`\n5. Testing specific email: ${testEmail}`);

        // Check if approved
        try {
            const approvedDoc = await getDoc(doc(db, 'approved_google_users', testEmail));
            if (approvedDoc.exists()) {
                console.log('✅ Email found in approved_google_users:', approvedDoc.data());
            } else {
                console.log('❌ Email NOT found in approved_google_users');
            }
        } catch (error) {
            console.error('❌ Error checking approved status:', error);
        }

        // Check if has user profile
        try {
            const userQuery = query(
                collection(db, 'users'),
                where('email', '==', testEmail)
            );
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                userSnapshot.forEach(doc => {
                    console.log('✅ User profile found:', doc.id, doc.data());
                });
            } else {
                console.log('❌ No user profile found for email');
            }
        } catch (error) {
            console.error('❌ Error checking user profile:', error);
        }

    } catch (error) {
        console.error('❌ Debug script failed:', error);
    }

    console.log('\n=== End Debug ===');
}

// Test Google Sign-In process
async function testGoogleSignIn() {
    console.log('=== Testing Google Sign-In Process ===');

    try {
        // Get the auth service from the app
        const authService = window.authService || (await import('./src/lib/auth.js')).authService;

        console.log('Starting Google Sign-In test...');
        await authService.signInWithGoogle();

    } catch (error) {
        console.error('Google Sign-In test failed:', error);
        console.log('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
    }
}

console.log('Debug functions loaded. Run:');
console.log('- debugGoogleSignInFlow() to check database state');
console.log('- testGoogleSignIn() to test the sign-in process');