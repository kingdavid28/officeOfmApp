# Messaging System Flow Diagrams

## 1. Message Sending Flow

```
┌─────────────┐
│   User A    │
│  (Sender)   │
└──────┬──────┘
       │
       │ 1. Types message
       ▼
┌─────────────────────────────┐
│  RealtimeMessagingService   │
│  sendMessage()              │
└──────┬──────────────────────┘
       │
       │ 2. Create message object
       │    status: 'sending'
       ▼
┌─────────────────────────────┐
│  Firebase Realtime DB       │
│  /messages/{chatId}/        │
└──────┬──────────────────────┘
       │
       │ 3. Update status: 'sent'
       │ 4. Update lastMessage
       │ 5. Send notifications
       ▼
┌─────────────────────────────┐
│  Notification Service       │
│  notifyParticipants()       │
└──────┬──────────────────────┘
       │
       │ 6. Create notifications
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User B    │    │   User C    │    │   User D    │
│ (Recipient) │    │ (Recipient) │    │ (Recipient) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 7. Receive message instantly        │
       │ 8. Show notification                │
       │ 9. Update unread count              │
       └──────────────────┴──────────────────┘
```

## 2. File Upload Flow

```
┌─────────────┐
│   User A    │
│  (Sender)   │
└──────┬──────┘
       │
       │ 1. Select file
       │ 2. Validate (type, size)
       ▼
┌─────────────────────────────┐
│  RealtimeMessagingService   │
│  sendFileMessage()          │
└──────┬──────────────────────┘
       │
       │ 3. Start upload
       ▼
┌─────────────────────────────┐
│  Firebase Storage           │
│  /chat_files/{chatId}/      │
└──────┬──────────────────────┘
       │
       │ 4. Upload progress: 0% → 100%
       │    (Real-time updates)
       │
       │ 5. Get download URL
       ▼
┌─────────────────────────────┐
│  Firebase Realtime DB       │
│  /messages/{chatId}/        │
│  - Create message           │
│  - Add attachment object    │
└──────┬──────────────────────┘
       │
       │ 6. Notify participants
       │    type: 'file_shared'
       ▼
┌─────────────┐    ┌─────────────┐
│   User B    │    │   User C    │
│ (Recipient) │    │ (Recipient) │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │ 7. See file message      │
       │ 8. Click to download     │
       └──────────────────┘
```

## 3. Group Chat Creation Flow

```
┌─────────────┐
│   User A    │
│  (Creator)  │
└──────┬──────┘
       │
       │ 1. Create group
       │    - Name: "Finance Team"
       │    - Add participants
       ▼
┌─────────────────────────────┐
│  RealtimeMessagingService   │
│  createGroupChat()          │
└──────┬──────────────────────┘
       │
       │ 2. Create chat object
       │    - Set creator as admin
       │    - Add participants
       │    - Configure settings
       ▼
┌─────────────────────────────┐
│  Firebase Realtime DB       │
│  /chats/{chatId}/           │
│  - id, name, type           │
│  - participants             │
│  - settings                 │
└──────┬──────────────────────┘
       │
       │ 3. Send system message
       │    "User A created the group"
       ▼
┌─────────────────────────────┐
│  /messages/{chatId}/        │
│  - System message           │
└──────┬──────────────────────┘
       │
       │ 4. Notify all participants
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User B    │    │   User C    │    │   User D    │
│(Participant)│    │(Participant)│    │(Participant)│
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │ 5. See new group chat               │
       │ 6. Can send messages                │
       └──────────────────┴──────────────────┘
```

## 4. Notification Flow

```
┌─────────────┐
│   Event     │
│  Trigger    │
└──────┬──────┘
       │
       ├─ New Message
       ├─ Mention (@user)
       ├─ Reply
       ├─ Reaction
       └─ File Shared
       │
       ▼
┌─────────────────────────────┐
│  notifyParticipants()       │
│  - Get chat participants    │
│  - Filter muted users       │
│  - Exclude sender           │
└──────┬──────────────────────┘
       │
       │ For each participant:
       ▼
┌─────────────────────────────┐
│  sendNotification()         │
│  - Create notification      │
│  - Set priority             │
│  - Add metadata             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Firebase Realtime DB       │
│  /message_notifications/    │
│  /{userId}/{notificationId} │
└──────┬──────────────────────┘
       │
       │ Real-time listener
       ▼
┌─────────────┐
│   User      │
│  (Client)   │
└──────┬──────┘
       │
       │ 1. Receive notification
       │ 2. Show toast/banner
       │ 3. Play sound (if high priority)
       │ 4. Update badge count
       │
       │ User clicks notification
       ▼
┌─────────────────────────────┐
│  Navigate to Chat           │
│  Mark notification as read  │
└─────────────────────────────┘
```

## 5. Typing Indicator Flow

```
┌─────────────┐
│   User A    │
│  (Typing)   │
└──────┬──────┘
       │
       │ 1. Starts typing
       │    (debounced 300ms)
       ▼
┌─────────────────────────────┐
│  setTyping(true)            │
│  - Set typing status        │
│  - Auto-timeout: 3 seconds  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Firebase Realtime DB       │
│  /chat_typing/{chatId}/     │
│  /{userId}                  │
│  - isTyping: true           │
│  - timestamp                │
└──────┬──────────────────────┘
       │
       │ Real-time listener
       ▼
┌─────────────┐    ┌─────────────┐
│   User B    │    │   User C    │
│  (Viewer)   │    │  (Viewer)   │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │ 2. Show "User A is typing..."
       │
       │ After 3 seconds OR stop typing:
       ▼
┌─────────────────────────────┐
│  setTyping(false)           │
│  - Remove typing status     │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│   User B    │    │   User C    │
│  (Viewer)   │    │  (Viewer)   │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │ 3. Hide typing indicator
       └──────────────────┘
```

## 6. Message Status Tracking

```
┌─────────────┐
│   Sender    │
└──────┬──────┘
       │
       │ 1. Send message
       ▼
┌─────────────────────────────┐
│  Status: SENDING            │
│  - Message being sent       │
└──────┬──────────────────────┘
       │
       │ 2. Saved to database
       ▼
┌─────────────────────────────┐
│  Status: SENT               │
│  - Message on server        │
└──────┬──────────────────────┘
       │
       │ 3. Recipient receives
       ▼
┌─────────────────────────────┐
│  Status: DELIVERED          │
│  - Message delivered        │
└──────┬──────────────────────┘
       │
       │ 4. Recipient opens chat
       │    and views message
       ▼
┌─────────────────────────────┐
│  Status: READ               │
│  - Message read             │
│  - Update lastReadAt        │
└─────────────────────────────┘
```

## 7. Unread Count Tracking

```
┌─────────────┐
│  New Message│
│   Arrives   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Check User's lastReadAt    │
│  timestamp in chat          │
└──────┬──────────────────────┘
       │
       │ If message.timestamp > lastReadAt
       ▼
┌─────────────────────────────┐
│  Increment Unread Count     │
│  - Update badge             │
│  - Show notification        │
└──────┬──────────────────────┘
       │
       │ User opens chat
       ▼
┌─────────────────────────────┐
│  markMessageAsRead()        │
│  - Update message status    │
│  - Update lastReadAt        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Clear Unread Count         │
│  - Remove badge             │
│  - Mark notifications read  │
└─────────────────────────────┘
```

## 8. Security Flow

```
┌─────────────┐
│   User      │
│  Request    │
└──────┬──────┘
       │
       │ 1. Attempt to access chat
       ▼
┌─────────────────────────────┐
│  Firebase Security Rules    │
│  database.rules.json        │
└──────┬──────────────────────┘
       │
       │ 2. Check authentication
       ├─ Not authenticated? → DENY
       │
       │ 3. Check participant status
       ├─ Not in chat? → DENY
       │
       │ 4. Check operation
       ├─ Read: Is participant? → ALLOW
       ├─ Write: Is participant? → ALLOW
       └─ Delete: Is sender or admin? → ALLOW
       │
       ▼
┌─────────────────────────────┐
│  Access Granted             │
│  - Read messages            │
│  - Send messages            │
│  - Manage chat              │
└─────────────────────────────┘
```

## 9. Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     USER JOURNEY                            │
└─────────────────────────────────────────────────────────────┘

1. LOGIN
   └─> Authenticate with Firebase Auth

2. VIEW CHATS
   └─> getUserChats(userId)
       └─> See list of chats with unread counts

3. OPEN CHAT
   └─> listenToMessages(chatId)
       └─> Load last 50 messages
       └─> Listen for new messages
       └─> Listen for typing indicators

4. SEND MESSAGE
   ├─> Text: sendMessage()
   │   └─> Status: sending → sent → delivered → read
   │
   └─> File: sendFileMessage()
       └─> Upload progress: 0% → 100%
       └─> Status: sending → sent → delivered → read

5. RECEIVE MESSAGE
   └─> Real-time listener triggers
       └─> Show message in chat
       └─> Show notification
       └─> Update unread count
       └─> Play sound (if high priority)

6. INTERACT WITH MESSAGE
   ├─> Reply: sendMessage(replyTo: messageId)
   ├─> React: addReaction(messageId, emoji)
   ├─> Delete: deleteMessage(messageId)
   └─> Mark Read: markMessageAsRead(messageId)

7. MANAGE GROUP
   ├─> Add Member: addParticipant()
   ├─> Remove Member: removeParticipant()
   ├─> Mute Chat: Update participant.isMuted
   └─> Leave Group: removeParticipant(userId)

8. NOTIFICATIONS
   └─> listenToNotifications(userId)
       └─> Receive notification
       └─> Click notification
       └─> Navigate to chat
       └─> Mark as read

9. LOGOUT
   └─> Cleanup listeners
       └─> Stop listening to messages
       └─> Stop listening to notifications
       └─> Stop listening to typing
```

## Legend

```
┌─────────┐
│  Box    │  = Component/Service/Database
└─────────┘

    │
    ▼         = Data flow direction

    ├─        = Decision/Branch

    →         = Action/Result
```

## Summary

These diagrams illustrate the complete flow of the Enhanced Realtime Messaging System, showing how messages, files, notifications, and group chats work together to provide a seamless real-time communication experience.

All flows follow Firebase best practices for:
- ✅ Real-time data synchronization
- ✅ Security and access control
- ✅ Performance optimization
- ✅ Offline support
- ✅ Scalability
