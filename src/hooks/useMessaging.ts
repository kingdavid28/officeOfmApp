import { useState, useEffect, useCallback } from 'react';
import { MessagingService, NotificationService } from '../lib/messaging';
import { Message, Notification } from '../lib/types';

export const useMessages = (organizationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = MessagingService.subscribeToMessages(organizationId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organizationId]);

  const sendMessage = useCallback(async (content: string, senderId: string, senderName: string, type: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    try {
      await MessagingService.sendMessage(content, senderId, senderName, organizationId, type, fileUrl, fileName);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [organizationId]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await MessagingService.editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await MessagingService.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    editMessage,
    deleteMessage
  };
};

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = NotificationService.subscribeToNotifications(userId, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, []);

  const createNotification = useCallback(async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'message' = 'info', actionUrl?: string, metadata?: Record<string, any>) => {
    try {
      await NotificationService.createNotification(userId, title, message, type, actionUrl, metadata);
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  };
};