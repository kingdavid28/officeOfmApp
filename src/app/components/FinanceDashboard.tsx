import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
    LayoutDashboard,
    DollarSign,
    FileText,
    Settings,
    TrendingUp,
    TrendingDown,
    Calendar,
    Building2,
    ChevronRight
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { franciscanCategoryGroups, formatCategoryDisplay } from '../../lib/franciscan-categories';
import { getAllFriaries } from '../../lib/friary-service';
import { Friary } from '../../lib/friary-types';

interface Transaction {
    id: string;
    date: Date;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    friaryId?: string;
}

interface BudgetData {
    current: number;
    expenses: number;
    donations: number;
}

interface CommunityFinancial {
    id: string;
    name: string;
    type: string;
    monthlyExpenses: number;
    monthlyBudget: number;
    utilizationPercent: number;
}

export function FinanceDashboard() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [budgetData, setBudgetData] = useState<BudgetData>({
        current: 0,
        expenses: 0,
        donations: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [monthlyData, setMonthlyData] = useState<number[]>([]);
    const [communityFinancials, setCommunityFinancials] = useState<CommunityFinancial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFinancialData();
        loadCommunityFinancials();
    }, [user]);

    const loadFinancialData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Load recent transactions
            const transactionsQuery = query(
                collection(db, 'receipts'),
                orderBy('receiptDate', 'desc'),
                limit(5)
            );

            const transactionsSnapshot = await getDocs(transactionsQuery);
            const transactions: Transaction[] = transactionsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    date: data.receiptDate?.toDate() || new Date(),
                    description: data.description || data.vendor || 'Transaction',
                    amount: data.amount || 0,
                    category: data.category || 'other',
                    type: 'expense',
                    friaryId: data.friaryId
                };
            });

            setRecentTransactions(transactions);

            // Calculate budget data
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthStart = new Date(currentYear, currentMonth, 1);
            const monthEnd = new Date(currentYear, currentMonth + 1, 0);

            const monthQuery = query(
                collection(db, 'receipts'),
                where('receiptDate', '>=', monthStart),
                where('receiptDate', '<=', monthEnd)
            );

            const monthSnapshot = await getDocs(monthQuery);
            const monthExpenses = monthSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || 0);
            }, 0);

            setBudgetData({
                current: 500000, // This should come from actual budget settings
                expenses: monthExpenses,
                donations: 25000 // This should come from actual donations tracking
            });

            // Load monthly data for chart (last 8 months)
            const monthlyExpenses: number[] = [];
            for (let i = 7; i >= 0; i--) {
                const month = new Date(currentYear, currentMonth - i, 1);
                const monthEnd = new Date(currentYear, currentMonth - i + 1, 0);

                const q = query(
                    collection(db, 'receipts'),
                    where('receiptDate', '>=', month),
                    where('receiptDate', '<=', monthEnd)
                );

                const snapshot = await getDocs(q);
                const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
                monthlyExpenses.push(total);
            }

            setMonthlyData(monthlyExpenses);

        } catch (error) {
            console.error('Error loading financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCommunityFinancials = async () => {
        try {
            // Load all friaries/communities
            const friaries = await getAllFriaries();

            // Get current month expenses for each community
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthStart = new Date(currentYear, currentMonth, 1);
            const monthEnd = new Date(currentYear, currentMonth + 1, 0);

            const communityData: CommunityFinancial[] = await Promise.all(
                friaries.map(async (friary) => {
                    // Query expenses for this friary this month
                    const expensesQuery = query(
                        collection(db, 'receipts'),
                        where('friaryId', '==', friary.id),
                        where('receiptDate', '>=', monthStart),
                        where('receiptDate', '<=', monthEnd)
                    );

                    const expensesSnapshot = await getDocs(expensesQuery);
                    const monthlyExpenses = expensesSnapshot.docs.reduce((sum, doc) => {
                        return sum + (doc.data().amount || 0);
                    }, 0);

                    // Default budget per community (should come from settings)
                    const monthlyBudget = 50000;
                    const utilizationPercent = monthlyBudget > 0
                        ? (monthlyExpenses / monthlyBudget) * 100
                        : 0;

                    return {
                        id: friary.id,
                        name: friary.name,
                        type: friary.type,
                        monthlyExpenses,
                        monthlyBudget,
                        utilizationPercent
                    };
                })
            );

            // Sort by expenses (highest first)
            communityData.sort((a, b) => b.monthlyExpenses - a.monthlyExpenses);

            setCommunityFinancials(communityData);
        } catch (error) {
            console.error('Error loading community financials:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const getMonthName = (index: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
        const currentMonth = new Date().getMonth();
        const monthIndex = (currentMonth - 7 + index + 12) % 12;
        return months[monthIndex];
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    OFM Franciscan Province of San Antonio de Padua, Philippines
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Current Budget
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {formatCurrency(budgetData.current)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Expenses
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">(This Month)</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {formatCurrency(budgetData.expenses)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-chart-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Donations
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">(This Month)</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {formatCurrency(budgetData.donations)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Overview Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end justify-between gap-2 px-4">
                            {monthlyData.map((value, index) => {
                                const maxValue = Math.max(...monthlyData);
                                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                                            style={{ height: `${height}%`, minHeight: '20px' }}
                                            title={formatCurrency(value)}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {getMonthName(index)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(transaction.date)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground mt-1">
                                            {transaction.description}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-semibold ${transaction.type === 'income'
                                            ? 'text-green-600'
                                            : 'text-destructive'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatCurrency(Math.abs(transaction.amount))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Reports Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className="text-primary hover:underline font-medium"
                    >
                        View Reports →
                    </button>
                </CardContent>
            </Card>

            {/* Financial Summary by Community */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Financial Summary by Community
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Monthly expenses and budget utilization
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    {communityFinancials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Building2 size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No community financial data available</p>
                            <p className="text-xs mt-1">Communities will appear here once expenses are recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {communityFinancials.map((community) => (
                                <div
                                    key={community.id}
                                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                                {community.name}
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    {community.type}
                                                </span>
                                            </h4>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
                                            <p className="text-lg font-bold text-foreground">
                                                {formatCurrency(community.monthlyExpenses)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Monthly Budget</p>
                                            <p className="text-lg font-bold text-foreground">
                                                {formatCurrency(community.monthlyBudget)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Budget Utilization Bar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">Budget Utilization</span>
                                            <span className={`text-xs font-semibold ${community.utilizationPercent > 90
                                                    ? 'text-destructive'
                                                    : community.utilizationPercent > 75
                                                        ? 'text-yellow-600'
                                                        : 'text-green-600'
                                                }`}>
                                                {community.utilizationPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${community.utilizationPercent > 90
                                                        ? 'bg-destructive'
                                                        : community.utilizationPercent > 75
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(community.utilizationPercent, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Summary Footer */}
                            <div className="pt-3 border-t border-border">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Communities:</span>
                                    <span className="font-semibold text-foreground">{communityFinancials.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-muted-foreground">Total Monthly Expenses:</span>
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(communityFinancials.reduce((sum, c) => sum + c.monthlyExpenses, 0))}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-muted-foreground">Total Monthly Budget:</span>
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(communityFinancials.reduce((sum, c) => sum + c.monthlyBudget, 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderBudgets = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Budget Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage budgets by category and friary
                </p>
            </div>

            {/* Category Budgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {franciscanCategoryGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Allocated:</span>
                                    <span className="font-semibold">{formatCurrency(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Spent:</span>
                                    <span className="font-semibold text-destructive">{formatCurrency(0)}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 mt-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
                <p className="text-muted-foreground mt-1">
                    Generate and view financial reports
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <h3 className="font-semibold text-foreground">Monthly Financial Report</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Comprehensive monthly breakdown by category
                            </p>
                        </button>
                        <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <h3 className="font-semibold text-foreground">Quarterly Summary</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Quarter-over-quarter comparison
                            </p>
                        </button>
                        <button className="w-full text-left p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                            <h3 className="font-semibold text-foreground">Annual Report</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Year-end financial summary
                            </p>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure financial management settings
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Financial Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Settings configuration coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-border">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'dashboard'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('budgets')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'budgets'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <DollarSign className="w-5 h-5" />
                        <span>Budgets</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'reports'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>Reports</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'settings'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            ) : (
                <>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'budgets' && renderBudgets()}
                    {activeTab === 'reports' && renderReports()}
                    {activeTab === 'settings' && renderSettings()}
                </>
            )}
        </div>
    );
}
