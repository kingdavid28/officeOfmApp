# Google Sign-In Flow Test Guide

## What Was Fixed

### **Issue**: Role selection modal was bypassed
- Google Sign-In was immediately processing results and throwing errors
- Users were signed out before they could select a role
- The role selection modal never appeared

### **Solution**: Proper flow separation
- Google Sign-In now returns the authentication result without processing
- GoogleSignInButton handles profile checking and role selection
- Role selection modal appears for new users
- Existing users sign in directly

## New Flow

### **For New Users (Popup)**
1. User clicks "Continue with Google"
2. Google popup opens and user authenticates
3. System checks if user profile exists
4. If no profile → Role selection modal appears
5. User selects role (Staff/Admin)
6. Request submitted to pending_users collection
7. User sees success message

### **For Existing Users (Popup)**
1. User clicks "Continue with Google"
2. Google popup opens and user authenticates
3. System finds existing profile
4. User signed in immediately
5. Redirected to dashboard

### **For Redirect Flow**
1. User clicks "Continue with Google"
2. Redirected to Google sign-in page
3. After authentication, redirected back to app
4. System processes redirect result
5. Existing users → signed in
6. New users → shown pending approval page

## Testing Steps

### **Test 1: New User with Popup**
1. Use a Google account that hasn't been registered
2. Click "Continue with Google"
3. Complete Google authentication
4. **Expected**: Role selection modal should appear
5. Select a role and submit
6. **Expected**: Success message and redirect to login

### **Test 2: Existing User**
1. Use a Google account that's already approved
2. Click "Continue with Google"
3. Complete Google authentication
4. **Expected**: Direct sign-in to dashboard

### **Test 3: User with Pending Request**
1. Use a Google account that already has a pending request
2. Click "Continue with Google"
3. Complete Google authentication
4. **Expected**: Message about pending approval

### **Test 4: Popup Blocked (Redirect Fallback)**
1. Block popups in browser
2. Click "Continue with Google"
3. **Expected**: Redirect to Google sign-in page
4. After authentication, redirect back to app
5. New users should see pending approval page

## Debug Commands

```javascript
// Check current authentication state
debugAuth()

// Check if user has pending request
authService.checkExistingPendingRequest('user@gmail.com')

// View pending users (admin only)
authService.getPendingUsers()

// Force sign out
forceSignOut()
```

## Expected Console Logs

### **New User Flow**
```
Starting Google Sign-In...
Attempting popup sign-in...
Popup sign-in successful: newuser@gmail.com
Google Sign-In popup completed, checking user profile...
New user detected, showing role selection
```

### **Existing User Flow**
```
Starting Google Sign-In...
Attempting popup sign-in...
Popup sign-in successful: existinguser@gmail.com
Google Sign-In popup completed, checking user profile...
Existing user signed in successfully
```

## Troubleshooting

### **Role Modal Not Appearing**
- Check browser console for errors
- Verify popup wasn't blocked
- Check if user already has pending request

### **Immediate Sign Out**
- Check Firestore rules allow reading pending_users
- Verify user doesn't have existing profile
- Check network connectivity

### **Popup Blocked**
- Allow popups for localhost
- System should automatically fallback to redirect
- Check redirect flow works correctly

The Google Sign-In flow should now work correctly with proper role selection for new users!