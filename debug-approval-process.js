// Debug script for approval process - run in browser console on localhost:5174

async function debugApprovalProcess() {
    console.log('=== Debugging Approval Process ===');

    try {
        // First, let's check if there are any pending Google users
        console.log('1. Checking for pending Google users...');

        // We'll use a simple fetch to check the database
        // Since we can't import Firebase modules directly, we'll check the app state

        console.log('Current URL:', window.location.href);
        console.log('Please make sure you are signed in as admin');

        // Check if we're on the admin panel
        const isAdminPanel = window.location.href.includes('admin') || document.querySelector('[data-testid="admin-panel"]');
        console.log('On admin panel:', isAdminPanel ? 'YES' : 'NO');

        // Look for pending users in the DOM
        const pendingElements = document.querySelectorAll('[data-testid*="pending"], .pending, [class*="pending"]');
        console.log('Found pending elements:', pendingElements.length);

        // Check for error messages
        const errorElements = document.querySelectorAll('.error, [class*="error"], .alert-error');
        console.log('Found error elements:', errorElements.length);

        if (errorElements.length > 0) {
            errorElements.forEach((el, i) => {
                console.log(`Error ${i + 1}:`, el.textContent);
            });
        }

        // Instructions for manual testing
        console.log('\n=== Manual Testing Steps ===');
        console.log('1. Make sure you are signed in as admin (reycelrcentino@gmail.com)');
        console.log('2. Go to the admin panel');
        console.log('3. Look for pending Google users');
        console.log('4. Try to approve a user and watch the console for errors');
        console.log('5. Check the Network tab for failed requests');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

// Function to test approval manually
async function testApproval() {
    console.log('=== Testing Approval Process ===');

    try {
        // Look for approve buttons
        const approveButtons = document.querySelectorAll('button[onclick*="approve"], button[class*="approve"], button:contains("Approve")');
        console.log('Found approve buttons:', approveButtons.length);

        if (approveButtons.length > 0) {
            console.log('Approve buttons found. Click one and watch the console for errors.');
            approveButtons.forEach((btn, i) => {
                console.log(`Button ${i + 1}:`, btn.textContent, btn);
            });
        } else {
            console.log('No approve buttons found. Make sure there are pending users to approve.');
        }

    } catch (error) {
        console.error('Test approval failed:', error);
    }
}

// Function to create a test pending user
async function createTestPendingUser() {
    console.log('=== Creating Test Pending User ===');

    try {
        // This would simulate what happens when someone requests Google sign-in
        console.log('To create a test pending user:');
        console.log('1. Sign out from admin');
        console.log('2. Try to sign in with Google using a new email');
        console.log('3. This should create a pending request');
        console.log('4. Sign back in as admin to approve it');

    } catch (error) {
        console.error('Create test user failed:', error);
    }
}

console.log('Approval debug functions loaded. Run:');
console.log('- debugApprovalProcess() to check current state');
console.log('- testApproval() to test approval buttons');
console.log('- createTestPendingUser() for instructions to create test data');

// Auto-run the debug
debugApprovalProcess();