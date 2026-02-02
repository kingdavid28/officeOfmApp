// Friary Financial Report Generator
import {
    FRIARY_RECEIPTS_CATEGORIES,
    FRIARY_DISBURSEMENTS_CATEGORIES,
    getCategoriesBySchedule,
    FriaryFinancialCategory
} from './friary-financial-categories';

export interface FriaryFinancialData {
    categoryId: string;
    budget: number;
    actual: number;
    accumulated: number;
}

export interface FriaryFinancialReport {
    friaryName: string;
    address: string;
    reportPeriod: string;
    reportDate: Date;

    // Financial Data
    receipts: FriaryFinancialData[];
    disbursements: FriaryFinancialData[];

    // Calculated Totals
    totalReceipts: {
        budget: number;
        actual: number;
        accumulated: number;
    };

    totalDisbursements: {
        budget: number;
        actual: number;
        accumulated: number;
    };

    cashOverShort: {
        budget: number;
        actual: number;
        accumulated: number;
    };

    // Cash Position
    beginningBalance: number;
    endingBalance: number;

    // Location of Funds
    cashOnHand: number;
    cashInBank: {
        account: string;
        friaryFund: number;
        unsaidMassIntention: number;
        total: number;
    };

    // Signatures
    preparedBy: {
        name: string;
        title: string;
    };

    approvedBy: {
        name: string;
        title: string;
    };
}

export class FriaryFinancialReportGenerator {

    static generateReport(
        friaryInfo: {
            name: string;
            address: string;
            reportPeriod: string;
        },
        financialData: FriaryFinancialData[],
        cashPosition: {
            beginningBalance: number;
            cashOnHand: number;
            bankAccount: string;
            friaryFund: number;
            unsaidMassIntention: number;
        },
        signatures: {
            preparedBy: { name: string; title: string };
            approvedBy: { name: string; title: string };
        }
    ): FriaryFinancialReport {

        // Separate receipts and disbursements
        const receipts = financialData.filter(data =>
            FRIARY_RECEIPTS_CATEGORIES.some(cat => cat.id === data.categoryId)
        );

        const disbursements = financialData.filter(data =>
            FRIARY_DISBURSEMENTS_CATEGORIES.some(cat => cat.id === data.categoryId)
        );

        // Calculate totals
        const totalReceipts = this.calculateTotals(receipts);
        const totalDisbursements = this.calculateTotals(disbursements);

        const cashOverShort = {
            budget: totalReceipts.budget - totalDisbursements.budget,
            actual: totalReceipts.actual - totalDisbursements.actual,
            accumulated: totalReceipts.accumulated - totalDisbursements.accumulated
        };

        const endingBalance = cashPosition.beginningBalance + cashOverShort.actual;

        return {
            friaryName: friaryInfo.name,
            address: friaryInfo.address,
            reportPeriod: friaryInfo.reportPeriod,
            reportDate: new Date(),

            receipts,
            disbursements,

            totalReceipts,
            totalDisbursements,
            cashOverShort,

            beginningBalance: cashPosition.beginningBalance,
            endingBalance,

            cashOnHand: cashPosition.cashOnHand,
            cashInBank: {
                account: cashPosition.bankAccount,
                friaryFund: cashPosition.friaryFund,
                unsaidMassIntention: cashPosition.unsaidMassIntention,
                total: cashPosition.friaryFund + cashPosition.unsaidMassIntention
            },

            preparedBy: signatures.preparedBy,
            approvedBy: signatures.approvedBy
        };
    }

    private static calculateTotals(data: FriaryFinancialData[]) {
        return data.reduce(
            (totals, item) => ({
                budget: totals.budget + item.budget,
                actual: totals.actual + item.actual,
                accumulated: totals.accumulated + item.accumulated
            }),
            { budget: 0, actual: 0, accumulated: 0 }
        );
    }

    static generateExcelData(report: FriaryFinancialReport): any[][] {
        const data: any[][] = [];

        // Header
        data.push([report.friaryName]);
        data.push([report.address]);
        data.push(['Financial Report']);
        data.push([`For the Month Ended, ${report.reportPeriod}`]);
        data.push([]); // Empty row

        // Receipts Section
        data.push(['RECEIPTS:', 'BUDGET', 'ACTUAL', 'ACCUMULATED']);

        // Main receipt categories
        FRIARY_RECEIPTS_CATEGORIES.filter(cat => !cat.parentCategory).forEach(category => {
            const categoryData = report.receipts.find(r => r.categoryId === category.id);
            data.push([
                category.name,
                categoryData?.budget || '-',
                categoryData?.actual || '-',
                categoryData?.accumulated || '-'
            ]);
        });

        // Other Receipts subsection
        data.push(['Other Receipts:']);
        FRIARY_RECEIPTS_CATEGORIES.filter(cat => cat.parentCategory === 'other_receipts').forEach(category => {
            const categoryData = report.receipts.find(r => r.categoryId === category.id);
            data.push([
                `  ${category.name}`,
                categoryData?.budget || '-',
                categoryData?.actual || '-',
                categoryData?.accumulated || '-'
            ]);
        });

        // Total Receipts
        data.push([
            'TOTAL RECEIPTS',
            report.totalReceipts.budget,
            report.totalReceipts.actual,
            report.totalReceipts.accumulated
        ]);

        data.push([]); // Empty row

        // Disbursements
        data.push([
            'LESS: TOTAL DISBURSEMENTS',
            report.totalDisbursements.budget,
            report.totalDisbursements.actual,
            report.totalDisbursements.accumulated
        ]);

        // Cash Over/Short
        data.push([
            'Cash Over (Short)',
            report.cashOverShort.budget || '-',
            report.cashOverShort.actual || '-',
            report.cashOverShort.accumulated || '-'
        ]);

        data.push([
            'TOTAL CASH OVER (SHORT)',
            report.cashOverShort.budget || '-',
            report.cashOverShort.actual || '-',
            report.cashOverShort.accumulated || '-'
        ]);

        data.push([]); // Empty row

        // Cash Position
        data.push(['Add: Beginning Balance', report.beginningBalance, report.beginningBalance]);
        data.push(['ENDING BALANCE', report.endingBalance, report.endingBalance]);

        data.push([]); // Empty row

        // Location of Funds
        data.push(['LOCATION OF FUNDS:']);
        data.push(['CASH ON HAND (Petty Cash Fund)', report.cashOnHand]);
        data.push([`CASH IN BANK (${report.cashInBank.account})`, report.cashInBank.total]);
        data.push(['  Friary Fund', report.cashInBank.friaryFund]);
        data.push(['  Unsaid Mass Intention', report.cashInBank.unsaidMassIntention]);
        data.push(['T O T A L', report.endingBalance]);

        data.push([]); // Empty row
        data.push([]); // Empty row

        // Signatures
        data.push(['Prepared by:', '', 'Approved by:']);
        data.push([]);
        data.push([]);
        data.push([report.preparedBy.name, '', report.approvedBy.name]);
        data.push([report.preparedBy.title, '', report.approvedBy.title]);

        return data;
    }

    static generateDisbursementSchedules(report: FriaryFinancialReport): any[][] {
        const data: any[][] = [];

        // Header
        data.push([`${report.friaryName}`]);
        data.push(['Financial Report Schedules']);
        data.push([`For the Month Ended, ${report.reportPeriod}`]);
        data.push([]); // Empty row

        data.push(['DISBURSEMENTS:', 'BUDGET', 'ACTUAL', 'ACCUMULATED']);

        // Schedule 1 - Operating Expenses
        data.push(['Schedule 1 - Operating Expenses']);
        getCategoriesBySchedule('Schedule 1').forEach(category => {
            const categoryData = report.disbursements.find(d => d.categoryId === category.id);
            data.push([
                category.name,
                categoryData?.budget || '-',
                categoryData?.actual || '-',
                categoryData?.accumulated || '-'
            ]);
        });

        const schedule1Total = this.calculateScheduleTotal(report.disbursements, 'Schedule 1');
        data.push([
            'Sub-Total',
            schedule1Total.budget,
            schedule1Total.actual,
            schedule1Total.accumulated
        ]);

        data.push([]); // Empty row

        // Schedule 2 - Other Form of Disbursements
        data.push(['Schedule 2 - Other Form of Disbursements']);
        getCategoriesBySchedule('Schedule 2').forEach(category => {
            const categoryData = report.disbursements.find(d => d.categoryId === category.id);
            data.push([
                category.name,
                categoryData?.budget || '-',
                categoryData?.actual || '-',
                categoryData?.accumulated || '-'
            ]);
        });

        const schedule2Total = this.calculateScheduleTotal(report.disbursements, 'Schedule 2');
        data.push([
            'Sub-Total',
            schedule2Total.budget,
            schedule2Total.actual,
            schedule2Total.accumulated
        ]);

        data.push([]); // Empty row

        // Schedule 3 - Extra Ordinary Disbursements
        data.push(['Schedule 3 - Extra Ordinary Disbursements']);
        getCategoriesBySchedule('Schedule 3').forEach(category => {
            const categoryData = report.disbursements.find(d => d.categoryId === category.id);
            data.push([
                category.name,
                categoryData?.budget || '-',
                categoryData?.actual || '-',
                categoryData?.accumulated || '-'
            ]);
        });

        const schedule3Total = this.calculateScheduleTotal(report.disbursements, 'Schedule 3');
        data.push([
            'Sub-Total',
            schedule3Total.budget,
            schedule3Total.actual,
            schedule3Total.accumulated
        ]);

        data.push([]); // Empty row

        // Total Disbursements
        data.push([
            'TOTAL DISBURSEMENTS',
            report.totalDisbursements.budget,
            report.totalDisbursements.actual,
            report.totalDisbursements.accumulated
        ]);

        return data;
    }

    private static calculateScheduleTotal(disbursements: FriaryFinancialData[], schedule: string) {
        const scheduleCategories = getCategoriesBySchedule(schedule);
        const scheduleData = disbursements.filter(d =>
            scheduleCategories.some(cat => cat.id === d.categoryId)
        );

        return this.calculateTotals(scheduleData);
    }
}

// Excel Export Utility
export class ExcelExportUtility {
    static createWorkbook(mainReport: any[][], schedules: any[][]) {
        // This would integrate with a library like xlsx or exceljs
        // For now, return the data structure that can be used with Excel libraries
        return {
            sheets: [
                {
                    name: 'Financial Report',
                    data: mainReport
                },
                {
                    name: 'Disbursement Schedules',
                    data: schedules
                }
            ]
        };
    }

    static formatCurrency(amount: number): string {
        if (amount === 0) return '-';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    static formatNumber(amount: number): string {
        if (amount === 0) return '-';
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}