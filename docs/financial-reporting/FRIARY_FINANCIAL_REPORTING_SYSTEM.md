# Friary Financial Reporting System

## 🏛️ **Overview**

The Friary Financial Reporting System is a comprehensive financial management solution designed specifically for religious communities, following the accounting standards and practices of OFM South Province Phil. This system integrates seamlessly with the existing receipt management system to provide professional-grade financial reporting capabilities.

## 📊 **Key Features**

### **1. Comprehensive Category System**
- **Receipt Categories**: 13 main income categories including Community Support, Donations, Mass Collections, Ministry fees, and Other Receipts
- **Disbursement Categories**: 35+ expense categories organized into 3 schedules:
  - **Schedule 1**: Operating Expenses (21 categories)
  - **Schedule 2**: Other Form of Disbursements (7 categories)  
  - **Schedule 3**: Extra-Ordinary Disbursements (9 categories)

### **2. Professional Financial Reports**
- **Main Financial Report**: Complete income and expense summary with budget vs actual comparisons
- **Disbursement Schedules**: Detailed breakdown of expenses by category and schedule
- **Cash Position Tracking**: Beginning balance, ending balance, and location of funds
- **Excel Export**: Professional Excel/CSV export functionality

### **3. Integration with Receipt System**
- **Seamless Data Flow**: Automatically categorizes receipts into appropriate financial categories
- **Official/Unofficial Tracking**: Separates official receipts (income) from unofficial receipts (expenses)
- **Real-time Updates**: Financial reports update automatically as receipts are added or modified

### **4. Role-Based Access Control**
- **Admin Access**: Full financial reporting capabilities
- **Super Admin Access**: Complete system oversight and management
- **Staff Access**: View-only access to relevant financial information

## 🏗️ **System Architecture**

### **Core Components**

#### **1. Financial Categories (`friary-financial-categories.ts`)**
```typescript
interface FriaryFinancialCategory {
  id: string;
  name: string;
  description: string;
  type: 'receipt' | 'disbursement';
  schedule?: string;
  budgetable: boolean;
  parentCategory?: string;
}
```

**Receipt Categories:**
- Community Support
- Donations  
- Mass Collections
- Mass Intention
- Ministry
- Share of Stole Fees
- Stole Fees (Parish)
- Subsidy (Custody/Diocese)
- Other Receipts (7 subcategories)

**Disbursement Categories by Schedule:**

**Schedule 1 - Operating Expenses:**
- Allowance, Auto, Food, Grooming & Clothing
- House & Laundry Supplies, Liturgical Paraphernalia
- Medical & Dental, Office Supplies
- Recollections & Retreat, Recreation
- Repair & Maintenance (Friary/Parish/Vehicle)
- SSS/PhilHealth/Pag-Ibig, Subscription & Periodicals
- Support & Allowances, Telephone & Communications
- Transportation & Travel, Utilities (Cable/Electricity/Water)

**Schedule 2 - Other Form of Disbursements:**
- Advances/Loans, Assistance & Benefits
- Community Celebrations, Contribution to Custody
- Gifts & Donation, Plants & Animals Care
- Social Services & Charities

**Schedule 3 - Extra-Ordinary Disbursements:**
- Decoroso Sustento, Documentary Expenses
- Educational/Cultural/Seminars, Friary/Parish Renovation
- Furniture & Fixtures, Hospitalization & Medical
- Kitchen Utensils & Equipment, Machinery & Equipment
- Sacred Images, Vessels, Vestments & Accessories

#### **2. Financial Report Generator (`friary-financial-report.ts`)**
```typescript
interface FriaryFinancialReport {
  friaryName: string;
  address: string;
  reportPeriod: string;
  receipts: FriaryFinancialData[];
  disbursements: FriaryFinancialData[];
  totalReceipts: { budget: number; actual: number; accumulated: number };
  totalDisbursements: { budget: number; actual: number; accumulated: number };
  cashOverShort: { budget: number; actual: number; accumulated: number };
  beginningBalance: number;
  endingBalance: number;
  cashOnHand: number;
  cashInBank: { account: string; friaryFund: number; unsaidMassIntention: number; total: number };
  preparedBy: { name: string; title: string };
  approvedBy: { name: string; title: string };
}
```

#### **3. Report Generator Component (`FriaryFinancialReportGenerator.tsx`)**
- **Interactive Interface**: Month selection, real-time report generation
- **Visual Summary**: Key metrics cards showing totals and balances
- **Detailed Breakdown**: Category-by-category analysis with descriptions
- **Export Functionality**: Excel/CSV export with proper formatting
- **Professional Layout**: Matches traditional friary accounting formats

## 📋 **Report Format**

### **Main Financial Report Structure**
```
OFM South Province Phil
Province of San Antonio de Padua, Philippines
Financial Report
For the Month Ended, [Month Year]

RECEIPTS:                           BUDGET    ACTUAL    ACCUMULATED
Community Support                      -         -           -
Donations                             -         -           -
Mass Collections                      -         -           -
Mass Intention                    3,000.00      -           -
Ministry                          5,000.00      -           -
[... other categories ...]
TOTAL RECEIPTS                   80,520.00      -           -

LESS: TOTAL DISBURSEMENTS        80,520.00      -           -
Cash Over (Short)                     -         -           -
TOTAL CASH OVER (SHORT)               -         -           -

Add: Beginning Balance           137,659.16 137,659.16
ENDING BALANCE                   137,659.16 137,659.16

LOCATION OF FUNDS:
CASH ON HAND (Petty Cash Fund)    26,627.25
CASH IN BANK (BPI: SA No. 9063-0622-08) 111,031.91
  Friary Fund                    111,031.91
  Unsaid Mass Intention               -
T O T A L                        137,659.16

Prepared by:                     Approved by:
Seth F. Monet, ofm              Noniel R. Pe, ofm
House Bursar                    Guardian
```

### **Disbursement Schedules Structure**
```
OFM South Province Phil
Financial Report Schedules
For the Month Ended, [Month Year]

DISBURSEMENTS:                      BUDGET    ACTUAL    ACCUMULATED

Schedule 1 - Operating Expenses
Allowance                         10,000.00      -           -
Auto                                  -         -           -
Food                              30,000.00      -           -
[... other Schedule 1 categories ...]
Sub-Total                         80,520.00      -           -

Schedule 2 - Other Form of Disbursements
[... Schedule 2 categories ...]
Sub-Total                             -         -           -

Schedule 3 - Extra Ordinary Disbursements
[... Schedule 3 categories ...]
Sub-Total                             -         -           -

TOTAL DISBURSEMENTS               80,520.00      -           -
```

## 🔧 **Implementation Details**

### **Integration with Receipt Manager**
The financial reporting system is integrated as a new tab in the Enhanced Receipt Manager:

```typescript
// Tab structure
<TabsList>
  <TabsTrigger value="all">All Receipts</TabsTrigger>
  <TabsTrigger value="official">Official</TabsTrigger>
  <TabsTrigger value="unofficial">Unofficial</TabsTrigger>
  <TabsTrigger value="financial">Financial Report</TabsTrigger>
</TabsList>
```

### **Data Processing Flow**
1. **Receipt Collection**: System gathers all receipts for selected month
2. **Categorization**: Receipts are mapped to appropriate financial categories
3. **Calculation**: Totals are computed for each category and schedule
4. **Report Generation**: Professional report is generated with proper formatting
5. **Export**: Excel/CSV export with multiple sheets (Main Report + Schedules)

### **Category Mapping Logic**
```typescript
// Example mapping logic
FRIARY_RECEIPTS_CATEGORIES.forEach(category => {
  const categoryReceipts = monthReceipts.filter(r => 
    r.category.toLowerCase().includes(category.name.toLowerCase()) ||
    r.description.toLowerCase().includes(category.name.toLowerCase())
  );
  
  const actual = categoryReceipts.reduce((sum, r) => sum + r.amount, 0);
  // ... process data
});
```

## 💰 **Financial Categories Reference**

### **Receipt Categories with Descriptions**

| Category | Description |
|----------|-------------|
| **Community Support** | Salary of friars working in established ministry (Parishes, Schools, Hospitals) |
| **Donations** | Amounts given by faithful without specific intention (including collection boxes) |
| **Mass Collections** | Collections during Holy Mass on weekdays and Sunday |
| **Mass Intention** | Stipends for celebration of masses (Pamisa) for requested intentions |
| **Ministry** | Ministries rendered by friars: masses, recollections, retreats, talks, blessings |
| **Share of Stole Fees** | Share of Friary from Stole Fee in Parish rendered by friars |
| **Stole Fees (Parish)** | Sacraments: baptismal, confirmation, wedding, funeral rendered by friars |
| **Subsidy** | Amounts received from Diocese or Custody in support to local community |

### **Other Receipts Subcategories**

| Category | Description |
|----------|-------------|
| **Account Receivables** | Amount lent to Friars and employees |
| **Cash Returned** | Cash amount returned through refund or expenses balance |
| **Certificates Issuance** | Fees for marriage banns, permits, baptismal, confirmation certificates |
| **Facility Use (Rental)** | Amounts for use of land, building, parking space and facilities |
| **Interest Earned** | Income from deposits, dividends, rents, royalties, investments |
| **Sale of Religious Articles** | Sales of candles, rosary, prayer books, religious articles |
| **Miscellaneous Income** | Other income not classified in above categories |

### **Disbursement Categories by Schedule**

#### **Schedule 1 - Operating Expenses (Budgetable)**
Essential day-to-day operational expenses of the friary and parish.

#### **Schedule 2 - Other Form of Disbursements (Budgetable)**
Additional operational expenses and community support activities.

#### **Schedule 3 - Extra-Ordinary Disbursements (Non-Budgetable)**
Major capital expenditures and extraordinary expenses that occur irregularly.

## 📈 **Usage Instructions**

### **Accessing Financial Reports**
1. Navigate to the Receipt Manager
2. Click on the "Financial Report" tab
3. Select the desired month using the month picker
4. Review the generated report with summary metrics
5. Export to Excel/CSV using the "Export Excel" button

### **Understanding the Report**
- **Green Numbers**: Positive amounts (receipts, surpluses)
- **Red Numbers**: Negative amounts (disbursements, deficits)
- **Blue Numbers**: Neutral amounts (balances, totals)
- **Active Badge**: Categories with transactions in the selected period
- **Expense Badge**: Disbursement categories with activity

### **Export Functionality**
The system generates two sheets:
1. **Financial Report**: Main summary report
2. **Disbursement Schedules**: Detailed expense breakdown

## 🔒 **Security and Access Control**

### **Role-Based Permissions**
- **Super Admin**: Full access to all financial reports and data
- **Admin**: Access to financial reports for their scope (personal/team/all based on preferences)
- **Staff**: Limited access based on assignment and permissions

### **Data Privacy**
- Financial data is filtered based on user role and scope preferences
- Sensitive information is protected through proper authentication
- Audit trails maintain record of report generation and access

## 🚀 **Future Enhancements**

### **Planned Features**
- **Budget Management**: Set and track budgets for each category
- **Multi-Year Reporting**: Compare financial performance across years
- **Advanced Analytics**: Trend analysis and financial forecasting
- **Automated Categorization**: AI-powered receipt categorization
- **Mobile Optimization**: Responsive design for mobile financial reporting

### **Integration Opportunities**
- **Accounting Software**: Export to QuickBooks, Xero, or other systems
- **Banking Integration**: Automatic bank transaction import
- **Tax Reporting**: Generate tax-compliant financial statements
- **Audit Support**: Detailed audit trails and supporting documentation

## 📚 **Technical Documentation**

### **File Structure**
```
src/
├── lib/
│   ├── friary-financial-categories.ts    # Category definitions
│   └── friary-financial-report.ts        # Report generation logic
└── app/components/
    ├── FriaryFinancialReportGenerator.tsx # Main report component
    └── EnhancedReceiptManager.tsx         # Integrated receipt manager
```

### **Key Functions**
- `FriaryFinancialReportGenerator.generateReport()`: Main report generation
- `ExcelExportUtility.createWorkbook()`: Excel export functionality
- `getCategoryById()`, `getCategoriesBySchedule()`: Category utilities
- `ExcelExportUtility.formatCurrency()`: Number formatting

### **Dependencies**
- React 18+ for component framework
- Lucide React for icons
- Tailwind CSS for styling
- Receipt Service for data integration
- User Preferences Service for scope management

## 🎯 **Best Practices**

### **Financial Management**
- Regular monthly report generation
- Consistent categorization of receipts and expenses
- Proper documentation and approval workflows
- Secure storage of financial records

### **System Usage**
- Regular data backups and exports
- Proper user role management
- Regular review of category mappings
- Consistent naming conventions for receipts

### **Compliance**
- Follow religious community accounting standards
- Maintain proper audit trails
- Regular financial reviews and approvals
- Transparent reporting to community leadership

---

The Friary Financial Reporting System provides a comprehensive, professional-grade financial management solution tailored specifically for religious communities. It combines modern technology with traditional accounting practices to ensure accurate, transparent, and compliant financial reporting.