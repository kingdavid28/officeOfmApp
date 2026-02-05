import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { AISearchInterface } from './AISearchInterface';
import { AIChatInterface } from './AIChatInterface';
import {
    AIChatService,
    SearchResult
} from '../../lib/ai-chat-service';
import {
    MLDocumentService,
    SimilarityResult
} from '../../lib/ml-document-service';
import {
    Brain,
    Search,
    MessageCircle,
    TrendingUp,
    FileText,
    BarChart3,
    Zap,
    Target,
    Clock,
    Shield,
    Lightbulb,
    Activity
} from 'lucide-react';

interface AIDashboardProps {
    currentUserId: string;
    currentUserName: string;
    userRole: 'staff' | 'admin' | 'super_admin';
}

export const AIDashboard: React.FC<AIDashboardProps> = ({
    currentUserId,
    currentUserName,
    userRole
}) => {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    const [aiStats, setAiStats] = useState({
        totalDocuments: 0,
        searchAccuracy: 0,
        responseTime: 0,
        userSatisfaction: 0
    });
    const [showChat, setShowChat] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [currentUserId, userRole]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load suggested queries based on user role
            const suggestions = AIChatService.generateSuggestedQueries(userRole);
            setSuggestedQueries(suggestions);

            // Mock AI statistics (in production, fetch from analytics)
            setAiStats({
                totalDocuments: 1247,
                searchAccuracy: 94.2,
                responseTime: 1.3,
                userSatisfaction: 4.7
            });

            // Mock recent searches (in production, fetch from user history)
            setRecentSearches([
                'food expenses last month',
                'office supplies budget',
                'monthly financial report',
                'allowance payments'
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchResult = (result: SearchResult) => {
        console.log('Search result clicked:', result);
        // Handle result click - could open document viewer, etc.
    };

    const getRoleCapabilities = () => {
        const capabilities = {
            staff: [
                'Search receipts and transactions up to ₱5,000',
                'Ask questions about food and office supplies',
                'View personal transaction history',
                'Get help with expense categorization'
            ],
            admin: [
                'Search all financial documents and reports',
                'Generate monthly and quarterly summaries',
                'Access comprehensive transaction data',
                'Analyze spending patterns and trends',
                'Manage staff financial queries'
            ],
            super_admin: [
                'Full access to all financial data',
                'Generate comprehensive financial reports',
                'Analyze organization-wide spending patterns',
                'Access audit trails and compliance data',
                'Manage system-wide financial policies',
                'Advanced analytics and forecasting'
            ]
        };

        return capabilities[userRole] || [];
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-8 w-8 mb-4" />
                                <Skeleton className="h-6 w-24 mb-2" />
                                <Skeleton className="h-4 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Brain className="w-8 h-8 text-blue-600" />
                        AI Financial Assistant
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Intelligent search and chat for your financial documents and reports
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {userRole.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Button
                        onClick={() => setShowChat(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open AI Chat
                    </Button>
                </div>
            </div>

            {/* AI Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Indexed Documents</p>
                                <p className="text-2xl font-bold text-gray-900">{aiStats.totalDocuments.toLocaleString()}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Search Accuracy</p>
                                <p className="text-2xl font-bold text-green-600">{aiStats.searchAccuracy}%</p>
                            </div>
                            <Target className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                                <p className="text-2xl font-bold text-orange-600">{aiStats.responseTime}s</p>
                            </div>
                            <Clock className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                                <p className="text-2xl font-bold text-purple-600">{aiStats.userSatisfaction}/5</p>
                            </div>
                            <Activity className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Search Interface */}
                <div className="lg:col-span-2">
                    <AISearchInterface
                        currentUserId={currentUserId}
                        userRole={userRole}
                        onResultClick={handleSearchResult}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Role Capabilities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Your AI Capabilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {getRoleCapabilities().map((capability, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                        <p className="text-sm text-gray-700">{capability}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setShowChat(true)}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Ask AI Assistant
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    Advanced Search
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Generate Report
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Analyze Trends
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Searches */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Recent Searches
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {recentSearches.map((search, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        className="w-full justify-start text-left h-auto p-2"
                                        onClick={() => {
                                            // Trigger search with this query
                                            console.log('Repeat search:', search);
                                        }}
                                    >
                                        <Search className="w-3 h-3 mr-2 flex-shrink-0" />
                                        <span className="text-sm truncate">{search}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5" />
                                AI Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                    <p>Use natural language like "Show me food expenses last month"</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                    <p>Ask specific questions about amounts, dates, or categories</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                    <p>The AI understands context from previous conversations</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                    <p>Use filters to narrow down search results</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI Chat Modal */}
            {showChat && (
                <AIChatInterface
                    currentUserId={currentUserId}
                    userName={currentUserName}
                    userRole={userRole}
                    isOpen={showChat}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
};