// Main Messaging Interface Component
// Features: Chat list, message view, file upload, notifications
// Best Practices: Performance optimization, accessibility, responsive design

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeMessagingService, GroupChat, ChatMessage, MessageNotification } from '../../../lib/realtime-messaging-service';
import { UserRole } from '../../../lib/friary-types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
    MessageCircle,
    Send,
    Paperclip,
    Image as ImageIcon,
    Users,
    Search,
    MoreVertical,
    X,
    Check,
    CheckCheck,
    Clock
} from 'lucide-react';
import { ChatList } from './ChatList';
import { MessageView } from './MessageView';
import { FileUploadModal } from './FileUploadModal';
import { GroupManagementModal } from './GroupManagementModal';
import { NotificationToast } from './NotificationToast';
import { FilePreviewModal } from './FilePreviewModal';

interface MessagingInterfaceProps {
    currentUserId: string;
    userName: string;
    userRole: UserRole;
}

export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
    currentUserId,
    userName,
    userRole
}) => {
    // State management
    const [chats, setChats] = useState<GroupChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<MessageNotification[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
    
    // Modal states
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showGroupManagement, setShowGroupManagement] = useState(false);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
    
    // Typing state
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load user's chats on mount
    useEffect(() => {
        loadChats();
        setupNotificationListener();
    }, [