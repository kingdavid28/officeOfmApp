import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeMessagingService, ChatMessage, GroupChat, MessageNotification, UploadProgress } from '../../lib/realtime-messaging-service';
import { Bell, MessageCircle, Send, X, Edit2, Trash2, Check, Paperclip, Image, File, Download, Users, Plus, Settings, Search, UserPlus, Hash } from 'lucide-react';
import { authService, UserProfile } from '../../lib/auth';

interface MessagingPageProps {
  organizationId?: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ organizationId }) => {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'chats' | 'direct' | 'notifications'>('chats');
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [directChats, setDirectChats] = useState<GroupChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // New chat modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatType, setChatType] = useState<'group' | 'direct'>('group');
  const [newChatName, setNewChatName] = useState('');
  const [newChatDescription, setNewChatDescription] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDirectUser, setSelectedDirectUser] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's chats
  useEffect(() => {
    if (!user?.uid) return;

    const loadChats = async () => {
      try {
        const userChats = await RealtimeMessagingService.getUserChats(user.uid);

        // Separate direct and group chats
        const direct = userChats.filter(chat => chat.type === 'direct');
        const groups = userChats.filter(chat => chat.type === 'group' || chat.type === 'channel');

        setDirectChats(direct);
        setChats(groups);

        // Auto-select first chat if available
        if (userChats.length > 0 && !selectedChat) {
          setSelectedChat(userChats[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load chats:', error);
        setLoading(false);
      }
    };

    loadChats();
  }, [user?.uid]);

  // Load available users when modal opens
  useEffect(() => {
    if (showNewChatModal && availableUsers.length === 0) {
      loadAvailableUsers();
    }
  }, [showNewChatModal]);

  const loadAvailableUsers = async () => {
    if (!user?.uid) return;

    setLoadingUsers(true);
    try {
      const allUsers = await authService.getAllUsers();
      // Filter out current user
      const otherUsers = allUsers.filter(u => u.uid !== user.uid);
      setAvailableUsers(otherUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Listen to messages in selected chat
  useEffect(() => {
    if (!selectedChat?.id) return;

    setMessages([]);

    const unsubscribeMessages = RealtimeMessagingService.listenToMessages(
      selectedChat.id,
      (message) => {
        setMessages(prev => {
          const exists = prev.find(m => m.id === message.id);
          if (exists) {
            return prev.map(m => m.id === message.id ? message : m);
          }
          return [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    );

    const unsubscribeUpdates = RealtimeMessagingService.listenToMessageUpdates(
      selectedChat.id,
      (message) => {
        setMessages(prev => prev.map(m => m.id === message.id ? message : m));
      }
    );

    const unsubscribeTyping = RealtimeMessagingService.listenToTyping(
      selectedChat.id,
      (userId, userName, isTyping) => {
        if (userId === user?.uid) return; // Don't show own typing

        setTypingUsers(prev => {
          if (isTyping) {
            if (!prev.find(u => u.userId === userId)) {
              return [...prev, { userId, userName }];
            }
          } else {
            return prev.filter(u => u.userId !== userId);
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeUpdates();
      unsubscribeTyping();
    };
  }, [selectedChat?.id, user?.uid]);

  // Listen to notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = RealtimeMessagingService.listenToNotifications(
      user.uid,
      (notification) => {
        setNotifications(prev => {
          const exists = prev.find(n => n.id === notification.id);
          if (!exists) {
            return [notification, ...prev];
          }
          return prev;
        });
      }
    );

    // Load unread count
    const loadUnreadCount = async () => {
      const count = await RealtimeMessagingService.getUnreadCount(user.uid);
      setUnreadCount(count);
    };
    loadUnreadCount();

    return () => unsubscribe();
  }, [user?.uid]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Event Handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat) return;

    try {
      await RealtimeMessagingService.sendMessage(
        selectedChat.id,
        user.uid,
        user.displayName || user.email || 'Unknown',
        'staff', // TODO: Get actual user role
        newMessage
      );
      setNewMessage('');

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      await RealtimeMessagingService.setTyping(
        selectedChat.id,
        user.uid,
        user.displayName || user.email || 'Unknown',
        false
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedChat) return;

    try {
      await RealtimeMessagingService.sendFileMessage(
        selectedChat.id,
        user.uid,
        user.displayName || user.email || 'Unknown',
        'staff', // TODO: Get actual user role
        file,
        undefined,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadProgress(null);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
      setUploadProgress(null);
    }
  };

  const handleTyping = () => {
    if (!user || !selectedChat) return;

    // Set typing indicator
    RealtimeMessagingService.setTyping(
      selectedChat.id,
      user.uid,
      user.displayName || user.email || 'Unknown',
      true
    );

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-clear after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      RealtimeMessagingService.setTyping(
        selectedChat.id,
        user.uid,
        user.displayName || user.email || 'Unknown',
        false
      );
    }, 3000);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user || !selectedChat) return;

    try {
      const message = messages.find(m => m.id === messageId);
      const userReaction = message?.reactions?.[user.uid];

      if (userReaction === emoji) {
        // Remove reaction (not implemented in service yet, would need to add)
        // For now, just close picker
      } else {
        await RealtimeMessagingService.addReaction(
          selectedChat.id,
          messageId,
          user.uid,
          emoji
        );
      }
      setShowReactions(null);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleCreateChat = async () => {
    if (!user || creatingChat) return;

    // For direct chat, need exactly one user selected
    if (chatType === 'direct') {
      if (!selectedDirectUser) {
        alert('Please select a person for direct messaging');
        return;
      }

      setCreatingChat(true);
      try {
        const otherUser = availableUsers.find(u => u.uid === selectedDirectUser);
        if (!otherUser) {
          throw new Error('Selected user not found');
        }

        const chatId = await RealtimeMessagingService.createOrGetDirectChat(
          user.uid,
          user.displayName || user.email || 'Unknown',
          'staff', // TODO: Get actual user role
          otherUser.uid,
          otherUser.name,
          otherUser.role
        );

        // Reload chats
        const userChats = await RealtimeMessagingService.getUserChats(user.uid);
        const direct = userChats.filter(chat => chat.type === 'direct');
        const groups = userChats.filter(chat => chat.type === 'group' || chat.type === 'channel');

        setDirectChats(direct);
        setChats(groups);

        // Select the new/existing chat
        const newChat = userChats.find(c => c.id === chatId);
        if (newChat) {
          setSelectedChat(newChat);
          setActiveTab('direct');
        }

        // Close modal and reset form
        setShowNewChatModal(false);
        resetNewChatForm();
        setCreatingChat(false);
      } catch (error) {
        console.error('Failed to create direct chat:', error);
        alert('Failed to create direct chat. Please try again.');
        setCreatingChat(false);
      }
      return;
    }

    // For group chat, need a name
    if (!newChatName.trim()) {
      alert('Please enter a chat name');
      return;
    }

    setCreatingChat(true);
    try {
      const chatId = await RealtimeMessagingService.createGroupChat(
        newChatName.trim(),
        user.uid,
        user.displayName || user.email || 'Unknown',
        'staff', // TODO: Get actual user role
        selectedUsers, // Pass selected user IDs
        'group',
        {
          allowFileSharing: true,
          maxFileSize: 10,
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
          isPrivate: false,
          requireApproval: false
        }
      );

      // Reload chats
      const userChats = await RealtimeMessagingService.getUserChats(user.uid);
      const direct = userChats.filter(chat => chat.type === 'direct');
      const groups = userChats.filter(chat => chat.type === 'group' || chat.type === 'channel');

      setDirectChats(direct);
      setChats(groups);

      // Select the new chat
      const newChat = userChats.find(c => c.id === chatId);
      if (newChat) {
        setSelectedChat(newChat);
        setActiveTab('chats');
      }

      // Close modal and reset form
      setShowNewChatModal(false);
      resetNewChatForm();
      setCreatingChat(false);
    } catch (error) {
      console.error('Failed to create chat:', error);
      alert('Failed to create chat. Please try again.');
      setCreatingChat(false);
    }
  };

  const resetNewChatForm = () => {
    setChatType('group');
    setNewChatName('');
    setNewChatDescription('');
    setSelectedUsers([]);
    setSelectedDirectUser('');
    setUserSearchTerm('');
  };

  const toggleUserSelection = (userId: string) => {
    if (chatType === 'direct') {
      setSelectedDirectUser(prev => prev === userId ? '' : userId);
    } else {
      setSelectedUsers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const getSelectedUserInfo = () => {
    if (chatType === 'direct' && selectedDirectUser) {
      const user = availableUsers.find(u => u.uid === selectedDirectUser);
      return user ? user.name : '';
    }
    return '';
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?') || !user || !selectedChat) return;

    try {
      await RealtimeMessagingService.deleteMessage(selectedChat.id, messageId, user.uid);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (!user || !selectedChat) return;

    try {
      await RealtimeMessagingService.markMessageAsRead(selectedChat.id, messageId, user.uid);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = async (notification: MessageNotification) => {
    if (!notification.read && user) {
      await RealtimeMessagingService.markNotificationRead(user.uid, notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Find and select the chat
    const allChats = [...chats, ...directChats];
    const chat = allChats.find(c => c.id === notification.chatId);
    if (chat) {
      setSelectedChat(chat);
      setActiveTab(chat.type === 'direct' ? 'direct' : 'chats');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
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
      case 'new_message': return '💬';
      case 'mention': return '📢';
      case 'reply': return '↩️';
      case 'reaction': return '😊';
      case 'file_shared': return '📎';
      default: return 'ℹ️';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image size={16} className="inline" />;
    }
    return <File size={16} className="inline" />;
  };

  const renderReactions = (message: ChatMessage) => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) return null;

    const reactionCounts: { [emoji: string]: number } = {};
    Object.values(message.reactions).forEach(emoji => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => handleReaction(message.id, emoji)}
            className={`text-xs px-2 py-0.5 rounded-full border ${message.reactions?.[user?.uid || ''] === emoji
              ? 'bg-blue-100 border-blue-300'
              : 'bg-gray-100 border-gray-300'
              } hover:bg-blue-50`}
          >
            {emoji} {count}
          </button>
        ))}
      </div>
    );
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  const getStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  const getChatAvatarColor = (chat: GroupChat) => {
    if (chat.type === 'direct') return 'bg-green-500';
    if (chat.type === 'channel') return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const getChatIcon = (chat: GroupChat) => {
    if (chat.type === 'direct') return <MessageCircle size={16} className="mr-1" />;
    if (chat.type === 'channel') return <Hash size={16} className="mr-1" />;
    return <Users size={16} className="mr-1" />;
  };

  const getOtherUserInDirectChat = (chat: GroupChat) => {
    const otherUserId = Object.keys(chat.participants).find(id => id !== user?.uid);
    return otherUserId ? chat.participants[otherUserId] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Messages</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 hover:bg-blue-800 rounded-full transition-colors"
              title="New Chat"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex space-x-1 bg-blue-800/20 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chats'
                ? 'bg-blue-700 shadow-sm'
                : 'hover:bg-blue-800/30'
                }`}
            >
              <Users size={16} />
              <span>Groups</span>
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'direct'
                ? 'bg-green-700 shadow-sm'
                : 'hover:bg-blue-800/30'
                }`}
            >
              <MessageCircle size={16} />
              <span>Direct</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-sm font-medium relative transition-all ${activeTab === 'notifications'
                ? 'bg-gray-700 shadow-sm'
                : 'hover:bg-blue-800/30'
                }`}
            >
              <Bell size={16} />
              <span>Alerts</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Chat List or Notifications */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' ? (
            chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="bg-blue-50 rounded-full p-6 mb-4">
                  <Users size={48} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No group chats yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a group to collaborate with your team
                </p>
                <button
                  onClick={() => {
                    setChatType('group');
                    setShowNewChatModal(true);
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>Create Group</span>
                </button>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${selectedChat?.id === chat.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-blue-50/50'
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${getChatAvatarColor(chat)} rounded-full flex items-center justify-center text-white font-semibold`}>
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {chat.name}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.type === 'channel' && '#'} {chat.lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        {getChatIcon(chat)}
                        {Object.keys(chat.participants).length} {chat.type === 'channel' ? 'members' : 'members'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : activeTab === 'direct' ? (
            directChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="bg-green-50 rounded-full p-6 mb-4">
                  <MessageCircle size={48} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No direct messages yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start a private conversation with a team member
                </p>
                <button
                  onClick={() => {
                    setChatType('direct');
                    setShowNewChatModal(true);
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>New Message</span>
                </button>
              </div>
            ) : (
              directChats.map((chat) => {
                const otherUser = getOtherUserInDirectChat(chat);
                const displayName = otherUser?.name || chat.name;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${selectedChat?.id === chat.id
                      ? 'bg-green-50 border-l-4 border-l-green-500'
                      : 'hover:bg-green-50/50'
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {displayName}
                          </h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <MessageCircle size={12} className="mr-1" />
                          Direct message
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="bg-gray-50 rounded-full p-6 mb-4">
                  <Bell size={48} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-sm text-gray-600">
                  You have no new notifications
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${!notification.read
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.timestamp)}
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
            )
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${getChatAvatarColor(selectedChat)} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {selectedChat.type === 'direct'
                      ? getOtherUserInDirectChat(selectedChat)?.name?.charAt(0).toUpperCase() || selectedChat.name.charAt(0).toUpperCase()
                      : selectedChat.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedChat.type === 'direct'
                        ? getOtherUserInDirectChat(selectedChat)?.name || selectedChat.name
                        : selectedChat.name
                      }
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {selectedChat.type === 'direct'
                          ? 'Direct message'
                          : `${Object.keys(selectedChat.participants).length} members`
                        }
                      </span>
                      {selectedChat.type === 'channel' && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Channel
                        </span>
                      )}
                      {selectedChat.type === 'direct' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Chat Settings"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className={`w-24 h-24 ${getChatAvatarColor(selectedChat)} rounded-full flex items-center justify-center text-white mb-4`}>
                    {selectedChat.type === 'direct' ? (
                      <MessageCircle size={48} />
                    ) : (
                      <Users size={48} />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedChat.type === 'direct'
                      ? `Start chatting with ${getOtherUserInDirectChat(selectedChat)?.name || 'this person'}`
                      : `Welcome to ${selectedChat.name}`
                    }
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    {selectedChat.type === 'direct'
                      ? 'Send your first message to start the conversation.'
                      : 'This is the beginning of your group chat. Send a message to get started!'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${message.senderId === user?.uid
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          } ${message.type === 'system' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''
                          }`}
                      >
                        {message.senderId !== user?.uid && message.type !== 'system' && (
                          <div className="text-xs font-semibold mb-1 text-blue-600">
                            {message.senderName}
                          </div>
                        )}

                        {message.type === 'system' ? (
                          <div className="text-sm italic text-gray-600 flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            {message.content}
                          </div>
                        ) : (
                          <>
                            <div className="text-sm">{message.content}</div>

                            {/* File Attachment */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment) => (
                                  <div key={attachment.id}>
                                    {attachment.type === 'image' ? (
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                        onClick={() => window.open(attachment.url, '_blank')}
                                      />
                                    ) : (
                                      <div className={`p-3 rounded-lg flex items-center justify-between ${message.senderId === user?.uid
                                        ? 'bg-blue-500/10'
                                        : 'bg-gray-50'
                                        }`}>
                                        <div className="flex items-center space-x-3">
                                          <div className={`p-2 rounded ${message.senderId === user?.uid
                                            ? 'bg-blue-500/20'
                                            : 'bg-gray-200'
                                            }`}>
                                            {getFileIcon(attachment.name)}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium truncate max-w-[150px]">
                                              {attachment.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {Math.round(attachment.size / 1024)}KB
                                            </span>
                                          </div>
                                        </div>
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`p-2 rounded hover:bg-blue-100 transition-colors ${message.senderId === user?.uid
                                            ? 'hover:bg-blue-500/20'
                                            : 'hover:bg-gray-200'
                                            }`}
                                          download
                                        >
                                          <Download size={16} />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {message.editedAt && (
                              <div className="text-xs opacity-75 mt-1 flex items-center">
                                <Edit2 size={10} className="mr-1" />
                                edited
                              </div>
                            )}

                            {/* Reactions */}
                            {renderReactions(message)}
                          </>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs opacity-75">
                            {formatTime(message.timestamp)}
                          </div>

                          {message.type !== 'system' && (
                            <div className="flex items-center space-x-1 ml-2">
                              {/* Status Icon */}
                              {message.senderId === user?.uid && (
                                <span className="text-xs opacity-75">
                                  {getStatusIcon(message.status)}
                                </span>
                              )}

                              {/* Reaction Button */}
                              <button
                                onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                                className="text-xs opacity-75 hover:opacity-100 relative transition-opacity"
                                title="Add reaction"
                              >
                                <span className="p-1 hover:bg-gray-200 rounded">😊</span>
                                {showReactions === message.id && (
                                  <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex space-x-1 z-10">
                                    {reactionEmojis.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReaction(message.id, emoji);
                                        }}
                                        className="text-lg hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </button>

                              {/* Delete for own messages */}
                              {message.senderId === user?.uid && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-xs opacity-75 hover:opacity-100 transition-opacity"
                                  title="Delete message"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicators */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm italic flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span>
                          {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {/* Upload Progress */}
              {uploadProgress && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {uploadProgress.status === 'uploading' && '📤 Uploading...'}
                      {uploadProgress.status === 'completed' && '✅ Upload Complete'}
                      {uploadProgress.status === 'error' && '❌ Upload Failed'}
                    </span>
                    <span className="text-sm text-blue-700">
                      {Math.round(uploadProgress.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-700 mt-1 truncate">
                    {uploadProgress.fileName}
                  </div>
                  {uploadProgress.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {uploadProgress.error}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex space-x-2">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />

                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Upload file or image"
                  disabled={!!uploadProgress}
                >
                  <Paperclip size={20} />
                </button>

                {/* Message Input */}
                <input
                  id="new-message-input"
                  name="new-message-input"
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder={`Message ${selectedChat.type === 'direct'
                    ? getOtherUserInDirectChat(selectedChat)?.name || 'user'
                    : selectedChat.name
                    }...`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  autoComplete="off"
                  disabled={!!uploadProgress}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !!uploadProgress}
                  className={`px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all shadow-sm ${selectedChat.type === 'direct' ? 'bg-green-600' : 'bg-blue-600'
                    } text-white`}
                >
                  <Send size={18} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center px-6">
              <div className="bg-white rounded-full p-8 shadow-lg mb-6 inline-block">
                <MessageCircle size={80} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Messages</h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Select a conversation from the sidebar to start messaging, or create a new chat to connect with your team
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => {
                    setChatType('group');
                    setShowNewChatModal(true);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <Users size={20} />
                  <span>Create Group</span>
                </button>
                <button
                  onClick={() => {
                    setChatType('direct');
                    setShowNewChatModal(true);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <MessageCircle size={20} />
                  <span>New Message</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create New Chat</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Start a {chatType === 'direct' ? 'private conversation' : 'group chat'} with your team
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  resetNewChatForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Chat Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setChatType('group');
                      setSelectedDirectUser('');
                    }}
                    className={`p-4 border rounded-lg text-center transition-all ${chatType === 'group'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Users size={24} className={chatType === 'group' ? 'text-blue-600' : 'text-gray-500'} />
                      <div>
                        <div className="font-medium text-gray-900">Group Chat</div>
                        <div className="text-xs text-gray-500">Multiple people</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setChatType('direct');
                      setSelectedUsers([]);
                      setNewChatName('');
                    }}
                    className={`p-4 border rounded-lg text-center transition-all ${chatType === 'direct'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <MessageCircle size={24} className={chatType === 'direct' ? 'text-green-600' : 'text-gray-500'} />
                      <div>
                        <div className="font-medium text-gray-900">Direct Message</div>
                        <div className="text-xs text-gray-500">One person</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Chat Name (Only for group chats) */}
              {chatType === 'group' && (
                <div>
                  <label htmlFor="chat-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Chat Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="chat-name"
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="e.g., Project Team, Finance Discussion..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}

              {/* Chat Description (Only for group chats) */}
              {chatType === 'group' && (
                <div>
                  <label htmlFor="chat-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    id="chat-description"
                    value={newChatDescription}
                    onChange={(e) => setNewChatDescription(e.target.value)}
                    placeholder="What is this chat about?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}

              {/* Add People */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chatType === 'direct' ? 'Select Person' : 'Add People'}
                  {chatType === 'direct' && <span className="text-red-500"> *</span>}
                  {chatType === 'group' && (
                    <span className="text-gray-400 text-xs"> ({selectedUsers.length} selected)</span>
                  )}
                </label>

                {/* Search Users */}
                <div className="relative mb-3">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Selected User Display */}
                {chatType === 'direct' && selectedDirectUser && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {availableUsers.find(u => u.uid === selectedDirectUser)?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {availableUsers.find(u => u.uid === selectedDirectUser)?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {availableUsers.find(u => u.uid === selectedDirectUser)?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedDirectUser('')}
                        className="p-1 hover:bg-green-100 rounded-full transition-colors"
                      >
                        <X size={16} className="text-green-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Users Pills (Group only) */}
                {chatType === 'group' && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    {selectedUsers.map(userId => {
                      const user = availableUsers.find(u => u.uid === userId);
                      return user ? (
                        <div
                          key={userId}
                          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                        >
                          <span>{user.name}</span>
                          <button
                            onClick={() => toggleUserSelection(userId)}
                            className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* User List */}
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">
                        {userSearchTerm ? 'No users found' : 'No users available'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredUsers.map((user) => {
                        const isSelected = chatType === 'direct'
                          ? selectedDirectUser === user.uid
                          : selectedUsers.includes(user.uid);
                        const bgColor = chatType === 'direct' && isSelected ? 'bg-green-50' : isSelected ? 'bg-blue-50' : '';
                        const hoverColor = chatType === 'direct' && isSelected ? 'hover:bg-green-100' : isSelected ? 'hover:bg-blue-100' : 'hover:bg-gray-50';

                        return (
                          <div
                            key={user.uid}
                            onClick={() => toggleUserSelection(user.uid)}
                            className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors ${bgColor} ${hoverColor}`}
                          >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${isSelected
                              ? chatType === 'direct' ? 'bg-green-600' : 'bg-blue-600'
                              : 'bg-gray-400'
                              }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>

                            {/* Role Badge */}
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {user.role.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Selection Indicator */}
                            <div className="flex-shrink-0">
                              {chatType === 'direct' ? (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
                                  ? 'bg-green-600 border-green-600'
                                  : 'border-gray-300'
                                  }`}>
                                  {isSelected && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                              ) : (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300'
                                  }`}>
                                  {isSelected && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {chatType === 'group' && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: You can add more people to the chat later
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {chatType === 'direct' && selectedDirectUser ? (
                  <span className="flex items-center">
                    <MessageCircle size={16} className="mr-2 text-green-600" />
                    Message <strong className="mx-1">{getSelectedUserInfo()}</strong>
                  </span>
                ) : chatType === 'group' && selectedUsers.length > 0 ? (
                  <span>
                    Creating group with {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}
                  </span>
                ) : null}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    resetNewChatForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={
                    creatingChat ||
                    (chatType === 'group' && !newChatName.trim()) ||
                    (chatType === 'direct' && !selectedDirectUser)
                  }
                  className={`px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors ${chatType === 'direct' ? 'bg-green-600' : 'bg-blue-600'
                    } text-white`}
                >
                  {creatingChat ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      {chatType === 'direct' ? (
                        <>
                          <MessageCircle size={18} />
                          <span>Start Chat</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          <span>Create Group</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;