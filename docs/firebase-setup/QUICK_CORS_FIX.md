# Quick Fix: Firebase Storage CORS Configuration

## Why You're Seeing "💾 Fallback Storage"

Your files are using temporary storage instead of proper Firebase Storage because CORS (Cross-Origin Resource Sharing) is not configured.

## Quick Fix (5 Minutes)

### Step 1: Install Google Cloud SDK

**Windows:**
- Download: https://cloud.google.com/sdk/docs/install
- Run installer and follow prompts

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Authenticate and Configure

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project officeofmapp

# Apply CORS configuration
gsutil cors set cors.json gs://officeofmapp.appspot.com

# Verify it worked
gsutil cors get gs://officeofmapp.appspot.com
```

### Step 3: Test

1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload your app
3. Upload a new file
4. Should see "✅ Firebase Storage" instead of "💾 Fallback Storage"

## Alternative: Use Firebase Emulator (Development Only)

For local development, use the Firebase Emulator:

```bash
# Start emulators
firebase emulators:start

# Your app will automatically connect (no CORS issues)
```

## What Changes After Fix

**Before:**
```
Letter to all... 💾 Fallback Storage  ← Temporary, not persistent
Format.FinRep.xlsx 💾 Fallback Storage  ← Temporary, not persistent
```

**After:**
```
Letter to all... ✅ Firebase Storage  ← Proper, persistent storage
Format.FinRep.xlsx ✅ Firebase Storage  ← Proper, persistent storage
```

## Benefits of Proper Firebase Storage

✅ Files persist across sessions
✅ Accessible from any device
✅ Optimized for large files
✅ Production-ready
✅ Secure and reliable

## Troubleshooting

**"gsutil: command not found"**
- Install Google Cloud SDK (Step 1 above)
- Restart terminal after installation

**"AccessDeniedException: 403"**
- Run `gcloud auth login`
- Make sure you're the project owner

**Still seeing fallback storage?**
- Old files will still show fallback storage
- New uploads should use Firebase Storage
- Re-upload old files to migrate them

## Need More Help?

See **FIREBASE_STORAGE_CORS_FIX.md** for detailed instructions and troubleshooting.

---

**TL;DR:** Run these 3 commands:
```bash
gcloud auth login
gcloud config set project officeofmapp
gsutil cors set cors.json gs://officeofmapp.appspot.com
```