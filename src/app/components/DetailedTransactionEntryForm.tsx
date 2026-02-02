import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    DetailedTransaction,
    DetailedFinancialReportService
} from '../../lib/detailed-financial-transactions';
import {
    FRIARY_RECEIPTS_CATEGORIES,
    FRIARY_DISBURSEMENTS_CATEGORIES,
    FriaryFinancialCategory
} from '../../lib/friary-financial-categories';
import { Plus, Receipt, CreditCard, Save, X } from 'lucide-react';

interface DetailedTransactionEntryFormProps {
    currentUserId: string;
    currentUserName: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    onTransactionCreated: (transaction: DetailedTransaction) => void;
}

export const DetailedTransactionEntryForm: React.FC<DetailedTransactionEntryFormProps> = ({
    currentUserId,
    currentUserName,
    userRole,
    onTransactionCreated
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState<'receipt' | 'disbursement'>('receipt');

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        particulars: '',
        amount: '',
        categoryId: '',
        subcategoryBreakdown: {} as Record<string, number>
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const availableCategories = transactionType === 'receipt'
        ? FRIARY_RECEIPTS_CATEGORIES
        : FRIARY_DISBURSEMENTS_CATEGORIES;

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            particulars: '',
            amount: '',
            categoryId: '',
            subcategoryBreakdown: {}
        });
        setErrors({});
        setTransactionType('receipt');
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.particulars.trim()) {
            newErrors.particulars = 'Particulars are required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Valid amount is required';
        }

        if (!formData.categoryId) {
            newErrors.categoryId = 'Category selection is required';
        }

        // Role-based amount limits
        const amount = parseFloat(formData.amount);
        if (userRole === 'staff' && amount > 5000) {
            newErrors.amount = 'Staff members can only enter transactions up to ₱5,000';
        } else if (userRole === 'admin' && amount > 50000) {
            newErrors.amount = 'Admin members can only enter transactions up to ₱50,000';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generateVoucherNumber = (): string => {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');

        const prefix = transactionType === 'receipt' ? 'RV' : 'DV';
        return `${year}-${month}${day}-${random}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const selectedCategory = availableCategories.find(cat => cat.id === formData.categoryId);

            // Create category breakdown
            const categoryBreakdown = transactionType === 'receipt' ? {
                [formData.categoryId]: parseFloat(formData.amount)
            } : undefined;

            const disbursementBreakdown = transactionType === 'disbursement' ? {
                [formData.categoryId]: parseFloat(formData.amount)
            } : undefined;

            const transaction: DetailedTransaction = {
                id: `${transactionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date(formData.date),
                particulars: formData.particulars,
                amount: parseFloat(formData.amount),
                type: transactionType,

                // Voucher numbers
                ...(transactionType === 'receipt' ?
                    { rvNumber: generateVoucherNumber() } :
                    { dvNumber: generateVoucherNumber() }
                ),

                // Category breakdowns
                categoryBreakdown,
                disbursementBreakdown,

                // Audit trail
                enteredBy: currentUserId,
                enteredByName: currentUserName,
                enteredAt: new Date(),
                source: 'manual_entry'
            };

            // In a real implementation, this would save to the database
            // For now, we'll just call the callback
            onTransactionCreated(transaction);

            resetForm();
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating transaction:', error);
            setErrors({ submit: 'Failed to create transaction. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {transactionType === 'receipt' ? (
                            <Receipt className="w-5 h-5 text-green-600" />
                        ) : (
                            <CreditCard className="w-5 h-5 text-red-600" />
                        )}
                        Add Detailed Transaction
                    </DialogTitle>
                    <DialogDescription>
                        Create a detailed financial transaction with proper voucher numbering and category breakdown.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Transaction Type Selection */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={transactionType === 'receipt' ? 'default' : 'outline'}
                            onClick={() => {
                                setTransactionType('receipt');
                                setFormData(prev => ({ ...prev, categoryId: '' }));
                            }}
                            className="flex-1"
                        >
                            <Receipt className="w-4 h-4 mr-2" />
                            Cash Receipt
                        </Button>
                        <Button
                            type="button"
                            variant={transactionType === 'disbursement' ? 'default' : 'outline'}
                            onClick={() => {
                                setTransactionType('disbursement');
                                setFormData(prev => ({ ...prev, categoryId: '' }));
                            }}
                            className="flex-1"
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Cash Disbursement
                        </Button>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                className={errors.date ? 'border-red-500' : ''}
                            />
                            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₱)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                className={errors.amount ? 'border-red-500' : ''}
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}

                            {/* Role-based limits display */}
                            <div className="text-xs text-muted-foreground">
                                {userRole === 'staff' && 'Staff limit: ₱5,000'}
                                {userRole === 'admin' && 'Admin limit: ₱50,000'}
                                {userRole === 'super_admin' && 'No limit (Super Admin)'}
                            </div>
                        </div>
                    </div>

                    {/* Particulars */}
                    <div className="space-y-2">
                        <Label htmlFor="particulars">Particulars</Label>
                        <Textarea
                            id="particulars"
                            placeholder="Describe the transaction details..."
                            value={formData.particulars}
                            onChange={(e) => setFormData(prev => ({ ...prev, particulars: e.target.value }))}
                            className={errors.particulars ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {errors.particulars && <p className="text-sm text-red-500">{errors.particulars}</p>}
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                        >
                            <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{category.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {category.description}
                                            </span>
                                            {category.schedule && (
                                                <Badge variant="outline" className="text-xs mt-1 w-fit">
                                                    {category.schedule}
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
                    </div>

                    {/* Preview */}
                    {formData.particulars && formData.amount && formData.categoryId && (
                        <Card className="bg-gray-50">
                            <CardHeader>
                                <CardTitle className="text-sm">Transaction Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Type:</span>
                                    <Badge variant={transactionType === 'receipt' ? 'default' : 'destructive'}>
                                        {transactionType === 'receipt' ? 'Cash Receipt' : 'Cash Disbursement'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Voucher No.:</span>
                                    <span className="font-mono">{generateVoucherNumber()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Amount:</span>
                                    <span className="font-medium">₱{parseFloat(formData.amount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Category:</span>
                                    <span>{availableCategories.find(cat => cat.id === formData.categoryId)?.name}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm();
                                setIsOpen(false);
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Creating...' : 'Create Transaction'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};