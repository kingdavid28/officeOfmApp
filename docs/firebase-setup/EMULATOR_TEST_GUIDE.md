# Firebase Emulator Test Guide

## ✅ Emulators Successfully Running!

Your Firebase Emulators are now running on:

- **🔐 Authentication**: http://127.0.0.1:9099
- **📊 Firestore**: http://127.0.0.1:8081  
- **📁 Storage**: http://127.0.0.1:9199
- **🎛️ Emulator UI**: http://127.0.0.1:4000
- **🌐 Your App**: http://localhost:5173/

## How to Test

### 1. Open Your App
Go to: http://localhost:5173/

### 2. Check Browser Console
Open Developer Tools (F12) and look for these messages:
```
🔥 Connected to Auth Emulator
🔥 Connected to Firestore Emulator  
🔥 Connected to Storage Emulator
```

### 3. Test File Upload
1. Login to your app
2. Go to File Manager
3. Try uploading a file
4. **No more CORS errors!** ✅

### 4. Monitor in Emulator UI
Open: http://127.0.0.1:4000/
- View uploaded files in Storage tab
- See user authentication in Auth tab
- Check database records in Firestore tab

## What Changed

### ✅ CORS Issues Fixed
- Files now upload through local emulator (no CORS)
- Same behavior as production but locally

### ✅ Better File Organization  
- Files stored as: `users/{userId}/{category}/{filename}`
- Better security and organization

### ✅ Development vs Production
- **Development**: Uses emulators (localhost)
- **Production**: Uses real Firebase (when deployed)

## Commands Reference

### Start Emulators
```bash
npx firebase emulators:start --only auth,firestore,storage
```

### Start Development Server
```bash
npm run dev
```

### Stop Emulators
Press `Ctrl+C` in the emulator terminal

### View Emulator UI
http://127.0.0.1:4000/

## Troubleshooting

### If emulators won't start:
```bash
npx firebase emulators:kill
npx firebase emulators:start --only auth,firestore,storage
```

### If ports are taken:
- Check firebase.json for port configuration
- Current ports: Auth(9099), Firestore(8081), Storage(9199)

### If app doesn't connect to emulators:
- Check browser console for connection messages
- Clear browser cache and localStorage
- Restart both emulators and dev server

## Next Steps

1. **Test file upload** - Should work without CORS errors
2. **Check emulator UI** - View your data in real-time  
3. **Deploy when ready** - `firebase deploy` for production

Your development environment is now properly configured! 🎉