// Debug Google Sign-In request creation - run in browser console

async function debugGoogleSignInRequest() {
    console.log('=== Debugging Google Sign-In Request Creation ===');

    try {
        // Test if we can create a pending user manually
        console.log('1. Testing manual pending user creation...');

        // We'll simulate what should happen when someone tries Google Sign-In
        const testPendingUser = {
            email: 'test-google-user@gmail.com',
            name: 'Test Google User',
            role: 'staff',
            requestedAt: new Date(),
            status: 'pending',
            authProvider: 'google'
        };

        console.log('Test pending user data:', testPendingUser);

        // Check if we can access Firestore (this will fail in console, but we can check)
        console.log('2. Checking Firestore access...');
        console.log('Note: Direct Firestore access from console will fail due to module imports');

        // Instructions for manual testing
        console.log('\n=== Manual Testing Instructions ===');
        console.log('1. Sign out from any current session');
        console.log('2. Go to the login page');
        console.log('3. Click "Continue with Google"');
        console.log('4. Use a NEW Google account (not already approved)');
        console.log('5. Watch the console for detailed logs during the process');
        console.log('6. Check if you see "Creating pending user:" log message');
        console.log('7. Check if you get "Access request submitted" message');

        console.log('\n=== What to look for ===');
        console.log('- "Processing Google sign-in result:" - Shows the flow started');
        console.log('- "User not found in approved_google_users collection" - Expected for new users');
        console.log('- "New user needs approval, creating pending request" - Should appear');
        console.log('- "Creating pending user:" - Should show the user data');
        console.log('- "✅ Pending user request created" - Success message');
        console.log('- Any error messages about permissions or Firestore');

        console.log('\n=== Common Issues ===');
        console.log('- If no logs appear: Google Sign-In not working at all');
        console.log('- If logs stop at "Processing Google sign-in result": Profile lookup failing');
        console.log('- If logs stop at "Creating pending user": Firestore permission issue');
        console.log('- If "permission-denied" error: Firestore rules problem');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

// Function to check current pending users (if signed in as admin)
async function checkPendingUsers() {
    console.log('=== Checking Current Pending Users ===');

    try {
        // Look for pending users in the admin panel DOM
        const pendingElements = document.querySelectorAll('[class*="pending"], .pending-user, [data-testid*="pending"]');
        console.log('Found pending elements in DOM:', pendingElements.length);

        // Look for "No pending users" or similar messages
        const textElements = document.querySelectorAll('p, div, span');
        let noPendingMessage = false;
        textElements.forEach(el => {
            const text = el.textContent?.toLowerCase();
            if (text && (text.includes('no pending') || text.includes('no users') || text.includes('empty'))) {
                console.log('Found "no pending" message:', el.textContent);
                noPendingMessage = true;
            }
        });

        if (pendingElements.length === 0 && !noPendingMessage) {
            console.log('No pending user elements found. This could mean:');
            console.log('- Not on admin panel');
            console.log('- Admin panel not loaded correctly');
            console.log('- No pending users exist');
        }

        // Check if we're on the admin panel
        const isAdminPanel = window.location.href.includes('admin') ||
            document.querySelector('.admin') ||
            document.querySelector('[class*="admin"]');
        console.log('On admin panel:', isAdminPanel ? 'YES' : 'NO');

    } catch (error) {
        console.error('Check pending users failed:', error);
    }
}

console.log('Google Sign-In request debug functions loaded. Run:');
console.log('- debugGoogleSignInRequest() for testing instructions');
console.log('- checkPendingUsers() to check current pending users');

// Auto-run the debug
debugGoogleSignInRequest();