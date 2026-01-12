export type ReceiptType = 'official' | 'unofficial';
export type ReceiptStatus = 'pending' | 'approved' | 'rejected';

export interface ReceiptCategory {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
}

export interface Receipt {
    id: string;
    title: string;
    description?: string;
    amount: number;
    category: string;
    categoryId: string;
    type: ReceiptType; // official or unofficial
    status: ReceiptStatus;
    date: string;
    imageUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    tags: string[];
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: Date;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedByName?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
    metadata?: {
        vendor?: string;
        invoiceNumber?: string;
        taxAmount?: number;
        notes?: string;
    };
    // Access control
    ownerId: string; // User who owns this receipt
    assignedAdminId?: string; // For staff receipts - which admin they belong to
    visibility: 'private' | 'admin' | 'public'; // Who can see this receipt
}

export interface ReceiptFilter {
    category?: string;
    type?: ReceiptType;
    status?: ReceiptStatus;
    dateFrom?: string;
    dateTo?: string;
    uploadedBy?: string;
    tags?: string[];
    amountMin?: number;
    amountMax?: number;
}

export interface ReceiptStats {
    totalReceipts: number;
    totalAmount: number;
    officialReceipts: number;
    unofficialReceipts: number;
    pendingApprovals: number;
    approvedReceipts: number;
    rejectedReceipts: number;
    categoriesBreakdown: { [category: string]: { count: number; amount: number } };
}

// Default receipt categories
export const DEFAULT_RECEIPT_CATEGORIES: Omit<ReceiptCategory, 'id' | 'createdBy' | 'createdAt'>[] = [
    {
        name: 'Office Supplies',
        description: 'Stationery, paper, pens, and other office materials',
        isActive: true
    },
    {
        name: 'Transportation',
        description: 'Travel expenses, fuel, public transport, taxi fares',
        isActive: true
    },
    {
        name: 'Utilities',
        description: 'Electricity, water, internet, phone bills',
        isActive: true
    },
    {
        name: 'Meals & Entertainment',
        description: 'Business meals, client entertainment, catering',
        isActive: true
    },
    {
        name: 'Equipment',
        description: 'Computers, furniture, machinery, tools',
        isActive: true
    },
    {
        name: 'Services',
        description: 'Professional services, consulting, maintenance',
        isActive: true
    },
    {
        name: 'Marketing & Advertising',
        description: 'Promotional materials, advertising costs, marketing campaigns',
        isActive: true
    },
    {
        name: 'Training & Education',
        description: 'Courses, seminars, training materials, certifications',
        isActive: true
    },
    {
        name: 'Medical & Health',
        description: 'Medical expenses, health insurance, wellness programs',
        isActive: true
    },
    {
        name: 'Legal & Compliance',
        description: 'Legal fees, permits, licenses, regulatory compliance',
        isActive: true
    },
    {
        name: 'Maintenance & Repairs',
        description: 'Building maintenance, equipment repairs, cleaning services',
        isActive: true
    },
    {
        name: 'Other',
        description: 'Miscellaneous expenses not covered by other categories',
        isActive: true
    }
];