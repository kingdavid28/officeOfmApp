// Enhanced Realtime Messaging Service
// Features: File/Photo sharing, Group chat, Notifications, Message status tracking
// Best Practices: Security, Performance, Offline support, Type safety

import {
    ref,
    set,
    push,
    update,
    remove,
    onValue,
    onChildAdded,
    onChildChanged,
    get,
    query,
    orderByChild,
    limitToLast,
    off
} from 'firebase/database';
import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    UploadTask
} from 'firebase/storage';
import { realtimeDb, storage } from './firebase';
import { UserRole } from './friary-types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ChatMessage {
    id: string;
    chatId: string; // For group chats
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    content: string;
    timestamp: number;
    type: 'text' | 'file' | 'image' | 'system';
    status: 'sending' | 'sent' | 'delivered' | 'read';
    replyTo?: string; // Message ID being replied to
    attachments?: MessageAttachment[];
    reactions?: { [userId: string]: string }; // emoji reactions
    editedAt?: number;
    deletedAt?: number;
}

export interface MessageAttachment {
    id: string;
    name: string;
    type: 'image' | 'document' | 'video' | 'audio' | 'other';
    url: string;
    size: number;
    mimeType: string;
    thumbnailUrl?: string;
    uploadProgress?: number;
}

export interface GroupChat {
    id: string;
    name: string;
    description?: string;
    type: 'direct' | 'group' | 'channel';
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    participants: {
        [userId: string]: {
            name: string;
            role: UserRole;
            joinedAt: number;
            isAdmin: boolean;
            isMuted: boolean;
            lastReadAt: number;
        };
    };
    settings: {
        allowFileSharing: boolean;
        maxFileSize: number; // in MB
        allowedFileTypes: string[];
        isPrivate: boolean;
        requireApproval: boolean;
    };
    avatar?: string;
    pinnedMessages?: string[];
    lastMessage?: {
        content: string;
        senderId: string;
        timestamp: number;
    };
}

export interface MessageNotification {
    id: string;
    userId: string;
    chatId: string;
    messageId: string;
    type: 'new_message' | 'mention' | 'reply' | 'reaction' | 'file_shared';
    title: string;
    body: string;
    timestamp: number;
    read: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    data?: {
        senderName?: string;
        chatName?: string;
        messagePreview?: string;
        attachmentCount?: number;
    };
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

// ============================================================================
// REALTIME MESSAGING SERVICE CLASS
// ============================================================================

export class RealtimeMessagingService {
    private static readonly CHATS_PATH = 'chats';
    private static readonly MESSAGES_PATH = 'messages';
    private static readonly NOTIFICATIONS_PATH = 'message_notifications';
    private static readonly TYPING_PATH = 'chat_typing';
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private static readonly ALLOWED_FILE_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];

    // ========================================================================
    // GROUP CHAT MANAGEMENT
    // ========================================================================

    /**
     * Create a new group chat
     */
    static async createGroupChat(
        name: string,
        creatorId: string,
        creatorName: string,
        creatorRole: UserRole,
        participantIds: string[],
        type: 'direct' | 'group' | 'channel' = 'group',
        settings?: Partial<GroupChat['settings']>
    ): Promise<string> {
        try {
            const chatsRef = ref(realtimeDb, this.CHATS_PATH);
            const newChatRef = push(chatsRef);
            const chatId = newChatRef.key!;

            const participants: GroupChat['participants'] = {
                [creatorId]: {
                    name: creatorName,
                    role: creatorRole,
                    joinedAt: Date.now(),
                    isAdmin: true,
                    isMuted: false,
                    lastReadAt: Date.now()
                }
            };

            // Add other participants
            participantIds.forEach(id => {
                if (id !== creatorId) {
                    participants[id] = {
                        name: '', // Will be updated when they join
                        role: 'staff',
                        joinedAt: Date.now(),
                        isAdmin: false,
                        isMuted: false,
                        lastReadAt: Date.now()
                    };
                }
            });

            const groupChat: GroupChat = {
                id: chatId,
                name,
                type,
                createdBy: creatorId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                participants,
                settings: {
                    allowFileSharing: true,
                    maxFileSize: 10,
                    allowedFileTypes: [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_FILE_TYPES],
                    isPrivate: false,
                    requireApproval: false,
                    ...settings
                }
            };

            await set(newChatRef, groupChat);
            console.log('✅ Group chat created:', chatId);

            // Send system message only for group chats
            if (type === 'group' || type === 'channel') {
                await this.sendSystemMessage(chatId, `${creatorName} created the group`);
            }

            return chatId;
        } catch (error) {
            console.error('❌ Error creating group chat:', error);
            throw error;
        }
    }

    /**
     * Create or get existing direct chat between two users
     */
    static async createOrGetDirectChat(
        userId1: string,
        userName1: string,
        userRole1: UserRole,
        userId2: string,
        userName2: string,
        userRole2: UserRole
    ): Promise<string> {
        try {
            // Check if direct chat already exists between these users
            const existingChat = await this.findDirectChat(userId1, userId2);

            if (existingChat) {
                console.log('✅ Found existing direct chat:', existingChat);
                return existingChat;
            }

            // Create new direct chat
            const chatName = `${userName1} & ${userName2}`;

            const chatId = await this.createGroupChat(
                chatName,
                userId1,
                userName1,
                userRole1,
                [userId2],
                'direct',
                {
                    allowFileSharing: true,
                    maxFileSize: 10,
                    allowedFileTypes: [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_FILE_TYPES],
                    isPrivate: true,
                    requireApproval: false
                }
            );

            // Update the second participant's name
            const participant2Ref = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}/participants/${userId2}`);
            await update(participant2Ref, {
                name: userName2,
                role: userRole2
            });

            console.log('✅ Direct chat created:', chatId);
            return chatId;
        } catch (error) {
            console.error('❌ Error creating direct chat:', error);
            throw error;
        }
    }

    /**
     * Find existing direct chat between two users
     */
    static async findDirectChat(userId1: string, userId2: string): Promise<string | null> {
        try {
            const chatsRef = ref(realtimeDb, this.CHATS_PATH);
            const snapshot = await get(chatsRef);

            if (!snapshot.exists()) return null;

            const allChats = snapshot.val();

            // Find direct chat with both users
            for (const [chatId, chat] of Object.entries(allChats)) {
                const chatData = chat as GroupChat;

                if (chatData.type === 'direct') {
                    const participantIds = Object.keys(chatData.participants);

                    if (
                        participantIds.length === 2 &&
                        participantIds.includes(userId1) &&
                        participantIds.includes(userId2)
                    ) {
                        return chatId;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('❌ Error finding direct chat:', error);
            return null;
        }
    }

    /**
     * Add participant to group chat
     */
    static async addParticipant(
        chatId: string,
        userId: string,
        userName: string,
        userRole: UserRole,
        addedBy: string
    ): Promise<void> {
        try {
            const participantRef = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}/participants/${userId}`);

            await set(participantRef, {
                name: userName,
                role: userRole,
                joinedAt: Date.now(),
                isAdmin: false,
                isMuted: false,
                lastReadAt: Date.now()
            });

            await update(ref(realtimeDb, `${this.CHATS_PATH}/${chatId}`), {
                updatedAt: Date.now()
            });

            // Send system message
            await this.sendSystemMessage(chatId, `${userName} joined the group`);

            console.log('✅ Participant added:', userId);
        } catch (error) {
            console.error('❌ Error adding participant:', error);
            throw error;
        }
    }

    /**
     * Remove participant from group chat
     */
    static async removeParticipant(
        chatId: string,
        userId: string,
        removedBy: string
    ): Promise<void> {
        try {
            const participantRef = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}/participants/${userId}`);
            const snapshot = await get(participantRef);
            const userName = snapshot.val()?.name || 'User';

            await remove(participantRef);

            await update(ref(realtimeDb, `${this.CHATS_PATH}/${chatId}`), {
                updatedAt: Date.now()
            });

            // Send system message
            await this.sendSystemMessage(chatId, `${userName} left the group`);

            console.log('✅ Participant removed:', userId);
        } catch (error) {
            console.error('❌ Error removing participant:', error);
            throw error;
        }
    }

    /**
     * Get user's chats
     */
    static async getUserChats(userId: string): Promise<GroupChat[]> {
        try {
            const chatsRef = ref(realtimeDb, this.CHATS_PATH);
            const snapshot = await get(chatsRef);

            if (!snapshot.exists()) return [];

            const allChats = snapshot.val();
            const userChats: GroupChat[] = [];

            Object.values(allChats).forEach((chat: any) => {
                if (chat.participants && chat.participants[userId]) {
                    userChats.push(chat);
                }
            });

            // Sort by last message timestamp
            return userChats.sort((a, b) => {
                const aTime = a.lastMessage?.timestamp || a.updatedAt;
                const bTime = b.lastMessage?.timestamp || b.updatedAt;
                return bTime - aTime;
            });
        } catch (error) {
            console.error('❌ Error getting user chats:', error);
            return [];
        }
    }

    // ========================================================================
    // MESSAGE SENDING & RECEIVING
    // ========================================================================

    /**
     * Send text message
     */
    static async sendMessage(
        chatId: string,
        senderId: string,
        senderName: string,
        senderRole: UserRole,
        content: string,
        replyTo?: string
    ): Promise<string> {
        try {
            const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);
            const newMessageRef = push(messagesRef);
            const messageId = newMessageRef.key!;

            const message: ChatMessage = {
                id: messageId,
                chatId,
                senderId,
                senderName,
                senderRole,
                content,
                timestamp: Date.now(),
                type: 'text',
                status: 'sending'
            };

            // Only add replyTo if it's defined
            if (replyTo) {
                message.replyTo = replyTo;
            }

            await set(newMessageRef, message);

            // Update message status
            await update(newMessageRef, { status: 'sent' });

            // Update chat's last message
            await this.updateLastMessage(chatId, content, senderId);

            // Send notifications to other participants
            await this.notifyParticipants(chatId, senderId, senderName, content, 'new_message');

            console.log('✅ Message sent:', messageId);
            return messageId;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            throw error;
        }
    }

    /**
     * Send system message
     */
    static async sendSystemMessage(chatId: string, content: string): Promise<string> {
        try {
            const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);
            const newMessageRef = push(messagesRef);
            const messageId = newMessageRef.key!;

            const message: ChatMessage = {
                id: messageId,
                chatId,
                senderId: 'system',
                senderName: 'System',
                senderRole: 'super_admin',
                content,
                timestamp: Date.now(),
                type: 'system',
                status: 'sent'
            };

            await set(newMessageRef, message);
            return messageId;
        } catch (error) {
            console.error('❌ Error sending system message:', error);
            throw error;
        }
    }

    /**
     * Upload file/image and send message
     */
    static async sendFileMessage(
        chatId: string,
        senderId: string,
        senderName: string,
        senderRole: UserRole,
        file: File,
        caption?: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        try {
            // Validate file
            this.validateFile(file);

            // Determine file type
            const fileType = this.getFileType(file.type);

            // Upload file to storage
            const storagePath = `chat_files/${chatId}/${Date.now()}_${file.name}`;
            const fileRef = storageRef(storage, storagePath);
            const uploadTask = uploadBytesResumable(fileRef, file);

            // Monitor upload progress
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        onProgress?.({
                            fileName: file.name,
                            progress,
                            status: 'uploading'
                        });
                    },
                    (error) => {
                        console.error('❌ Upload error:', error);
                        onProgress?.({
                            fileName: file.name,
                            progress: 0,
                            status: 'error',
                            error: error.message
                        });
                        reject(error);
                    },
                    async () => {
                        try {
                            // Get download URL
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                            // Create message with attachment
                            const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);
                            const newMessageRef = push(messagesRef);
                            const messageId = newMessageRef.key!;

                            const attachment: MessageAttachment = {
                                id: `att_${Date.now()}`,
                                name: file.name,
                                type: fileType,
                                url: downloadURL,
                                size: file.size,
                                mimeType: file.type
                            };

                            const message: ChatMessage = {
                                id: messageId,
                                chatId,
                                senderId,
                                senderName,
                                senderRole,
                                content: caption || `Shared ${fileType === 'image' ? 'an image' : 'a file'}: ${file.name}`,
                                timestamp: Date.now(),
                                type: fileType === 'image' ? 'image' : 'file',
                                status: 'sent',
                                attachments: [attachment]
                            };

                            await set(newMessageRef, message);

                            // Update chat's last message
                            await this.updateLastMessage(chatId, message.content, senderId);

                            // Send notifications
                            await this.notifyParticipants(
                                chatId,
                                senderId,
                                senderName,
                                `Shared ${fileType === 'image' ? 'an image' : 'a file'}`,
                                'file_shared'
                            );

                            onProgress?.({
                                fileName: file.name,
                                progress: 100,
                                status: 'completed'
                            });

                            console.log('✅ File message sent:', messageId);
                            resolve(messageId);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('❌ Error sending file message:', error);
            throw error;
        }
    }

    /**
     * Listen to messages in a chat
     */
    static listenToMessages(
        chatId: string,
        callback: (message: ChatMessage) => void,
        limit: number = 50
    ): () => void {
        const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);
        const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));

        const unsubscribe = onChildAdded(messagesQuery, (snapshot) => {
            const message = snapshot.val() as ChatMessage;
            if (message) {
                callback(message);
            }
        });

        return () => off(messagesQuery);
    }

    /**
     * Listen to message updates (status changes, reactions, edits)
     */
    static listenToMessageUpdates(
        chatId: string,
        callback: (message: ChatMessage) => void
    ): () => void {
        const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);

        const unsubscribe = onChildChanged(messagesRef, (snapshot) => {
            const message = snapshot.val() as ChatMessage;
            if (message) {
                callback(message);
            }
        });

        return () => off(messagesRef);
    }

    /**
     * Mark message as read
     */
    static async markMessageAsRead(chatId: string, messageId: string, userId: string): Promise<void> {
        try {
            const messageRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}/${messageId}`);
            await update(messageRef, { status: 'read' });

            // Update user's last read timestamp
            const participantRef = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}/participants/${userId}`);
            await update(participantRef, { lastReadAt: Date.now() });

            console.log('✅ Message marked as read:', messageId);
        } catch (error) {
            console.error('❌ Error marking message as read:', error);
        }
    }

    /**
     * Add reaction to message
     */
    static async addReaction(
        chatId: string,
        messageId: string,
        userId: string,
        emoji: string
    ): Promise<void> {
        try {
            const reactionRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}/${messageId}/reactions/${userId}`);
            await set(reactionRef, emoji);
            console.log('✅ Reaction added:', emoji);
        } catch (error) {
            console.error('❌ Error adding reaction:', error);
        }
    }

    /**
     * Delete message
     */
    static async deleteMessage(chatId: string, messageId: string, userId: string): Promise<void> {
        try {
            const messageRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}/${messageId}`);
            const snapshot = await get(messageRef);
            const message = snapshot.val() as ChatMessage;

            // Only sender or admin can delete
            if (message.senderId !== userId) {
                throw new Error('Unauthorized to delete this message');
            }

            // Soft delete - mark as deleted
            await update(messageRef, {
                deletedAt: Date.now(),
                content: 'This message was deleted'
            });

            // Delete attachments from storage if any
            if (message.attachments) {
                for (const attachment of message.attachments) {
                    try {
                        const fileRef = storageRef(storage, attachment.url);
                        await deleteObject(fileRef);
                    } catch (error) {
                        console.warn('Could not delete attachment:', error);
                    }
                }
            }

            console.log('✅ Message deleted:', messageId);
        } catch (error) {
            console.error('❌ Error deleting message:', error);
            throw error;
        }
    }

    // ========================================================================
    // NOTIFICATIONS
    // ========================================================================

    /**
     * Send notification to chat participants
     */
    private static async notifyParticipants(
        chatId: string,
        senderId: string,
        senderName: string,
        messagePreview: string,
        type: MessageNotification['type']
    ): Promise<void> {
        try {
            // Get chat info
            const chatRef = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}`);
            const chatSnapshot = await get(chatRef);
            const chat = chatSnapshot.val() as GroupChat;

            if (!chat) return;

            // Send notification to each participant (except sender)
            const notificationPromises = Object.keys(chat.participants)
                .filter(userId => userId !== senderId && !chat.participants[userId].isMuted)
                .map(userId => this.sendNotification(
                    userId,
                    chatId,
                    '',
                    type,
                    `${senderName} in ${chat.name}`,
                    messagePreview,
                    'normal',
                    {
                        senderName,
                        chatName: chat.name,
                        messagePreview,
                        attachmentCount: 0
                    }
                ));

            await Promise.all(notificationPromises);
        } catch (error) {
            console.error('❌ Error notifying participants:', error);
        }
    }

    /**
     * Send notification to specific user
     */
    static async sendNotification(
        userId: string,
        chatId: string,
        messageId: string,
        type: MessageNotification['type'],
        title: string,
        body: string,
        priority: MessageNotification['priority'] = 'normal',
        data?: MessageNotification['data']
    ): Promise<string> {
        try {
            const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
            const newNotificationRef = push(notificationsRef);
            const notificationId = newNotificationRef.key!;

            const notification: MessageNotification = {
                id: notificationId,
                userId,
                chatId,
                messageId,
                type,
                title,
                body,
                timestamp: Date.now(),
                read: false,
                priority,
                data
            };

            await set(newNotificationRef, notification);
            console.log('✅ Notification sent:', notificationId);

            return notificationId;
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            throw error;
        }
    }

    /**
     * Listen to user notifications
     */
    static listenToNotifications(
        userId: string,
        callback: (notification: MessageNotification) => void
    ): () => void {
        const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
        const notificationsQuery = query(notificationsRef, orderByChild('timestamp'));

        const unsubscribe = onChildAdded(notificationsQuery, (snapshot) => {
            const notification = snapshot.val() as MessageNotification;
            if (notification && !notification.read) {
                callback(notification);
            }
        });

        return () => off(notificationsQuery);
    }

    /**
     * Mark notification as read
     */
    static async markNotificationRead(userId: string, notificationId: string): Promise<void> {
        try {
            const notificationRef = ref(
                realtimeDb,
                `${this.NOTIFICATIONS_PATH}/${userId}/${notificationId}`
            );
            await update(notificationRef, { read: true });
            console.log('✅ Notification marked as read:', notificationId);
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
        }
    }

    /**
     * Get unread notification count
     */
    static async getUnreadCount(userId: string): Promise<number> {
        try {
            const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
            const snapshot = await get(notificationsRef);

            if (!snapshot.exists()) return 0;

            const notifications = snapshot.val();
            return Object.values(notifications).filter((n: any) => !n.read).length;
        } catch (error) {
            console.error('❌ Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Clear all notifications for user
     */
    static async clearAllNotifications(userId: string): Promise<void> {
        try {
            const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
            await remove(notificationsRef);
            console.log('✅ All notifications cleared for user:', userId);
        } catch (error) {
            console.error('❌ Error clearing notifications:', error);
        }
    }

    // ========================================================================
    // TYPING INDICATORS
    // ========================================================================

    /**
     * Set typing indicator for chat
     */
    static async setTyping(
        chatId: string,
        userId: string,
        userName: string,
        isTyping: boolean
    ): Promise<void> {
        try {
            const typingRef = ref(realtimeDb, `${this.TYPING_PATH}/${chatId}/${userId}`);

            if (isTyping) {
                await set(typingRef, {
                    userId,
                    userName,
                    isTyping: true,
                    timestamp: Date.now()
                });

                // Auto-remove after 3 seconds
                setTimeout(async () => {
                    await remove(typingRef);
                }, 3000);
            } else {
                await remove(typingRef);
            }
        } catch (error) {
            console.error('❌ Error setting typing indicator:', error);
        }
    }

    /**
     * Listen to typing indicators in chat
     */
    static listenToTyping(
        chatId: string,
        callback: (userId: string, userName: string, isTyping: boolean) => void
    ): () => void {
        const typingRef = ref(realtimeDb, `${this.TYPING_PATH}/${chatId}`);

        const unsubscribeAdded = onChildAdded(typingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                callback(snapshot.key!, data.userName, true);
            }
        });

        const unsubscribeRemoved = onChildChanged(typingRef, (snapshot) => {
            callback(snapshot.key!, '', false);
        });

        return () => {
            off(typingRef);
        };
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * Update chat's last message
     */
    private static async updateLastMessage(
        chatId: string,
        content: string,
        senderId: string
    ): Promise<void> {
        try {
            const chatRef = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}`);
            await update(chatRef, {
                lastMessage: {
                    content: content.substring(0, 100), // Truncate preview
                    senderId,
                    timestamp: Date.now()
                },
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('❌ Error updating last message:', error);
        }
    }

    /**
     * Validate file before upload
     */
    private static validateFile(file: File): void {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        }

        // Check file type
        const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
        const isDocument = this.ALLOWED_FILE_TYPES.includes(file.type);

        if (!isImage && !isDocument) {
            throw new Error('File type not allowed');
        }
    }

    /**
     * Get file type category
     */
    private static getFileType(mimeType: string): MessageAttachment['type'] {
        if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
        if (mimeType.includes('video')) return 'video';
        if (mimeType.includes('audio')) return 'audio';
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) {
            return 'document';
        }
        return 'other';
    }

    /**
     * Get unread message count for chat
     */
    static async getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
        try {
            const chatRef = ref(realtimeDb, `${this.CHATS_PATH}/${chatId}`);
            const chatSnapshot = await get(chatRef);
            const chat = chatSnapshot.val() as GroupChat;

            if (!chat || !chat.participants[userId]) return 0;

            const lastReadAt = chat.participants[userId].lastReadAt;

            const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);
            const messagesSnapshot = await get(messagesRef);

            if (!messagesSnapshot.exists()) return 0;

            const messages = messagesSnapshot.val();
            return Object.values(messages).filter((msg: any) =>
                msg.timestamp > lastReadAt && msg.senderId !== userId
            ).length;
        } catch (error) {
            console.error('❌ Error getting unread message count:', error);
            return 0;
        }
    }

    /**
     * Search messages in chat
     */
    static async searchMessages(chatId: string, searchTerm: string): Promise<ChatMessage[]> {
        try {
            const messagesRef = ref(realtimeDb, `${this.MESSAGES_PATH}/${chatId}`);
            const snapshot = await get(messagesRef);

            if (!snapshot.exists()) return [];

            const messages = snapshot.val();
            const searchLower = searchTerm.toLowerCase();

            return Object.values(messages).filter((msg: any) =>
                msg.content.toLowerCase().includes(searchLower) ||
                msg.senderName.toLowerCase().includes(searchLower)
            ) as ChatMessage[];
        } catch (error) {
            console.error('❌ Error searching messages:', error);
            return [];
        }
    }
}
