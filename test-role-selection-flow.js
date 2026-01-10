// Test Role Selection Flow
// Run this in browser console after Google Sign-In role selection

console.log('🧪 Testing Role Selection Flow...');

const testRoleSelectionFlow = {
    async checkPendingRequest(email) {
        console.log(`🔍 Checking pending request for: ${email}`);

        try {
            const hasPending = await authService.checkExistingPendingRequest(email);
            console.log(`📋 Has pending request: ${hasPending}`);

            if (hasPending) {
                const pendingUsers = await authService.getPendingUsers();
                const userRequest = pendingUsers.find(u => u.email === email);
                if (userRequest) {
                    console.log('📊 Pending request details:', userRequest);
                    console.log(`✅ Request created at: ${userRequest.requestedAt}`);
                    console.log(`🎭 Requested role: ${userRequest.role}`);
                    console.log(`🔗 Auth provider: ${userRequest.authProvider}`);
                }
            }

            return hasPending;
        } catch (error) {
            console.error('❌ Error checking pending request:', error);
            return false;
        }
    },

    async checkCurrentAuthState() {
        console.log('\n🔍 Checking current authentication state...');

        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log(`👤 Current user: ${currentUser.email} (${currentUser.uid})`);
            console.log('⚠️ User should be signed out after role selection');

            // Check if user has profile
            try {
                const profile = await authService.getUserProfile(currentUser.uid);
                if (profile) {
                    console.log(`📊 User has profile: ${profile.role}`);
                    console.log('✅ This is an existing user');
                } else {
                    console.log('❌ User has no profile - this should trigger sign out');
                }
            } catch (error) {
                console.error('❌ Error checking profile:', error);
            }
        } else {
            console.log('✅ No user currently signed in (expected after role selection)');
        }
    },

    async simulateRoleSelectionComplete(email) {
        console.log(`\n🎭 Simulating role selection completion for: ${email}`);

        // Check if request was created
        const hasPending = await this.checkPendingRequest(email);

        if (hasPending) {
            console.log('✅ Role selection flow completed successfully');
            console.log('📋 User should now see pending approval page');
        } else {
            console.log('❌ Role selection may have failed');
            console.log('🔧 Check if request was created in Firestore');
        }
    },

    async testCompleteFlow(email = 'doorknock28@gmail.com') {
        console.log(`\n🚀 Testing complete role selection flow for: ${email}`);

        await this.checkCurrentAuthState();
        await this.checkPendingRequest(email);

        console.log('\n📋 Expected behavior after role selection:');
        console.log('1. ✅ User should be signed out');
        console.log('2. ✅ Pending request should exist in Firestore');
        console.log('3. ✅ App should show pending approval page');
        console.log('4. ✅ No authentication loops or errors');

        console.log('\n🔧 If issues persist, try:');
        console.log('• debugGoogleSignIn.fixCommonIssues()');
        console.log('• Clear browser cache and cookies');
        console.log('• Check Firestore rules for pending_users collection');
    }
};

// Export to global scope
window.testRoleSelection = testRoleSelectionFlow;

// Auto-run test for the user from the logs
testRoleSelectionFlow.testCompleteFlow('doorknock28@gmail.com').catch(console.error);

console.log('\n📋 Available commands:');
console.log('• testRoleSelection.checkPendingRequest("email@example.com")');
console.log('• testRoleSelection.checkCurrentAuthState()');
console.log('• testRoleSelection.testCompleteFlow("email@example.com")');