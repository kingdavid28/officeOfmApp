import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
    FriaryFinancialReportGenerator,
    FriaryFinancialReport,
    FriaryFinancialData,
    ExcelExportUtility
} from '../../lib/friary-financial-report';
import {
    FRIARY_RECEIPTS_CATEGORIES,
    FRIARY_DISBURSEMENTS_CATEGORIES,
    getCategoriesBySchedule
} from '../../lib/friary-financial-categories';
import { receiptService } from '../../lib/receipt-service';
import { ManualFinancialEntryService, ManualFinancialEntry } from '../../lib/manual-financial-entries';
import { ManualFinancialEntryForm } from './ManualFinancialEntryForm';
import { Download, FileSpreadsheet, Calendar, Building2, DollarSign, Plus, Receipt, Edit } from 'lucide-react';

interface FriaryFinancialReportGeneratorProps {
    currentUserUid: string;
    currentUserName: string;
    userRole: 'admin' | 'super_admin' | 'staff';
}

export const FriaryFinancialReportGeneratorComponent: React.FC<FriaryFinancialReportGeneratorProps> = ({
    currentUserUid,
    currentUserName,
    userRole
}) => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<FriaryFinancialReport | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [friaryInfo, setFriaryInfo] = useState({
        name: 'OFM South Province Phil',
        address: 'Province of San Antonio de Padua, Philippines'
    });

    useEffect(() => {
        generateReport();
    }, [selectedMonth]);

    const generateReport = async () => {
        setLoading(true);
        try {
            // Get receipts data from the receipt service based on user role
            const receipts = await receiptService.getVisibleReceipts(currentUserUid);

            // Get manual financial entries for the selected month
            const selectedDate = new Date(selectedMonth);
            const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            const manualEntries = await ManualFinancialEntryService.getEntriesForPeriod(
                startDate,
                endDate,
                userRole,
                currentUserUid
            );

            // Filter receipts for the selected month
            const monthReceipts = receipts.filter(receipt => {
                const receiptDate = new Date(receipt.date);
                return receiptDate.getMonth() === selectedDate.getMonth() &&
                    receiptDate.getFullYear() === selectedDate.getFullYear();
            });

            // Convert receipt data to financial data format
            const financialData: FriaryFinancialData[] = [];

            // Process receipts (income) - combining physical receipts and manual entries
            FRIARY_RECEIPTS_CATEGORIES.forEach(category => {
                // Physical receipts
                const categoryReceipts = monthReceipts.filter(r =>
                    r.type === 'official' && // Official receipts are income
                    (r.category.toLowerCase().includes(category.name.toLowerCase()) ||
                        r.description.toLowerCase().includes(category.name.toLowerCase()))
                );
                const receiptAmount = categoryReceipts.reduce((sum, r) => sum + r.amount, 0);

                // Manual entries
                const categoryManualEntries = manualEntries.filter(entry =>
                    entry.type === 'receipt' && entry.categoryId === category.id
                );
                const manualAmount = categoryManualEntries.reduce((sum, entry) => sum + entry.amount, 0);

                const totalActual = receiptAmount + manualAmount;

                financialData.push({
                    categoryId: category.id,
                    budget: 0, // Would come from budget system
                    actual: totalActual,
                    accumulated: totalActual // For now, same as actual
                });
            });

            // Process disbursements (expenses) - combining physical receipts and manual entries
            FRIARY_DISBURSEMENTS_CATEGORIES.forEach(category => {
                // Physical receipts (unofficial receipts as expenses)
                const categoryExpenses = monthReceipts.filter(r =>
                    r.type === 'unofficial' && // Unofficial receipts are expenses
                    (r.category.toLowerCase().includes(category.name.toLowerCase()) ||
                        r.description.toLowerCase().includes(category.name.toLowerCase()))
                );
                const receiptAmount = categoryExpenses.reduce((sum, r) => sum + r.amount, 0);

                // Manual entries
                const categoryManualEntries = manualEntries.filter(entry =>
                    entry.type === 'disbursement' && entry.categoryId === category.id
                );
                const manualAmount = categoryManualEntries.reduce((sum, entry) => sum + entry.amount, 0);

                const totalActual = receiptAmount + manualAmount;

                financialData.push({
                    categoryId: category.id,
                    budget: 0, // Would come from budget system
                    actual: totalActual,
                    accumulated: totalActual
                });
            });

            // Generate the report
            const generatedReport = FriaryFinancialReportGenerator.generateReport(
                {
                    name: friaryInfo.name,
                    address: friaryInfo.address,
                    reportPeriod: new Date(selectedMonth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                    })
                },
                financialData,
                {
                    beginningBalance: 137659.16, // This would come from previous month
                    cashOnHand: 26627.25,
                    bankAccount: 'BPI: SA No. 9063-0622-08',
                    friaryFund: 111031.91,
                    unsaidMassIntention: 0
                },
                {
                    preparedBy: { name: 'Seth F. Monet, ofm', title: 'House Bursar' },
                    approvedBy: { name: 'Noniel R. Pe, ofm', title: 'Guardian' }
                }
            );

            setReport(generatedReport);
        } catch (error) {
            console.error('Error generating financial report:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!report) return;

        const mainReportData = FriaryFinancialReportGenerator.generateExcelData(report);
        const schedulesData = FriaryFinancialReportGenerator.generateDisbursementSchedules(report);

        // Create downloadable content
        const workbook = ExcelExportUtility.createWorkbook(mainReportData, schedulesData);

        // Convert to CSV for download (simplified version)
        const csvContent = mainReportData.map(row =>
            row.map(cell => typeof cell === 'number' ? cell.toString() : `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${friaryInfo.name.replace(/\s+/g, '_')}_Financial_Report_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-48" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="p-4 border rounded-lg">
                                        <Skeleton className="h-6 w-32 mb-2" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!report) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Unable to generate financial report</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-6 h-6" />
                                Friary Financial Report Generator
                            </CardTitle>
                            <p className="text-muted-foreground mt-1">
                                Generate comprehensive financial reports following OFM South Province Phil format
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ManualFinancialEntryForm
                                currentUserId={currentUserUid}
                                currentUserName={currentUserName}
                                userRole={userRole}
                                onEntryCreated={(entry) => {
                                    // Refresh report when new entry is created
                                    generateReport();
                                }}
                            />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button onClick={exportToExcel} className="flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Report Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₱{ExcelExportUtility.formatNumber(report.totalReceipts.actual)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Disbursements</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₱{ExcelExportUtility.formatNumber(report.totalDisbursements.actual)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cash Over/Short</p>
                                <p className={`text-2xl font-bold ${report.cashOverShort.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₱{ExcelExportUtility.formatNumber(report.cashOverShort.actual)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ending Balance</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    ₱{ExcelExportUtility.formatNumber(report.endingBalance)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Receipts Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Receipts</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Income categories following friary accounting standards
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Main Receipt Categories */}
                        <div>
                            <h4 className="font-medium mb-3">Main Categories</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {FRIARY_RECEIPTS_CATEGORIES.filter(cat => !cat.parentCategory).map(category => {
                                    const categoryData = report.receipts.find(r => r.categoryId === category.id);
                                    const amount = categoryData?.actual || 0;

                                    return (
                                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-xs text-muted-foreground">{category.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₱{ExcelExportUtility.formatNumber(amount)}</p>
                                                {amount > 0 && <Badge variant="secondary" className="text-xs">Active</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Other Receipts */}
                        <div>
                            <h4 className="font-medium mb-3">Other Receipts</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {FRIARY_RECEIPTS_CATEGORIES.filter(cat => cat.parentCategory === 'other_receipts').map(category => {
                                    const categoryData = report.receipts.find(r => r.categoryId === category.id);
                                    const amount = categoryData?.actual || 0;

                                    return (
                                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-xs text-muted-foreground">{category.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₱{ExcelExportUtility.formatNumber(amount)}</p>
                                                {amount > 0 && <Badge variant="secondary" className="text-xs">Active</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disbursements by Schedule */}
            {['Schedule 1', 'Schedule 2', 'Schedule 3'].map(schedule => (
                <Card key={schedule}>
                    <CardHeader>
                        <CardTitle>{schedule} - {
                            schedule === 'Schedule 1' ? 'Operating Expenses' :
                                schedule === 'Schedule 2' ? 'Other Form of Disbursements' :
                                    'Extra-Ordinary Disbursements'
                        }</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {getCategoriesBySchedule(schedule).map(category => {
                                const categoryData = report.disbursements.find(d => d.categoryId === category.id);
                                const amount = categoryData?.actual || 0;

                                return (
                                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{category.name}</p>
                                            <p className="text-xs text-muted-foreground">{category.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">₱{ExcelExportUtility.formatNumber(amount)}</p>
                                            {amount > 0 && <Badge variant="destructive" className="text-xs">Expense</Badge>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Location of Funds */}
            <Card>
                <CardHeader>
                    <CardTitle>Location of Funds</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">Cash on Hand (Petty Cash Fund)</span>
                            <span className="font-medium">₱{ExcelExportUtility.formatNumber(report.cashOnHand)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">Cash in Bank ({report.cashInBank.account})</span>
                            <span className="font-medium">₱{ExcelExportUtility.formatNumber(report.cashInBank.total)}</span>
                        </div>
                        <div className="ml-4 space-y-2">
                            <div className="flex items-center justify-between p-2 text-sm">
                                <span>Friary Fund</span>
                                <span>₱{ExcelExportUtility.formatNumber(report.cashInBank.friaryFund)}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 text-sm">
                                <span>Unsaid Mass Intention</span>
                                <span>₱{ExcelExportUtility.formatNumber(report.cashInBank.unsaidMassIntention)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border-2 border-blue-500 rounded-lg bg-blue-50">
                            <span className="font-bold">TOTAL</span>
                            <span className="font-bold text-blue-600">₱{ExcelExportUtility.formatNumber(report.endingBalance)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Signatures */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Authorization</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                            <p className="font-medium">Prepared by:</p>
                            <div className="mt-8 mb-2 border-b border-gray-400"></div>
                            <p className="font-medium">{report.preparedBy.name}</p>
                            <p className="text-sm text-muted-foreground">{report.preparedBy.title}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Approved by:</p>
                            <div className="mt-8 mb-2 border-b border-gray-400"></div>
                            <p className="font-medium">{report.approvedBy.name}</p>
                            <p className="text-sm text-muted-foreground">{report.approvedBy.title}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};