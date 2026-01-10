# Authentication Troubleshooting Guide

## Issues Fixed

### 1. Google Sign-In Problems
- **Added popup fallback**: Now tries popup first, falls back to redirect if blocked
- **Better error handling**: Specific error messages for different failure scenarios
- **Improved flow**: Consolidated Google sign-in processing logic

### 2. Request for Approval Issues
- **Enhanced validation**: Better form validation and error messages
- **Firestore rules**: Ensured anonymous users can create pending requests
- **Error handling**: More specific error messages for different scenarios

## How to Test

### Google Sign-In
1. **Open browser console** and run the debug script:
   ```javascript
   // Copy and paste debug-auth-issues.js content
   ```

2. **Try Google Sign-In** and check console for:
   - "Starting Google Sign-In..."
   - "Attempting popup sign-in..." or "Using redirect method..."
   - Any error messages

3. **Common issues to check**:
   - Popup blockers enabled
   - Domain not authorized in Firebase Console
   - Google provider not enabled

### Request for Approval
1. **Fill out registration form** with valid data
2. **Check browser console** for any errors
3. **Verify in Firebase Console** > Firestore > pending_users collection

## Firebase Console Checklist

### Authentication Settings
1. **Go to Authentication > Sign-in method**
2. **Enable Google** as a sign-in provider
3. **Add authorized domains**:
   - `localhost` (for development)
   - Your production domain

### Firestore Rules
1. **Go to Firestore Database > Rules**
2. **Verify pending_users collection** allows anonymous creation:
   ```
   match /pending_users/{pendingId} {
     allow create: if true; // Allow anonymous registration requests
   }
   ```

## Debug Commands (Browser Console)

```javascript
// Check current user
debugAuth()

// Force sign out and clear cache
forceSignOut()

// Debug user profile
debugUserProfile()

// Test approval request (paste test-approval-request.js content)
```

## Common Error Solutions

### "Popup blocked"
- **Solution**: Allow popups for localhost or use redirect method
- **Automatic**: Code now falls back to redirect automatically

### "Unauthorized domain"
- **Solution**: Add your domain to Firebase Console > Authentication > Settings > Authorized domains

### "Operation not allowed"
- **Solution**: Enable Google sign-in provider in Firebase Console

### "Missing or insufficient permissions"
- **Solution**: Deploy Firestore rules with `firebase deploy --only firestore:rules`

### "Network request failed"
- **Solution**: Check internet connection and Firebase project configuration

## What's New

### Enhanced Google Sign-In
- Popup-first approach with redirect fallback
- Better error handling and user feedback
- Consolidated processing logic

### Improved Registration
- Real-time form validation
- Better error messages
- Visual feedback with icons and loading states

### Better Debugging
- Debug scripts for troubleshooting
- Console commands for testing
- Comprehensive error logging

## Next Steps

1. **Test Google Sign-In** with different browsers
2. **Test registration form** with various inputs
3. **Check Firebase Console** for pending requests
4. **Verify admin approval flow** works correctly

If issues persist, check the browser console for specific error messages and refer to this guide for solutions.