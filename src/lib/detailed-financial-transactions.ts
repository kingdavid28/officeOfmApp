// Detailed Financial Transaction System for Comprehensive Reporting
// Based on Saint Francis of Assisi Friary actual format

export interface DetailedTransaction {
    id: string;
    date: Date;
    particulars: string;
    rvNumber?: string; // Receipt Voucher Number
    dvNumber?: string; // Disbursement Voucher Number
    amount: number;
    type: 'receipt' | 'disbursement';

    // Category breakdown (for receipts)
    categoryBreakdown?: {
        communitySupport?: number;
        donation?: number;
        massCollection?: number;
        massIntention?: number;
        ministry?: number;
        shareOfStoleFees?: number;
        stoleFees?: number;
        subsidy?: number;
        accountReceivable?: number;
        cashReturned?: number;
        certificateIssuance?: number;
        facilityUsed?: number;
        interest?: number;
        salesOfReligiousArticles?: number;
        miscellaneous?: number;
    };

    // Category breakdown (for disbursements)
    disbursementBreakdown?: {
        allowance?: number;
        auto?: number;
        food?: number;
        groomingClothing?: number;
        houseLaundrySupplies?: number;
        liturgicalParaphernalia?: number;
        medicalDental?: number;
        officeSupplies?: number;
        recollectionRetreat?: number;
        recreation?: number;
        repairMaintenance?: number;
        sssPhilHealth?: number;
        subscriptionPeriodicals?: number;
        supportAllowances?: number;
        telephoneCommunication?: number;
        transportationTravel?: number;
        cableTV?: number;
        electricity?: number;
        water?: number;
        advancesLoans?: number;
        assistanceBenefits?: number;
        communityCelebrations?: number;
        contribution?: number;
        giftsDonation?: number;
        plantsAnimalsCare?: number;
        repairMaintenanceVehicle?: number;
        shareOfStoleFeesOut?: number;
        socialServicesCharities?: number;
        decorosoSustento?: number;
        documentaryExpenses?: number;
        educationalCulturalSeminars?: number;
        friaryRenovation?: number;
        furnitureFixtures?: number;
        hospitalizationMedical?: number;
        kitchenUtensils?: number;
        machineryEquipment?: number;
        sacredImagesAccessories?: number;
    };

    // Audit trail
    enteredBy: string;
    enteredByName: string;
    enteredAt: Date;
    approvedBy?: string;
    approvedAt?: Date;

    // Source tracking
    source: 'manual_entry' | 'receipt_scan' | 'bank_import' | 'system_generated';
    sourceReference?: string;
}

export interface CashFlowRecord {
    id: string;
    date: Date;
    particulars: string;

    // Cash on Hand tracking
    cashOnHand: {
        in?: number;
        out?: number;
        balance: number;
    };

    // Bank account tracking
    cashInBank: {
        deposit?: number;
        withdrawal?: number;
        balance: number;
    };

    // Mass Intention Fund tracking
    massIntentionFund: {
        massIntention?: number;
        balance: number;
        unsaidIntention?: number;
        saidIntention?: number;
        intentionBalance: number;
    };
}

export interface DetailedFinancialReport {
    // Header information
    friaryName: string;
    address: string;
    reportPeriod: string;
    reportDate: Date;

    // Detailed transaction records
    cashReceipts: DetailedTransaction[];
    cashDisbursements: DetailedTransaction[];

    // Summary totals by category
    receiptSummary: {
        communitySupport: number;
        donation: number;
        massCollection: number;
        massIntention: number;
        ministry: number;
        shareOfStoleFees: number;
        stoleFees: number;
        subsidy: number;
        accountReceivable: number;
        cashReturned: number;
        certificateIssuance: number;
        facilityUsed: number;
        interest: number;
        salesOfReligiousArticles: number;
        miscellaneous: number;
        total: number;
    };

    disbursementSummary: {
        // Schedule 1 - Operating Expenses
        allowance: number;
        auto: number;
        food: number;
        groomingClothing: number;
        houseLaundrySupplies: number;
        liturgicalParaphernalia: number;
        medicalDental: number;
        officeSupplies: number;
        recollectionRetreat: number;
        recreation: number;
        repairMaintenance: number;
        sssPhilHealth: number;
        subscriptionPeriodicals: number;
        supportAllowances: number;
        telephoneCommunication: number;
        transportationTravel: number;
        cableTV: number;
        electricity: number;
        water: number;

        // Schedule 2 - Other Disbursements
        advancesLoans: number;
        assistanceBenefits: number;
        communityCelebrations: number;
        contribution: number;
        giftsDonation: number;
        plantsAnimalsCore: number;
        repairMaintenanceVehicle: number;
        shareOfStoleFeesOut: number;
        socialServicesCharities: number;

        // Schedule 3 - Extraordinary Disbursements
        decorosoSustento: number;
        documentaryExpenses: number;
        educationalCulturalSeminars: number;
        friaryRenovation: number;
        furnitureFixtures: number;
        hospitalizationMedical: number;
        kitchenUtensils: number;
        machineryEquipment: number;
        sacredImagesAccessories: number;

        total: number;
    };

    // Location of Funds tracking
    locationOfFunds: CashFlowRecord[];

    // Final balances
    finalBalances: {
        cashOnHand: number;
        cashInBank: number;
        friaryFund: number;
        unsaidMassIntention: number;
        total: number;
    };

    // Authorization
    preparedBy: { name: string; title: string };
    approvedBy: { name: string; title: string };
}

export class DetailedFinancialReportService {

    static async generateDetailedReport(
        startDate: Date,
        endDate: Date,
        userRole: 'staff' | 'admin' | 'super_admin',
        userId: string
    ): Promise<DetailedFinancialReport> {

        // Get all transactions for the period
        const transactions = await this.getTransactionsForPeriod(startDate, endDate, userRole, userId);

        // Separate receipts and disbursements
        const cashReceipts = transactions.filter(t => t.type === 'receipt');
        const cashDisbursements = transactions.filter(t => t.type === 'disbursement');

        // Calculate category summaries
        const receiptSummary = this.calculateReceiptSummary(cashReceipts);
        const disbursementSummary = this.calculateDisbursementSummary(cashDisbursements);

        // Get cash flow records
        const locationOfFunds = await this.getCashFlowRecords(startDate, endDate);

        // Calculate final balances
        const finalBalances = this.calculateFinalBalances(locationOfFunds);

        return {
            friaryName: 'Saint Francis of Assisi Friary',
            address: '2 Capricorn St., Pleasant Homes Subdivision, Punta Princesa, Cebu City',
            reportPeriod: `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getFullYear()}`,
            reportDate: new Date(),

            cashReceipts,
            cashDisbursements,
            receiptSummary,
            disbursementSummary,
            locationOfFunds,
            finalBalances,

            preparedBy: { name: 'Seth F. Monet, ofm', title: 'House Bursar' },
            approvedBy: { name: 'Noniel R. Pe, ofm', title: 'Guardian' }
        };
    }

    private static async getTransactionsForPeriod(
        startDate: Date,
        endDate: Date,
        userRole: 'staff' | 'admin' | 'super_admin',
        userId: string
    ): Promise<DetailedTransaction[]> {

        try {
            // In a real implementation, this would query Firestore
            // For now, we'll combine sample data with any existing manual entries

            const transactions: DetailedTransaction[] = [];

            // Sample transactions based on the provided Saint Francis of Assisi Friary format
            const sampleTransactions: DetailedTransaction[] = [
                // January 2022 Sample Receipt Transactions
                {
                    id: 'rec_001',
                    date: new Date('2022-01-02'),
                    particulars: 'Nonoy, ofm: Ministry',
                    rvNumber: '22-001',
                    amount: 1500.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        ministry: 1500.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_002',
                    date: new Date('2022-01-02'),
                    particulars: 'Seth, ofm: Ministry',
                    rvNumber: '22-002',
                    amount: 2000.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        ministry: 2000.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_003',
                    date: new Date('2022-01-03'),
                    particulars: 'CSAPP: Friary Subsidy',
                    rvNumber: '22-003',
                    amount: 72520.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        subsidy: 72520.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_004',
                    date: new Date('2022-01-03'),
                    particulars: 'Tony, ofm: Ministry',
                    rvNumber: '22-004',
                    amount: 1800.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        ministry: 1800.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_005',
                    date: new Date('2022-01-11'),
                    particulars: 'OSC Sariaya: Mass Intention',
                    rvNumber: '22-005',
                    amount: 3000.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        massIntention: 3000.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_006',
                    date: new Date('2022-01-17'),
                    particulars: 'Vir H: News Paper Sales',
                    rvNumber: '22-006',
                    amount: 150.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        salesOfReligiousArticles: 150.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_007',
                    date: new Date('2022-01-21'),
                    particulars: 'Rey, ofm: Ministry',
                    rvNumber: '22-007',
                    amount: 2200.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        ministry: 2200.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'rec_008',
                    date: new Date('2022-01-27'),
                    particulars: 'Errol, ofm: Ministry',
                    rvNumber: '22-008',
                    amount: 1750.00,
                    type: 'receipt',
                    categoryBreakdown: {
                        ministry: 1750.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },

                // Sample Disbursement Transactions
                {
                    id: 'dis_001',
                    date: new Date('2022-01-02'),
                    particulars: 'Richard A: Karne ug Gulay',
                    dvNumber: '22-001',
                    amount: 850.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 850.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_002',
                    date: new Date('2022-01-03'),
                    particulars: 'CSAPP Contribution',
                    dvNumber: '22-002',
                    amount: 5000.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        contribution: 5000.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_003',
                    date: new Date('2022-01-03'),
                    particulars: 'Richard A: Karne',
                    dvNumber: '22-003',
                    amount: 650.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 650.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_004',
                    date: new Date('2022-01-03'),
                    particulars: 'Friars Allowance',
                    dvNumber: '22-004',
                    amount: 10000.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        allowance: 10000.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_005',
                    date: new Date('2022-01-04'),
                    particulars: 'Richard A: Gulay',
                    dvNumber: '22-005',
                    amount: 420.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 420.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_006',
                    date: new Date('2022-01-06'),
                    particulars: 'Richard A: Gulay',
                    dvNumber: '22-006',
                    amount: 380.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 380.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_007',
                    date: new Date('2022-01-06'),
                    particulars: 'Seth, ofm: Various Expenses',
                    dvNumber: '22-007',
                    amount: 1250.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        officeSupplies: 1250.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_008',
                    date: new Date('2022-01-08'),
                    particulars: 'Ma. Luz H: News Paper Payment',
                    dvNumber: '22-008',
                    amount: 180.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        subscriptionPeriodicals: 180.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_009',
                    date: new Date('2022-01-10'),
                    particulars: 'Richard A: Various Expenses',
                    dvNumber: '22-009',
                    amount: 750.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        houseLaundrySupplies: 750.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_010',
                    date: new Date('2022-01-10'),
                    particulars: 'Michael R: Beer Payment & Food',
                    dvNumber: '22-010',
                    amount: 950.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        recreation: 950.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_011',
                    date: new Date('2022-01-11'),
                    particulars: 'Richard A: Marketing Gulay',
                    dvNumber: '22-011',
                    amount: 320.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 320.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_012',
                    date: new Date('2022-01-12'),
                    particulars: 'Richard A: Gulay ug Fish Food',
                    dvNumber: '22-012',
                    amount: 680.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 680.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_013',
                    date: new Date('2022-01-13'),
                    particulars: 'Michael R: Garden Materials',
                    dvNumber: '22-013',
                    amount: 450.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        plantsAnimalsCare: 450.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_014',
                    date: new Date('2022-01-13'),
                    particulars: 'Richard A: Marketing Karne',
                    dvNumber: '22-014',
                    amount: 720.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 720.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_015',
                    date: new Date('2022-01-14'),
                    particulars: 'Errol, ofm: Netflix Payment',
                    dvNumber: '22-015',
                    amount: 549.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        recreation: 549.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_016',
                    date: new Date('2022-01-15'),
                    particulars: 'Richard A: News Paper & Itlog',
                    dvNumber: '22-016',
                    amount: 280.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 200.00,
                        subscriptionPeriodicals: 80.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_017',
                    date: new Date('2022-01-15'),
                    particulars: 'Seth, ofm: Various Expenses',
                    dvNumber: '22-017',
                    amount: 890.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        officeSupplies: 890.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_018',
                    date: new Date('2022-01-15'),
                    particulars: 'Richard A: Marketing Isda',
                    dvNumber: '22-018',
                    amount: 520.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 520.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_019',
                    date: new Date('2022-01-17'),
                    particulars: 'Richard A: Limbas',
                    dvNumber: '22-019',
                    amount: 180.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        houseLaundrySupplies: 180.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_020',
                    date: new Date('2022-01-17'),
                    particulars: 'Richard A: Karne',
                    dvNumber: '22-020',
                    amount: 650.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 650.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_021',
                    date: new Date('2022-01-18'),
                    particulars: 'Seth, ofm: Repair - Washing',
                    dvNumber: '22-021',
                    amount: 1200.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        repairMaintenance: 1200.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_022',
                    date: new Date('2022-01-18'),
                    particulars: 'Errol, ofm: SkyCable',
                    dvNumber: '22-022',
                    amount: 1850.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        cableTV: 1850.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_023',
                    date: new Date('2022-01-18'),
                    particulars: 'Richard A: Marketing Gulay',
                    dvNumber: '22-023',
                    amount: 380.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 380.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_024',
                    date: new Date('2022-01-18'),
                    particulars: 'MCWD: Bill Payment',
                    dvNumber: '22-024',
                    amount: 2150.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        water: 2150.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_025',
                    date: new Date('2022-01-19'),
                    particulars: 'Errol, ofm: Medicine',
                    dvNumber: '22-025',
                    amount: 450.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        medicalDental: 450.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_026',
                    date: new Date('2022-01-21'),
                    particulars: 'Richard A: Marketing Gulay',
                    dvNumber: '22-026',
                    amount: 320.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 320.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_027',
                    date: new Date('2022-01-21'),
                    particulars: 'Ma. Luz H: News Paper Payment',
                    dvNumber: '22-027',
                    amount: 180.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        subscriptionPeriodicals: 180.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_028',
                    date: new Date('2022-01-22'),
                    particulars: 'Richard A: Karne',
                    dvNumber: '22-028',
                    amount: 750.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 750.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_029',
                    date: new Date('2022-01-25'),
                    particulars: 'Richard A: Karne ug Gulay',
                    dvNumber: '22-029',
                    amount: 920.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 920.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_030',
                    date: new Date('2022-01-28'),
                    particulars: 'Richard A: Karne',
                    dvNumber: '22-030',
                    amount: 680.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        food: 680.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_031',
                    date: new Date('2022-01-28'),
                    particulars: 'Ma. Luz H: News Paper Payment',
                    dvNumber: '22-031',
                    amount: 180.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        subscriptionPeriodicals: 180.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_032',
                    date: new Date('2022-01-28'),
                    particulars: 'Parkher S: Repair & Cleaning Aircon',
                    dvNumber: '22-032',
                    amount: 2500.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        repairMaintenance: 2500.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                },
                {
                    id: 'dis_033',
                    date: new Date('2022-01-31'),
                    particulars: 'Errol, ofm: Medicine',
                    dvNumber: '22-033',
                    amount: 380.00,
                    type: 'disbursement',
                    disbursementBreakdown: {
                        medicalDental: 380.00
                    },
                    enteredBy: userId,
                    enteredByName: 'Seth F. Monet, ofm',
                    enteredAt: new Date(),
                    source: 'manual_entry'
                }
            ];

            // Filter transactions for the selected period
            const filteredTransactions = sampleTransactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });

            transactions.push(...filteredTransactions);

            // TODO: Add integration with actual Firestore database
            // const db = getFirestore();
            // const transactionsRef = collection(db, 'detailed_transactions');
            // const q = query(
            //     transactionsRef,
            //     where('date', '>=', startDate),
            //     where('date', '<=', endDate),
            //     orderBy('date', 'desc')
            // );
            // const querySnapshot = await getDocs(q);
            // querySnapshot.forEach((doc) => {
            //     transactions.push({ id: doc.id, ...doc.data() } as DetailedTransaction);
            // });

            return transactions;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }

    private static calculateReceiptSummary(receipts: DetailedTransaction[]) {
        const summary = {
            communitySupport: 0,
            donation: 0,
            massCollection: 0,
            massIntention: 0,
            ministry: 0,
            shareOfStoleFees: 0,
            stoleFees: 0,
            subsidy: 0,
            accountReceivable: 0,
            cashReturned: 0,
            certificateIssuance: 0,
            facilityUsed: 0,
            interest: 0,
            salesOfReligiousArticles: 0,
            miscellaneous: 0,
            total: 0
        };

        receipts.forEach(receipt => {
            if (receipt.categoryBreakdown) {
                Object.keys(summary).forEach(key => {
                    if (key !== 'total' && receipt.categoryBreakdown![key as keyof typeof receipt.categoryBreakdown]) {
                        summary[key as keyof typeof summary] += receipt.categoryBreakdown![key as keyof typeof receipt.categoryBreakdown] || 0;
                    }
                });
            }
            summary.total += receipt.amount;
        });

        return summary;
    }

    private static calculateDisbursementSummary(disbursements: DetailedTransaction[]) {
        const summary = {
            // Schedule 1
            allowance: 0, auto: 0, food: 0, groomingClothing: 0, houseLaundrySupplies: 0,
            liturgicalParaphernalia: 0, medicalDental: 0, officeSupplies: 0, recollectionRetreat: 0,
            recreation: 0, repairMaintenance: 0, sssPhilHealth: 0, subscriptionPeriodicals: 0,
            supportAllowances: 0, telephoneCommunication: 0, transportationTravel: 0,
            cableTV: 0, electricity: 0, water: 0,

            // Schedule 2
            advancesLoans: 0, assistanceBenefits: 0, communityCelebrations: 0, contribution: 0,
            giftsDonation: 0, plantsAnimalsCore: 0, repairMaintenanceVehicle: 0,
            shareOfStoleFeesOut: 0, socialServicesCharities: 0,

            // Schedule 3
            decorosoSustento: 0, documentaryExpenses: 0, educationalCulturalSeminars: 0,
            friaryRenovation: 0, furnitureFixtures: 0, hospitalizationMedical: 0,
            kitchenUtensils: 0, machineryEquipment: 0, sacredImagesAccessories: 0,

            total: 0
        };

        disbursements.forEach(disbursement => {
            if (disbursement.disbursementBreakdown) {
                Object.keys(summary).forEach(key => {
                    if (key !== 'total' && disbursement.disbursementBreakdown![key as keyof typeof disbursement.disbursementBreakdown]) {
                        summary[key as keyof typeof summary] += disbursement.disbursementBreakdown![key as keyof typeof disbursement.disbursementBreakdown] || 0;
                    }
                });
            }
            summary.total += disbursement.amount;
        });

        return summary;
    }

    private static async getCashFlowRecords(startDate: Date, endDate: Date): Promise<CashFlowRecord[]> {
        // Sample cash flow records based on the provided Saint Francis of Assisi Friary format
        const records: CashFlowRecord[] = [
            {
                id: 'cf_001',
                date: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
                particulars: 'Beginning Balance',
                cashOnHand: { balance: 26627.25 },
                cashInBank: { balance: 111031.91 },
                massIntentionFund: {
                    balance: 111031.91,
                    intentionBalance: 0
                }
            },
            {
                id: 'cf_002',
                date: new Date('2022-01-11'),
                particulars: 'OSC Sariaya: Mass Intention',
                cashOnHand: { balance: 26627.25 },
                cashInBank: { balance: 111031.91 },
                massIntentionFund: {
                    massIntention: 3000.00,
                    balance: 111031.91,
                    intentionBalance: 3000.00
                }
            },
            {
                id: 'cf_003',
                date: new Date('2022-01-19'),
                particulars: 'Cash Withdrawal',
                cashOnHand: {
                    in: 15000.00,
                    balance: 41627.25
                },
                cashInBank: {
                    withdrawal: 15000.00,
                    balance: 96031.91
                },
                massIntentionFund: {
                    balance: 96031.91,
                    intentionBalance: 3000.00
                }
            },
            {
                id: 'cf_004',
                date: new Date('2022-01-31'),
                particulars: 'Said - Mass Intention',
                cashOnHand: { balance: 41627.25 },
                cashInBank: { balance: 96031.91 },
                massIntentionFund: {
                    balance: 96031.91,
                    saidIntention: 1500.00,
                    intentionBalance: 1500.00
                }
            }
        ];

        // Filter records for the selected period
        return records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= startDate && recordDate <= endDate;
        });
    }

    private static calculateFinalBalances(cashFlowRecords: CashFlowRecord[]) {
        const lastRecord = cashFlowRecords[cashFlowRecords.length - 1];

        return {
            cashOnHand: lastRecord?.cashOnHand.balance || 0,
            cashInBank: lastRecord?.cashInBank.balance || 0,
            friaryFund: lastRecord?.cashInBank.balance || 0,
            unsaidMassIntention: lastRecord?.massIntentionFund.intentionBalance || 0,
            total: (lastRecord?.cashOnHand.balance || 0) + (lastRecord?.cashInBank.balance || 0)
        };
    }

    static generateDetailedExcelReport(report: DetailedFinancialReport): any[][] {
        const data: any[][] = [];

        // CASH RECEIPTS SECTION
        data.push([report.friaryName]);
        data.push(['CASH RECEIPTS']);
        data.push([`For the Month Ended, ${report.reportPeriod}`]);
        data.push([]);

        // Headers for Cash Receipts
        data.push([
            'DATE', 'PARTICULARS', 'RV No.', 'AMOUNT',
            'Com\'ty Supp', 'Donation', 'Mass Coll.', 'Mass Int\'n', 'Ministry',
            'Share of SF', 'Stole Fees', 'Subsidy', 'A/R', 'Cash Ret.',
            'Cert. Iss.', 'F. Used', 'Interest', 'Sales of RA', 'Miscel.'
        ]);

        // Cash Receipts Data
        report.cashReceipts.forEach(receipt => {
            data.push([
                receipt.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
                receipt.particulars,
                receipt.rvNumber || '',
                receipt.amount,
                receipt.categoryBreakdown?.communitySupport || '',
                receipt.categoryBreakdown?.donation || '',
                receipt.categoryBreakdown?.massCollection || '',
                receipt.categoryBreakdown?.massIntention || '',
                receipt.categoryBreakdown?.ministry || '',
                receipt.categoryBreakdown?.shareOfStoleFees || '',
                receipt.categoryBreakdown?.stoleFees || '',
                receipt.categoryBreakdown?.subsidy || '',
                receipt.categoryBreakdown?.accountReceivable || '',
                receipt.categoryBreakdown?.cashReturned || '',
                receipt.categoryBreakdown?.certificateIssuance || '',
                receipt.categoryBreakdown?.facilityUsed || '',
                receipt.categoryBreakdown?.interest || '',
                receipt.categoryBreakdown?.salesOfReligiousArticles || '',
                receipt.categoryBreakdown?.miscellaneous || ''
            ]);
        });

        // Totals row for receipts
        data.push([
            '', '', '', 'TOTAL',
            report.receiptSummary.communitySupport || '',
            report.receiptSummary.donation || '',
            report.receiptSummary.massCollection || '',
            report.receiptSummary.massIntention || '',
            report.receiptSummary.ministry || '',
            report.receiptSummary.shareOfStoleFees || '',
            report.receiptSummary.stoleFees || '',
            report.receiptSummary.subsidy || '',
            report.receiptSummary.accountReceivable || '',
            report.receiptSummary.cashReturned || '',
            report.receiptSummary.certificateIssuance || '',
            report.receiptSummary.facilityUsed || '',
            report.receiptSummary.interest || '',
            report.receiptSummary.salesOfReligiousArticles || '',
            report.receiptSummary.miscellaneous || ''
        ]);

        data.push([]);
        data.push([]);

        // CASH DISBURSEMENTS SECTION
        data.push([report.friaryName]);
        data.push(['CASH DISBURSEMENTS']);
        data.push([`For the Month Ended, ${report.reportPeriod}`]);
        data.push([]);

        // Headers for Cash Disbursements (Schedule 1)
        data.push([
            'DATE', 'PARTICULARS', 'DV. No.', 'AMOUNT',
            'Allowance', 'Auto', 'Food', 'G & C', 'H & L Supp', 'Lit. Phara',
            'Med & Den', 'Office Supp', 'Rec & Ret', 'Recreation', 'Rep & Main',
            'SSS/PhilH', 'Subs & Per', 'Sup & Allow', 'Tel & Comm', 'Trans & Tra',
            'Cable TV', 'Electricity', 'Water'
        ]);

        // Cash Disbursements Data
        report.cashDisbursements.forEach(disbursement => {
            data.push([
                disbursement.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
                disbursement.particulars,
                disbursement.dvNumber || '',
                disbursement.amount,
                disbursement.disbursementBreakdown?.allowance || '',
                disbursement.disbursementBreakdown?.auto || '',
                disbursement.disbursementBreakdown?.food || '',
                disbursement.disbursementBreakdown?.groomingClothing || '',
                disbursement.disbursementBreakdown?.houseLaundrySupplies || '',
                disbursement.disbursementBreakdown?.liturgicalParaphernalia || '',
                disbursement.disbursementBreakdown?.medicalDental || '',
                disbursement.disbursementBreakdown?.officeSupplies || '',
                disbursement.disbursementBreakdown?.recollectionRetreat || '',
                disbursement.disbursementBreakdown?.recreation || '',
                disbursement.disbursementBreakdown?.repairMaintenance || '',
                disbursement.disbursementBreakdown?.sssPhilHealth || '',
                disbursement.disbursementBreakdown?.subscriptionPeriodicals || '',
                disbursement.disbursementBreakdown?.supportAllowances || '',
                disbursement.disbursementBreakdown?.telephoneCommunication || '',
                disbursement.disbursementBreakdown?.transportationTravel || '',
                disbursement.disbursementBreakdown?.cableTV || '',
                disbursement.disbursementBreakdown?.electricity || '',
                disbursement.disbursementBreakdown?.water || ''
            ]);
        });

        // Subtotal row
        data.push([
            '', '', '', 'SUBTOTAL',
            report.disbursementSummary.allowance || '',
            report.disbursementSummary.auto || '',
            report.disbursementSummary.food || '',
            report.disbursementSummary.groomingClothing || '',
            report.disbursementSummary.houseLaundrySupplies || '',
            report.disbursementSummary.liturgicalParaphernalia || '',
            report.disbursementSummary.medicalDental || '',
            report.disbursementSummary.officeSupplies || '',
            report.disbursementSummary.recollectionRetreat || '',
            report.disbursementSummary.recreation || '',
            report.disbursementSummary.repairMaintenance || '',
            report.disbursementSummary.sssPhilHealth || '',
            report.disbursementSummary.subscriptionPeriodicals || '',
            report.disbursementSummary.supportAllowances || '',
            report.disbursementSummary.telephoneCommunication || '',
            report.disbursementSummary.transportationTravel || '',
            report.disbursementSummary.cableTV || '',
            report.disbursementSummary.electricity || '',
            report.disbursementSummary.water || ''
        ]);

        data.push([]);
        data.push([]);

        // LOCATION OF FUNDS SECTION
        data.push([report.friaryName]);
        data.push(['LOCATION OF FUNDS']);
        data.push([`For the Month Ended, ${report.reportPeriod}`]);
        data.push([]);

        // Location of Funds Headers
        data.push([
            'DATE', 'PARTICULARS',
            'CASH ON HAND', '', '',
            'CASH IN BANK', '', '',
            'FRIARY FUND', 'UNSAID MASS INTENTION', '', '', '', ''
        ]);
        data.push([
            '', '',
            'IN', 'OUT', 'BALANCE',
            'DEPOSIT', 'W\'DRAWAL', 'BALANCE',
            'MASS INT.', 'BALANCE', 'UNSAID INT.', 'SAID INT.', 'BALANCE', ''
        ]);

        // Location of Funds Data
        report.locationOfFunds.forEach(record => {
            data.push([
                record.date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
                record.particulars,
                record.cashOnHand.in || '',
                record.cashOnHand.out || '',
                record.cashOnHand.balance,
                record.cashInBank.deposit || '',
                record.cashInBank.withdrawal || '',
                record.cashInBank.balance,
                record.massIntentionFund.massIntention || '',
                record.massIntentionFund.balance,
                record.massIntentionFund.unsaidIntention || '',
                record.massIntentionFund.saidIntention || '',
                record.massIntentionFund.intentionBalance,
                ''
            ]);
        });

        // Final totals
        data.push([
            '', 'TOTAL',
            '', '', report.finalBalances.cashOnHand,
            '', '', report.finalBalances.cashInBank,
            '', report.finalBalances.friaryFund,
            '', '', report.finalBalances.unsaidMassIntention,
            ''
        ]);

        return data;
    }
}