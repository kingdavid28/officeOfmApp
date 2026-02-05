// Excel Template Generator for Friary Financial Reports
// This utility creates properly formatted Excel templates that match the traditional friary format

export interface ExcelCellStyle {
    font?: {
        bold?: boolean;
        size?: number;
        name?: string;
    };
    alignment?: {
        horizontal?: 'left' | 'center' | 'right';
        vertical?: 'top' | 'middle' | 'bottom';
    };
    border?: {
        top?: boolean;
        bottom?: boolean;
        left?: boolean;
        right?: boolean;
    };
    fill?: {
        color?: string;
    };
    numberFormat?: string;
}

export interface ExcelCell {
    value: string | number;
    style?: ExcelCellStyle;
    merge?: {
        colspan?: number;
        rowspan?: number;
    };
}

export class ExcelTemplateGenerator {

    static generateFriaryReportTemplate(): ExcelCell[][] {
        const template: ExcelCell[][] = [];

        // Header Section
        template.push([
            {
                value: 'OFM South Province Phil',
                style: {
                    font: { bold: true, size: 14 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([
            {
                value: 'Province of San Antonio de Padua, Philippines',
                style: {
                    font: { size: 10 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([
            {
                value: 'Financial Report',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([
            {
                value: 'For the Month Ended, January 31, 2022',
                style: {
                    font: { size: 10 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Column Headers
        template.push([
            {
                value: 'RECEIPTS:',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'left' }
                }
            },
            {
                value: 'BUDGET',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' }
                }
            },
            {
                value: 'ACTUAL',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' }
                }
            },
            {
                value: 'ACCUMULATED',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' }
                }
            }
        ]);

        // Receipt Categories
        const receiptCategories = [
            'Community Support',
            'Donations',
            'Mass Collections',
            'Mass Intention',
            'Ministry',
            'Share of Stole Fees (Friary)',
            'Stole Fees (Parish)',
            'Subsidy (Custody/Diocese)'
        ];

        receiptCategories.forEach(category => {
            template.push([
                { value: category, style: { alignment: { horizontal: 'left' } } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } }
            ]);
        });

        // Other Receipts Section
        template.push([
            { value: 'Other Receipts:', style: { font: { bold: true } } },
            { value: '' },
            { value: '' },
            { value: '' }
        ]);

        const otherReceiptCategories = [
            'Account Receivables',
            'Cash Returned',
            'Certificates Issuance',
            'Facility Use (Rental)',
            'Interest Earned (net)',
            'Sale of Religious Articles',
            'Miscellaneous Income'
        ];

        otherReceiptCategories.forEach(category => {
            template.push([
                { value: `  ${category}`, style: { alignment: { horizontal: 'left' } } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } }
            ]);
        });

        // Total Receipts
        template.push([
            {
                value: 'TOTAL RECEIPTS',
                style: {
                    font: { bold: true },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '80,520.00',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Disbursements
        template.push([
            {
                value: 'LESS: TOTAL DISBURSEMENTS',
                style: { font: { bold: true } }
            },
            {
                value: '80,520.00',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            }
        ]);

        // Cash Over/Short
        template.push([
            { value: 'Cash Over (Short)', style: { font: { bold: true } } },
            { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
            { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
            { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } }
        ]);

        template.push([
            {
                value: 'TOTAL CASH OVER (SHORT)',
                style: {
                    font: { bold: true },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Cash Position
        template.push([
            { value: 'Add: Beginning Balance', style: { font: { bold: true } } },
            {
                value: '137,659.16',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            {
                value: '137,659.16',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            { value: '' }
        ]);

        template.push([
            {
                value: 'ENDING BALANCE',
                style: {
                    font: { bold: true, size: 12 },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '137,659.16',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '137,659.16',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            { value: '' }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row
        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Location of Funds
        template.push([
            {
                value: 'LOCATION OF FUNDS:',
                style: {
                    font: { bold: true, size: 12 }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([
            { value: 'CASH ON HAND (Petty Cash Fund)', style: { alignment: { horizontal: 'left' } } },
            {
                value: '26,627.25',
                style: {
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            { value: '' },
            { value: '' }
        ]);

        template.push([
            { value: 'CASH IN BANK (BPI: SA No. 9063-0622-08)', style: { alignment: { horizontal: 'left' } } },
            {
                value: '111,031.91',
                style: {
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            { value: '' },
            { value: '' }
        ]);

        template.push([
            { value: '  Friary Fund', style: { alignment: { horizontal: 'left' } } },
            {
                value: '111,031.91',
                style: {
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            { value: '' },
            { value: '' }
        ]);

        template.push([
            { value: '  Unsaid Mass Intention', style: { alignment: { horizontal: 'left' } } },
            {
                value: '-',
                style: {
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00'
                }
            },
            { value: '' },
            { value: '' }
        ]);

        template.push([
            {
                value: 'T O T A L',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'left' },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '137,659.16',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            { value: '' },
            { value: '' }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row
        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row
        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Signatures
        template.push([
            { value: 'Prepared by:', style: { font: { bold: true } } },
            { value: '' },
            { value: 'Approved by:', style: { font: { bold: true } } },
            { value: '' }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row
        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row
        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        template.push([
            {
                value: 'Seth F. Monet, ofm',
                style: {
                    font: { bold: true },
                    border: { top: true }
                }
            },
            { value: '' },
            {
                value: 'Noniel R. Pe, ofm',
                style: {
                    font: { bold: true },
                    border: { top: true }
                }
            },
            { value: '' }
        ]);

        template.push([
            { value: 'House Bursar', style: { font: { size: 10 } } },
            { value: '' },
            { value: 'Guardian', style: { font: { size: 10 } } },
            { value: '' }
        ]);

        return template;
    }

    static generateDisbursementSchedulesTemplate(): ExcelCell[][] {
        const template: ExcelCell[][] = [];

        // Header Section
        template.push([
            {
                value: 'OFM South Province Phil',
                style: {
                    font: { bold: true, size: 14 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([
            {
                value: 'Financial Report Schedules',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([
            {
                value: 'For the Month Ended, January 31, 2022',
                style: {
                    font: { size: 10 },
                    alignment: { horizontal: 'center' }
                },
                merge: { colspan: 4 }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Column Headers
        template.push([
            {
                value: 'DISBURSEMENTS:',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'left' }
                }
            },
            {
                value: 'BUDGET',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' }
                }
            },
            {
                value: 'ACTUAL',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' }
                }
            },
            {
                value: 'ACCUMULATED',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'center' }
                }
            }
        ]);

        // Schedule 1 - Operating Expenses
        template.push([
            {
                value: 'Schedule 1 - Operating Expenses',
                style: {
                    font: { bold: true },
                    fill: { color: '#E6F3FF' }
                },
                merge: { colspan: 4 }
            }
        ]);

        const schedule1Categories = [
            { name: 'Allowance', budget: '10,000.00' },
            { name: 'Auto', budget: '-' },
            { name: 'Food', budget: '30,000.00' },
            { name: 'Grooming & Clothing', budget: '4,000.00' },
            { name: 'House & Laundry Supplies', budget: '4,000.00' },
            { name: 'Liturgical Paraphernalia', budget: '500.00' },
            { name: 'Medical & Dental', budget: '5,000.00' },
            { name: 'Office Supplies', budget: '500.00' },
            { name: 'Recollections & Retreat', budget: '1,000.00' },
            { name: 'Recreation', budget: '4,000.00' },
            { name: 'Repair & Maintenance - Friary/Parish', budget: '2,000.00' },
            { name: 'SSS/Phil. Health Contribution', budget: '520.00' },
            { name: 'Subscription & Periodicals', budget: '1,000.00' },
            { name: 'Support & Allowances (Sal & Wages)', budget: '9,000.00' },
            { name: 'Telephone & Other Communications', budget: '4,500.00' },
            { name: 'Transportations & Travel', budget: '1,000.00' },
            { name: 'Utilities: Cable TV', budget: '500.00' },
            { name: 'Electricity', budget: '-' },
            { name: 'Water', budget: '3,000.00' }
        ];

        schedule1Categories.forEach(category => {
            template.push([
                { value: category.name, style: { alignment: { horizontal: 'left' } } },
                { value: category.budget, style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } }
            ]);
        });

        template.push([
            {
                value: 'Sub-Total',
                style: {
                    font: { bold: true },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '80,520.00',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Schedule 2 - Other Form of Disbursements
        template.push([
            {
                value: 'Schedule 2 - Other Form of Disbursements',
                style: {
                    font: { bold: true },
                    fill: { color: '#FFF2E6' }
                },
                merge: { colspan: 4 }
            }
        ]);

        const schedule2Categories = [
            'Advances/Loans',
            'Assistance & Benefits',
            'Community Celebrations',
            'Contribution: CSAPP',
            'Gifts & Donation',
            'Plants and Animal Care',
            'Repair & Maintenance - Vehicle',
            'Share of Stole Fees',
            'Social Services & Charities'
        ];

        schedule2Categories.forEach(category => {
            template.push([
                { value: category, style: { alignment: { horizontal: 'left' } } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } }
            ]);
        });

        template.push([
            {
                value: 'Sub-Total',
                style: {
                    font: { bold: true },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Schedule 3 - Extra Ordinary Disbursements
        template.push([
            {
                value: 'Schedule 3 - Extra Ordinary Disbursements',
                style: {
                    font: { bold: true },
                    fill: { color: '#F0F8E6' }
                },
                merge: { colspan: 4 }
            }
        ]);

        const schedule3Categories = [
            'Decoroso Sustento',
            'Documentary Expenses',
            'Educational; Cultural & Seminars',
            'Friary/Parish Renovation',
            'Furnitures and Fixtures',
            'Hospitalization & Medical Expenses',
            'Kitchen Utensil & Equipment',
            'Machinery & Equipment',
            'Sacred Images & Accessories'
        ];

        schedule3Categories.forEach(category => {
            template.push([
                { value: category, style: { alignment: { horizontal: 'left' } } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } },
                { value: '-', style: { alignment: { horizontal: 'right' }, numberFormat: '#,##0.00' } }
            ]);
        });

        template.push([
            {
                value: 'Sub-Total',
                style: {
                    font: { bold: true },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            }
        ]);

        template.push([{ value: '', merge: { colspan: 4 } }]); // Empty row

        // Total Disbursements
        template.push([
            {
                value: 'TOTAL DISBURSEMENTS',
                style: {
                    font: { bold: true, size: 12 },
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '80,520.00',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            },
            {
                value: '-',
                style: {
                    font: { bold: true, size: 12 },
                    alignment: { horizontal: 'right' },
                    numberFormat: '#,##0.00',
                    border: { top: true, bottom: true }
                }
            }
        ]);

        return template;
    }

    static convertToCSV(template: ExcelCell[][]): string {
        return template.map(row =>
            row.map(cell => {
                const value = cell.value.toString();
                // Escape quotes and wrap in quotes if contains comma
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        ).join('\n');
    }

    static downloadTemplate(filename: string, template: ExcelCell[][]) {
        const csvContent = this.convertToCSV(template);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}