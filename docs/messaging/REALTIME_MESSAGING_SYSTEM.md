# Enhanced Realtime Messaging System

## Overview
Comprehensive real-time messaging system with file/photo sharing, group chat, and notifications for the OFM Office Management System.

## Features

### ✅ 1. Real-time Chat Messages
- **Text Messages**: Send and receive text messages instantly
- **Message Status Tracking**: sending → sent → delivered → read
- **Reply to Messages**: Quote and reply to specific messages
- **Edit Messages**: Edit sent messages (with edit timestamp)
- **Delete Messages**: Soft delete with "message deleted" placeholder
- **Message Reactions**: Add emoji reactions to messages
- **Message Search**: Search through chat history

### ✅ 2. File & Photo Sharing
- **Image Upload**: Share JPEG, PNG, GIF, WEBP images
- **Document Upload**: Share PDF, Word, Excel, Text, CSV files
- **File Size Limit**: 10MB maximum per file
- **Upload Progress**: Real-time upload progress tracking
- **File Preview**: Thumbnail generation for images
- **File Download**: Download shared files
- **Auto-cleanup**: Delete files when messages are deleted

**Supported File Types:**
- **Images**: JPEG, PNG, GIF, WEBP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
- **Maximum Size**: 10MB per file

### ✅ 3. Group Chat
- **Create Groups**: Create group chats with multiple participants
- **Direct Messages**: One-on-one private chats
- **Channels**: Broadcast channels for announcements
- **Add/Remove Participants**: Manage group members
- **Group Admin**: Assign admin roles to participants
- **Group Settings**: Configure file sharing, privacy, approval requirements
- **Group Avatar**: Set custom group images
- **Pin Messages**: Pin important messages to top
- **Mute Notifications**: Mute specific chats

### ✅ 4. Comprehensive Notifications
- **New Message Notifications**: Instant alerts for new messages
- **Mention Notifications**: Get notified when mentioned (@username)
- **Reply Notifications**: Alerts when someone replies to your message
- **Reaction Notifications**: Know when someone reacts to your message
- **File Shared Notifications**: Alerts for shared files
- **Priority Levels**: low, normal, high, urgent
- **Notification Badge**: Unread count display
- **Notification Sound**: Audio alerts (configurable)
- **Push Notifications**: Browser push notifications support

### ✅ 5. Typing Indicators
- **Real-time Typing**: See when others are typing
- **Auto-timeout**: Disappears after 3 seconds of inactivity
- **Multiple Users**: Shows all users currently typing

### ✅ 6. Message Status
- **Sending**: Message is being sent
- **Sent**: Message delivered to server
- **Delivered**: Message delivered to recipient
- **Read**: Recipient has read the message

### ✅ 7. Unread Message Tracking
- **Unread Count**: Badge showing unread messages per chat
- **Last Read Timestamp**: Track when user last read messages
- **Auto-mark Read**: Mark messages as read when viewed

## Technical Implementation

### Database Structure

```
realtime-database/
├── chats/
│   └── {chatId}
│       ├── id: string
│       ├── name: string
│       ├── description?: string
│       ├── type: 'direct' | 'group' | 'channel'
│       ├── createdBy: string
│       ├── createdAt: number
│       ├── updatedAt: number
│       ├── participants/
│       │   └── {userId}
│       │       ├── name: string
│       │       ├── role: UserRole
│       │       ├── joinedAt: number
│       │       ├── isAdmin: boolean
│       │       ├── isMuted: boolean
│       │       └── lastReadAt: number
│       ├── settings/
│       │   ├── allowFileSharing: boolean
│       │   ├── maxFileSize: number
│       │   ├── allowedFileTypes: string[]
│       │   ├── isPrivate: boolean
│       │   └── requireApproval: boolean
│       ├── avatar?: string
│       ├── pinnedMessages?: string[]
│       └── lastMessage/
│           ├── content: string
│           ├── senderId: string
│           └── timestamp: number
│
├── messages/
│   └── {chatId}/
│       └── {messageId}
│           ├── id: string
│           ├── chatId: string
│           ├── senderId: string
│           ├── senderName: string
│           ├── senderRole: UserRole
│           ├── content: string
│           ├── timestamp: number
│           ├── type: 'text' | 'file' | 'image' | 'system'
│           ├── status: 'sending' | 'sent' | 'delivered' | 'read'
│           ├── replyTo?: string
│           ├── attachments?: MessageAttachment[]
│           ├── reactions?: { [userId]: emoji }
│           ├── editedAt?: number
│           └── deletedAt?: number
│
├── message_notifications/
│   └── {userId}/
│       └── {notificationId}
│           ├── id: string
│           ├── userId: string
│           ├── chatId: string
│           ├── messageId: string
│           ├── type: 'new_message' | 'mention' | 'reply' | 'reaction' | 'file_shared'
│           ├── title: string
│           ├── body: string
│           ├── timestamp: number
│           ├── read: boolean
│           ├── priority: 'low' | 'normal' | 'high' | 'urgent'
│           └── data?: object
│
└── chat_typing/
    └── {chatId}/
        └── {userId}
            ├── userId: string
            ├── userName: string
            ├── isTyping: boolean
            └── timestamp: number
```

### Storage Structure

```
firebase-storage/
└── chat_files/
    └── {chatId}/
        └── {timestamp}_{filename}
```

## Usage Examples

### 1. Create Group Chat

```typescript
import { RealtimeMessagingService } from './lib/realtime-messaging-service';

const chatId = await RealtimeMessagingService.createGroupChat(
  'Finance Team',
  userId,
  userName,
  userRole,
  [user2Id, user3Id, user4Id],
  'group',
  {
    allowFileSharing: true,
    maxFileSize: 10,
    isPrivate: false
  }
);
```

### 2. Send Text Message

```typescript
const messageId = await RealtimeMessagingService.sendMessage(
  chatId,
  userId,
  userName,
  userRole,
  'Hello team! Here is the financial report.'
);
```

### 3. Send File/Image

```typescript
const messageId = await RealtimeMessagingService.sendFileMessage(
  chatId,
  userId,
  userName,
  userRole,
  file,
  'Financial Report Q1 2024',
  (progress) => {
    console.log(`Upload progress: ${progress.progress}%`);
  }
);
```

### 4. Listen to Messages

```typescript
const unsubscribe = RealtimeMessagingService.listenToMessages(
  chatId,
  (message) => {
    console.log('New message:', message);
    // Update UI with new message
  },
  50 // Load last 50 messages
);

// Cleanup
return () => unsubscribe();
```

### 5. Listen to Notifications

```typescript
const unsubscribe = RealtimeMessagingService.listenToNotifications(
  userId,
  (notification) => {
    console.log('New notification:', notification);
    // Show notification toast
    showToast(notification.title, notification.body);
  }
);
```

### 6. Mark Message as Read

```typescript
await RealtimeMessagingService.markMessageAsRead(chatId, messageId, userId);
```

### 7. Add Reaction

```typescript
await RealtimeMessagingService.addReaction(chatId, messageId, userId, '👍');
```

### 8. Get Unread Count

```typescript
const unreadCount = await RealtimeMessagingService.getUnreadMessageCount(chatId, userId);
console.log(`Unread messages: ${unreadCount}`);
```

### 9. Search Messages

```typescript
const results = await RealtimeMessagingService.searchMessages(chatId, 'financial report');
console.log(`Found ${results.length} messages`);
```

### 10. Typing Indicator

```typescript
// Start typing
await RealtimeMessagingService.setTyping(chatId, userId, userName, true);

// Stop typing
await RealtimeMessagingService.setTyping(chatId, userId, userName, false);

// Listen to typing
const unsubscribe = RealtimeMessagingService.listenToTyping(
  chatId,
  (userId, userName, isTyping) => {
    if (isTyping) {
      console.log(`${userName} is typing...`);
    }
  }
);
```

## Security Rules

### Chat Access
- Users can only read chats they are participants in
- Users can only write to chats they are participants in
- Participant-specific data can only be modified by that user

### Message Access
- Users can only read messages from chats they belong to
- Users can only send messages to chats they belong to
- Users can only delete their own messages

### Notification Access
- Users can only read their own notifications
- Any authenticated user can send notifications
- Users can only mark their own notifications as read

### File Upload
- Files are stored in chat-specific folders
- Only chat participants can access files
- Files are deleted when messages are deleted

## Best Practices

### 1. File Upload
```typescript
// Validate file before upload
try {
  await RealtimeMessagingService.sendFileMessage(
    chatId,
    userId,
    userName,
    userRole,
    file,
    caption,
    (progress) => {
      // Update progress bar
      setUploadProgress(progress.progress);
    }
  );
} catch (error) {
  if (error.message.includes('size exceeds')) {
    showError('File too large. Maximum 10MB allowed.');
  } else if (error.message.includes('type not allowed')) {
    showError('File type not supported.');
  }
}
```

### 2. Notification Handling
```typescript
// Listen to notifications and show toast
RealtimeMessagingService.listenToNotifications(userId, (notification) => {
  // Show toast notification
  showToast(notification.title, notification.body, {
    priority: notification.priority,
    onClick: () => {
      // Navigate to chat
      navigateToChat(notification.chatId);
      // Mark as read
      RealtimeMessagingService.markNotificationRead(userId, notification.id);
    }
  });
  
  // Play sound for high priority
  if (notification.priority === 'high' || notification.priority === 'urgent') {
    playNotificationSound();
  }
});
```

### 3. Unread Count Badge
```typescript
// Update badge count
const updateBadge = async () => {
  const notificationCount = await RealtimeMessagingService.getUnreadCount(userId);
  const chats = await RealtimeMessagingService.getUserChats(userId);
  
  let totalUnread = notificationCount;
  for (const chat of chats) {
    const unread = await RealtimeMessagingService.getUnreadMessageCount(chat.id, userId);
    totalUnread += unread;
  }
  
  setBadgeCount(totalUnread);
};
```

### 4. Cleanup on Unmount
```typescript
useEffect(() => {
  const unsubscribeMessages = RealtimeMessagingService.listenToMessages(chatId, handleMessage);
  const unsubscribeTyping = RealtimeMessagingService.listenToTyping(chatId, handleTyping);
  const unsubscribeNotifications = RealtimeMessagingService.listenToNotifications(userId, handleNotification);
  
  return () => {
    unsubscribeMessages();
    unsubscribeTyping();
    unsubscribeNotifications();
  };
}, [chatId, userId]);
```

## Performance Optimizations

### 1. Message Pagination
- Load last 50 messages initially
- Load more on scroll up
- Use `limitToLast()` for efficient queries

### 2. File Upload
- Compress images before upload
- Show upload progress
- Cancel upload if user navigates away

### 3. Notification Batching
- Group notifications from same chat
- Debounce notification sounds
- Clear old notifications periodically

### 4. Typing Indicator
- Debounce typing events (300ms)
- Auto-timeout after 3 seconds
- Only send when actually typing

## Testing

### Test Scenarios

1. **Send Text Message**
   - Open chat in two tabs
   - Send message in one tab
   - Verify appears in other tab instantly

2. **File Upload**
   - Upload image file
   - Verify progress bar updates
   - Verify file appears in chat
   - Verify file can be downloaded

3. **Group Chat**
   - Create group with 3+ users
   - Send messages from different users
   - Verify all users receive messages

4. **Notifications**
   - Send message to user
   - Verify notification appears
   - Click notification
   - Verify navigates to chat

5. **Typing Indicator**
   - Start typing in one tab
   - Verify "typing..." appears in other tab
   - Stop typing
   - Verify indicator disappears

6. **Unread Count**
   - Send messages to user
   - Verify unread badge updates
   - Open chat
   - Verify badge clears

## Related Files

- `src/lib/realtime-messaging-service.ts` - Core messaging service
- `database.rules.json` - Security rules
- `storage.rules` - File storage rules
- `firebase.json` - Firebase configuration

## Next Steps

1. Create messaging UI component
2. Implement notification toast system
3. Add file preview modal
4. Create group management UI
5. Add message search UI
6. Implement push notifications
7. Add voice message support
8. Add video call integration

## Conclusion

The Enhanced Realtime Messaging System provides a complete chat solution with file sharing, group chat, and comprehensive notifications. All features follow Firebase best practices for security, performance, and scalability.
