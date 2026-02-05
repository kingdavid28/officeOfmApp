import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    AIChatService,
    ChatMessage,
    AISearchQuery
} from '../../lib/ai-chat-service';
import { ComprehensiveSearchResult } from '../../lib/comprehensive-ai-search';
import {
    AIRealtimeService,
    AIRealtimeMessage,
    UserPresence,
    AITypingIndicator
} from '../../lib/ai-realtime-service';
import {
    MessageCircle,
    Send,
    Bot,
    User,
    FileText,
    Receipt,
    BarChart3,
    Shield,
    Lightbulb,
    X,
    Wifi,
    WifiOff
} from 'lucide-react';

interface AIChatInterfaceProps {
    currentUserId: string;
    userName: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    isOpen?: boolean;
    onClose?: () => void;
}

// Separate component for the chat input to prevent re-renders
const ChatInput = React.memo(({
    inputValue,
    onInputChange,
    onSendMessage,
    isLoading,
    suggestedQueries
}: {
    inputValue: string;
    onInputChange: (value: string) => void;
    onSendMessage: (query?: string) => void;
    isLoading: boolean;
    suggestedQueries: string[];
}) => {
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    }, [onSendMessage]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(e.target.value);
    }, [onInputChange]);

    const handleSendClick = useCallback(() => {
        onSendMessage();
    }, [onSendMessage]);

    return (
        <div className="border-t p-4">
            <div className="flex space-x-2">
                <Input
                    id="ai-chat-input"
                    name="ai-chat-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about financial documents, receipts, or reports..."
                    disabled={isLoading}
                    className="flex-1"
                    autoComplete="off"
                />
                <Button
                    onClick={handleSendClick}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>

            {inputValue === '' && suggestedQueries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {suggestedQueries.slice(0, 4).map((query, index) => (
                        <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => onSendMessage(query)}
                            className="text-xs h-6 px-2"
                        >
                            {query}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
    currentUserId,
    userName,
    userRole,
    isOpen = false,
    onClose
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, AITypingIndicator>>(new Map());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadChatHistory();
        loadSuggestedQueries();
        setupRealtimeFeatures();

        return () => {
            cleanupRealtimeFeatures();
        };
    }, [currentUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatHistory = async () => {
        try {
            const history = await AIChatService.getChatHistory(currentUserId);
            setMessages(history);
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const loadSuggestedQueries = () => {
        const suggestions = AIChatService.generateSuggestedQueries(userRole);
        setSuggestedQueries(suggestions);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const setupRealtimeFeatures = () => {
        // Set user presence as online
        AIRealtimeService.setPresence(currentUserId, userName, userRole, 'online', 'AI Chat');

        // Setup disconnect cleanup
        AIRealtimeService.setupDisconnectCleanup(currentUserId);

        // Listen to connection state
        const unsubscribeConnection = AIRealtimeService.listenToConnectionState((connected) => {
            setIsConnected(connected);
            if (connected) {
                AIRealtimeService.setPresence(currentUserId, userName, userRole, 'online', 'AI Chat');
            }
        });

        // Listen to real-time messages
        const unsubscribeMessages = AIRealtimeService.listenToMessages((message) => {
            // Convert realtime message to chat message format
            if (message.userId !== currentUserId) {
                const chatMessage: ChatMessage = {
                    id: message.id,
                    content: message.message,
                    role: message.type === 'user' ? 'user' : 'assistant',
                    timestamp: new Date(message.timestamp),
                    userId: message.userId,
                    userRole: message.userRole,
                    metadata: message.metadata
                };
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === chatMessage.id)) return prev;
                    return [...prev, chatMessage];
                });
            }
        });

        // Listen to presence changes
        const unsubscribePresence = AIRealtimeService.listenToPresence((userId, presence) => {
            setOnlineUsers(prev => {
                const filtered = prev.filter(u => u.userId !== userId);
                if (presence.status === 'online') {
                    return [...filtered, presence];
                }
                return filtered;
            });
        });

        // Listen to typing indicators
        const unsubscribeTyping = AIRealtimeService.listenToTyping((userId, indicator) => {
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (indicator && userId !== currentUserId) {
                    newMap.set(userId, indicator);
                } else {
                    newMap.delete(userId);
                }
                return newMap;
            });
        });

        // Store cleanup functions
        (window as any).__realtimeCleanup = {
            unsubscribeConnection,
            unsubscribeMessages,
            unsubscribePresence,
            unsubscribeTyping
        };
    };

    const cleanupRealtimeFeatures = () => {
        // Set user presence as offline
        AIRealtimeService.setPresence(currentUserId, userName, userRole, 'offline');

        // Call cleanup functions
        const cleanup = (window as any).__realtimeCleanup;
        if (cleanup) {
            cleanup.unsubscribeConnection?.();
            cleanup.unsubscribeMessages?.();
            cleanup.unsubscribePresence?.();
            cleanup.unsubscribeTyping?.();
            delete (window as any).__realtimeCleanup;
        }
    };

    const handleInputChange = useCallback((value: string) => {
        setInputValue(value);

        // Send typing indicator
        if (value.trim()) {
            AIRealtimeService.setTyping(currentUserId, userName, true);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                AIRealtimeService.setTyping(currentUserId, userName, false);
            }, 3000);
        } else {
            AIRealtimeService.setTyping(currentUserId, userName, false);
        }
    }, [currentUserId, userName]);

    const handleSendMessage = useCallback(async (query?: string) => {
        const messageText = query || inputValue.trim();
        if (!messageText || isLoading) return;

        setIsLoading(true);
        setInputValue('');

        // Stop typing indicator
        AIRealtimeService.setTyping(currentUserId, userName, false);

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}_user`,
            content: messageText,
            role: 'user',
            timestamp: new Date(),
            userId: currentUserId,
            userRole
        };

        setMessages(prev => [...prev, userMessage]);

        try {
            // Send message to realtime database
            const messageId = await AIRealtimeService.sendMessage(
                currentUserId,
                userName,
                userRole,
                messageText,
                'user'
            );

            const searchQuery: AISearchQuery = {
                query: messageText,
                userRole,
                userId: currentUserId,
                limit: 10
            };

            const searchResults = await AIChatService.searchDocuments(searchQuery);
            const aiResponse = await AIChatService.generateResponse(
                messageText,
                searchResults,
                userRole,
                messages
            );

            const assistantMessage: ChatMessage = {
                id: `msg_${Date.now()}_assistant`,
                content: aiResponse.answer,
                role: 'assistant',
                timestamp: new Date(),
                userId: 'ai_assistant',
                userRole: 'super_admin',
                metadata: {
                    searchResults: aiResponse.sources,
                    confidence: aiResponse.confidence,
                    sources: aiResponse.sources.map(s => s.title)
                }
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Send AI response to realtime database
            await AIRealtimeService.sendMessage(
                'ai_assistant',
                'OFM AI Assistant',
                'super_admin',
                aiResponse.answer,
                'ai'
            );

            // Update message status
            await AIRealtimeService.updateMessageStatus(messageId, 'delivered', {
                processingTime: Date.now() - userMessage.timestamp.getTime(),
                confidence: aiResponse.confidence,
                sources: aiResponse.sources.map(s => s.title)
            });

            await AIChatService.saveChatMessage(userMessage);
            await AIChatService.saveChatMessage(assistantMessage);

        } catch (error) {
            console.error('Error processing message:', error);

            const errorMessage: ChatMessage = {
                id: `msg_${Date.now()}_error`,
                content: 'I apologize, but I encountered an error while processing your request. Please try again.',
                role: 'assistant',
                timestamp: new Date(),
                userId: 'ai_assistant',
                userRole: 'super_admin'
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, currentUserId, userName, userRole, messages]);

    const getMessageIcon = useMemo(() => (role: string) => {
        switch (role) {
            case 'user':
                return <User className="w-4 h-4" />;
            case 'assistant':
                return <Bot className="w-4 h-4" />;
            default:
                return <MessageCircle className="w-4 h-4" />;
        }
    }, []);

    const getSourceIcon = useMemo(() => (type: string) => {
        switch (type) {
            case 'receipt':
                return <Receipt className="w-4 h-4" />;
            case 'financial_report':
                return <BarChart3 className="w-4 h-4" />;
            case 'transaction':
                return <FileText className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    }, []);

    const formatCurrency = useMemo(() => (amount: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    }, []);

    const chatContent = useMemo(() => (
        <div className="flex flex-col h-[70vh] sm:h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">OFM AI Assistant</h3>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                            {isConnected ? (
                                <>
                                    <Wifi className="w-3 h-3 text-green-500" />
                                    <span>Connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3 h-3 text-red-500" />
                                    <span>Disconnected</span>
                                </>
                            )}
                            {onlineUsers.length > 1 && (
                                <span className="ml-2">• {onlineUsers.length} online</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <Badge variant="outline" className="text-xs px-2 py-1 sm:px-3">
                        <Shield className="w-3 h-3 mr-1 sm:mr-1.5" />
                        <span className="hidden sm:inline">{userRole.replace('_', ' ').toUpperCase()}</span>
                        <span className="sm:hidden">{userRole.split('_')[0].toUpperCase()}</span>
                    </Badge>
                    {isOpen && onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 hover:bg-gray-200"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                        <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Welcome to OFM AI Assistant</h4>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                            I can help you search financial documents, receipts, and reports.
                            Ask me anything about your financial data!
                        </p>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Try asking:</p>
                            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center px-4">
                                {suggestedQueries.slice(0, 3).map((query, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendMessage(query)}
                                        className="text-xs"
                                    >
                                        <Lightbulb className="w-3 h-3 mr-1" />
                                        {query}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            <div className="flex items-start space-x-2">
                                <div className={`mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {getMessageIcon(message.role)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">{message.content}</p>

                                    {message.role === 'assistant' && message.metadata?.searchResults && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-gray-600">Sources:</p>
                                            {message.metadata.searchResults.slice(0, 3).map((result: ComprehensiveSearchResult) => (
                                                <div
                                                    key={result.id}
                                                    className="bg-white rounded p-2 border text-xs"
                                                >
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        {getSourceIcon(result.type)}
                                                        <span className="font-medium">{result.title}</span>
                                                        {result.amount && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {formatCurrency(result.amount)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 line-clamp-2">{result.content}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-gray-500">
                                                            {result.date?.toLocaleDateString()}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {result.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {message.timestamp.toLocaleTimeString()}
                                        </span>
                                        {message.metadata?.confidence && (
                                            <Badge variant="outline" className="text-xs">
                                                {Math.round(message.metadata.confidence * 100)}% confident
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                            <div className="flex items-center space-x-2">
                                <Bot className="w-4 h-4 text-gray-500" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Typing Indicators */}
                {Array.from(typingUsers.values()).map((indicator) => (
                    <div key={indicator.userId} className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                    {indicator.userName} is typing...
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Component */}
            <ChatInput
                inputValue={inputValue}
                onInputChange={handleInputChange}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                suggestedQueries={suggestedQueries}
            />
        </div>
    ), [messages, inputValue, isLoading, suggestedQueries, userRole, isOpen, onClose, isConnected, onlineUsers, typingUsers, handleSendMessage, handleInputChange, getMessageIcon, getSourceIcon, formatCurrency]);

    if (isOpen && onClose) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 gap-0 [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>AI Chat Assistant</DialogTitle>
                        <DialogDescription>
                            Chat with the AI assistant to search financial documents and get answers to your questions.
                        </DialogDescription>
                    </DialogHeader>
                    {chatContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 z-50">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 gap-0 [&>button]:hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>AI Chat Assistant</DialogTitle>
                    <DialogDescription>
                        Chat with the AI assistant to search financial documents and get answers to your questions.
                    </DialogDescription>
                </DialogHeader>
                {chatContent}
            </DialogContent>
        </Dialog>
    );
};

export const FloatingChatButton: React.FC<{
    currentUserId: string;
    userName: string;
    userRole: 'staff' | 'admin' | 'super_admin';
}> = (props) => {
    return <AIChatInterface {...props} />;
};