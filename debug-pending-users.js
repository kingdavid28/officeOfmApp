// Debug script to check pending users in admin panel
// Run this in browser console while signed in as admin

async function debugPendingUsers() {
    console.log('=== Debugging Pending Users in Admin Panel ===');

    try {
        // Import the auth service
        const { authService } = await import('./src/lib/auth.js');

        console.log('1. Checking all pending users in database...');
        try {
            const pendingUsers = await authService.getPendingUsers();
            console.log(`Total pending users found: ${pendingUsers.length}`);

            pendingUsers.forEach((user, index) => {
                console.log(`User ${index + 1}:`, {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    authProvider: user.authProvider,
                    status: user.status,
                    requestedAt: user.requestedAt
                });
            });

            // Filter Google users specifically
            const googleUsers = pendingUsers.filter(user => user.authProvider === 'google');
            console.log(`Google pending users: ${googleUsers.length}`);
            googleUsers.forEach((user, index) => {
                console.log(`Google User ${index + 1}:`, user);
            });

            // Filter email users
            const emailUsers = pendingUsers.filter(user => user.authProvider === 'email');
            console.log(`Email pending users: ${emailUsers.length}`);

        } catch (error) {
            console.error('❌ Error getting pending users:', error);
        }

        console.log('2. Checking what admin panel is showing...');

        // Look for pending users in the DOM
        const pendingElements = document.querySelectorAll('[class*="pending"], .pending-user, [data-testid*="pending"]');
        console.log(`Found ${pendingElements.length} pending user elements in DOM`);

        // Look for user cards or list items
        const userCards = document.querySelectorAll('.card, .user-card, [class*="user"]');
        console.log(`Found ${userCards.length} user card elements`);

        // Look for email addresses in the DOM (to see what users are displayed)
        const emailElements = document.querySelectorAll('*');
        const emailTexts = [];
        emailElements.forEach(el => {
            const text = el.textContent;
            if (text && text.includes('@') && text.includes('.')) {
                // Simple email detection
                const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                if (emailMatch) {
                    emailMatch.forEach(email => {
                        if (!emailTexts.includes(email)) {
                            emailTexts.push(email);
                        }
                    });
                }
            }
        });

        console.log('Emails found in DOM:', emailTexts);

        console.log('3. Checking admin panel state...');

        // Check if we're on the admin panel
        const isAdminPanel = window.location.href.includes('admin') ||
            document.querySelector('.admin') ||
            document.querySelector('[class*="admin"]');
        console.log('On admin panel:', isAdminPanel ? 'YES' : 'NO');

        // Look for tabs or sections
        const tabs = document.querySelectorAll('button[role="tab"], .tab, [class*="tab"]');
        console.log(`Found ${tabs.length} tab elements`);
        tabs.forEach((tab, index) => {
            console.log(`Tab ${index + 1}:`, tab.textContent);
        });

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }

    console.log('=== End Debug ===');
}

// Function to refresh admin panel data
async function refreshAdminPanel() {
    console.log('=== Refreshing Admin Panel ===');

    try {
        // Look for refresh or reload buttons
        const refreshButtons = document.querySelectorAll('button');
        let refreshButton = null;

        refreshButtons.forEach(btn => {
            const text = btn.textContent?.toLowerCase();
            if (text && (text.includes('refresh') || text.includes('reload') || text.includes('load'))) {
                refreshButton = btn;
                console.log('Found refresh button:', btn.textContent);
            }
        });

        if (refreshButton) {
            console.log('Clicking refresh button...');
            refreshButton.click();
        } else {
            console.log('No refresh button found. Try refreshing the page manually.');
        }

    } catch (error) {
        console.error('Refresh failed:', error);
    }
}

console.log('Pending users debug functions loaded:');
console.log('- debugPendingUsers() - Check database vs DOM');
console.log('- refreshAdminPanel() - Try to refresh the admin panel');

// Auto-run the debug
debugPendingUsers();