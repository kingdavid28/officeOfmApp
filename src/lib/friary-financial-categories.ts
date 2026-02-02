// Friary Financial Categories based on Saint Francis of Assisi Friary accounting system

export interface FriaryFinancialCategory {
    id: string;
    name: string;
    description: string;
    type: 'receipt' | 'disbursement';
    schedule?: string;
    budgetable: boolean;
    parentCategory?: string;
}

export const FRIARY_RECEIPTS_CATEGORIES: FriaryFinancialCategory[] = [
    // Main Receipt Categories
    {
        id: 'community_support',
        name: 'Community Support',
        description: 'Salary of friars working in established ministry (Parishes, Schools, Hospitals)',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'donations',
        name: 'Donations',
        description: 'Amounts given by faithful as donations without specific intention (including collection boxes)',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'mass_collections',
        name: 'Mass Collections',
        description: 'Collections during Holy Mass on weekdays and Sunday',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'mass_intention',
        name: 'Mass Intention',
        description: 'Stipends for celebration of masses (Pamisa) for requested intentions',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'ministry',
        name: 'Ministry',
        description: 'Ministries rendered by friars: masses, recollections, retreats, talks, teachings, blessings',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'share_stole_fees',
        name: 'Share of Stole Fees (Friary)',
        description: 'Share of Friary from Stole Fee in Parish rendered by friars',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'stole_fees_parish',
        name: 'Stole Fees (Parish)',
        description: 'Sacraments: baptismal, confirmation, wedding, funeral rendered by friars',
        type: 'receipt',
        budgetable: true
    },
    {
        id: 'subsidy',
        name: 'Subsidy (Custody/Diocese)',
        description: 'Amounts received from Diocese or Custody in support to local community',
        type: 'receipt',
        budgetable: true
    },

    // Other Receipts
    {
        id: 'account_receivables',
        name: 'Account Receivables',
        description: 'Amount lent to Friars and employees',
        type: 'receipt',
        budgetable: false,
        parentCategory: 'other_receipts'
    },
    {
        id: 'cash_returned',
        name: 'Cash Returned',
        description: 'Cash amount returned through refund or expenses balance',
        type: 'receipt',
        budgetable: false,
        parentCategory: 'other_receipts'
    },
    {
        id: 'certificates_issuance',
        name: 'Certificates Issuance (Parish)',
        description: 'Fees for marriage banns, permits, baptismal, confirmation, marriage certificates',
        type: 'receipt',
        budgetable: true,
        parentCategory: 'other_receipts'
    },
    {
        id: 'facility_rental',
        name: 'Facility Use (Rental)',
        description: 'Amounts for use of land, building, parking space and other facilities',
        type: 'receipt',
        budgetable: true,
        parentCategory: 'other_receipts'
    },
    {
        id: 'interest_earned',
        name: 'Interest Earned (net)',
        description: 'Income from deposits, dividends, rents, royalties, and other investments',
        type: 'receipt',
        budgetable: true,
        parentCategory: 'other_receipts'
    },
    {
        id: 'religious_articles_sales',
        name: 'Sale of Religious Articles',
        description: 'Sales of candles, rosary, prayer books, and other religious articles',
        type: 'receipt',
        budgetable: true,
        parentCategory: 'other_receipts'
    },
    {
        id: 'miscellaneous_income',
        name: 'Miscellaneous Income',
        description: 'Other income not classified in above categories',
        type: 'receipt',
        budgetable: false,
        parentCategory: 'other_receipts'
    }
];

export const FRIARY_DISBURSEMENTS_CATEGORIES: FriaryFinancialCategory[] = [
    // Schedule 1 - Operating Expenses
    {
        id: 'allowance',
        name: 'Allowance',
        description: 'Monthly allowance of friars for personal needs and travel allowance during vacation',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'auto',
        name: 'Auto',
        description: 'Gasoline, oil, minor repairs, licenses renewal and other vehicle needs',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'food',
        name: 'Food',
        description: 'All food, drinking water, LPG, and grocery items for simple but decent living',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'grooming_clothing',
        name: 'Grooming & Clothing',
        description: 'Hair cutting, deodorizer, bath soap, toothbrush, clothes, pants, underwear',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'house_laundry_supplies',
        name: 'House & Laundry Supplies',
        description: 'House cleaning materials, laundry materials (soap, zonrox, downy)',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'liturgical_paraphernalia',
        name: 'Liturgical Paraphernalia',
        description: 'Sacristy supplies, mass wine, hosts, candles, flowers, decorations, incense',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'medical_dental',
        name: 'Medical & Dental',
        description: 'Medicine, medical needs, multi-vitamins, maintenance medicine, dental visits',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'office_supplies',
        name: 'Office Supplies',
        description: 'Papers, pens, printed materials (receipts, envelopes, certificates)',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'recollections_retreat',
        name: 'Recollections & Retreat',
        description: 'House chapter, monthly recollection, seminars, retreats for spiritual formation',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'recreation',
        name: 'Recreation',
        description: 'Community bonding: foods, drinks, games, movies, eat-out as community',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'repair_maintenance_friary',
        name: 'Repair & Maintenance - Friary',
        description: 'Building maintenance and minor repairs of friary buildings',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'repair_maintenance_parish',
        name: 'Repair & Maintenance - Parish',
        description: 'Building maintenance and minor repairs of parish buildings',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'repair_maintenance_vehicle',
        name: 'Repair & Maintenance - Vehicle',
        description: 'Minor repairs of vehicles and equipment',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'sss_philhealth',
        name: 'SSS/PhilHealth/Pag-Ibig',
        description: 'Benefits and contributions for lay personnel and workers',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'subscription_periodicals',
        name: 'Subscription & Periodicals',
        description: 'Books, subscriptions to periodicals and newspapers',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'support_allowances',
        name: 'Support & Allowances (Salaries & Wages)',
        description: 'Salaries of employees, honorarium of choirs, organists rendering services',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'telephone_communications',
        name: 'Telephone & Other Communications',
        description: 'PLDT bills, postage, LBC, internet and other communications expenses',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'transportation_travel',
        name: 'Transportation & Travel',
        description: 'Transportation expenses of friars, parish and friary workers',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'utilities_cable',
        name: 'Utilities - Cable TV',
        description: 'Cable TV bills',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'utilities_electricity',
        name: 'Utilities - Electricity',
        description: 'Electricity bills',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },
    {
        id: 'utilities_water',
        name: 'Utilities - Water',
        description: 'Water bills',
        type: 'disbursement',
        schedule: 'Schedule 1',
        budgetable: true
    },

    // Schedule 2 - Other Form of Disbursements
    {
        id: 'advances_loans',
        name: 'Advances/Loans (Employees)',
        description: 'Cash advances to employees payable in installments',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },
    {
        id: 'assistance_benefits',
        name: 'Assistance & Benefits',
        description: '13th month pay, bonuses, retirement benefits stipulated by law',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },
    {
        id: 'community_celebrations',
        name: 'Community Celebrations',
        description: 'Food and groceries for birthday, anniversary, fiesta celebrations',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },
    {
        id: 'contribution_custody',
        name: 'Contribution to Custody',
        description: 'Monthly contribution, donation, support to Formation Fund and Health Fund',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },
    {
        id: 'gifts_donation',
        name: 'Gifts & Donation',
        description: 'Gifts for friars (birthday, anniversary, Christmas) and financial support',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },
    {
        id: 'plants_animals_care',
        name: 'Plants & Animals Care',
        description: 'Animal and pet food, plant fertilizer, agricultural expenses',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },
    {
        id: 'social_services_charities',
        name: 'Social Services & Charities',
        description: 'Donations to poor and needy in parish or friary',
        type: 'disbursement',
        schedule: 'Schedule 2',
        budgetable: true
    },

    // Schedule 3 - Extra-Ordinary Disbursements
    {
        id: 'decoroso_sustento',
        name: 'Decoroso Sustento',
        description: 'Stipend for guest priests/friars administering fiesta, wedding, baptism, confirmation, funerals',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'documentary_expenses',
        name: 'Documentary Expenses',
        description: 'Licenses (marriage, driver), legal documents, passport, visa, other documents',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'educational_cultural_seminars',
        name: 'Educational, Cultural & Seminars',
        description: 'Ongoing studies expenses and professional help shouldered by friary',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'friary_parish_renovation',
        name: 'Friary/Parish Renovation',
        description: 'Major repair of friary or buildings',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'furniture_fixtures',
        name: 'Furniture & Fixtures',
        description: 'Pews, benches, confessional boxes, chairs, beds, bookshelves, chandeliers, cabinets',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'hospitalization_medical',
        name: 'Hospitalization & Medical',
        description: 'Hospital confinement expenses and major medical treatments',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'kitchen_utensils_equipment',
        name: 'Kitchen Utensils & Equipment',
        description: 'Oven stoves, refrigerators, coolers, freezers, rice cooker, pots, pans, plates, glassware',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'machinery_equipment',
        name: 'Machinery & Equipment',
        description: 'Sound systems, amplifiers, microphones, generators, calculators, air conditioners, computers',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    },
    {
        id: 'sacred_images_vessels_vestments',
        name: 'Sacred Images, Vessels, Vestments & Accessories',
        description: 'Statues, crucifixes, stations of cross, chalices, ciboria, monstrances, tabernacles, vestments',
        type: 'disbursement',
        schedule: 'Schedule 3',
        budgetable: false
    }
];

export const ALL_FRIARY_CATEGORIES = [
    ...FRIARY_RECEIPTS_CATEGORIES,
    ...FRIARY_DISBURSEMENTS_CATEGORIES
];

// Helper functions
export const getCategoryById = (id: string): FriaryFinancialCategory | undefined => {
    return ALL_FRIARY_CATEGORIES.find(cat => cat.id === id);
};

export const getReceiptCategories = (): FriaryFinancialCategory[] => {
    return FRIARY_RECEIPTS_CATEGORIES;
};

export const getDisbursementCategories = (): FriaryFinancialCategory[] => {
    return FRIARY_DISBURSEMENTS_CATEGORIES;
};

export const getCategoriesBySchedule = (schedule: string): FriaryFinancialCategory[] => {
    return FRIARY_DISBURSEMENTS_CATEGORIES.filter(cat => cat.schedule === schedule);
};

export const getBudgetableCategories = (): FriaryFinancialCategory[] => {
    return ALL_FRIARY_CATEGORIES.filter(cat => cat.budgetable);
};