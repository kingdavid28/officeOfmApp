# Google Sign-In Testing Guide

## Overview

This guide provides comprehensive testing steps for the Google Sign-In and role selection system. The system has been enhanced to handle edge cases and provide better error handling.

## Recent Improvements

### Enhanced Error Handling
- Better retry logic with exponential backoff for profile fetching
- Improved state management to prevent stuck authentication states
- More detailed console logging for debugging
- Automatic cleanup of invalid authentication states

### Improved User Experience
- Clear role selection modal for new users
- Professional pending approval page instead of alert popups
- Better error messages with specific guidance
- Automatic fallback from popup to redirect when needed

## Testing Scenarios

### 1. New User - First Time Google Sign-In (Popup)

**Steps:**
1. Use a Google account that has never been registered
2. Open browser console to monitor logs
3. Click "Continue with Google"
4. Complete Google authentication in popup
5. **Expected Result:** Role selection modal appears

**Console Logs to Look For:**
```
Starting Google Sign-In...
Attempting popup sign-in...
Popup sign-in successful: newuser@gmail.com
Google Sign-In popup completed, checking user profile...
New user detected, checking for existing requests...
Showing role selection modal for new user
```

**What Should Happen:**
- Google popup opens and closes after authentication
- Role selection modal appears with Staff/Admin options
- User can select role and submit request
- Success message appears and user is redirected to pending approval page

### 2. New User - First Time Google Sign-In (Redirect)

**Steps:**
1. Block popups in browser settings
2. Use a Google account that has never been registered
3. Click "Continue with Google"
4. Complete Google authentication on redirect page
5. **Expected Result:** Redirected back to app with pending approval page

**Console Logs to Look For:**
```
Starting Google Sign-In...
Attempting popup sign-in...
Popup failed, trying redirect: auth/popup-blocked
Using redirect method...
Google Sign-In using redirect method, will be handled on page reload
```

**After Redirect:**
```
Checking for Google Sign-In redirect result...
Google redirect sign-in completed for: newuser@gmail.com
Auth state changed: newuser@gmail.com (uid123)
Google user without profile detected - checking for pending approval
User signed out, cleared profile and auth errors
```

### 3. Existing User - Google Sign-In

**Steps:**
1. Use a Google account that has been approved and has a profile
2. Click "Continue with Google"
3. Complete Google authentication
4. **Expected Result:** Direct sign-in to dashboard

**Console Logs to Look For:**
```
Starting Google Sign-In...
Attempting popup sign-in...
Popup sign-in successful: existinguser@gmail.com
Google Sign-In popup completed, checking user profile...
Existing user signed in successfully
```

### 4. User with Pending Request

**Steps:**
1. Use a Google account that already has a pending approval request
2. Click "Continue with Google"
3. Complete Google authentication
4. **Expected Result:** Error message about pending approval

**Console Logs to Look For:**
```
Starting Google Sign-In...
New user detected, checking for existing requests...
User already has pending request
```

**Error Message:** "Your access request is already pending approval. Please wait for admin approval."

### 5. Network/Connection Issues

**Steps:**
1. Disconnect internet or use slow connection
2. Try Google Sign-In
3. **Expected Result:** Appropriate error message

**Error Messages:**
- "Network error. Please check your connection and try again."
- "Google Sign-In failed"

## Debug Tools

### Browser Console Commands

Run these commands in the browser console for debugging:

```javascript
// Load comprehensive test suite
// (Paste the content of test-google-signin-comprehensive.js)

// Load debug tools
// (Paste the content of debug-google-signin-issues.js)

// Run full diagnostic
debugGoogleSignIn.runFullDiagnostic("your-email@gmail.com")

// Check current user state
debugGoogleSignIn.checkUserState()

// Test Google Sign-In directly
debugGoogleSignIn.testGoogleSignInDirect()

// Fix common issues (clears state and reloads)
debugGoogleSignIn.fixCommonIssues()
```

### Manual State Checks

```javascript
// Check current authentication state
console.log('Current user:', auth.currentUser);

// Check if user has profile
if (auth.currentUser) {
  authService.getUserProfile(auth.currentUser.uid).then(profile => {
    console.log('User profile:', profile);
  });
}

// Check pending requests
authService.getPendingUsers().then(pending => {
  console.log('Pending users:', pending);
});

// Force sign out
authService.signOut().then(() => {
  console.log('Signed out');
  location.reload();
});
```

## Common Issues and Solutions

### Issue: Role Selection Modal Not Appearing

**Symptoms:**
- User signs in with Google but immediately gets signed out
- No role selection modal appears
- Console shows "New user detected" but no modal

**Solutions:**
1. Check if popup was blocked - should fallback to redirect
2. Verify user doesn't already have pending request
3. Check Firestore rules allow reading `pending_users` collection
4. Clear browser cache and try again

**Debug Commands:**
```javascript
debugGoogleSignIn.checkUserState()
debugGoogleSignIn.checkPendingRequests("user@gmail.com")
```

### Issue: User Stuck in Authentication Loop

**Symptoms:**
- User appears signed in but gets signed out immediately
- Console shows repeated authentication attempts
- App keeps showing login page

**Solutions:**
1. Clear authentication state: `debugGoogleSignIn.fixCommonIssues()`
2. Check if user has profile in Firestore
3. Verify Firestore rules are correct

### Issue: "Default User" Sign-In

**Symptoms:**
- Wrong user gets signed in
- User sees someone else's account

**Solutions:**
1. This indicates cached authentication state
2. Sign out completely: `authService.signOut()`
3. Clear browser data for the site
4. Try incognito/private browsing mode

### Issue: Popup Blocked

**Symptoms:**
- Error message about popup being blocked
- No Google sign-in window appears

**Solutions:**
1. Allow popups for localhost in browser settings
2. System should automatically fallback to redirect
3. If redirect doesn't work, check browser console for errors

## Testing Checklist

### Before Testing
- [ ] Clear browser cache and cookies
- [ ] Check browser console is open for monitoring
- [ ] Verify internet connection is stable
- [ ] Ensure popups are allowed (or test with them blocked)

### Test Cases
- [ ] New user with popup (role selection should appear)
- [ ] New user with redirect (pending approval page should appear)
- [ ] Existing user (direct sign-in to dashboard)
- [ ] User with pending request (error message)
- [ ] Network error handling
- [ ] Popup blocked scenario

### After Each Test
- [ ] Check console logs match expected patterns
- [ ] Verify user experience is smooth
- [ ] Confirm no JavaScript errors
- [ ] Test both Staff and Admin role selections

## Expected User Flows

### New User Flow
1. Click "Continue with Google" → Google popup/redirect
2. Complete authentication → Role selection modal
3. Select role → Submit request
4. See success message → Pending approval page
5. Admin approves → User can sign in normally

### Existing User Flow
1. Click "Continue with Google" → Google popup/redirect
2. Complete authentication → Direct sign-in
3. Redirected to dashboard → Normal app usage

## Troubleshooting

If tests fail:

1. **Check Console Logs:** Look for specific error messages
2. **Run Debug Tools:** Use the provided debug commands
3. **Clear State:** Use `debugGoogleSignIn.fixCommonIssues()`
4. **Check Firestore Rules:** Ensure proper access permissions
5. **Test Network:** Verify stable internet connection
6. **Browser Issues:** Try different browser or incognito mode

## Success Criteria

The Google Sign-In system is working correctly when:

- ✅ New users see role selection modal
- ✅ Existing users sign in directly
- ✅ Pending users see appropriate messages
- ✅ Error handling is graceful and informative
- ✅ No JavaScript errors in console
- ✅ Both popup and redirect methods work
- ✅ User experience is professional and smooth

## Next Steps

After successful testing:

1. Test admin approval workflow
2. Verify role-based access control
3. Test user role editing by admins
4. Ensure proper security measures are in place
5. Document any additional edge cases discovered