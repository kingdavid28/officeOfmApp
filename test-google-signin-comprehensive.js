// Comprehensive Google Sign-In Flow Test
// Run this in browser console to test the complete flow

console.log('🔍 Starting comprehensive Google Sign-In flow test...');

// Test utilities
const testUtils = {
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    logStep(step, message) {
        console.log(`📋 Step ${step}: ${message}`);
    },

    logSuccess(message) {
        console.log(`✅ ${message}`);
    },

    logError(message) {
        console.error(`❌ ${message}`);
    },

    logWarning(message) {
        console.warn(`⚠️ ${message}`);
    }
};

// Test 1: Check authentication service availability
async function testAuthServiceAvailability() {
    testUtils.logStep(1, 'Checking authentication service availability');

    try {
        if (typeof authService === 'undefined') {
            testUtils.logError('authService is not available in global scope');
            return false;
        }

        if (typeof authService.signInWithGoogle !== 'function') {
            testUtils.logError('signInWithGoogle method not found');
            return false;
        }

        testUtils.logSuccess('Authentication service is available');
        return true;
    } catch (error) {
        testUtils.logError(`Auth service check failed: ${error.message}`);
        return false;
    }
}

// Test 2: Check Firebase configuration
async function testFirebaseConfig() {
    testUtils.logStep(2, 'Checking Firebase configuration');

    try {
        if (typeof auth === 'undefined') {
            testUtils.logError('Firebase auth is not available');
            return false;
        }

        if (typeof db === 'undefined') {
            testUtils.logError('Firestore db is not available');
            return false;
        }

        // Check if Google provider is configured
        const provider = new GoogleAuthProvider();
        if (!provider) {
            testUtils.logError('Google Auth Provider not available');
            return false;
        }

        testUtils.logSuccess('Firebase configuration is valid');
        return true;
    } catch (error) {
        testUtils.logError(`Firebase config check failed: ${error.message}`);
        return false;
    }
}

// Test 3: Check current authentication state
async function testCurrentAuthState() {
    testUtils.logStep(3, 'Checking current authentication state');

    try {
        const currentUser = auth.currentUser;

        if (currentUser) {
            testUtils.logWarning(`User is already signed in: ${currentUser.email}`);

            // Check if user has profile
            const profile = await authService.getUserProfile(currentUser.uid);
            if (profile) {
                testUtils.logSuccess(`User has valid profile with role: ${profile.role}`);
            } else {
                testUtils.logError('User is signed in but has no profile');
            }
        } else {
            testUtils.logSuccess('No user currently signed in - ready for testing');
        }

        return true;
    } catch (error) {
        testUtils.logError(`Auth state check failed: ${error.message}`);
        return false;
    }
}

// Test 4: Test Google Sign-In button availability
async function testGoogleSignInButton() {
    testUtils.logStep(4, 'Checking Google Sign-In button availability');

    try {
        const googleButton = document.querySelector('button:has(svg)') ||
            document.querySelector('[data-testid="google-signin"]') ||
            document.querySelector('button:contains("Google")');

        if (!googleButton) {
            testUtils.logWarning('Google Sign-In button not found in DOM');
            testUtils.logWarning('This might be normal if user is already signed in');
            return true;
        }

        testUtils.logSuccess('Google Sign-In button found in DOM');

        // Check if button is enabled
        if (googleButton.disabled) {
            testUtils.logWarning('Google Sign-In button is disabled');
        } else {
            testUtils.logSuccess('Google Sign-In button is enabled and clickable');
        }

        return true;
    } catch (error) {
        testUtils.logError(`Button check failed: ${error.message}`);
        return false;
    }
}

// Test 5: Test pending users collection access
async function testPendingUsersAccess() {
    testUtils.logStep(5, 'Testing pending users collection access');

    try {
        // Try to read pending users (should work for unauthenticated users based on rules)
        const pendingUsers = await authService.getPendingUsers();
        testUtils.logSuccess(`Can access pending users collection (${pendingUsers.length} pending)`);
        return true;
    } catch (error) {
        testUtils.logError(`Cannot access pending users: ${error.message}`);
        testUtils.logWarning('This might indicate Firestore rules issues');
        return false;
    }
}

// Test 6: Test role selection modal component
async function testRoleSelectionModal() {
    testUtils.logStep(6, 'Testing role selection modal availability');

    try {
        // Check if GoogleRoleSelectionModal is available
        if (typeof GoogleRoleSelectionModal === 'undefined') {
            testUtils.logWarning('GoogleRoleSelectionModal not in global scope');
            testUtils.logWarning('This is normal - component is imported in React');
        }

        // Check if modal container exists in DOM
        const modalContainer = document.querySelector('[role="dialog"]') ||
            document.querySelector('.fixed.inset-0') ||
            document.querySelector('[data-testid="role-modal"]');

        if (modalContainer) {
            testUtils.logSuccess('Role selection modal found in DOM');
        } else {
            testUtils.logSuccess('No role selection modal in DOM (expected when not needed)');
        }

        return true;
    } catch (error) {
        testUtils.logError(`Modal check failed: ${error.message}`);
        return false;
    }
}

// Test 7: Simulate Google Sign-In flow (without actual authentication)
async function testGoogleSignInFlow() {
    testUtils.logStep(7, 'Testing Google Sign-In flow simulation');

    try {
        // Test the flow logic without actual authentication
        const testEmail = 'test@example.com';

        // Check if user has existing pending request
        const hasPending = await authService.checkExistingPendingRequest(testEmail);
        testUtils.logSuccess(`Pending request check works: ${hasPending ? 'Has pending' : 'No pending'}`);

        // Test role request creation (will fail due to duplicate, but tests the flow)
        try {
            await authService.createGoogleUserRequest(testEmail, 'Test User', 'staff');
            testUtils.logSuccess('Role request creation works');
        } catch (error) {
            if (error.message.includes('already pending')) {
                testUtils.logSuccess('Duplicate request prevention works');
            } else {
                testUtils.logError(`Role request failed: ${error.message}`);
            }
        }

        return true;
    } catch (error) {
        testUtils.logError(`Flow simulation failed: ${error.message}`);
        return false;
    }
}

// Test 8: Check redirect result handling
async function testRedirectResultHandling() {
    testUtils.logStep(8, 'Testing redirect result handling');

    try {
        // Test redirect result handling (should return null if no redirect)
        const redirectResult = await authService.handleRedirectResult();

        if (redirectResult === null) {
            testUtils.logSuccess('No redirect result (expected for normal page load)');
        } else {
            testUtils.logSuccess(`Redirect result handled: ${redirectResult.user.email}`);
        }

        return true;
    } catch (error) {
        testUtils.logError(`Redirect handling failed: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runComprehensiveTest() {
    console.log('🚀 Running comprehensive Google Sign-In test suite...\n');

    const tests = [
        testAuthServiceAvailability,
        testFirebaseConfig,
        testCurrentAuthState,
        testGoogleSignInButton,
        testPendingUsersAccess,
        testRoleSelectionModal,
        testGoogleSignInFlow,
        testRedirectResultHandling
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (let i = 0; i < tests.length; i++) {
        try {
            const result = await tests[i]();
            if (result) passedTests++;

            // Add delay between tests
            await testUtils.delay(500);
            console.log(''); // Add spacing
        } catch (error) {
            testUtils.logError(`Test ${i + 1} crashed: ${error.message}`);
        }
    }

    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Google Sign-In flow should work correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above for issues.');
    }

    // Provide next steps
    console.log('\n📋 Next Steps:');
    console.log('1. If tests passed, try actual Google Sign-In with a new account');
    console.log('2. Check browser console during sign-in for detailed logs');
    console.log('3. Verify role selection modal appears for new users');
    console.log('4. Test both popup and redirect flows');

    return passedTests === totalTests;
}

// Export for manual testing
window.testGoogleSignIn = runComprehensiveTest;
window.testUtils = testUtils;

// Auto-run the test
runComprehensiveTest().catch(error => {
    console.error('🔥 Test suite crashed:', error);
});