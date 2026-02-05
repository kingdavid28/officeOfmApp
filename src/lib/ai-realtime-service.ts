// AI Realtime Service - Real-time AI Features using Firebase Realtime Database
// Use Cases: Live chat, typing indicators, presence, notifications, collaborative editing
// Best Practices: Efficient data structure, security rules, offline support, connection management

import {
    ref,
    set,
    push,
    update,
    remove,
    onValue,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    onDisconnect,
    serverTimestamp,
    get,
    query,
    orderByChild,
    limitToLast,
    equalTo,
    off,
    DatabaseReference
} from 'firebase/database';
import { realtimeDb } from './firebase';
import { UserRole } from './friary-types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AIRealtimeMessage {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    message: string;
    timestamp: number;
    type: 'user' | 'ai' | 'system';
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
    metadata?: {
        processingTime?: number;
        confidence?: number;
        sources?: string[];
    };
}

export interface UserPresence {
    userId: string;
    userName: string;
    userRole: UserRole;
    status: 'online' | 'away' | 'offline';
    lastSeen: number;
    currentPage?: string;
    isTyping?: boolean;
}

export interface AITypingIndicator {
    userId: string;
    userName: string;
    isTyping: boolean;
    timestamp: number;
}

export interface RealtimeNotification {
    id: string;
    userId: string;
    type: 'ai_response' | 'mention' | 'system' | 'update';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    actionUrl?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CollaborativeSession {
    sessionId: string;
    documentId: string;
    participants: {
        [userId: string]: {
            name: string;
            role: UserRole;
            cursor?: { line: number; column: number };
            selection?: { start: number; end: number };
            lastActivity: number;
        };
    };
    createdAt: number;
    updatedAt: number;
}

// ============================================================================
// AI REALTIME SERVICE CLASS
// ============================================================================

export class AIRealtimeService {
    private static readonly CHAT_PATH = 'ai_chat';
    private static readonly PRESENCE_PATH = 'presence';
    private static readonly TYPING_PATH = 'typing';
    private static readonly NOTIFICATIONS_PATH = 'notifications';
    private static readonly COLLABORATIVE_PATH = 'collaborative';
    private static readonly MAX_MESSAGES = 100;
    private static readonly TYPING_TIMEOUT = 3000; // 3 seconds

    // ========================================================================
    // CHAT MESSAGES - Real-time AI Chat
    // ========================================================================

    /**
     * Send a message to AI chat (real-time)
     */
    static async sendMessage(
        userId: string,
        userName: string,
        userRole: UserRole,
        message: string,
        type: 'user' | 'ai' | 'system' = 'user'
    ): Promise<string> {
        try {
            const chatRef = ref(realtimeDb, `${this.CHAT_PATH}/messages`);
            const newMessageRef = push(chatRef);

            const messageData: AIRealtimeMessage = {
                id: newMessageRef.key!,
                userId: userId || 'unknown',
                userName: userName || 'Unknown User',
                userRole: userRole || 'guest',
                message,
                timestamp: Date.now(),
                type,
                status: 'sending'
            };

            await set(newMessageRef, messageData);

            // Update status to sent
            await update(newMessageRef, { status: 'sent' });

            console.log('✅ Message sent:', newMessageRef.key);
            return newMessageRef.key!;

        } catch (error) {
            console.error('❌ Error sending message:', error);
            throw error;
        }
    }

    /**
     * Listen to new messages (real-time)
     */
    static listenToMessages(
        callback: (message: AIRealtimeMessage) => void,
        limit: number = 50
    ): () => void {
        const messagesRef = ref(realtimeDb, `${this.CHAT_PATH}/messages`);
        const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));

        const unsubscribe = onChildAdded(messagesQuery, (snapshot) => {
            const message = snapshot.val() as AIRealtimeMessage;
            if (message) {
                callback(message);
            }
        });

        // Return cleanup function
        return () => off(messagesQuery);
    }

    /**
     * Listen to message updates (status changes)
     */
    static listenToMessageUpdates(
        messageId: string,
        callback: (message: AIRealtimeMessage) => void
    ): () => void {
        const messageRef = ref(realtimeDb, `${this.CHAT_PATH}/messages/${messageId}`);

        const unsubscribe = onValue(messageRef, (snapshot) => {
            const message = snapshot.val() as AIRealtimeMessage;
            if (message) {
                callback(message);
            }
        });

        return () => off(messageRef);
    }

    /**
     * Update message status
     */
    static async updateMessageStatus(
        messageId: string,
        status: AIRealtimeMessage['status'],
        metadata?: AIRealtimeMessage['metadata']
    ): Promise<void> {
        try {
            const messageRef = ref(realtimeDb, `${this.CHAT_PATH}/messages/${messageId}`);
            const updates: any = { status };

            if (metadata) {
                updates.metadata = metadata;
            }

            await update(messageRef, updates);
            console.log('✅ Message status updated:', messageId, status);

        } catch (error) {
            console.error('❌ Error updating message status:', error);
        }
    }

    /**
     * Clear old messages (keep last N messages)
     */
    static async clearOldMessages(keepLast: number = 100): Promise<void> {
        try {
            const messagesRef = ref(realtimeDb, `${this.CHAT_PATH}/messages`);
            const snapshot = await get(messagesRef);

            if (snapshot.exists()) {
                const messages = snapshot.val();
                const messageIds = Object.keys(messages);

                // Sort by timestamp
                const sortedIds = messageIds.sort((a, b) => {
                    return messages[a].timestamp - messages[b].timestamp;
                });

                // Remove old messages
                const toRemove = sortedIds.slice(0, -keepLast);
                for (const id of toRemove) {
                    await remove(ref(realtimeDb, `${this.CHAT_PATH}/messages/${id}`));
                }

                console.log('✅ Cleared', toRemove.length, 'old messages');
            }

        } catch (error) {
            console.error('❌ Error clearing old messages:', error);
        }
    }

    // ========================================================================
    // PRESENCE - User Online/Offline Status
    // ========================================================================

    /**
     * Set user presence (online/offline)
     */
    static async setPresence(
        userId: string,
        userName: string | undefined,
        userRole: UserRole,
        status: 'online' | 'away' | 'offline',
        currentPage?: string
    ): Promise<void> {
        try {
            // Validate required fields
            if (!userId) {
                console.warn('⚠️ Cannot set presence: userId is required');
                return;
            }

            if (!userName) {
                console.warn('⚠️ Cannot set presence: userName is undefined, skipping presence update');
                return;
            }

            const presenceRef = ref(realtimeDb, `${this.PRESENCE_PATH}/${userId}`);

            const presenceData: UserPresence = {
                userId,
                userName,
                userRole,
                status,
                lastSeen: Date.now(),
                currentPage
            };

            await set(presenceRef, presenceData);

            // Set up disconnect handler (auto-offline when disconnected)
            if (status === 'online') {
                const disconnectRef = onDisconnect(presenceRef);
                await disconnectRef.update({
                    status: 'offline',
                    lastSeen: Date.now()
                });
            }

            console.log('✅ Presence set:', userId, status);

        } catch (error) {
            console.error('❌ Error setting presence:', error);
        }
    }

    /**
     * Listen to user presence changes
     */
    static listenToPresence(
        callback: (userId: string, presence: UserPresence) => void
    ): () => void {
        const presenceRef = ref(realtimeDb, this.PRESENCE_PATH);

        const unsubscribeAdded = onChildAdded(presenceRef, (snapshot) => {
            const presence = snapshot.val() as UserPresence;
            if (presence) {
                callback(snapshot.key!, presence);
            }
        });

        const unsubscribeChanged = onChildChanged(presenceRef, (snapshot) => {
            const presence = snapshot.val() as UserPresence;
            if (presence) {
                callback(snapshot.key!, presence);
            }
        });

        // Return cleanup function
        return () => {
            off(presenceRef);
        };
    }

    /**
     * Get all online users
     */
    static async getOnlineUsers(): Promise<UserPresence[]> {
        try {
            const presenceRef = ref(realtimeDb, this.PRESENCE_PATH);
            const snapshot = await get(presenceRef);

            if (snapshot.exists()) {
                const presences = snapshot.val();
                return Object.values(presences).filter(
                    (p: any) => p.status === 'online'
                ) as UserPresence[];
            }

            return [];

        } catch (error) {
            console.error('❌ Error getting online users:', error);
            return [];
        }
    }

    // ========================================================================
    // TYPING INDICATORS
    // ========================================================================

    /**
     * Set typing indicator
     */
    static async setTyping(
        userId: string,
        userName: string,
        isTyping: boolean
    ): Promise<void> {
        try {
            const typingRef = ref(realtimeDb, `${this.TYPING_PATH}/${userId}`);

            if (isTyping) {
                const typingData: AITypingIndicator = {
                    userId: userId || 'unknown',
                    userName: userName || 'Unknown User',
                    isTyping: true,
                    timestamp: Date.now()
                };

                await set(typingRef, typingData);

                // Auto-remove after timeout
                setTimeout(async () => {
                    await remove(typingRef);
                }, this.TYPING_TIMEOUT);

            } else {
                await remove(typingRef);
            }

        } catch (error) {
            console.error('❌ Error setting typing indicator:', error);
        }
    }

    /**
     * Listen to typing indicators
     */
    static listenToTyping(
        callback: (userId: string, indicator: AITypingIndicator | null) => void
    ): () => void {
        const typingRef = ref(realtimeDb, this.TYPING_PATH);

        const unsubscribeAdded = onChildAdded(typingRef, (snapshot) => {
            const indicator = snapshot.val() as AITypingIndicator;
            if (indicator) {
                callback(snapshot.key!, indicator);
            }
        });

        const unsubscribeRemoved = onChildRemoved(typingRef, (snapshot) => {
            callback(snapshot.key!, null);
        });

        return () => {
            off(typingRef);
        };
    }

    // ========================================================================
    // NOTIFICATIONS - Real-time Notifications
    // ========================================================================

    /**
     * Send notification to user
     */
    static async sendNotification(
        userId: string,
        type: RealtimeNotification['type'],
        title: string,
        message: string,
        priority: RealtimeNotification['priority'] = 'normal',
        actionUrl?: string
    ): Promise<string> {
        try {
            const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
            const newNotificationRef = push(notificationsRef);

            const notification: RealtimeNotification = {
                id: newNotificationRef.key!,
                userId,
                type,
                title,
                message,
                timestamp: Date.now(),
                read: false,
                priority,
                actionUrl
            };

            await set(newNotificationRef, notification);
            console.log('✅ Notification sent:', newNotificationRef.key);

            return newNotificationRef.key!;

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
        callback: (notification: RealtimeNotification) => void
    ): () => void {
        const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
        const notificationsQuery = query(notificationsRef, orderByChild('timestamp'));

        const unsubscribe = onChildAdded(notificationsQuery, (snapshot) => {
            const notification = snapshot.val() as RealtimeNotification;
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
     * Clear old notifications
     */
    static async clearOldNotifications(userId: string, olderThan: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
        try {
            const notificationsRef = ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}`);
            const snapshot = await get(notificationsRef);

            if (snapshot.exists()) {
                const notifications = snapshot.val();
                const cutoffTime = Date.now() - olderThan;

                for (const [id, notification] of Object.entries(notifications)) {
                    const notif = notification as RealtimeNotification;
                    if (notif.timestamp < cutoffTime && notif.read) {
                        await remove(ref(realtimeDb, `${this.NOTIFICATIONS_PATH}/${userId}/${id}`));
                    }
                }

                console.log('✅ Cleared old notifications for user:', userId);
            }

        } catch (error) {
            console.error('❌ Error clearing old notifications:', error);
        }
    }

    // ========================================================================
    // COLLABORATIVE EDITING - Real-time Collaboration
    // ========================================================================

    /**
     * Create collaborative session
     */
    static async createCollaborativeSession(
        documentId: string,
        userId: string,
        userName: string,
        userRole: UserRole
    ): Promise<string> {
        try {
            const sessionsRef = ref(realtimeDb, `${this.COLLABORATIVE_PATH}/sessions`);
            const newSessionRef = push(sessionsRef);

            const session: CollaborativeSession = {
                sessionId: newSessionRef.key!,
                documentId,
                participants: {
                    [userId || 'unknown']: {
                        name: userName || 'Unknown User',
                        role: userRole || 'guest',
                        lastActivity: Date.now()
                    }
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await set(newSessionRef, session);
            console.log('✅ Collaborative session created:', newSessionRef.key);

            return newSessionRef.key!;

        } catch (error) {
            console.error('❌ Error creating collaborative session:', error);
            throw error;
        }
    }

    /**
     * Join collaborative session
     */
    static async joinCollaborativeSession(
        sessionId: string,
        userId: string,
        userName: string,
        userRole: UserRole
    ): Promise<void> {
        try {
            const participantRef = ref(
                realtimeDb,
                `${this.COLLABORATIVE_PATH}/sessions/${sessionId}/participants/${userId || 'unknown'}`
            );

            await set(participantRef, {
                name: userName || 'Unknown User',
                role: userRole || 'guest',
                lastActivity: Date.now()
            });

            // Set up disconnect handler
            const disconnectRef = onDisconnect(participantRef);
            await disconnectRef.remove();

            console.log('✅ Joined collaborative session:', sessionId);

        } catch (error) {
            console.error('❌ Error joining collaborative session:', error);
        }
    }

    /**
     * Update cursor position in collaborative session
     */
    static async updateCursor(
        sessionId: string,
        userId: string,
        cursor: { line: number; column: number }
    ): Promise<void> {
        try {
            const cursorRef = ref(
                realtimeDb,
                `${this.COLLABORATIVE_PATH}/sessions/${sessionId}/participants/${userId}/cursor`
            );

            await set(cursorRef, cursor);

        } catch (error) {
            console.error('❌ Error updating cursor:', error);
        }
    }

    /**
     * Listen to collaborative session changes
     */
    static listenToCollaborativeSession(
        sessionId: string,
        callback: (session: CollaborativeSession) => void
    ): () => void {
        const sessionRef = ref(realtimeDb, `${this.COLLABORATIVE_PATH}/sessions/${sessionId}`);

        const unsubscribe = onValue(sessionRef, (snapshot) => {
            const session = snapshot.val() as CollaborativeSession;
            if (session) {
                callback(session);
            }
        });

        return () => off(sessionRef);
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * Get connection state
     */
    static listenToConnectionState(callback: (connected: boolean) => void): () => void {
        const connectedRef = ref(realtimeDb, '.info/connected');

        const unsubscribe = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val() === true;
            callback(connected);
            console.log('🔌 Connection state:', connected ? 'Connected' : 'Disconnected');
        });

        return () => off(connectedRef);
    }

    /**
     * Clean up all user data on disconnect
     */
    static setupDisconnectCleanup(userId: string): void {
        // Remove presence
        const presenceRef = ref(realtimeDb, `${this.PRESENCE_PATH}/${userId}`);
        onDisconnect(presenceRef).update({
            status: 'offline',
            lastSeen: Date.now()
        });

        // Remove typing indicator
        const typingRef = ref(realtimeDb, `${this.TYPING_PATH}/${userId}`);
        onDisconnect(typingRef).remove();

        console.log('✅ Disconnect cleanup configured for user:', userId);
    }
}
