import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
    Brain,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    DollarSign,
    Calendar,
    Target,
    BarChart3,
    PieChart,
    Activity,
    Zap,
    Eye,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { AIFinancialAnalyzer, ExpenseAnalytics, SpendingPattern, BudgetAlert, FinancialInsight } from '../../lib/ai-financial-insights';
import { receiptService } from '../../lib/receipt-service';
import { ReceiptViewScopeSelector } from './ReceiptViewScopeSelector';
import { ReceiptViewScope } from '../../lib/user-preferences';
import { Receipt } from '../../lib/receipt-types';

interface AIFinancialDashboardProps {
    receipts: Receipt[];
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    initialViewScope?: ReceiptViewScope;
    onViewScopeChange?: (scope: ReceiptViewScope) => void;
}

export const AIFinancialDashboard: React.FC<AIFinancialDashboardProps> = ({
    receipts: initialReceipts,
    isOpen,
    onClose,
    currentUserId,
    userRole,
    initialViewScope = 'all',
    onViewScopeChange
}) => {
    const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedInsight, setSelectedInsight] = useState<FinancialInsight | null>(null);
    const [currentViewScope, setCurrentViewScope] = useState<ReceiptViewScope>(initialViewScope);
    const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);

    useEffect(() => {
        if (isOpen) {
            loadReceiptsForScope(currentViewScope);
        }
    }, [isOpen, currentViewScope]);

    useEffect(() => {
        setCurrentViewScope(initialViewScope);
    }, [initialViewScope]);

    const loadReceiptsForScope = async (scope: ReceiptViewScope) => {
        try {
            setLoading(true);
            const scopedReceipts = await receiptService.getVisibleReceipts(currentUserId, undefined, scope);
            setReceipts(scopedReceipts);

            if (scopedReceipts.length > 0) {
                await generateAnalytics(scopedReceipts);
            } else {
                setAnalytics(null);
            }
        } catch (error) {
            console.error('Failed to load receipts for scope:', error);
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    const handleViewScopeChange = (newScope: ReceiptViewScope) => {
        setCurrentViewScope(newScope);
        if (onViewScopeChange) {
            onViewScopeChange(newScope);
        }
    };

    const generateAnalytics = async (receiptData: Receipt[]) => {
        try {
            const analyzer = new AIFinancialAnalyzer();
            analyzer.setData(receiptData);
            const result = analyzer.generateAnalytics();
            setAnalytics(result);
        } catch (error) {
            console.error('Failed to generate analytics:', error);
            setAnalytics(null);
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
            case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
            default: return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getImpactIcon = (impact: string) => {
        switch (impact) {
            case 'high': return <ArrowUp className="w-4 h-4 text-red-500" />;
            case 'medium': return <Minus className="w-4 h-4 text-yellow-500" />;
            default: return <ArrowDown className="w-4 h-4 text-green-500" />;
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-6 h-6 text-blue-600" />
                            AI Financial Intelligence Dashboard
                            <Badge variant="outline" className="ml-2">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Powered
                            </Badge>
                        </div>

                        {/* View Scope Selector for Admins */}
                        {userRole === 'admin' && (
                            <ReceiptViewScopeSelector
                                currentScope={currentViewScope}
                                userRole={userRole}
                                onScopeChange={handleViewScopeChange}
                                compact={true}
                            />
                        )}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                            <p className="text-lg font-medium">AI is analyzing your expenses...</p>
                            <p className="text-sm text-muted-foreground">This may take a few moments</p>
                        </div>
                    </div>
                ) : analytics ? (
                    <div className="space-y-4">
                        {/* View Scope Indicator */}
                        {userRole === 'admin' && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <Eye className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Analyzing: {currentViewScope === 'personal' ? 'Your Personal Expenses' :
                                            currentViewScope === 'team' ? 'Your Team\'s Expenses' :
                                                'Combined Expenses (You + Team)'}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {receipts.length} receipts
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <Tabs defaultValue="overview" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="patterns">Patterns</TabsTrigger>
                                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                                <TabsTrigger value="insights">Insights</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Total Spending</p>
                                                    <p className="text-2xl font-bold">₱{analytics.totalSpending.toLocaleString()}</p>
                                                </div>
                                                <DollarSign className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Avg per Receipt</p>
                                                    <p className="text-2xl font-bold">₱{analytics.averagePerReceipt.toLocaleString()}</p>
                                                </div>
                                                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Next Month Prediction</p>
                                                    <p className="text-2xl font-bold">₱{analytics.predictions.nextMonthSpending.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {Math.round(analytics.predictions.confidence * 100)}% confidence
                                                    </p>
                                                </div>
                                                <Activity className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Year-End Projection</p>
                                                    <p className="text-2xl font-bold">₱{analytics.predictions.yearEndProjection.toLocaleString()}</p>
                                                </div>
                                                <Target className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Category Breakdown */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChart className="w-5 h-5" />
                                            Spending by Category
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {Object.entries(analytics.spendingByCategory)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 8)
                                                .map(([category, amount]) => {
                                                    const percentage = (amount / analytics.totalSpending) * 100;
                                                    return (
                                                        <div key={category} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                                <span className="text-sm font-medium">{category}</span>
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2 ml-3">
                                                                    <div
                                                                        className="bg-blue-500 h-2 rounded-full"
                                                                        style={{ width: `${percentage}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-3">
                                                                <p className="text-sm font-bold">₱{amount.toLocaleString()}</p>
                                                                <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Monthly Trend */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Monthly Spending Trend
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {Object.entries(analytics.spendingByMonth)
                                                .sort(([a], [b]) => a.localeCompare(b))
                                                .slice(-6)
                                                .map(([month, amount]) => (
                                                    <div key={month} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        <span className="text-sm font-medium">{month}</span>
                                                        <span className="text-sm font-bold">₱{amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="patterns" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5" />
                                            AI-Detected Spending Patterns
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {analytics.spendingPatterns.map((pattern, index) => (
                                                <div key={index} className="p-4 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-medium">{pattern.category}</h3>
                                                        <div className="flex items-center gap-2">
                                                            {getTrendIcon(pattern.trend)}
                                                            <Badge variant={pattern.trend === 'increasing' ? 'destructive' :
                                                                pattern.trend === 'decreasing' ? 'default' : 'secondary'}>
                                                                {pattern.trend}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Change</p>
                                                            <p className="font-medium">{pattern.changePercentage.toFixed(1)}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Avg Amount</p>
                                                            <p className="font-medium">₱{pattern.averageAmount.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Frequency</p>
                                                            <p className="font-medium">{pattern.frequency} receipts</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Seasonality</p>
                                                            <Badge variant="outline" className="text-xs">
                                                                {pattern.seasonality}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="alerts" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Budget Alerts & Warnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {analytics.budgetAlerts.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Eye className="w-12 h-12 mx-auto mb-4 text-green-600" />
                                                <p className="text-lg font-medium text-green-800">All Clear!</p>
                                                <p className="text-sm text-green-600">No budget alerts detected</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {analytics.budgetAlerts.map((alert, index) => (
                                                    <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className="w-5 h-5" />
                                                                <h3 className="font-medium">{alert.category}</h3>
                                                            </div>
                                                            <Badge variant={alert.severity === 'high' ? 'destructive' :
                                                                alert.severity === 'medium' ? 'secondary' : 'default'}>
                                                                {alert.severity} priority
                                                            </Badge>
                                                        </div>

                                                        <p className="text-sm mb-2">{alert.message}</p>
                                                        <p className="text-sm font-medium">
                                                            <strong>Recommendation:</strong> {alert.recommendation}
                                                        </p>

                                                        <div className="mt-2 flex items-center justify-between">
                                                            <Badge variant="outline" className="text-xs">
                                                                {alert.type.replace('_', ' ')}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {Math.round(alert.confidence * 100)}% confidence
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="insights" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5" />
                                            AI-Generated Financial Insights
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {analytics.insights.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                                                <p className="text-lg font-medium">Analyzing Patterns...</p>
                                                <p className="text-sm text-muted-foreground">More data needed for insights</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {analytics.insights.map((insight, index) => (
                                                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                                        onClick={() => setSelectedInsight(insight)}>
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                {getImpactIcon(insight.impact)}
                                                                <h3 className="font-medium">{insight.title}</h3>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={insight.impact === 'high' ? 'default' :
                                                                    insight.impact === 'medium' ? 'secondary' : 'outline'}>
                                                                    {insight.impact} impact
                                                                </Badge>
                                                                {insight.potentialSavings && (
                                                                    <Badge variant="outline" className="text-green-600">
                                                                        ₱{insight.potentialSavings.toLocaleString()} savings
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="outline" className="text-xs">
                                                                {insight.type.replace('_', ' ')}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {Math.round(insight.confidence * 100)}% confidence
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                        <p className="text-lg font-medium">No Data Available</p>
                        <p className="text-sm text-muted-foreground">Upload some receipts to see AI insights</p>
                    </div>
                )}

                {/* Detailed Insight Modal */}
                {selectedInsight && (
                    <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                                    {selectedInsight.title}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Badge variant={selectedInsight.impact === 'high' ? 'default' :
                                        selectedInsight.impact === 'medium' ? 'secondary' : 'outline'}>
                                        {selectedInsight.impact} impact
                                    </Badge>
                                    {selectedInsight.potentialSavings && (
                                        <Badge variant="outline" className="text-green-600">
                                            Potential Savings: ₱{selectedInsight.potentialSavings.toLocaleString()}
                                        </Badge>
                                    )}
                                    <Badge variant="outline">
                                        {Math.round(selectedInsight.confidence * 100)}% confidence
                                    </Badge>
                                </div>

                                <p className="text-muted-foreground">{selectedInsight.description}</p>

                                <div>
                                    <h3 className="font-medium mb-2">Recommended Actions:</h3>
                                    <ul className="space-y-1">
                                        {selectedInsight.actionItems.map((action, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
};