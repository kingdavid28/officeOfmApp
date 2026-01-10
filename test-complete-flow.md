# Google Sign-In Flow Test Instructions

## Current Issue
Approved Google users can't sign in successfully. The approval process works, but the actual sign-in fails.

## Test Steps

### 1. Check Current State
Open browser console on localhost:5173 and run:
```javascript
// Copy and paste the debug script from debug-browser-console.js
// Then run:
debugGoogleSignInFlow()
```

### 2. Test the Complete Flow

#### Step A: Clean up any existing test data
```javascript
// In browser console:
cleanupTestData('kingdavid28a@gmail.com')
```

#### Step B: Create a pending user request
1. Go to the app and try to sign in with Google using `kingdavid28a@gmail.com`
2. This should create a pending user request

#### Step C: Approve the user as admin
1. Sign in as admin (reycelrcentino@gmail.com)
2. Go to admin panel
3. Approve the pending Google user

#### Step D: Test the sign-in
1. Sign out from admin
2. Try to sign in with Google using `kingdavid28a@gmail.com`
3. Check console for detailed logs

### 3. Expected Behavior
- User should be found in `approved_google_users` collection
- Profile should be created in `users` collection with real Google UID
- User should be removed from `approved_google_users` collection
- User should be successfully signed in

### 4. Debugging Points

If the flow fails, check:

1. **Firestore Permissions**: Ensure the user can create their own profile
2. **Profile Creation**: Check if `setDoc` operation succeeds
3. **UID Mismatch**: Verify the Google UID is used correctly
4. **Timing Issues**: Check if there are race conditions

### 5. Manual Fix (if needed)

If the automatic flow fails, you can manually fix it:

```javascript
// In browser console (as admin):
manuallyApproveUser('kingdavid28a@gmail.com', 'King David', 'staff')

// Then test sign-in again
```

## Key Files Modified
- `src/lib/auth.ts` - Enhanced error handling and logging
- `firestore.rules` - Check permissions for profile creation

## Next Steps
1. Run the test flow
2. Identify the exact failure point
3. Fix the specific issue (permissions, timing, or validation)
4. Verify the fix works for new users