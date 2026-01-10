// Test script for approval request functionality
// Run this in browser console to test the request system

async function testApprovalRequest() {
    console.log('=== Testing Approval Request System ===');

    try {
        // Import the auth service
        const { authService } = await import('./src/lib/auth.ts');

        // Test data
        const testEmail = 'test@example.com';
        const testName = 'Test User';
        const testRole = 'staff';

        console.log('1. Testing requestUserCreation...');
        console.log('Test data:', { testEmail, testName, testRole });

        try {
            const result = await authService.requestUserCreation(testEmail, testName, testRole);
            console.log('✅ Request created successfully:', result);
        } catch (error) {
            console.error('❌ Request creation failed:', error);

            // Check if it's a duplicate request error
            if (error.message.includes('already pending')) {
                console.log('ℹ️ This is expected if the request already exists');
            }
        }

        console.log('2. Testing checkExistingPendingRequest...');
        try {
            const exists = await authService.checkExistingPendingRequest(testEmail);
            console.log('Pending request exists:', exists);
        } catch (error) {
            console.error('❌ Check pending request failed:', error);
        }

        console.log('3. Testing getPendingUsers (requires admin)...');
        try {
            const pendingUsers = await authService.getPendingUsers();
            console.log('Pending users count:', pendingUsers.length);
            console.log('Recent pending users:', pendingUsers.slice(0, 3));
        } catch (error) {
            console.error('❌ Get pending users failed (may require admin):', error);
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error);
    }

    console.log('=== End Test ===');
}

// Run the test
testApprovalRequest();