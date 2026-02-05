// Franciscan Financial Categories
// Reflects the life and mission of OFM Province of San Antonio de Padua

export interface CategoryGroup {
    id: string;
    name: string;
    description: string;
    subcategories: Category[];
}

export interface Category {
    id: string;
    name: string;
    description: string;
    examples?: string[];
    budgetGuideline?: string;
}

// Main category groups for Franciscan life
export const franciscanCategoryGroups: CategoryGroup[] = [
    {
        id: 'community_living',
        name: 'Community Living',
        description: 'Daily expenses for friary life and brotherhood',
        subcategories: [
            {
                id: 'food_household',
                name: 'Food & Household Supplies',
                description: 'Groceries, meals, cleaning supplies, toiletries',
                examples: [
                    'Groceries for community meals',
                    'Cleaning supplies',
                    'Toiletries and personal care',
                    'Kitchen supplies'
                ],
                budgetGuideline: 'Typically 30-40% of community budget'
            },
            {
                id: 'utilities',
                name: 'Utilities',
                description: 'Water, electricity, internet, phone',
                examples: [
                    'Electric bill',
                    'Water bill',
                    'Internet/WiFi',
                    'Phone/mobile',
                    'Gas/LPG'
                ],
                budgetGuideline: 'Typically 15-20% of community budget'
            },
            {
                id: 'maintenance',
                name: 'House Maintenance & Repairs',
                description: 'Repairs, renovations, property upkeep',
                examples: [
                    'Plumbing repairs',
                    'Electrical work',
                    'Painting',
                    'Roof repairs',
                    'Appliance repairs'
                ],
                budgetGuideline: 'Variable, set aside 10-15% for emergencies'
            },
            {
                id: 'transportation',
                name: 'Community Transportation',
                description: 'Vehicle maintenance, fuel, public transport',
                examples: [
                    'Gasoline/diesel',
                    'Vehicle maintenance',
                    'Public transportation',
                    'Parking fees',
                    'Vehicle registration'
                ],
                budgetGuideline: 'Typically 10-15% of community budget'
            }
        ]
    },
    {
        id: 'ministry_apostolate',
        name: 'Ministry & Apostolate',
        description: 'Expenses for evangelization and service',
        subcategories: [
            {
                id: 'parish_operations',
                name: 'Parish Operations',
                description: 'Parish ministry, liturgy, sacraments',
                examples: [
                    'Liturgical supplies',
                    'Parish events',
                    'Sacramental materials',
                    'Church maintenance',
                    'Parish programs'
                ],
                budgetGuideline: 'Varies by parish size and activities'
            },
            {
                id: 'education_programs',
                name: 'Education Programs',
                description: 'Schools, catechesis, youth ministry',
                examples: [
                    'School supplies',
                    'Catechism materials',
                    'Youth programs',
                    'Educational events',
                    'Teacher support'
                ],
                budgetGuideline: 'Based on number of students/programs'
            },
            {
                id: 'social_services',
                name: 'Social Services & Outreach',
                description: 'Charity, assistance to poor, social programs',
                examples: [
                    'Food assistance',
                    'Medical aid',
                    'Disaster relief',
                    'Livelihood programs',
                    'Community development'
                ],
                budgetGuideline: 'Franciscan priority - allocate generously'
            },
            {
                id: 'evangelization',
                name: 'Evangelization & Mission',
                description: 'Mission trips, retreats, evangelization',
                examples: [
                    'Mission trips',
                    'Evangelization materials',
                    'Retreat expenses',
                    'Mission supplies',
                    'Outreach programs'
                ],
                budgetGuideline: 'Core Franciscan mission'
            }
        ]
    },
    {
        id: 'formation_education',
        name: 'Formation & Education',
        description: 'Seminary, ongoing formation, education',
        subcategories: [
            {
                id: 'seminary_expenses',
                name: 'Seminary Expenses',
                description: 'Tuition, board, formation programs',
                examples: [
                    'Seminary tuition',
                    'Board and lodging',
                    'Formation materials',
                    'Spiritual direction',
                    'Formator expenses'
                ],
                budgetGuideline: 'Investment in future - prioritize'
            },
            {
                id: 'continuing_education',
                name: 'Continuing Education',
                description: 'Courses, workshops, professional development',
                examples: [
                    'Theology courses',
                    'Workshops and seminars',
                    'Professional development',
                    'Language courses',
                    'Specialized training'
                ],
                budgetGuideline: 'Ongoing formation is essential'
            },
            {
                id: 'books_resources',
                name: 'Books & Resources',
                description: 'Books, subscriptions, educational materials',
                examples: [
                    'Theological books',
                    'Subscriptions',
                    'Study materials',
                    'Library resources',
                    'Online courses'
                ],
                budgetGuideline: 'Support intellectual life'
            },
            {
                id: 'retreats_spiritual',
                name: 'Retreats & Spiritual Programs',
                description: 'Annual retreats, days of recollection',
                examples: [
                    'Annual retreat',
                    'Days of recollection',
                    'Spiritual direction',
                    'Pilgrimage expenses',
                    'Spiritual programs'
                ],
                budgetGuideline: 'Essential for Franciscan life'
            }
        ]
    },
    {
        id: 'healthcare_welfare',
        name: 'Healthcare & Welfare',
        description: 'Medical care, insurance, retirement',
        subcategories: [
            {
                id: 'medical_dental',
                name: 'Medical & Dental',
                description: 'Doctor visits, medicines, treatments',
                examples: [
                    'Doctor consultations',
                    'Medicines',
                    'Laboratory tests',
                    'Dental care',
                    'Hospital bills'
                ],
                budgetGuideline: 'Essential - do not compromise health'
            },
            {
                id: 'health_insurance',
                name: 'Health Insurance',
                description: 'PhilHealth, HMO, insurance premiums',
                examples: [
                    'PhilHealth contributions',
                    'HMO premiums',
                    'Life insurance',
                    'Accident insurance'
                ],
                budgetGuideline: 'Mandatory for all friars'
            },
            {
                id: 'retirement_fund',
                name: 'Retirement Fund Contribution',
                description: 'Contributions to Province retirement fund',
                examples: [
                    'Monthly retirement contribution',
                    'Senior friars support',
                    'Long-term care fund'
                ],
                budgetGuideline: 'Regular monthly contribution required'
            },
            {
                id: 'emergency_assistance',
                name: 'Emergency Assistance',
                description: 'Urgent medical needs, emergencies',
                examples: [
                    'Emergency hospitalization',
                    'Urgent medical procedures',
                    'Crisis intervention',
                    'Unexpected health needs'
                ],
                budgetGuideline: 'Maintain emergency fund'
            }
        ]
    },
    {
        id: 'province_administration',
        name: 'Province Administration',
        description: 'Provincial office, governance, communications',
        subcategories: [
            {
                id: 'office_operations',
                name: 'Office Operations',
                description: 'Office supplies, equipment, operations',
                examples: [
                    'Office supplies',
                    'Equipment',
                    'Printing and copying',
                    'Office maintenance',
                    'Postage and courier'
                ],
                budgetGuideline: 'Keep minimal - Franciscan simplicity'
            },
            {
                id: 'communications_it',
                name: 'Communications & IT',
                description: 'Website, software, IT infrastructure',
                examples: [
                    'Website hosting',
                    'Software licenses',
                    'IT equipment',
                    'Communications tools',
                    'Social media'
                ],
                budgetGuideline: 'Modern tools for mission'
            },
            {
                id: 'travel_meetings',
                name: 'Travel & Meetings',
                description: 'Provincial meetings, visitations, travel',
                examples: [
                    'Provincial Chapter',
                    'Council meetings',
                    'Visitation expenses',
                    'Inter-provincial meetings',
                    'Travel allowances'
                ],
                budgetGuideline: 'Necessary for governance'
            },
            {
                id: 'legal_professional',
                name: 'Legal & Professional Fees',
                description: 'Legal services, accounting, professional fees',
                examples: [
                    'Legal consultations',
                    'Accounting services',
                    'Audit fees',
                    'Professional services',
                    'Compliance fees'
                ],
                budgetGuideline: 'Ensure proper compliance'
            }
        ]
    }
];

// Flatten categories for easy dropdown use
export const getAllCategories = (): Category[] => {
    return franciscanCategoryGroups.flatMap(group =>
        group.subcategories.map(cat => ({
            ...cat,
            groupName: group.name,
            groupId: group.id
        }))
    );
};

// Get category by ID
export const getCategoryById = (id: string): Category | undefined => {
    for (const group of franciscanCategoryGroups) {
        const category = group.subcategories.find(cat => cat.id === id);
        if (category) {
            return { ...category, groupName: group.name, groupId: group.id };
        }
    }
    return undefined;
};

// Get categories by group
export const getCategoriesByGroup = (groupId: string): Category[] => {
    const group = franciscanCategoryGroups.find(g => g.id === groupId);
    return group ? group.subcategories : [];
};

// Helper to format category for display
export const formatCategoryDisplay = (categoryId: string): string => {
    const category = getCategoryById(categoryId);
    if (!category) return categoryId;
    return `${category.groupName} → ${category.name}`;
};

// Migration helper: Map old categories to new ones
export const migrateLegacyCategory = (oldCategory: string): string => {
    const mapping: Record<string, string> = {
        'food': 'food_household',
        'officeSupplies': 'office_operations',
        'houseLaundrySupplies': 'food_household',
        'utilities': 'utilities',
        'maintenance': 'maintenance',
        'transportation': 'transportation',
        'medical': 'medical_dental',
        'education': 'continuing_education',
        'ministry': 'parish_operations',
        'other': 'office_operations'
    };

    return mapping[oldCategory] || 'office_operations';
};
