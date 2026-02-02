// Manual Financial Entry System for Comprehensive Financial Reporting

export interface ManualFinancialEntry {
    id: string;
    date: Date;
    categoryId: string; // Links to friary financial categories
    type: 'receipt' | 'disbursement';
    amount: number;
    description: string;
    reference?: string; // Check number, transfer ID, etc.
    entryType: 'bank_transfer' | 'cash_transaction' | 'adjustment' | 'accrual' | 'online_payment' | 'direct_debit' | 'other';

    // Audit trail
    enteredBy: string; // User ID who entered this
    enteredByName: string;
    enteredByRole: 'staff' | 'admin' | 'super_admin';
    enteredAt: Date;

    // Approval workflow
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    rejectionReason?: string;

    // Supporting documentation
    supportingDocuments?: string[]; // URLs to uploaded documents
    notes?: string;

    // Accounting details
    accountCode?: string;
    fundSource?: 'friary_fund' | 'mass_intention_fund' | 'special_fund';
    isRecurring?: boolean;
    recurringSchedule?: 'monthly' | 'quarterly' | 'annually';
}

export interface ManualEntryPermissions {
    canCreate: boolean;
    canApprove: boolean;
    canEdit: boolean;
    canDelete: boolean;
    maxAmount?: number; // Maximum amount user can enter without approval
    requiresApproval: boolean;
}

export class ManualFinancialEntryService {

    // Get permissions based on user role
    static getPermissions(userRole: 'staff' | 'admin' | 'super_admin'): ManualEntryPermissions {
        switch (userRole) {
            case 'staff':
                return {
                    canCreate: true,
                    canApprove: false,
                    canEdit: false, // Can only edit their own pending entries
                    canDelete: false,
                    maxAmount: 5000, // ₱5,000 limit without approval
                    requiresApproval: true
                };

            case 'admin':
                return {
                    canCreate: true,
                    canApprove: true, // Can approve staff entries
                    canEdit: true, // Can edit staff entries and own entries
                    canDelete: true, // Can delete pending entries
                    maxAmount: 50000, // ₱50,000 limit without super admin approval
                    requiresApproval: false // For amounts under limit
                };

            case 'super_admin':
                return {
                    canCreate: true,
                    canApprove: true, // Can approve all entries
                    canEdit: true, // Can edit any entry
                    canDelete: true, // Can delete any entry
                    maxAmount: undefined, // No limit
                    requiresApproval: false
                };

            default:
                return {
                    canCreate: false,
                    canApprove: false,
                    canEdit: false,
                    canDelete: false,
                    requiresApproval: true
                };
        }
    }

    // Create new manual entry
    static async createEntry(
        entry: Omit<ManualFinancialEntry, 'id' | 'enteredAt' | 'status'>,
        userRole: 'staff' | 'admin' | 'super_admin'
    ): Promise<ManualFinancialEntry> {
        const permissions = this.getPermissions(userRole);

        if (!permissions.canCreate) {
            throw new Error('Insufficient permissions to create financial entries');
        }

        // Check amount limits
        if (permissions.maxAmount && entry.amount > permissions.maxAmount) {
            if (!permissions.requiresApproval) {
                throw new Error(`Amount exceeds limit of ₱${permissions.maxAmount.toLocaleString()}. Requires approval.`);
            }
        }

        const newEntry: ManualFinancialEntry = {
            ...entry,
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            enteredAt: new Date(),
            status: permissions.requiresApproval &&
                permissions.maxAmount &&
                entry.amount > permissions.maxAmount ? 'pending' : 'approved'
        };

        // In real implementation, save to Firestore
        // await firestore.collection('manual_financial_entries').doc(newEntry.id).set(newEntry);

        return newEntry;
    }

    // Get entries for financial reporting
    static async getEntriesForPeriod(
        startDate: Date,
        endDate: Date,
        userRole: 'staff' | 'admin' | 'super_admin',
        userId: string
    ): Promise<ManualFinancialEntry[]> {
        // In real implementation, query Firestore
        // This is a mock implementation

        const allEntries: ManualFinancialEntry[] = []; // Would come from database

        // Filter based on user role and permissions
        if (userRole === 'super_admin') {
            // Super admin sees all entries
            return allEntries.filter(entry =>
                entry.date >= startDate &&
                entry.date <= endDate &&
                entry.status === 'approved'
            );
        } else if (userRole === 'admin') {
            // Admin sees their entries + staff entries assigned to them
            return allEntries.filter(entry =>
                entry.date >= startDate &&
                entry.date <= endDate &&
                entry.status === 'approved' &&
                (entry.enteredBy === userId || entry.enteredByRole === 'staff')
            );
        } else {
            // Staff sees only their own entries
            return allEntries.filter(entry =>
                entry.date >= startDate &&
                entry.date <= endDate &&
                entry.status === 'approved' &&
                entry.enteredBy === userId
            );
        }
    }

    // Approve entry
    static async approveEntry(
        entryId: string,
        approverId: string,
        approverName: string,
        approverRole: 'admin' | 'super_admin'
    ): Promise<void> {
        const permissions = this.getPermissions(approverRole);

        if (!permissions.canApprove) {
            throw new Error('Insufficient permissions to approve entries');
        }

        // In real implementation, update Firestore
        // await firestore.collection('manual_financial_entries').doc(entryId).update({
        //   status: 'approved',
        //   approvedBy: approverId,
        //   approvedByName: approverName,
        //   approvedAt: new Date()
        // });
    }

    // Reject entry
    static async rejectEntry(
        entryId: string,
        approverId: string,
        approverName: string,
        reason: string,
        approverRole: 'admin' | 'super_admin'
    ): Promise<void> {
        const permissions = this.getPermissions(approverRole);

        if (!permissions.canApprove) {
            throw new Error('Insufficient permissions to reject entries');
        }

        // In real implementation, update Firestore
        // await firestore.collection('manual_financial_entries').doc(entryId).update({
        //   status: 'rejected',
        //   approvedBy: approverId,
        //   approvedByName: approverName,
        //   approvedAt: new Date(),
        //   rejectionReason: reason
        // });
    }
}

// Common entry types with descriptions
export const MANUAL_ENTRY_TYPES = {
    bank_transfer: {
        label: 'Bank Transfer',
        description: 'Electronic transfers, wire transfers, online banking',
        icon: '🏦',
        examples: ['Diocese subsidy transfer', 'Salary payments', 'Vendor payments']
    },
    cash_transaction: {
        label: 'Cash Transaction',
        description: 'Cash transactions without physical receipts',
        icon: '💵',
        examples: ['Cash donations', 'Petty cash expenses', 'Collection box contents']
    },
    adjustment: {
        label: 'Adjustment',
        description: 'Corrections, reclassifications, adjusting entries',
        icon: '⚖️',
        examples: ['Error corrections', 'Reclassifications', 'Accrual adjustments']
    },
    accrual: {
        label: 'Accrual',
        description: 'Accrued income or expenses',
        icon: '📅',
        examples: ['Accrued utilities', 'Prepaid expenses', 'Deferred income']
    },
    online_payment: {
        label: 'Online Payment',
        description: 'Digital payments, e-wallets, online services',
        icon: '💳',
        examples: ['Online subscriptions', 'Digital services', 'E-wallet transactions']
    },
    direct_debit: {
        label: 'Direct Debit',
        description: 'Automatic payments, recurring charges',
        icon: '🔄',
        examples: ['Utility auto-pay', 'Loan payments', 'Insurance premiums']
    },
    other: {
        label: 'Other',
        description: 'Other financial transactions',
        icon: '📝',
        examples: ['Miscellaneous transactions', 'Special cases']
    }
};

// Validation rules
export const MANUAL_ENTRY_VALIDATION = {
    maxDescriptionLength: 500,
    maxNotesLength: 1000,
    maxReferenceLength: 100,
    requiredFields: ['date', 'categoryId', 'type', 'amount', 'description', 'entryType'],
    amountLimits: {
        staff: 5000,
        admin: 50000,
        super_admin: undefined
    }
};