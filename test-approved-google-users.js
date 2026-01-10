// Test Approved Google Users Flow
// Run this in browser console to test approved Google user handling

console.log('🧪 Testing Approved Google Users Flow...');

const testApprovedGoogleUsers = {
    async checkApprovedGoogleUsers() {
        console.log('\n🔍 Checking approved_google_users collection...');

        try {
            // Get all documents from approved_google_users collection
            const snapshot = await getDocs(collection(db, 'approved_google_users'));

            if (snapshot.empty) {
                console.log('📋 No approved Google users found');
                return [];
            }

            const approvedUsers = [];
            snapshot.forEach(doc => {
                const userData = doc.data();
                approvedUsers.push({
                    email: doc.id,
                    ...userData
                });
                console.log(`✅ Approved user: ${doc.id} (${userData.role})`);
            });

            return approvedUsers;
        } catch (error) {
            console.error('❌ Error checking approved Google users:', error);
            return [];
        }
    },

    async checkUserProfile(email) {
        console.log(`\n🔍 Checking user profile for: ${email}`);

        try {
            // First check if user is currently signed in
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email === email) {
                console.log(`👤 User is currently signed in: ${currentUser.uid}`);

                // Check if they have a profile
                const profile = await authService.getUserProfile(currentUser.uid);
                if (profile) {
                    console.log(`✅ User has profile: ${profile.role}`);
                    return { hasProfile: true, profile };
                } else {
                    console.log('❌ User is signed in but has no profile');
                    return { hasProfile: false, profile: null };
                }
            } else {
                console.log('ℹ️ User is not currently signed in');
                return { hasProfile: false, profile: null };
            }
        } catch (error) {
            console.error('❌ Error checking user profile:', error);
            return { hasProfile: false, profile: null };
        }
    },

    async simulateApprovedUserSignIn(email) {
        console.log(`\n🎭 Simulating approved user sign-in for: ${email}`);

        // Check if user is in approved_google_users collection
        try {
            const approvedDoc = await getDoc(doc(db, 'approved_google_users', email));

            if (approvedDoc.exists()) {
                console.log('✅ User found in approved_google_users collection');
                console.log('📊 Approved user data:', approvedDoc.data());

                console.log('🔧 Expected flow:');
                console.log('1. User signs in with Google');
                console.log('2. System checks for existing profile (none found)');
                console.log('3. System checks approved_google_users collection');
                console.log('4. System creates user profile from approved data');
                console.log('5. System removes user from approved_google_users');
                console.log('6. User is signed in successfully');

                return true;
            } else {
                console.log('❌ User not found in approved_google_users collection');
                console.log('🔧 This user would go through role selection');
                return false;
            }
        } catch (error) {
            console.error('❌ Error checking approved user:', error);
            return false;
        }
    },

    async createTestApprovedUser(email, role = 'staff') {
        console.log(`\n🧪 Creating test approved user: ${email} (${role})`);

        try {
            const approvedUserData = {
                uid: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
                email: email,
                role: role,
                name: email.split('@')[0],
                createdAt: new Date(),
                lastLogin: new Date(),
                approvedBy: 'test-admin',
                approvedAt: new Date()
            };

            await setDoc(doc(db, 'approved_google_users', email), approvedUserData);
            console.log('✅ Test approved user created');
            console.log('📊 User data:', approvedUserData);

            return approvedUserData;
        } catch (error) {
            console.error('❌ Error creating test approved user:', error);
            return null;
        }
    },

    async cleanupTestUser(email) {
        console.log(`\n🧹 Cleaning up test user: ${email}`);

        try {
            // Remove from approved_google_users
            await deleteDoc(doc(db, 'approved_google_users', email));
            console.log('✅ Removed from approved_google_users');

            // If user has a profile, remove it too
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email === email) {
                await deleteDoc(doc(db, 'users', currentUser.uid));
                console.log('✅ Removed user profile');

                // Sign out user
                await authService.signOut();
                console.log('✅ Signed out user');
            }
        } catch (error) {
            console.error('❌ Error cleaning up test user:', error);
        }
    },

    async runFullTest(testEmail = 'test-approved@gmail.com') {
        console.log(`\n🚀 Running full approved Google user test for: ${testEmail}`);

        // Step 1: Check current state
        await this.checkApprovedGoogleUsers();
        await this.checkUserProfile(testEmail);

        // Step 2: Create test approved user
        const approvedUser = await this.createTestApprovedUser(testEmail, 'staff');

        if (approvedUser) {
            console.log('\n📋 Test Setup Complete:');
            console.log(`✅ Test user ${testEmail} is now in approved_google_users collection`);
            console.log('🔧 Next steps:');
            console.log('1. Try Google Sign-In with this email');
            console.log('2. System should detect approved user');
            console.log('3. System should create profile and sign user in');
            console.log('4. User should NOT see role selection modal');

            console.log('\n⚠️ Note: You need to actually sign in with Google to test the full flow');
            console.log('🧹 Run testApprovedGoogleUsers.cleanupTestUser("' + testEmail + '") when done');
        }
    }
};

// Export to global scope
window.testApprovedGoogleUsers = testApprovedGoogleUsers;

// Auto-run basic checks
testApprovedGoogleUsers.checkApprovedGoogleUsers().catch(console.error);

console.log('\n📋 Available test commands:');
console.log('• testApprovedGoogleUsers.checkApprovedGoogleUsers() - Check approved users');
console.log('• testApprovedGoogleUsers.checkUserProfile("email") - Check user profile');
console.log('• testApprovedGoogleUsers.simulateApprovedUserSignIn("email") - Simulate sign-in');
console.log('• testApprovedGoogleUsers.createTestApprovedUser("email", "role") - Create test user');
console.log('• testApprovedGoogleUsers.runFullTest("email") - Run complete test');
console.log('• testApprovedGoogleUsers.cleanupTestUser("email") - Clean up test user');