import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    AIChatService,
    SearchResult,
    AISearchQuery
} from '../../lib/ai-chat-service';
import {
    Search,
    Filter,
    FileText,
    Receipt,
    BarChart3,
    Calendar,
    DollarSign,
    Tag,
    ExternalLink,
    Brain,
    Zap,
    TrendingUp,
    Clock
} from 'lucide-react';

interface AISearchInterfaceProps {
    currentUserId: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    onResultClick?: (result: SearchResult) => void;
}

export const AISearchInterface: React.FC<AISearchInterfaceProps> = ({
    currentUserId,
    userRole,
    onResultClick
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: 'all',
        category: 'all',
        documentType: 'all',
        amountRange: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = async (searchQuery?: string) => {
        const queryText = searchQuery || query.trim();
        if (!queryText) return;

        setIsLoading(true);
        try {
            const searchParams: AISearchQuery = {
                query: queryText,
                userRole,
                userId: currentUserId,
                filters: buildFilters(),
                limit: 20
            };

            const searchResults = await AIChatService.searchDocuments(searchParams);
            setResults(searchResults);
        } catch (error) {
            console.error('Error performing search:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const buildFilters = () => {
        const filterObj: any = {};

        if (filters.dateRange && filters.dateRange !== 'all') {
            const [start, end] = filters.dateRange.split(' to ');
            if (start && end) {
                filterObj.dateRange = {
                    start: new Date(start),
                    end: new Date(end)
                };
            }
        }

        if (filters.category && filters.category !== 'all') {
            filterObj.categories = [filters.category];
        }

        if (filters.documentType && filters.documentType !== 'all') {
            filterObj.documentTypes = [filters.documentType];
        }

        if (filters.amountRange && filters.amountRange !== 'all') {
            const [min, max] = filters.amountRange.split('-').map(Number);
            if (min !== undefined && max !== undefined) {
                filterObj.amountRange = { min, max };
            }
        }

        return filterObj;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getResultIcon = (type: string) => {
        switch (type) {
            case 'receipt':
                return <Receipt className="w-5 h-5 text-green-500" />;
            case 'financial_report':
                return <BarChart3 className="w-5 h-5 text-blue-500" />;
            case 'transaction':
                return <FileText className="w-5 h-5 text-purple-500" />;
            case 'manual_entry':
                return <FileText className="w-5 h-5 text-orange-500" />;
            default:
                return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getRelevanceColor = (score: number): string => {
        if (score >= 0.8) return 'bg-green-100 text-green-800';
        if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const suggestedQueries = [
        'food expenses last month',
        'office supplies over ₱1000',
        'recent receipts from Richard A',
        'monthly financial summary',
        'allowance payments this year',
        'utility bills January 2024'
    ];

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-blue-600" />
                        AI-Powered Document Search
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Search through financial documents, receipts, and reports using natural language
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Search Input */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                id="ai-search-input"
                                name="ai-search-input"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search for receipts, transactions, or ask questions..."
                                className="pl-10"
                                autoComplete="off"
                            />
                        </div>
                        <Button onClick={() => handleSearch()} disabled={isLoading}>
                            <Zap className="w-4 h-4 mr-2" />
                            Search
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Document Type</label>
                                <Select
                                    value={filters.documentType}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, documentType: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        <SelectItem value="receipt">Receipts</SelectItem>
                                        <SelectItem value="financial_report">Financial Reports</SelectItem>
                                        <SelectItem value="transaction">Transactions</SelectItem>
                                        <SelectItem value="manual_entry">Manual Entries</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Category</label>
                                <Select
                                    value={filters.category}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All categories</SelectItem>
                                        <SelectItem value="food">Food</SelectItem>
                                        <SelectItem value="officeSupplies">Office Supplies</SelectItem>
                                        <SelectItem value="allowance">Allowance</SelectItem>
                                        <SelectItem value="utilities">Utilities</SelectItem>
                                        <SelectItem value="medical">Medical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Amount Range</label>
                                <Select
                                    value={filters.amountRange}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any amount" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any amount</SelectItem>
                                        <SelectItem value="0-500">₱0 - ₱500</SelectItem>
                                        <SelectItem value="500-1000">₱500 - ₱1,000</SelectItem>
                                        <SelectItem value="1000-5000">₱1,000 - ₱5,000</SelectItem>
                                        <SelectItem value="5000-999999">₱5,000+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Date Range</label>
                                <Select
                                    value={filters.dateRange}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any date" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any date</SelectItem>
                                        <SelectItem value="2024-01-01 to 2024-01-31">January 2024</SelectItem>
                                        <SelectItem value="2024-02-01 to 2024-02-29">February 2024</SelectItem>
                                        <SelectItem value="2024-03-01 to 2024-03-31">March 2024</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Suggested Queries */}
                    {query === '' && results.length === 0 && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Try searching for:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQueries.map((suggestion, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setQuery(suggestion);
                                            handleSearch(suggestion);
                                        }}
                                        className="text-xs"
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Search Results */}
            {isLoading && (
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-start space-x-4">
                                    <Skeleton className="w-12 h-12 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Search Results ({results.length})</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                AI Ranked
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {results.map((result) => (
                                <div
                                    key={result.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => onResultClick?.(result)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            {getResultIcon(result.type)}
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 mb-1">
                                                    {result.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {result.content}
                                                </p>

                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{result.date.toLocaleDateString()}</span>
                                                    </div>

                                                    {result.amount && (
                                                        <div className="flex items-center space-x-1">
                                                            <DollarSign className="w-3 h-3" />
                                                            <span>{formatCurrency(result.amount)}</span>
                                                        </div>
                                                    )}

                                                    {result.category && (
                                                        <div className="flex items-center space-x-1">
                                                            <Tag className="w-3 h-3" />
                                                            <span>{result.category}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end space-y-2">
                                            <Badge
                                                variant="outline"
                                                className={getRelevanceColor(result.relevanceScore)}
                                            >
                                                {Math.round(result.relevanceScore * 100)}% match
                                            </Badge>

                                            <Badge variant="secondary" className="text-xs">
                                                {result.type.replace('_', ' ')}
                                            </Badge>

                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {query && !isLoading && results.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-600 mb-4">
                            Try adjusting your search terms or filters to find what you're looking for.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {suggestedQueries.slice(0, 3).map((suggestion, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setQuery(suggestion);
                                        handleSearch(suggestion);
                                    }}
                                >
                                    Try: {suggestion}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};