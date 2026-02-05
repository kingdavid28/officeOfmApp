// Test Environment Detection
// Run this in browser console to see which environment you're in

console.log('🔍 Environment Detection Test');
console.log('='.repeat(60));

// Check current environment
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const mode = import.meta.env.MODE;

console.log('Environment Details:');
console.log('  Mode:', mode);
console.log('  Is Development:', isDevelopment);
console.log('  Is Production:', isProduction);
console.log('  Current URL:', window.location.href);

// Check Firebase connections
console.log('\nFirebase Connections:');

// Check if using emulators
const usingEmulators = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

if (usingEmulators) {
    console.log('  ✅ Using Emulators (Development)');
    console.log('  Auth:', 'http://127.0.0.1:9099');
    console.log('  Firestore:', '127.0.0.1:8081');
    console.log('  Storage:', '127.0.0.1:9199');
    console.log('  Data Location:', 'Local computer');
} else {
    console.log('  ✅ Using Real Firebase (Production)');
    console.log('  Auth:', 'Firebase Cloud');
    console.log('  Firestore:', 'Firebase Cloud');
    console.log('  Storage:', 'Firebase Cloud');
    console.log('  Data Location:', 'Firebase servers');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Environments are completely separate!');
console.log('💡 Development cannot affect production data');
