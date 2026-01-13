import { Receipt, ReceiptStats } from './receipt-types';

export interface SpendingPattern {
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
    averageAmount: number;
    frequency: number;
    seasonality?: 'high' | 'medium' | 'low';
}

export interface BudgetAlert {
    id: string;
    type: 'overspend' | 'unusual_pattern' | 'budget_warning' | 'cost_optimization';
    severity: 'low' | 'medium' | 'high';
    category: string;
    message: string;
    recommendation: string;
    amount?: number;
    threshold?: number;
    confidence: number;
}

export interface FinancialInsight {
    id: string;
    type: 'cost_saving' | 'spending_pattern' | 'budget_optimization' | 'vendor_analysis';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    potentialSavings?: number;
    actionItems: string[];
    confidence: number;
    dataPoints: any[];
}

export interface ExpenseAnalytics {
    totalSpending: number;
    averagePerReceipt: number;
    spendingByCategory: { [category: string]: number };
    spendingByMonth: { [month: string]: number };
    spendingPatterns: SpendingPattern[];
    budgetAlerts: BudgetAlert[];
    insights: FinancialInsight[];
    predictions: {
        nextMonthSpending: number;
        yearEndProjection: number;
        confidence: number;
    };
}

export class AIFinancialAnalyzer {
    private receipts: Receipt[] = [];
    private historicalData: { [month: string]: Receipt[] } = {};

    setData(receipts: Receipt[]): void {
        this.receipts = receipts;
        this.organizeHistoricalData();
    }

    private organizeHistoricalData(): void {
        this.historicalData = {};

        this.receipts.forEach(receipt => {
            const date = new Date(receipt.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!this.historicalData[monthKey]) {
                this.historicalData[monthKey] = [];
            }
            this.historicalData[monthKey].push(receipt);
        });
    }

    generateAnalytics(): ExpenseAnalytics {
        const totalSpending = this.calculateTotalSpending();
        const averagePerReceipt = this.calculateAveragePerReceipt();
        const spendingByCategory = this.calculateSpendingByCategory();
        const spendingByMonth = this.calculateSpendingByMonth();
        const spendingPatterns = this.analyzeSpendingPatterns();
        const budgetAlerts = this.generateBudgetAlerts();
        const insights = this.generateInsights();
        const predictions = this.generatePredictions();

        return {
            totalSpending,
            averagePerReceipt,
            spendingByCategory,
            spendingByMonth,
            spendingPatterns,
            budgetAlerts,
            insights,
            predictions
        };
    }

    private calculateTotalSpending(): number {
        return this.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    }

    private calculateAveragePerReceipt(): number {
        return this.receipts.length > 0 ? this.calculateTotalSpending() / this.receipts.length : 0;
    }

    private calculateSpendingByCategory(): { [category: string]: number } {
        const spending: { [category: string]: number } = {};

        this.receipts.forEach(receipt => {
            spending[receipt.category] = (spending[receipt.category] || 0) + receipt.amount;
        });

        return spending;
    }

    private calculateSpendingByMonth(): { [month: string]: number } {
        const spending: { [month: string]: number } = {};

        Object.entries(this.historicalData).forEach(([month, receipts]) => {
            spending[month] = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
        });

        return spending;
    }

    private analyzeSpendingPatterns(): SpendingPattern[] {
        const patterns: SpendingPattern[] = [];
        const spendingByCategory = this.calculateSpendingByCategory();

        Object.entries(spendingByCategory).forEach(([category, totalAmount]) => {
            const categoryReceipts = this.receipts.filter(r => r.category === category);
            const trend = this.calculateTrend(category);
            const averageAmount = totalAmount / categoryReceipts.length;
            const frequency = categoryReceipts.length;
            const seasonality = this.analyzeSeasonality(category);

            patterns.push({
                category,
                trend: trend.direction,
                changePercentage: trend.percentage,
                averageAmount,
                frequency,
                seasonality
            });
        });

        return patterns.sort((a, b) => b.averageAmount - a.averageAmount);
    }

    private calculateTrend(category: string): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
        const monthlySpending = this.getMonthlySpendingForCategory(category);
        const months = Object.keys(monthlySpending).sort();

        if (months.length < 2) {
            return { direction: 'stable', percentage: 0 };
        }

        const recentMonths = months.slice(-3);
        const olderMonths = months.slice(-6, -3);

        const recentAvg = recentMonths.reduce((sum, month) => sum + (monthlySpending[month] || 0), 0) / recentMonths.length;
        const olderAvg = olderMonths.length > 0
            ? olderMonths.reduce((sum, month) => sum + (monthlySpending[month] || 0), 0) / olderMonths.length
            : recentAvg;

        const changePercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

        let direction: 'increasing' | 'decreasing' | 'stable';
        if (Math.abs(changePercentage) < 10) {
            direction = 'stable';
        } else if (changePercentage > 0) {
            direction = 'increasing';
        } else {
            direction = 'decreasing';
        }

        return { direction, percentage: Math.abs(changePercentage) };
    }

    private getMonthlySpendingForCategory(category: string): { [month: string]: number } {
        const spending: { [month: string]: number } = {};

        Object.entries(this.historicalData).forEach(([month, receipts]) => {
            spending[month] = receipts
                .filter(r => r.category === category)
                .reduce((sum, receipt) => sum + receipt.amount, 0);
        });

        return spending;
    }

    private analyzeSeasonality(category: string): 'high' | 'medium' | 'low' {
        const monthlySpending = this.getMonthlySpendingForCategory(category);
        const amounts = Object.values(monthlySpending);

        if (amounts.length < 3) return 'low';

        const avg = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = avg > 0 ? stdDev / avg : 0;

        if (coefficientOfVariation > 0.5) return 'high';
        if (coefficientOfVariation > 0.25) return 'medium';
        return 'low';
    }

    private generateBudgetAlerts(): BudgetAlert[] {
        const alerts: BudgetAlert[] = [];
        const spendingByCategory = this.calculateSpendingByCategory();
        const patterns = this.analyzeSpendingPatterns();

        // Check for unusual spending patterns
        patterns.forEach(pattern => {
            if (pattern.trend === 'increasing' && pattern.changePercentage > 50) {
                alerts.push({
                    id: `overspend_${pattern.category}`,
                    type: 'overspend',
                    severity: pattern.changePercentage > 100 ? 'high' : 'medium',
                    category: pattern.category,
                    message: `${pattern.category} spending has increased by ${pattern.changePercentage.toFixed(1)}%`,
                    recommendation: `Review ${pattern.category} expenses and consider cost optimization measures`,
                    confidence: 0.8
                });
            }

            if (pattern.averageAmount > 5000 && pattern.frequency < 3) {
                alerts.push({
                    id: `unusual_${pattern.category}`,
                    type: 'unusual_pattern',
                    severity: 'medium',
                    category: pattern.category,
                    message: `Infrequent but high-value ${pattern.category} expenses detected`,
                    recommendation: `Consider bulk purchasing or negotiating better rates for ${pattern.category}`,
                    confidence: 0.7
                });
            }
        });

        // Check for cost optimization opportunities
        const topCategories = patterns.slice(0, 3);
        topCategories.forEach(pattern => {
            if (pattern.averageAmount > 1000) {
                alerts.push({
                    id: `optimization_${pattern.category}`,
                    type: 'cost_optimization',
                    severity: 'low',
                    category: pattern.category,
                    message: `${pattern.category} is a major expense category`,
                    recommendation: `Explore vendor negotiations or alternative suppliers for ${pattern.category}`,
                    confidence: 0.6
                });
            }
        });

        return alerts;
    }

    private generateInsights(): FinancialInsight[] {
        const insights: FinancialInsight[] = [];
        const spendingByCategory = this.calculateSpendingByCategory();
        const patterns = this.analyzeSpendingPatterns();

        // Vendor consolidation insight
        const vendorAnalysis = this.analyzeVendors();
        if (vendorAnalysis.duplicateCategories.length > 0) {
            insights.push({
                id: 'vendor_consolidation',
                type: 'vendor_analysis',
                title: 'Vendor Consolidation Opportunity',
                description: `You have multiple vendors in ${vendorAnalysis.duplicateCategories.join(', ')}. Consolidating could reduce costs.`,
                impact: 'medium',
                potentialSavings: vendorAnalysis.potentialSavings,
                actionItems: [
                    'Review vendor contracts in duplicate categories',
                    'Negotiate volume discounts with preferred vendors',
                    'Standardize procurement processes'
                ],
                confidence: 0.7,
                dataPoints: vendorAnalysis.duplicateCategories
            });
        }

        // Spending pattern insight
        const highVariabilityCategories = patterns.filter(p => p.seasonality === 'high');
        if (highVariabilityCategories.length > 0) {
            insights.push({
                id: 'spending_variability',
                type: 'spending_pattern',
                title: 'High Spending Variability Detected',
                description: `Categories like ${highVariabilityCategories.map(c => c.category).join(', ')} show high variability. Better planning could reduce costs.`,
                impact: 'medium',
                actionItems: [
                    'Implement budget planning for variable categories',
                    'Consider bulk purchasing during low-cost periods',
                    'Set up spending alerts for these categories'
                ],
                confidence: 0.8,
                dataPoints: highVariabilityCategories
            });
        }

        // Cost saving opportunity
        const expensiveCategories = patterns.filter(p => p.averageAmount > 2000);
        if (expensiveCategories.length > 0) {
            const potentialSavings = expensiveCategories.reduce((sum, cat) => sum + (cat.averageAmount * 0.1), 0);
            insights.push({
                id: 'cost_saving',
                type: 'cost_saving',
                title: 'Cost Reduction Opportunities',
                description: `High-value categories could benefit from strategic sourcing and negotiation.`,
                impact: 'high',
                potentialSavings,
                actionItems: [
                    'Conduct market research for alternative suppliers',
                    'Negotiate annual contracts for better rates',
                    'Implement approval workflows for high-value purchases'
                ],
                confidence: 0.9,
                dataPoints: expensiveCategories
            });
        }

        return insights;
    }

    private analyzeVendors(): { duplicateCategories: string[]; potentialSavings: number } {
        const vendorsByCategory: { [category: string]: Set<string> } = {};

        this.receipts.forEach(receipt => {
            if (receipt.metadata?.vendor) {
                if (!vendorsByCategory[receipt.category]) {
                    vendorsByCategory[receipt.category] = new Set();
                }
                vendorsByCategory[receipt.category].add(receipt.metadata.vendor);
            }
        });

        const duplicateCategories = Object.entries(vendorsByCategory)
            .filter(([_, vendors]) => vendors.size > 2)
            .map(([category, _]) => category);

        const potentialSavings = duplicateCategories.length * 500; // Estimated savings per category

        return { duplicateCategories, potentialSavings };
    }

    private generatePredictions(): { nextMonthSpending: number; yearEndProjection: number; confidence: number } {
        const monthlySpending = this.calculateSpendingByMonth();
        const months = Object.keys(monthlySpending).sort();

        if (months.length < 3) {
            return {
                nextMonthSpending: 0,
                yearEndProjection: 0,
                confidence: 0.1
            };
        }

        // Simple linear regression for trend
        const recentMonths = months.slice(-6);
        const amounts = recentMonths.map(month => monthlySpending[month] || 0);

        const avgSpending = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

        // Calculate trend
        const trend = this.calculateLinearTrend(amounts);
        const nextMonthSpending = Math.max(0, avgSpending + trend);

        // Year-end projection based on current year data
        const currentYear = new Date().getFullYear();
        const currentYearMonths = months.filter(month => month.startsWith(currentYear.toString()));
        const currentYearSpending = currentYearMonths.reduce((sum, month) => sum + (monthlySpending[month] || 0), 0);
        const monthsRemaining = 12 - currentYearMonths.length;
        const yearEndProjection = currentYearSpending + (nextMonthSpending * monthsRemaining);

        const confidence = Math.min(0.9, recentMonths.length / 6);

        return {
            nextMonthSpending,
            yearEndProjection,
            confidence
        };
    }

    private calculateLinearTrend(values: number[]): number {
        if (values.length < 2) return 0;

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + (val * index), 0);
        const sumXX = values.reduce((sum, _, index) => sum + (index * index), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    // Smart categorization based on historical data and patterns
    suggestCategory(receiptText: string, vendor?: string, amount?: number): { category: string; confidence: number } {
        const categories = this.analyzeSpendingPatterns();

        // Simple keyword-based categorization with learning from historical data
        const categoryKeywords: { [category: string]: string[] } = {};

        // Build keyword map from historical receipts
        this.receipts.forEach(receipt => {
            if (!categoryKeywords[receipt.category]) {
                categoryKeywords[receipt.category] = [];
            }

            if (receipt.metadata?.vendor) {
                categoryKeywords[receipt.category].push(receipt.metadata.vendor.toLowerCase());
            }

            if (receipt.title) {
                const words = receipt.title.toLowerCase().split(' ');
                categoryKeywords[receipt.category].push(...words);
            }
        });

        // Score each category
        const scores: { [category: string]: number } = {};
        const textLower = receiptText.toLowerCase();
        const vendorLower = vendor?.toLowerCase() || '';

        Object.entries(categoryKeywords).forEach(([category, keywords]) => {
            let score = 0;
            keywords.forEach(keyword => {
                if (textLower.includes(keyword) || vendorLower.includes(keyword)) {
                    score += 1;
                }
            });
            scores[category] = score / keywords.length;
        });

        // Find best match
        const bestCategory = Object.entries(scores).reduce((best, [category, score]) =>
            score > best.score ? { category, score } : best
            , { category: 'Other', score: 0 });

        return {
            category: bestCategory.category,
            confidence: Math.min(0.95, bestCategory.score)
        };
    }
}