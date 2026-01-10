import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMessages, useNotifications } from '../../hooks/useMessaging';
import { Message, Notification } from '../../lib/types';
import { Bell, MessageCircle, Send, X, Edit2, Trash2, Check } from 'lucide-react';

interface MessagingPageProps {
  organizationId: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ organizationId }) => {
  const { user } = useAuth();
  const { messages, loading: messagesLoading, sendMessage, editMessage, deleteMessage } = useMessages(organizationId);
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(user?.uid || '');
  
  const [activeTab, setActiveTab] = useState<'chat' | 'notifications'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(newMessage, user.uid, user.displayName || user.email || 'Unknown');
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      await editMessage(messageId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'message': return '💬';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-md flex flex-col">
      {/* Header with Tabs */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Messages & Notifications</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3 py-1 rounded ${
                activeTab === 'chat' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <MessageCircle size={16} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center space-x-2 px-3 py-1 rounded relative ${
                activeTab === 'notifications' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Bell size={16} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.uid
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.senderId !== user?.uid && (
                        <div className="text-xs font-semibold mb-1">
                          {message.senderName}
                        </div>
                      )}
                      
                      {editingId === message.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded text-gray-800"
                            onKeyPress={(e) => e.key === 'Enter' && handleEditMessage(message.id)}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditMessage(message.id)}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded flex items-center space-x-1"
                            >
                              <Check size={12} />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm">{message.content}</div>
                          {message.edited && (
                            <div className="text-xs opacity-75 mt-1">(edited)</div>
                          )}
                        </>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </div>
                        
                        {message.senderId === user?.uid && editingId !== message.id && (
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={() => {
                                setEditingId(message.id);
                                setEditContent(message.content);
                              }}
                              className="text-xs opacity-75 hover:opacity-100"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-xs opacity-75 hover:opacity-100"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Notifications Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Your Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Check size={16} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notificationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;