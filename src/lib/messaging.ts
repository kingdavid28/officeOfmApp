import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  where,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Notification } from './types';

export class MessagingService {
  // Send a message
  static async sendMessage(content: string, senderId: string, senderName: string, organizationId: string, type: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) {
    try {
      const messageData = {
        content,
        senderId,
        senderName,
        organizationId,
        timestamp: serverTimestamp(),
        type,
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        edited: false
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Create notification for organization members
      await this.createMessageNotification(senderId, senderName, content, organizationId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Listen to real-time messages
  static subscribeToMessages(organizationId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('organizationId', '==', organizationId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as Message);
      });
      callback(messages.reverse());
    });
  }

  // Edit message
  static async editMessage(messageId: string, newContent: string) {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Delete message
  static async deleteMessage(messageId: string) {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Create notification for new messages
  private static async createMessageNotification(senderId: string, senderName: string, content: string, organizationId: string) {
    try {
      // Get organization users (simplified - in real app, query users by organizationId)
      const notificationData = {
        title: `New message from ${senderName}`,
        message: content.length > 50 ? content.substring(0, 50) + '...' : content,
        type: 'message',
        read: false,
        createdAt: serverTimestamp(),
        metadata: {
          senderId,
          organizationId
        }
      };

      // In a real implementation, you'd query users and create notifications for each
      // For now, this creates a template notification
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  }
}

export class NotificationService {
  // Create notification
  static async createNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'message' = 'info', actionUrl?: string, metadata?: Record<string, any>) {
    try {
      const notificationData = {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp(),
        ...(actionUrl && { actionUrl }),
        ...(metadata && { metadata })
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Listen to user notifications
  static subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Notification);
      });
      callback(notifications);
    });
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}