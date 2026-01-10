// Check admin profile - run in browser console on localhost:5174

async function checkAdminProfile() {
    console.log('=== Checking Admin Profile ===');

    try {
        // Check if we can access the auth context
        console.log('Current URL:', window.location.href);

        // Look for user profile information in the DOM
        const userElements = document.querySelectorAll('[data-testid*="user"], [class*="user"], .profile');
        console.log('Found user elements:', userElements.length);

        // Check for admin panel elements
        const adminElements = document.querySelectorAll('[data-testid*="admin"], [class*="admin"], .admin');
        console.log('Found admin elements:', adminElements.length);

        // Look for error messages about missing UID
        const errorMessages = document.querySelectorAll('.error, [class*="error"]');
        console.log('Error messages found:', errorMessages.length);

        errorMessages.forEach((el, i) => {
            const text = el.textContent;
            if (text && (text.includes('UID') || text.includes('user') || text.includes('profile'))) {
                console.log(`Relevant error ${i + 1}:`, text);
            }
        });

        // Check browser console for auth-related errors
        console.log('\n=== Instructions ===');
        console.log('1. Make sure you are signed in as admin');
        console.log('2. Check if you see "Unable to identify current user" alert');
        console.log('3. Look for any console errors about missing UID');
        console.log('4. Try refreshing the page');

        // Check localStorage for auth data
        const authData = localStorage.getItem('firebase:authUser:AIzaSyDy4jBqxKpD_B6SGAqRLyTrmGxQ9rEA0zw:[DEFAULT]');
        if (authData) {
            console.log('Auth data found in localStorage');
            try {
                const parsed = JSON.parse(authData);
                console.log('User UID from localStorage:', parsed.uid);
                console.log('User email from localStorage:', parsed.email);
            } catch (e) {
                console.log('Could not parse auth data');
            }
        } else {
            console.log('No auth data in localStorage');
        }

    } catch (error) {
        console.error('Check admin profile failed:', error);
    }
}

// Function to test the approval process step by step
async function stepByStepApprovalTest() {
    console.log('=== Step by Step Approval Test ===');

    console.log('Step 1: Check if you are on the admin panel');
    const isAdminPanel = document.querySelector('.admin') || document.querySelector('[class*="admin"]') || window.location.href.includes('admin');
    console.log('On admin panel:', isAdminPanel ? 'YES' : 'NO');

    console.log('Step 2: Look for pending users section');
    const pendingSection = document.querySelector('[class*="pending"]') || document.querySelector('h2, h3').textContent?.includes('Pending');
    console.log('Pending section found:', pendingSection ? 'YES' : 'NO');

    console.log('Step 3: Look for approve buttons');
    const approveButtons = document.querySelectorAll('button');
    let approveButtonFound = false;
    approveButtons.forEach(btn => {
        if (btn.textContent?.toLowerCase().includes('approve')) {
            console.log('Approve button found:', btn.textContent);
            approveButtonFound = true;
        }
    });
    console.log('Approve buttons found:', approveButtonFound ? 'YES' : 'NO');

    if (!approveButtonFound) {
        console.log('No approve buttons found. This could mean:');
        console.log('- No pending users to approve');
        console.log('- Admin panel not loaded correctly');
        console.log('- User not signed in as admin');
    }
}

console.log('Admin profile check functions loaded. Run:');
console.log('- checkAdminProfile() to check admin user profile');
console.log('- stepByStepApprovalTest() to test approval process step by step');

// Auto-run the check
checkAdminProfile();