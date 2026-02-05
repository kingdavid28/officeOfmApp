# Production CORS Fix Guide

## Current Situation
You're getting CORS errors because you're accessing the **production app** at `https://officeofmapp.web.app` which tries to use real Firebase Storage.

## Immediate Solutions

### Option 1: Use Development Server (Quick Fix)
**Access your app at:** http://localhost:5173/
- ✅ Uses emulators (no CORS issues)
- ✅ Works immediately
- ✅ Best for development and testing

### Option 2: Fix Production CORS (Permanent Fix)

#### Method 1: Using Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `officeofmapp`
3. Navigate to **Cloud Storage** → **Browser**
4. Find bucket: `officeofmapp.appspot.com`
5. Click **Permissions** tab
6. Add CORS configuration:

```json
[
  {
    "origin": ["https://officeofmapp.web.app", "https://officeofmapp.firebaseapp.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "X-Requested-With"]
  }
]
```

#### Method 2: Using Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `officeofmapp`
3. Go to **Storage** section
4. Click **Rules** tab
5. The current rules look good, but CORS is separate from rules

#### Method 3: Deploy New Storage Rules
```bash
# Deploy the updated storage rules
npx firebase deploy --only storage
```

## Alternative: Environment Detection

Update your app to automatically detect production vs development:

```typescript
// In firebase-storage-service.ts
static async uploadFile(file: File, category: string): Promise<UploadResult> {
  // Check if we're in production
  const isProduction = window.location.hostname === 'officeofmapp.web.app';
  
  if (isProduction) {
    // Use fallback method for production until CORS is fixed
    console.log('Production detected, using fallback upload method');
    return this.uploadFileAsFallback(file, category);
  } else {
    // Use normal Firebase Storage for development (with emulators)
    return this.uploadFileNormal(file, category);
  }
}
```

## Recommended Workflow

### For Development:
1. **Always use:** http://localhost:5173/
2. **Run emulators:** `npx firebase emulators:start --only auth,firestore,storage`
3. **Run dev server:** `npm run dev`

### For Production Testing:
1. **Fix CORS first** using Google Cloud Console method above
2. **Then deploy:** `npx firebase deploy`
3. **Test at:** https://officeofmapp.web.app

### For Immediate Testing:
1. **Use development URL:** http://localhost:5173/
2. **Login and test file upload** - should work perfectly
3. **Check emulator UI:** http://127.0.0.1:4000/

## Why This Happens

- **Development** (localhost:5173) → Uses emulators → No CORS
- **Production** (officeofmapp.web.app) → Uses real Firebase → CORS restrictions

The emulators don't have CORS restrictions, but production Firebase Storage does.

## Next Steps

1. **Use http://localhost:5173/ for now** - this will work immediately
2. **Fix production CORS** using Google Cloud Console when you need production access
3. **Keep emulators running** for the best development experience

The development setup is working perfectly - just make sure you're using the right URL!