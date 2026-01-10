# Google Sign-In Redirect Fix

## Problem Identified

The Google Sign-In is failing because of a redirect URL mismatch. The error shows:

```
GET https://officeofmapp.firebaseapp.com/__/firebase/init.json 404 (Not Found)
```

This happens because:
1. The app is running on `localhost:5174` 
2. But Firebase Auth is redirecting to `https://officeofmapp.firebaseapp.com`
3. The production domain doesn't have the correct Firebase hosting setup

## Solutions

### Option 1: Fix Firebase Console Configuration (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `officeofmapp`
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Make sure these domains are added:
   - `localhost`
   - `127.0.0.1`
   - `officeofmapp.firebaseapp.com`

### Option 2: Use Firebase Hosting for Development

Instead of using Vite's dev server, use Firebase hosting:

```bash
# Build the project
npm run build

# Serve using Firebase hosting
firebase serve --only hosting
```

### Option 3: Update Firebase Auth Domain (Temporary Fix)

Temporarily change the auth domain in `.env` to use localhost:

```env
VITE_FIREBASE_AUTH_DOMAIN=localhost
```

**Note:** This may cause other issues and is not recommended for production.

## Testing Steps

1. First, try Option 1 (update Firebase Console)
2. Run the comprehensive test: Open `test-google-signin-comprehensive.html`
3. Click "Test Google Sign-In" 
4. Complete the Google Sign-In flow
5. Return to the test page and click "Check Redirect Result"

## Expected Flow

After fixing the redirect issue:

1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User signs in with Google
4. Redirects back to your app
5. App processes the result:
   - If user is pre-approved → Creates profile and signs in
   - If user is new → Creates pending request and signs out

## Verification

Use the test file `test-google-signin-comprehensive.html` to verify:
- Firebase initialization works
- Google provider works  
- Firestore access works
- Google Sign-In redirect works
- Redirect result processing works