# AI Realtime Features - Quick Start Guide

## Setup Instructions

### 1. Update Environment Variables

Add the Realtime Database URL to your `.env` file:

```env
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

For emulator testing, this will be automatically overridden to use `http://127.0.0.1:9000`.

### 2. Start Firebase Emulator

```bash
firebase emulators:start
```

This will start all emulators including:
- Auth Emulator: http://127.0.0.1:9099
- Firestore Emulator: http://127.0.0.1:8081
- Storage Emulator: http://127.0.0.1:9199
- Functions Emulator: http://127.0.0.1:5002
- **Realtime Database Emulator: http://127.0.0.1:9000** (NEW)
- Emulator UI: http://localhost:4000

### 3. Access Realtime Database UI

Open http://localhost:4000 and navigate to the **Realtime Database** tab to see live data updates.

## Testing Real-time Features

### Test 1: Real-time Chat Messages

1. Open the app in **two browser tabs** (or two different browsers)
2. Log in as different users in each tab
3. Open the AI Chat interface in both tabs
4. Send a message in one tab
5. **Expected Result**: Message appears instantly in the other tab

### Test 2: Typing Indicators

1. Open AI Chat in two tabs with different users
2. Start typing in one tab
3. **Expected Result**: "User is typing..." appears in the other tab
4. Stop typing for 3 seconds
5. **Expected Result**: Typing indicator disappears

### Test 3: User Presence

1. Open AI Chat in two tabs
2. Check the header in each tab
3. **Expected Result**: Shows "2 online" or similar count
4. Close one tab
5. **Expected Result**: Online count decreases to 1

### Test 4: Connection State

1. Open AI Chat
2. Check the header for connection status
3. **Expected Result**: Shows green Wifi icon with "Connected"
4. Stop the emulator
5. **Expected Result**: Shows red WifiOff icon with "Disconnected"
6. Restart the emulator
7. **Expected Result**: Automatically reconnects and shows "Connected"

### Test 5: Message Status Tracking

1. Send a message in AI Chat
2. Watch the message status change:
   - **sending** → **sent** → **delivered**
3. Check the Realtime Database UI
4. **Expected Result**: See message with updated status in `ai_chat/messages`

### Test 6: Presence Auto-Cleanup

1. Open AI Chat
2. Check Realtime Database UI under `presence/{userId}`
3. **Expected Result**: User status is "online"
4. Close the browser tab
5. **Expected Result**: User status automatically changes to "offline"

## Viewing Data in Emulator UI

### Navigate to Realtime Database Tab

You'll see the following data structure:

```
realtime-database/
├── ai_chat/
│   └── messages/
│       └── {messageId} (click to expand)
├── presence/
│   └── {userId} (shows online/offline status)
├── typing/
│   └── {userId} (appears when user is typing)
├── notifications/
│   └── {userId}/
│       └── {notificationId}
└── collaborative/
    └── sessions/
        └── {sessionId}
```

### Watch Live Updates

- Messages appear in real-time as users send them
- Presence updates when users connect/disconnect
- Typing indicators appear/disappear as users type
- All changes are instant and visible in the UI

## Common Issues & Solutions

### Issue: "Connection Refused" Error

**Cause**: Realtime Database emulator not running

**Solution**:
```bash
firebase emulators:start
```

### Issue: Messages Not Appearing in Real-time

**Cause**: Browser tabs using same user session

**Solution**: Use different browsers or incognito mode for different users

### Issue: Typing Indicator Stuck

**Cause**: Timeout not clearing properly

**Solution**: Refresh the page - disconnect cleanup will remove stale indicators

### Issue: Presence Shows Offline When Online

**Cause**: Disconnect handler not set up

**Solution**: Check that `setupDisconnectCleanup()` is called on component mount

### Issue: Security Rules Error

**Cause**: `database.rules.json` not loaded

**Solution**: Restart emulator to reload security rules

## Monitoring Performance

### Check Realtime Database Metrics

1. Open Emulator UI: http://localhost:4000
2. Navigate to Realtime Database tab
3. Monitor:
   - Number of active connections
   - Read/write operations per second
   - Data size

### Optimize Performance

- **Message Cleanup**: Run `clearOldMessages()` periodically
- **Notification Cleanup**: Run `clearOldNotifications()` for each user
- **Typing Timeout**: Ensure 3-second timeout is working
- **Listener Cleanup**: Always unsubscribe listeners on unmount

## Integration with Components

### Update Component Props

When using `AIChatInterface`, ensure you pass the `userName` prop:

```typescript
<AIChatInterface
  currentUserId={user.uid}
  userName={user.displayName || user.email}  // NEW: Required
  userRole={userRole}
  isOpen={isOpen}
  onClose={handleClose}
/>
```

### Example Usage in Dashboard

```typescript
import { AIChatInterface } from './components/AIChatInterface';

function Dashboard() {
  const { user, userRole } = useAuth();
  
  return (
    <div>
      {/* Your dashboard content */}
      
      {/* AI Chat with Realtime Features */}
      <AIChatInterface
        currentUserId={user.uid}
        userName={user.displayName || user.email}
        userRole={userRole}
      />
    </div>
  );
}
```

## Next Steps

1. **Test all features** using the test scenarios above
2. **Monitor performance** in the Emulator UI
3. **Verify security rules** by testing unauthorized access
4. **Check cleanup functions** work correctly on disconnect
5. **Test offline behavior** by stopping/starting emulator

## Production Deployment

Before deploying to production:

1. **Update `.env` with production Realtime Database URL**
2. **Deploy security rules**: `firebase deploy --only database`
3. **Test with production data** (use test accounts)
4. **Monitor Firebase Console** for real-time metrics
5. **Set up alerts** for connection issues or errors

## Support

For issues or questions:
- Check Firebase Emulator logs
- Review `AI_REALTIME_FEATURES_IMPLEMENTATION.md` for detailed documentation
- Test with Firebase Console in production
- Check browser console for error messages

---

**Happy Testing! 🚀**

The AI Realtime Features provide a powerful real-time communication system for the OFM Office Management System. Enjoy the instant messaging, presence tracking, and collaborative features!
