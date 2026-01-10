// Debug Firebase Configuration
// Run this in the browser console on your app page

async function debugFirebaseConfig() {
    console.log('=== Firebase Configuration Debug ===');

    try {
        // Check if Firebase is loaded
        if (typeof window.firebase === 'undefined') {
            console.log('❌ Firebase not loaded globally');
        } else {
            console.log('✅ Firebase loaded globally');
        }

        // Check current URL
        console.log('Current URL:', window.location.href);
        console.log('Current hostname:', window.location.hostname);
        console.log('Current port:', window.location.port);

        // Check environment variables (if accessible)
        console.log('Environment check:');
        console.log('- NODE_ENV:', process?.env?.NODE_ENV || 'not available');

        // Check if we can access Firebase config from the app
        const configCheck = {
            apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || 'not available',
            authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || 'not available',
            projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || 'not available'
        };

        console.log('Firebase config from env:', configCheck);

        // Test Firebase Auth redirect URL
        const expectedRedirectUrl = `${window.location.origin}/`;
        console.log('Expected redirect URL:', expectedRedirectUrl);

        // Check if Firebase Auth is initialized
        try {
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            console.log('✅ Firebase Auth initialized');
            console.log('Auth config:', {
                apiKey: auth.config.apiKey,
                authDomain: auth.config.authDomain,
                projectId: auth.config.projectId
            });
        } catch (authError) {
            console.log('❌ Firebase Auth error:', authError.message);
        }

        // Test network connectivity to Firebase
        console.log('Testing Firebase connectivity...');

        try {
            const response = await fetch(`https://${configCheck.authDomain}/__/firebase/init.json`);
            if (response.ok) {
                console.log('✅ Firebase hosting init.json accessible');
                const initData = await response.json();
                console.log('Init data:', initData);
            } else {
                console.log(`❌ Firebase hosting init.json not accessible: ${response.status}`);
            }
        } catch (fetchError) {
            console.log('❌ Network error accessing Firebase hosting:', fetchError.message);
        }

        // Check if we're in development mode
        const isDevelopment = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.port !== '';

        console.log('Development mode detected:', isDevelopment);

        if (isDevelopment) {
            console.log('🔧 Development mode recommendations:');
            console.log('1. Ensure localhost is in Firebase Console authorized domains');
            console.log('2. Consider using Firebase hosting for testing: firebase serve');
            console.log('3. Check that redirect URLs match your development setup');
        }

        console.log('=== Debug Complete ===');

    } catch (error) {
        console.error('Debug script error:', error);
    }
}

// Auto-run the debug
debugFirebaseConfig();

// Make it available globally for manual execution
window.debugFirebaseConfig = debugFirebaseConfig;