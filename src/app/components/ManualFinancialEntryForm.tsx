import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    Plus,
    DollarSign,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Upload,
    Trash2
} from 'lucide-react';
import {
    ManualFinancialEntry,
    ManualFinancialEntryService,
    MANUAL_ENTRY_TYPES,
    MANUAL_ENTRY_VALIDATION
} from '../../lib/manual-financial-entries';
import {
    FRIARY_RECEIPTS_CATEGORIES,
    FRIARY_DISBURSEMENTS_CATEGORIES,
    FriaryFinancialCategory
} from '../../lib/friary-financial-categories';

interface ManualFinancialEntryFormProps {
    currentUserId: string;
    currentUserName: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    onEntryCreated: (entry: ManualFinancialEntry) => void;
}

export const ManualFinancialEntryForm: React.FC<ManualFinancialEntryFormProps> = ({
    currentUserId,
    currentUserName,
    userRole,
    onEntryCreated
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        categoryId: 'none',
        type: 'receipt' as 'receipt' | 'disbursement',
        amount: '',
        description: '',
        reference: '',
        entryType: 'bank_transfer' as keyof typeof MANUAL_ENTRY_TYPES,
        notes: '',
        fundSource: 'friary_fund' as 'friary_fund' | 'mass_intention_fund' | 'special_fund'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const permissions = ManualFinancialEntryService.getPermissions(userRole);
    const availableCategories = formData.type === 'receipt'
        ? FRIARY_RECEIPTS_CATEGORIES
        : FRIARY_DISBURSEMENTS_CATEGORIES;

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        MANUAL_ENTRY_VALIDATION.requiredFields.forEach(field => {
            if (field === 'categoryId') {
                if (!formData.categoryId || formData.categoryId === 'none') {
                    newErrors.categoryId = 'Category selection is required';
                }
            } else if (!formData[field as keyof typeof formData]) {
                newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
            }
        });

        // Amount validation
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            newErrors.amount = 'Amount must be a positive number';
        } else if (permissions.maxAmount && amount > permissions.maxAmount) {
            newErrors.amount = `Amount exceeds your limit of ₱${permissions.maxAmount.toLocaleString()}. Requires approval.`;
        }

        // Description length
        if (formData.description.length > MANUAL_ENTRY_VALIDATION.maxDescriptionLength) {
            newErrors.description = `Description must be less than ${MANUAL_ENTRY_VALIDATION.maxDescriptionLength} characters`;
        }

        // Notes length
        if (formData.notes.length > MANUAL_ENTRY_VALIDATION.maxNotesLength) {
            newErrors.notes = `Notes must be less than ${MANUAL_ENTRY_VALIDATION.maxNotesLength} characters`;
        }

        // Reference length
        if (formData.reference.length > MANUAL_ENTRY_VALIDATION.maxReferenceLength) {
            newErrors.reference = `Reference must be less than ${MANUAL_ENTRY_VALIDATION.maxReferenceLength} characters`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const entry = await ManualFinancialEntryService.createEntry({
                date: new Date(formData.date),
                categoryId: formData.categoryId,
                type: formData.type,
                amount: parseFloat(formData.amount),
                description: formData.description,
                reference: formData.reference || undefined,
                entryType: formData.entryType,
                enteredBy: currentUserId,
                enteredByName: currentUserName,
                enteredByRole: userRole,
                notes: formData.notes || undefined,
                fundSource: formData.fundSource
            }, userRole);

            onEntryCreated(entry);
            setIsOpen(false);

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                categoryId: 'none',
                type: 'receipt',
                amount: '',
                description: '',
                reference: '',
                entryType: 'bank_transfer',
                notes: '',
                fundSource: 'friary_fund'
            });
            setErrors({});

        } catch (error) {
            console.error('Error creating manual entry:', error);
            setErrors({ submit: error instanceof Error ? error.message : 'Failed to create entry' });
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = availableCategories.find(cat => cat.id === formData.categoryId && formData.categoryId !== 'none');
    const selectedEntryType = MANUAL_ENTRY_TYPES[formData.entryType];
    const amount = parseFloat(formData.amount);
    const requiresApproval = permissions.maxAmount && amount > permissions.maxAmount;

    if (!permissions.canCreate) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Manual Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Add Manual Financial Entry
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Add financial transactions that don't have physical receipts
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Entry Type and Transaction Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Transaction Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: 'receipt' | 'disbursement') =>
                                    setFormData({ ...formData, type: value, categoryId: 'none' })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="receipt">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            Receipt (Income)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="disbursement">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-red-600" />
                                            Disbursement (Expense)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="entryType">Entry Type</Label>
                            <Select
                                value={formData.entryType}
                                onValueChange={(value: keyof typeof MANUAL_ENTRY_TYPES) =>
                                    setFormData({ ...formData, entryType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(MANUAL_ENTRY_TYPES).map(([key, type]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <span>{type.icon}</span>
                                                {type.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedEntryType && (
                                <p className="text-xs text-muted-foreground">
                                    {selectedEntryType.description}
                                </p>
                            )}
                            {errors.entryType && <p className="text-sm text-red-600">{errors.entryType}</p>}
                        </div>
                    </div>

                    {/* Date and Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                            {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₱)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                            {requiresApproval && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertTriangle className="w-3 h-3" />
                                    Requires approval (exceeds ₱{permissions.maxAmount?.toLocaleString()} limit)
                                </div>
                            )}
                            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="categoryId">Financial Category</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Select a category</SelectItem>
                                {availableCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        <div className="space-y-1">
                                            <div className="font-medium">{category.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {category.description}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedCategory && (
                            <p className="text-xs text-muted-foreground">
                                {selectedCategory.description}
                            </p>
                        )}
                        {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the transaction..."
                            rows={3}
                            maxLength={MANUAL_ENTRY_VALIDATION.maxDescriptionLength}
                            required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Required field</span>
                            <span>{formData.description.length}/{MANUAL_ENTRY_VALIDATION.maxDescriptionLength}</span>
                        </div>
                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                    </div>

                    {/* Reference and Fund Source */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reference">Reference (Optional)</Label>
                            <Input
                                id="reference"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                placeholder="Check #, Transfer ID, etc."
                                maxLength={MANUAL_ENTRY_VALIDATION.maxReferenceLength}
                            />
                            <p className="text-xs text-muted-foreground">
                                Check number, transfer ID, or other reference
                            </p>
                            {errors.reference && <p className="text-sm text-red-600">{errors.reference}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fundSource">Fund Source</Label>
                            <Select
                                value={formData.fundSource}
                                onValueChange={(value: 'friary_fund' | 'mass_intention_fund' | 'special_fund') =>
                                    setFormData({ ...formData, fundSource: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="friary_fund">Friary Fund</SelectItem>
                                    <SelectItem value="mass_intention_fund">Mass Intention Fund</SelectItem>
                                    <SelectItem value="special_fund">Special Fund</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional details, context, or explanations..."
                            rows={2}
                            maxLength={MANUAL_ENTRY_VALIDATION.maxNotesLength}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Optional field</span>
                            <span>{formData.notes.length}/{MANUAL_ENTRY_VALIDATION.maxNotesLength}</span>
                        </div>
                        {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
                    </div>

                    {/* Entry Type Examples */}
                    {selectedEntryType && selectedEntryType.examples.length > 0 && (
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">Examples for {selectedEntryType.label}:</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedEntryType.examples.map((example, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {example}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    {/* Approval Notice */}
                    {requiresApproval && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                                <div className="text-sm text-amber-700">
                                    <p className="font-medium">Approval Required</p>
                                    <p>This entry exceeds your approval limit and will be sent for admin approval.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Entry
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};