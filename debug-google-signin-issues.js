// Debug Google Sign-In Issues
// Run this in browser console to identify and fix specific issues

console.log('🔧 Google Sign-In Issue Debugger');

const debugger = {
    // Check if user is stuck in a bad state
    async checkUserState() {
        console.log('\n🔍 Checking current user state...');

        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log(`👤 Current user: ${currentUser.email} (${currentUser.uid})`);

            try {
                const profile = await authService.getUserProfile(currentUser.uid);
                if (profile) {
                    console.log(`✅ User profile found: ${profile.role}`);
                    console.log('📊 Profile details:', profile);
                } else {
                    console.log('❌ User is authenticated but has no profile');
                    console.log('🔧 This user should be signed out');

                    // Offer to fix
                    if (confirm('Sign out this user without profile?')) {
                        await authService.signOut();
                        console.log('✅ User signed out');
                        location.reload();
                    }
                }
            } catch (error) {
                console.error('❌ Error checking profile:', error);
            }
        } else {
            console.log('✅ No user currently signed in');
        }
    },

    // Check for pending requests
    async checkPendingRequests(email) {
        console.log(`\n🔍 Checking pending requests for: ${email}`);

        try {
            const hasPending = await authService.checkExistingPendingRequest(email);
            console.log(`📋 Has pending request: ${hasPending}`);

            if (hasPending) {
                const pendingUsers = await authService.getPendingUsers();
                const userRequest = pendingUsers.find(u => u.email === email);
                if (userRequest) {
                    console.log('📊 Pending request details:', userRequest);
                }
            }
        } catch (error) {
            console.error('❌ Error checking pending requests:', error);
        }
    },

    // Test Google Sign-In without UI
    async testGoogleSignInDirect() {
        console.log('\n🧪 Testing Google Sign-In directly...');

        try {
            console.log('🚀 Starting Google Sign-In...');
            const result = await authService.signInWithGoogle();

            if (result) {
                console.log('✅ Google Sign-In successful');
                console.log('👤 User:', result.user.email);

                // Check profile
                const profile = await authService.getUserProfile(result.user.uid);
                if (profile) {
                    console.log('✅ User has profile, sign-in complete');
                } else {
                    console.log('⚠️ New user detected, needs role selection');
                    await authService.signOut();
                }
            } else {
                console.log('🔄 Redirect method used, check after page reload');
            }
        } catch (error) {
            console.error('❌ Google Sign-In failed:', error);
        }
    },

    // Fix common issues
    async fixCommonIssues() {
        console.log('\n🔧 Attempting to fix common issues...');

        // Clear any stuck authentication state
        try {
            await authService.signOut();
            console.log('✅ Cleared authentication state');
        } catch (error) {
            console.log('⚠️ Could not clear auth state:', error.message);
        }

        // Clear local storage
        try {
            localStorage.clear();
            console.log('✅ Cleared local storage');
        } catch (error) {
            console.log('⚠️ Could not clear local storage:', error.message);
        }

        // Clear session storage
        try {
            sessionStorage.clear();
            console.log('✅ Cleared session storage');
        } catch (error) {
            console.log('⚠️ Could not clear session storage:', error.message);
        }

        console.log('🔄 Reloading page...');
        setTimeout(() => location.reload(), 1000);
    },

    // Check Firestore rules
    async checkFirestoreAccess() {
        console.log('\n🔍 Checking Firestore access...');

        try {
            const pendingUsers = await authService.getPendingUsers();
            console.log(`✅ Can read pending_users collection (${pendingUsers.length} items)`);
        } catch (error) {
            console.error('❌ Cannot read pending_users:', error);
            console.log('🔧 Check Firestore rules for pending_users collection');
        }

        try {
            // Try to read users collection (should fail for unauthenticated)
            const users = await authService.getAllUsers();
            console.log(`⚠️ Can read users collection (${users.length} items) - this might be a security issue`);
        } catch (error) {
            console.log('✅ Cannot read users collection (expected for unauthenticated users)');
        }
    },

    // Simulate role selection flow
    async simulateRoleSelection(email = 'test@example.com', role = 'staff') {
        console.log(`\n🧪 Simulating role selection for ${email} as ${role}...`);

        try {
            // Check if already has pending request
            const hasPending = await authService.checkExistingPendingRequest(email);
            if (hasPending) {
                console.log('⚠️ User already has pending request');
                return;
            }

            // Create request
            const requestId = await authService.createGoogleUserRequest(email, 'Test User', role);
            console.log(`✅ Created request with ID: ${requestId}`);

            // Verify request was created
            const pendingUsers = await authService.getPendingUsers();
            const newRequest = pendingUsers.find(u => u.email === email);
            if (newRequest) {
                console.log('✅ Request verified in database');
                console.log('📊 Request details:', newRequest);
            } else {
                console.log('❌ Request not found in database');
            }
        } catch (error) {
            console.error('❌ Role selection simulation failed:', error);
        }
    },

    // Check redirect result
    async checkRedirectResult() {
        console.log('\n🔍 Checking for redirect result...');

        try {
            const result = await authService.handleRedirectResult();
            if (result) {
                console.log('✅ Found redirect result');
                console.log('👤 User:', result.user.email);
            } else {
                console.log('ℹ️ No redirect result (normal for direct page load)');
            }
        } catch (error) {
            console.error('❌ Redirect result error:', error);
        }
    },

    // Full diagnostic
    async runFullDiagnostic(email) {
        console.log('🏥 Running full diagnostic...');

        await this.checkUserState();
        if (email) {
            await this.checkPendingRequests(email);
        }
        await this.checkFirestoreAccess();
        await this.checkRedirectResult();

        console.log('\n📋 Diagnostic complete. Check logs above for issues.');
    }
};

// Export to global scope
window.debugGoogleSignIn = debugger;

// Provide helpful commands
console.log('\n📋 Available debug commands:');
console.log('• debugGoogleSignIn.checkUserState() - Check current user state');
console.log('• debugGoogleSignIn.checkPendingRequests("email@example.com") - Check pending requests');
console.log('• debugGoogleSignIn.testGoogleSignInDirect() - Test Google Sign-In directly');
console.log('• debugGoogleSignIn.fixCommonIssues() - Fix common issues');
console.log('• debugGoogleSignIn.checkFirestoreAccess() - Check database access');
console.log('• debugGoogleSignIn.simulateRoleSelection("email", "role") - Test role selection');
console.log('• debugGoogleSignIn.runFullDiagnostic("email") - Run complete diagnostic');

// Auto-run basic checks
debugger.runFullDiagnostic().catch(console.error);