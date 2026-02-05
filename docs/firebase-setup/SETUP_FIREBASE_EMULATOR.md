# Firebase Emulator Setup Guide

## Quick Fix for CORS Issues

The CORS error you're experiencing is a common development issue. Here are the best solutions:

## Option 1: Firebase Emulator Suite (Recommended)

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Start the Emulators
```bash
firebase emulators:start
```

This will start:
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Storage Emulator: http://localhost:9199
- Emulator UI: http://localhost:4000

### 4. Run Your Development Server
In a new terminal:
```bash
npm run dev
```

## Option 2: Deploy to Firebase Hosting (Production-like)

### 1. Build the project
```bash
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. Access your app at
```
https://officeofmapp.web.app
```

## Option 3: Use the Fallback Method (Current Implementation)

The current code already includes a fallback method that stores files as data URLs when Firebase Storage fails. This works for development but has limitations:

- Files are stored as base64 in the database (larger size)
- Not suitable for production
- Works for testing file upload/download functionality

## Recommended Development Workflow

1. **For daily development**: Use Firebase Emulator Suite
2. **For testing production features**: Deploy to Firebase Hosting
3. **For quick testing**: Use the fallback method (already implemented)

## Storage Rules Update

The current storage rules are configured for the new file organization structure:

```javascript
// Files are now organized as: users/{userId}/{category}/{timestamp}_{filename}
match /users/{userId}/{category}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && 
    (request.auth.uid == userId || hasAdminRole());
}
```

## Benefits of Each Approach

### Firebase Emulator Suite
✅ Identical to production behavior
✅ No CORS issues
✅ Fast development cycle
✅ Offline development
✅ Data persistence between sessions

### Firebase Hosting
✅ True production environment
✅ Real Firebase Storage
✅ Performance testing
✅ Shareable URLs

### Fallback Method
✅ Works immediately
✅ No additional setup
⚠️ Not production-ready
⚠️ Larger file sizes

## Troubleshooting

### If emulators won't start:
```bash
# Kill any existing processes
firebase emulators:kill

# Clear cache
firebase emulators:clear

# Start fresh
firebase emulators:start
```

### If you see "port already in use":
```bash
# Check what's using the ports
netstat -ano | findstr :9099
netstat -ano | findstr :8080
netstat -ano | findstr :9199

# Kill the processes or change ports in firebase.json
```

### If authentication doesn't work with emulator:
- Make sure you're using the emulator auth endpoint
- Clear browser cache and localStorage
- Check that the emulator is properly connected in the console

## Next Steps

1. Try the Firebase Emulator Suite first (recommended)
2. If that works, use it for all development
3. Deploy to Firebase Hosting for production testing
4. Keep the fallback method as a safety net

The emulator approach will give you the best development experience and eliminate CORS issues completely.