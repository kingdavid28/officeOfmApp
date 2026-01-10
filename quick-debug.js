// Quick debug script - paste this in browser console on localhost:5173

async function quickDebugGoogleSignIn() {
    console.log('=== Quick Google Sign-In Debug ===');

    try {
        // Get Firebase modules
        const { getFirestore, collection, getDocs, doc, getDoc, query, where } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        const db = getFirestore();
        const auth = getAuth();

        console.log('Current user:', auth.currentUser?.email || 'None');

        // Check approved Google users
        console.log('\n1. Approved Google Users:');
        const approvedSnapshot = await getDocs(collection(db, 'approved_google_users'));
        console.log(`Found ${approvedSnapshot.size} approved users:`);
        approvedSnapshot.forEach(doc => {
            console.log(`  - ${doc.id}:`, doc.data());
        });

        // Check user profiles
        console.log('\n2. User Profiles:');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log(`Found ${usersSnapshot.size} user profiles:`);
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${doc.id}: ${data.email} (${data.role})`);
        });

        // Test specific email
        const testEmail = 'kingdavid28a@gmail.com';
        console.log(`\n3. Testing ${testEmail}:`);

        const approvedDoc = await getDoc(doc(db, 'approved_google_users', testEmail));
        console.log('In approved_google_users:', approvedDoc.exists() ? approvedDoc.data() : 'NO');

        const userQuery = query(collection(db, 'users'), where('email', '==', testEmail));
        const userSnapshot = await getDocs(userQuery);
        console.log('Has user profile:', !userSnapshot.empty ? 'YES' : 'NO');

        if (!userSnapshot.empty) {
            userSnapshot.forEach(doc => {
                console.log('Profile:', doc.id, doc.data());
            });
        }

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

// Test Google Sign-In
async function testGoogleSignInNow() {
    console.log('=== Testing Google Sign-In ===');

    try {
        // Import auth service
        const authModule = await import('./src/lib/auth.js');
        const authService = authModule.authService;

        console.log('Starting Google Sign-In...');
        await authService.signInWithGoogle();

    } catch (error) {
        console.error('Google Sign-In failed:', error);
        console.log('Error details:', {
            code: error.code,
            message: error.message
        });
    }
}

console.log('Quick debug loaded. Run:');
console.log('- quickDebugGoogleSignIn() to check database state');
console.log('- testGoogleSignInNow() to test sign-in');

// Auto-run the debug
quickDebugGoogleSignIn();