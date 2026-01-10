// Debug Google Sign-In button click - paste in browser console

async function debugButtonClick() {
    console.log('=== Debugging Google Sign-In Button Click ===');

    try {
        // Find the Google Sign-In button
        const googleButtons = document.querySelectorAll('button');
        let googleButton = null;

        googleButtons.forEach(btn => {
            const text = btn.textContent?.toLowerCase();
            if (text && (text.includes('google') || text.includes('continue with'))) {
                googleButton = btn;
            }
        });

        if (!googleButton) {
            console.log('❌ No Google Sign-In button found');
            return;
        }

        console.log('✅ Found Google Sign-In button:', googleButton.textContent);
        console.log('Button disabled:', googleButton.disabled);
        console.log('Button type:', googleButton.type);
        console.log('Button onclick:', googleButton.onclick);

        // Check if button has event listeners
        console.log('Button element:', googleButton);

        // Try to manually trigger the click
        console.log('Attempting to manually trigger click...');

        // Add our own click listener to see if clicks are working
        googleButton.addEventListener('click', (e) => {
            console.log('🔥 Button click detected!');
            console.log('Event:', e);
        });

        // Try to access the React component
        console.log('Checking for React component...');
        const reactKey = Object.keys(googleButton).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
        if (reactKey) {
            console.log('✅ React component found');
        } else {
            console.log('❌ No React component found - this might be the issue');
        }

        // Check if authService is available
        console.log('Checking authService availability...');
        if (window.authService) {
            console.log('✅ authService found on window');
        } else {
            console.log('❌ authService not found on window');
        }

        console.log('\n=== Manual Test ===');
        console.log('Now click the Google Sign-In button and see if you get the "🔥 Button click detected!" message');

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

// Function to test authService directly
async function testAuthServiceDirectly() {
    console.log('=== Testing AuthService Directly ===');

    try {
        // Try to import and test authService
        console.log('Attempting to access authService...');

        // Check if we can access it from the global scope
        if (window.authService) {
            console.log('✅ Found authService on window');

            try {
                console.log('Testing signInWithGoogle method...');
                await window.authService.signInWithGoogle();
            } catch (error) {
                console.log('AuthService error:', error);
            }
        } else {
            console.log('❌ authService not available on window');
            console.log('This might be why the button click is not working');
        }

    } catch (error) {
        console.error('AuthService test failed:', error);
    }
}

// Function to check React component state
async function checkReactComponent() {
    console.log('=== Checking React Component ===');

    try {
        // Look for React DevTools
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            console.log('✅ React DevTools available');
        } else {
            console.log('❌ React DevTools not available');
        }

        // Check if React is loaded
        if (window.React) {
            console.log('✅ React is loaded');
        } else {
            console.log('❌ React not found on window');
        }

        // Look for the app root
        const appRoot = document.getElementById('root') || document.querySelector('[data-reactroot]');
        if (appRoot) {
            console.log('✅ React app root found');
        } else {
            console.log('❌ React app root not found');
        }

    } catch (error) {
        console.error('React component check failed:', error);
    }
}

console.log('Button debug functions loaded:');
console.log('- debugButtonClick() - Debug the button click handler');
console.log('- testAuthServiceDirectly() - Test authService directly');
console.log('- checkReactComponent() - Check React component state');

// Auto-run the debug
debugButtonClick();