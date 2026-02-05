# Messaging System - Quick Reference Guide

## 🚀 Quick Start

### Using Organization Messaging

```typescript
import { useMessages } from '../../hooks/useMessaging';

const { 
  messages,           // Array of messages
  loading,            // Loading state
  uploadProgress,     // File upload progress
  typingUsers,        // Array of typing users
  sendMessage,        // Send text message
  sendFileMessage,    // Send file with progress
  editMessage,        // Edit message
  deleteMessage,      // Delete message
  addReaction,        // Add emoji reaction
  removeReaction,     // Remove reaction
  setTyping          // Set typing indicator
} = useMessages(organizationId);
```

### Sending Messages

```typescript
// Text message
await sendMessage(
  content,      // Message text
  senderId,     // User ID
  senderName,   // User name
  'text'        // Message type
);

// File message
await sendFileMessage(
  file,         // File object
  senderId,     // User ID
  senderName,   // User name
  caption,      // Optional caption
  (progress) => {
    // Progress callback
    console.log(progress.progress); // 0-100
  }
);
```

### Reactions

```typescript
// Add reaction
await addReaction(messageId, userId, '👍');

// Remove reaction
await removeReaction(messageId, userId);
```

### Typing Indicators

```typescript
// Set typing
await setTyping(userId, userName, true);

// Clear typing (auto-clears after 3s)
await setTyping(userId, userName, false);
```

---

## 📁 File Upload

### Supported File Types

**Images**: JPEG, PNG, GIF, WEBP  
**Documents**: PDF, Word, Excel, Text, CSV  
**Max Size**: 10MB

### Upload Progress States

- `uploading` - File is uploading
- `completed` - Upload successful
- `error` - Upload failed

### Example

```typescript
const handleFileUpload = async (file: File) => {
  try {
    await sendFileMessage(
      file,
      user.uid,
      user.displayName,
      'Check this out!',
      (progress) => {
        console.log(`${progress.progress}% - ${progress.status}`);
      }
    );
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

## 😊 Reactions

### Available Emojis

👍 ❤️ 😂 😮 😢 🎉

### Usage

```typescript
// Add reaction
<button onClick={() => handleReaction(messageId, '👍')}>
  👍
</button>

// Display reactions
{message.reactions && Object.entries(message.reactions).map(([userId, emoji]) => (
  <span key={userId}>{emoji}</span>
))}
```

---

## ⌨️ Typing Indicators

### Display Typing Users

```typescript
{typingUsers.length > 0 && (
  <div>
    {typingUsers.map(u => u.userName).join(', ')} 
    {typingUsers.length === 1 ? 'is' : 'are'} typing...
  </div>
)}
```

### Set Typing on Input

```typescript
<input
  onChange={(e) => {
    setNewMessage(e.target.value);
    setTyping(user.uid, user.displayName, true);
  }}
/>
```

---

## 🗄️ Database Structure

### Realtime Database Paths

```
organizations/
  {organizationId}/
    messages/
      {messageId}/
        id: string
        content: string
        senderId: string
        senderName: string
        timestamp: number
        type: 'text' | 'file'
        fileUrl?: string
        fileName?: string
        edited: boolean
        reactions: { [userId]: emoji }
    
    typing/
      {userId}/
        userId: string
        userName: string
        isTyping: boolean
        timestamp: number
    
    notifications/
      {notificationId}/
        id: string
        title: string
        message: string
        type: string
        read: boolean
        createdAt: number
```

---

## 🔐 Security Rules

### Message Access

```json
{
  "rules": {
    "organizations": {
      "$orgId": {
        "messages": {
          ".read": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
          ".write": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId"
        }
      }
    }
  }
}
```

---

## 🎨 UI Components

### Message Bubble

```typescript
<div className={`
  max-w-xs lg:max-w-md px-4 py-2 rounded-lg
  ${isSender ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}
`}>
  <div className="text-sm">{message.content}</div>
  {message.fileUrl && (
    <a href={message.fileUrl} download>
      Download {message.fileName}
    </a>
  )}
</div>
```

### Upload Progress Bar

```typescript
{uploadProgress && (
  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="w-full bg-blue-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${uploadProgress.progress}%` }}
      />
    </div>
    <div className="text-xs mt-1">{uploadProgress.fileName}</div>
  </div>
)}
```

### Reaction Picker

```typescript
<div className="flex space-x-1">
  {['👍', '❤️', '😂', '😮', '😢', '🎉'].map(emoji => (
    <button
      key={emoji}
      onClick={() => handleReaction(messageId, emoji)}
      className="text-lg hover:scale-125"
    >
      {emoji}
    </button>
  ))}
</div>
```

---

## 🧪 Testing

### Manual Test Checklist

- [ ] Send text message
- [ ] Upload image file
- [ ] Upload document file
- [ ] View upload progress
- [ ] Download file
- [ ] Add reaction
- [ ] Remove reaction
- [ ] Edit message
- [ ] Delete message
- [ ] See typing indicator
- [ ] Multiple users typing

### Emulator Testing

```bash
# Start Firebase Emulator
firebase emulators:start

# Realtime Database: http://localhost:9000
# Emulator UI: http://localhost:4000
```

---

## 🐛 Common Issues

### File Upload Fails

**Problem**: File upload returns error  
**Solution**: Check file size (< 10MB) and type

### Typing Indicator Stuck

**Problem**: Typing indicator doesn't clear  
**Solution**: Auto-clears after 3 seconds, or call `setTyping(false)`

### Reactions Not Showing

**Problem**: Reactions don't appear  
**Solution**: Check `message.reactions` object exists

### Messages Not Real-time

**Problem**: Messages don't update instantly  
**Solution**: Verify Realtime Database connection and rules

---

## 📚 Related Documentation

- **ENHANCED_MESSAGING_IMPLEMENTATION_SUMMARY.md** - Complete implementation details
- **MESSAGING_SYSTEM_EVALUATION.md** - System architecture and evaluation
- **COMPLETE_MESSAGING_FEATURES_SUMMARY.md** - Feature overview
- **database.rules.json** - Security rules

---

## 🎯 Best Practices

1. ✅ Always validate files before upload
2. ✅ Show upload progress to users
3. ✅ Clear typing indicators on send
4. ✅ Handle errors gracefully
5. ✅ Clean up listeners on unmount
6. ✅ Use TypeScript for type safety
7. ✅ Test with Firebase Emulator
8. ✅ Follow security rules

---

**Last Updated**: February 5, 2026  
**Version**: 2.0.0
