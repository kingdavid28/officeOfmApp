import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from './ui/tabs';
import {
    DetailedFinancialReportService,
    DetailedFinancialReport,
    DetailedTransaction
} from '../../lib/detailed-financial-transactions';
import { ManualFinancialEntryForm } from './ManualFinancialEntryForm';
import { DetailedTransactionEntryForm } from './DetailedTransactionEntryForm';
import {
    Download,
    FileSpreadsheet,
    Calendar,
    Building2,
    DollarSign,
    Receipt,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Wallet,
    Building,
    Plus
} from 'lucide-react';

interface DetailedFinancialReportProps {
    currentUserUid: string;
    currentUserName: string;
    userRole: 'admin' | 'super_admin' | 'staff';
}

export const DetailedFinancialReportComponent: React.FC<DetailedFinancialReportProps> = ({
    currentUserUid,
    currentUserName,
    userRole
}) => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<DetailedFinancialReport | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeTab, setActiveTab] = useState<'receipts' | 'disbursements' | 'location'>('receipts');

    useEffect(() => {
        generateDetailedReport();
    }, [selectedMonth]);

    const generateDetailedReport = async () => {
        setLoading(true);
        try {
            const selectedDate = new Date(selectedMonth);
            const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            const detailedReport = await DetailedFinancialReportService.generateDetailedReport(
                startDate,
                endDate,
                userRole,
                currentUserUid
            );

            setReport(detailedReport);
        } catch (error) {
            console.error('Error generating detailed financial report:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!report) return;

        const excelData = DetailedFinancialReportService.generateDetailedExcelReport(report);

        // Convert to CSV for download
        const csvContent = excelData.map(row =>
            row.map(cell => {
                const cellValue = cell?.toString() || '';
                return cellValue.includes(',') ? `"${cellValue}"` : cellValue;
            }).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.friaryName.replace(/\s+/g, '_')}_Detailed_Financial_Report_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        });
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
                            <div className="space-y-2">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
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
                    <p className="text-muted-foreground">Unable to generate detailed financial report</p>
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
                                <FileSpreadsheet className="w-6 h-6" />
                                Detailed Financial Report
                            </CardTitle>
                            <p className="text-muted-foreground mt-1">
                                Complete transaction-level financial reporting with cash receipts, disbursements, and location of funds
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <DetailedTransactionEntryForm
                                currentUserId={currentUserUid}
                                currentUserName={currentUserName}
                                userRole={userRole}
                                onTransactionCreated={() => generateDetailedReport()}
                            />
                            <ManualFinancialEntryForm
                                currentUserId={currentUserUid}
                                currentUserName={currentUserName}
                                userRole={userRole}
                                onEntryCreated={() => generateDetailedReport()}
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(report.receiptSummary.total)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Disbursements</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(report.disbursementSummary.total)}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cash on Hand</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(report.finalBalances.cashOnHand)}
                                </p>
                            </div>
                            <Wallet className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Cash in Bank</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(report.finalBalances.cashInBank)}
                                </p>
                            </div>
                            <Building className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Reports Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>{report.friaryName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        For the Month Ended, {report.reportPeriod}
                    </p>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="receipts" className="flex items-center gap-2">
                                <Receipt className="w-4 h-4" />
                                Cash Receipts
                            </TabsTrigger>
                            <TabsTrigger value="disbursements" className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Cash Disbursements
                            </TabsTrigger>
                            <TabsTrigger value="location" className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Location of Funds
                            </TabsTrigger>
                        </TabsList>

                        {/* Cash Receipts Tab */}
                        <TabsContent value="receipts" className="mt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Cash Receipts</h3>
                                    <Badge variant="secondary">
                                        {report.cashReceipts.length} transactions
                                    </Badge>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Particulars</TableHead>
                                                <TableHead>RV No.</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Source</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.cashReceipts.map((receipt) => (
                                                <TableRow key={receipt.id}>
                                                    <TableCell className="font-medium">
                                                        {formatDate(receipt.date)}
                                                    </TableCell>
                                                    <TableCell>{receipt.particulars}</TableCell>
                                                    <TableCell>{receipt.rvNumber || '-'}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(receipt.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {receipt.categoryBreakdown && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {Object.entries(receipt.categoryBreakdown)
                                                                    .filter(([_, value]) => value && value > 0)
                                                                    .map(([key, value]) => (
                                                                        <Badge key={key} variant="outline" className="text-xs">
                                                                            {key}: {formatCurrency(value)}
                                                                        </Badge>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            receipt.source === 'manual_entry' ? 'default' :
                                                                receipt.source === 'receipt_scan' ? 'secondary' :
                                                                    'outline'
                                                        }>
                                                            {receipt.source.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Receipt Summary */}
                                <Card className="bg-green-50 border-green-200">
                                    <CardHeader>
                                        <CardTitle className="text-green-800">Receipt Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(report.receiptSummary)
                                                .filter(([key, value]) => key !== 'total' && value > 0)
                                                .map(([key, value]) => (
                                                    <div key={key} className="text-center">
                                                        <p className="text-xs text-green-600 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </p>
                                                        <p className="font-semibold text-green-800">
                                                            {formatCurrency(value)}
                                                        </p>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-green-300">
                                            <div className="text-center">
                                                <p className="text-sm text-green-600">Total Receipts</p>
                                                <p className="text-2xl font-bold text-green-800">
                                                    {formatCurrency(report.receiptSummary.total)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Cash Disbursements Tab */}
                        <TabsContent value="disbursements" className="mt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Cash Disbursements</h3>
                                    <Badge variant="secondary">
                                        {report.cashDisbursements.length} transactions
                                    </Badge>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Particulars</TableHead>
                                                <TableHead>DV No.</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Source</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.cashDisbursements.map((disbursement) => (
                                                <TableRow key={disbursement.id}>
                                                    <TableCell className="font-medium">
                                                        {formatDate(disbursement.date)}
                                                    </TableCell>
                                                    <TableCell>{disbursement.particulars}</TableCell>
                                                    <TableCell>{disbursement.dvNumber || '-'}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(disbursement.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {disbursement.disbursementBreakdown && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {Object.entries(disbursement.disbursementBreakdown)
                                                                    .filter(([_, value]) => value && value > 0)
                                                                    .map(([key, value]) => (
                                                                        <Badge key={key} variant="outline" className="text-xs">
                                                                            {key}: {formatCurrency(value)}
                                                                        </Badge>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            disbursement.source === 'manual_entry' ? 'default' :
                                                                disbursement.source === 'receipt_scan' ? 'secondary' :
                                                                    'outline'
                                                        }>
                                                            {disbursement.source.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Disbursement Summary */}
                                <Card className="bg-red-50 border-red-200">
                                    <CardHeader>
                                        <CardTitle className="text-red-800">Disbursement Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(report.disbursementSummary)
                                                .filter(([key, value]) => key !== 'total' && value > 0)
                                                .map(([key, value]) => (
                                                    <div key={key} className="text-center">
                                                        <p className="text-xs text-red-600 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </p>
                                                        <p className="font-semibold text-red-800">
                                                            {formatCurrency(value)}
                                                        </p>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-red-300">
                                            <div className="text-center">
                                                <p className="text-sm text-red-600">Total Disbursements</p>
                                                <p className="text-2xl font-bold text-red-800">
                                                    {formatCurrency(report.disbursementSummary.total)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Location of Funds Tab */}
                        <TabsContent value="location" className="mt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Location of Funds</h3>
                                    <Badge variant="secondary">
                                        {report.locationOfFunds.length} records
                                    </Badge>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Particulars</TableHead>
                                                <TableHead className="text-center" colSpan={3}>Cash on Hand</TableHead>
                                                <TableHead className="text-center" colSpan={3}>Cash in Bank</TableHead>
                                                <TableHead className="text-center" colSpan={4}>Mass Intention Fund</TableHead>
                                            </TableRow>
                                            <TableRow>
                                                <TableHead></TableHead>
                                                <TableHead></TableHead>
                                                <TableHead className="text-right">In</TableHead>
                                                <TableHead className="text-right">Out</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-right">Deposit</TableHead>
                                                <TableHead className="text-right">Withdrawal</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-right">Mass Int.</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-right">Unsaid</TableHead>
                                                <TableHead className="text-right">Said</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.locationOfFunds.map((record) => (
                                                <TableRow key={record.id}>
                                                    <TableCell className="font-medium">
                                                        {formatDate(record.date)}
                                                    </TableCell>
                                                    <TableCell>{record.particulars}</TableCell>
                                                    <TableCell className="text-right">
                                                        {record.cashOnHand.in ? formatCurrency(record.cashOnHand.in) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {record.cashOnHand.out ? formatCurrency(record.cashOnHand.out) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(record.cashOnHand.balance)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {record.cashInBank.deposit ? formatCurrency(record.cashInBank.deposit) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {record.cashInBank.withdrawal ? formatCurrency(record.cashInBank.withdrawal) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(record.cashInBank.balance)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {record.massIntentionFund.massIntention ? formatCurrency(record.massIntentionFund.massIntention) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(record.massIntentionFund.balance)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {record.massIntentionFund.unsaidIntention ? formatCurrency(record.massIntentionFund.unsaidIntention) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {record.massIntentionFund.saidIntention ? formatCurrency(record.massIntentionFund.saidIntention) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Final Balances Summary */}
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardHeader>
                                        <CardTitle className="text-blue-800">Final Balances</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center">
                                                <p className="text-sm text-blue-600">Cash on Hand</p>
                                                <p className="text-xl font-bold text-blue-800">
                                                    {formatCurrency(report.finalBalances.cashOnHand)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-blue-600">Cash in Bank</p>
                                                <p className="text-xl font-bold text-blue-800">
                                                    {formatCurrency(report.finalBalances.cashInBank)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-blue-600">Friary Fund</p>
                                                <p className="text-xl font-bold text-blue-800">
                                                    {formatCurrency(report.finalBalances.friaryFund)}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-blue-600">Unsaid Mass Intention</p>
                                                <p className="text-xl font-bold text-blue-800">
                                                    {formatCurrency(report.finalBalances.unsaidMassIntention)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-300">
                                            <div className="text-center">
                                                <p className="text-sm text-blue-600">Total Funds</p>
                                                <p className="text-3xl font-bold text-blue-800">
                                                    {formatCurrency(report.finalBalances.total)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Report Authorization */}
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