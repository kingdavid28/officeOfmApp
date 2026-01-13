import { Receipt, ReceiptStats } from './receipt-types';
import { UserProfile } from './auth';

export interface ReportPeriod {
    type: 'daily' | 'monthly' | 'yearly';
    startDate: Date;
    endDate: Date;
    label: string;
}

export interface FinancialSummary {
    totalAmount: number;
    totalReceipts: number;
    averageAmount: number;
    officialAmount: number;
    unofficialAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
    categoryBreakdown: { [category: string]: { amount: number; count: number; percentage: number } };
    vendorBreakdown: { [vendor: string]: { amount: number; count: number; percentage: number } };
    dailyTrends: { [date: string]: number };
    topExpenses: Receipt[];
}

export interface ComplianceMetrics {
    officialReceiptPercentage: number;
    approvalRate: number;
    averageApprovalTime: number; // in hours
    complianceScore: number; // 0-100
    missingDocumentation: number;
    duplicateRisks: Receipt[];
    unusualTransactions: Receipt[];
}

export interface BudgetAnalysis {
    projectedSpending: number;
    budgetVariance: number;
    spendingVelocity: number; // spending rate per day
    categoryOverruns: { [category: string]: { budgeted: number; actual: number; variance: number } };
    recommendations: string[];
    alerts: string[];
}

export interface FinancialReport {
    id: string;
    reportType: 'daily' | 'monthly' | 'yearly';
    period: ReportPeriod;
    generatedAt: Date;
    generatedBy: string;
    generatedByName: string;
    scope: 'personal' | 'team' | 'organization';
    
    // Core Data
    receipts: Receipt[];
    summary: FinancialSummary;
    compliance: ComplianceMetrics;
    budgetAnalysis: BudgetAnalysis;
    
    // AI Insights
    keyInsights: string[];
    recommendations: string[];
    riskFactors: string[];
    opportunities: string[];
    
    // Comparative Analysis
    previousPeriodComparison?: {
        summaryChange: { [key: string]: number };
        trendAnalysis: string[];
        performanceMetrics: { [metric: string]: number };
    };
    
    // Export Options
    exportFormats: ('pdf' | 'excel' | 'csv')[];
    confidenceScore: number;
}

export class AIFinancialReportGenerator {
    private receipts: Receipt[] = [];
    private userProfile: UserProfile | null = null;
    private teamMembers: UserProfile[] = [];

    setData(receipts: Receipt[], userProfile: UserProfile, teamMembers: UserProfile[] = []): void {
        this.receipts = receipts;
        this.userProfile = userProfile;
        this.teamMembers = teamMembers;
    }

    async generateReport(
        reportType: 'daily' | 'monthly' | 'yearly',
        targetDate: Date = new Date(),
        scope: 'personal' | 'team' | 'organization' = 'personal'
    ): Promise<FinancialReport> {
        if (!this.userProfile) {
            throw new Error('User profile required for report generation');
        }

        const period = this.calculateReportPeriod(reportType, targetDate);
        const filteredReceipts = this.filterReceiptsByPeriod(this.receipts, perioalReport> {
    try {
      console.log('Generating AI financial report...', request);
      
      // Fetch receipts for the specified period
      const filter: ReceiptFilter = {
        dateFrom: request.period.startDate,
        dateTo: request.period.endDate
      };
      
      if (request.categories && request.categories.length > 0) {
        // Note: This would need to be implemented as multiple queries or client-side filtering
        // For now, we'll filter client-side after fet