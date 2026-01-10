// Test Google Sign-In flow - paste this in browser console

async function testGoogleSignInFlow() {
    console.log('=== Testing Google Sign-In Flow ===');

    try {
        // First, sign out current user to test new user flow
        console.log('1. Current user status...');

        // Check if there's a current user
        const authData = localStorage.getItem('firebase:authUser:AIzaSyDy4jBqxKpD_B6SGAqRLyTrmGxQ9rEA0zw:[DEFAULT]');
        if (authData) {
            const user = JSON.parse(authData);
            console.log('Current user:', user.email);
            console.log('To test Google Sign-In for new users, you need to sign out first');
            console.log('Click the Sign Out button or run: signOutCurrentUser()');
            return;
        } else {
            console.log('No user currently signed in - good for testing');
        }

        console.log('2. Testing Google Sign-In button...');

        // Look for Google Sign-In button
        const googleButtons = document.querySelectorAll('button');
        let googleButton = null;

        googleButtons.forEach(btn => {
            const text = btn.textContent?.toLowerCase();
            if (text && (text.includes('google') || text.includes('continue with'))) {
                googleButton = btn;
                console.log('Found Google Sign-In button:', btn.textContent);
            }
        });

        if (!googleButton) {
            console.log('❌ No Google Sign-In button found');
            console.log('Make sure you are on the login page');
            return;
        }

        console.log('3. Instructions for testing:');
        console.log('- Click the Google Sign-In button');
        console.log('- Use a NEW Google account (not reycelrcentino@gmail.com)');
        console.log('- Watch the console for detailed logs');
        console.log('- Look for these key messages:');
        console.log('  * "Starting Google Sign-In..."');
        console.log('  * "Using redirect method..."');
        console.log('  * "Processing Google sign-in result:"');
        console.log('  * "New user needs approval, creating pending request"');
        console.log('  * "✅ Pending user request created"');
        console.log('  * Alert: "Access request submitted for approval..."');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Function to sign out current user
async function signOutCurrentUser() {
    try {
        // Clear localStorage auth data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes('firebase:authUser')) {
                localStorage.removeItem(key);
                console.log('Removed:', key);
            }
        });

        console.log('✅ Signed out successfully');
        console.log('Refresh the page to complete sign out');

        // Refresh the page
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Sign out failed:', error);
    }
}

// Function to check if Google Sign-In is working at all
async function checkGoogleSignInButton() {
    console.log('=== Checking Google Sign-In Button ===');

    try {
        const googleButtons = document.querySelectorAll('button');
        let found = false;

        googleButtons.forEach((btn, index) => {
            const text = btn.textContent?.toLowerCase();
            if (text && (text.includes('google') || text.includes('continue with'))) {
                console.log(`Button ${index + 1}: "${btn.textContent}"`);
                console.log('Disabled:', btn.disabled);
                console.log('Click handler:', btn.onclick ? 'Yes' : 'No');
                found = true;

                // Try to get the button's event listeners
                console.log('Element:', btn);
            }
        });

        if (!found) {
            console.log('❌ No Google Sign-In button found');
            console.log('Current page:', window.location.href);
            console.log('Make sure you are on the login page');
        }

    } catch (error) {
        console.error('Check button failed:', error);
    }
}

console.log('Google Sign-In test functions loaded:');
console.log('- testGoogleSignInFlow() - Main test function');
console.log('- signOutCurrentUser() - Sign out to test new user flow');
console.log('- checkGoogleSignInButton() - Check if button exists and works');

// Auto-run the test
testGoogleSignInFlow();