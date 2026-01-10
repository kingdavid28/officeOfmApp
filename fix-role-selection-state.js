// Fix Role Selection State Issues
// Run this in browser console if user is stuck after role selection

console.log('🔧 Role Selection State Fixer');

const roleSelectionFixer = {
    async fixCurrentState() {
        console.log('🔧 Fixing current authentication state...');

        try {
            // Sign out any current user
            await authService.signOut();
            console.log('✅ Signed out current user');

            // Clear any cached state
            localStorage.removeItem('firebase:authUser:' + auth.app.options.apiKey + ':[DEFAULT]');
            sessionStorage.clear();
            console.log('✅ Cleared cached authentication state');

            // Force reload to reset React state
            console.log('🔄 Reloading page to reset state...');
            setTimeout(() => location.reload(), 1000);

        } catch (error) {
            console.error('❌ Error fixing state:', error);
        }
    },

    async checkAndFixPendingRequest(email) {
        console.log(`🔍 Checking pending request for: ${email}`);

        try {
            const hasPending = await authService.checkExistingPendingRequest(email);

            if (hasPending) {
                console.log('✅ Pending request exists - user should see approval page');

                // Ensure user is signed out
                if (auth.currentUser) {
                    console.log('🔧 Signing out user to show pending approval page');
                    await authService.signOut();
                }

                // Trigger pending approval state
                console.log('🔄 Reloading to show pending approval page...');
                setTimeout(() => location.reload(), 500);

            } else {
                console.log('❌ No pending request found');
                console.log('🔧 User may need to go through role selection again');

                // Clear any stuck state
                await this.fixCurrentState();
            }

        } catch (error) {
            console.error('❌ Error checking pending request:', error);
            console.log('🔧 Clearing state and reloading...');
            await this.fixCurrentState();
        }
    },

    async forceShowPendingApproval(email) {
        console.log(`🎭 Forcing pending approval page for: ${email}`);

        try {
            // Sign out current user
            await authService.signOut();

            // Set auth error to trigger pending approval page
            // This is a bit hacky but should work for testing
            console.log('🔧 Setting pending approval state...');

            // Reload page - the AuthContext should detect the pending request
            location.reload();

        } catch (error) {
            console.error('❌ Error forcing pending approval:', error);
        }
    },

    async quickFix(email = 'doorknock28@gmail.com') {
        console.log(`🚀 Quick fix for role selection issues: ${email}`);

        // Check current state
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log(`👤 Current user: ${currentUser.email}`);

            // Check if user has profile
            try {
                const profile = await authService.getUserProfile(currentUser.uid);
                if (!profile) {
                    console.log('❌ User has no profile - fixing state...');
                    await this.checkAndFixPendingRequest(email);
                    return;
                }
            } catch (error) {
                console.log('❌ Error checking profile - fixing state...');
                await this.checkAndFixPendingRequest(email);
                return;
            }
        }

        // Check if pending request exists
        await this.checkAndFixPendingRequest(email);
    }
};

// Export to global scope
window.fixRoleSelection = roleSelectionFixer;

// Auto-run quick fix
roleSelectionFixer.quickFix().catch(console.error);

console.log('\n📋 Available fix commands:');
console.log('• fixRoleSelection.quickFix("email@example.com") - Auto-fix common issues');
console.log('• fixRoleSelection.fixCurrentState() - Clear stuck authentication state');
console.log('• fixRoleSelection.checkAndFixPendingRequest("email") - Check and fix pending request');
console.log('• fixRoleSelection.forceShowPendingApproval("email") - Force show pending approval page');