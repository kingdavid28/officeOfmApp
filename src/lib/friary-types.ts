// Friary and Organization Types for San Antonio de Padua Province

export type FriaryType = 'friary' | 'school' | 'formation_house' | 'retreat_center' | 'parish';

export interface Friary {
    id: string;
    name: string;
    location: string;
    type: FriaryType;
    guardian: string; // User ID of the Guardian/Director
    guardianName?: string; // Display name
    members: string[]; // Array of User IDs
    memberCount?: number; // Computed field
    phone?: string;
    email?: string;
    address?: string;
    established?: string;
    ministries?: string[];
    budget?: FriaryBudget;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FriaryBudget {
    annual: number;
    monthly: number;
    categories: Record<string, number>; // Category ID -> Amount
    fiscalYearStart?: Date;
}

export interface Ministry {
    id: string;
    name: string;
    type: 'parish' | 'education' | 'social' | 'formation' | 'healthcare' | 'retreat' | 'mission' | 'other';
    friaryId: string;
    coordinator: string; // User ID
    coordinatorName?: string;
    description?: string;
    budget?: number;
    beneficiaries?: number;
    startDate?: Date;
    endDate?: Date;
    status: 'active' | 'inactive' | 'planned';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProvinceStats {
    totalCommunities: number;
    totalFriars: number;
    totalFriaries: number;
    totalSchools: number;
    totalFormationHouses: number;
    totalParishes: number;
    totalRetreatCenters: number;
    totalMinistries: number;
    totalBudget: number;
    totalExpenses: number;
}

export interface FriaryStats {
    totalFiles: number;
    totalExpenses: number;
    monthlyBudget: number;
    budgetUtilization: number;
    recentDocuments: any[];
    recentExpenses: any[];
    memberCount: number;
}

// User roles with vice positions
export type UserRole =
    | 'super_admin'           // Provincial Minister
    | 'vice_super_admin'      // Vice Provincial / Provincial Vicar
    | 'admin'                 // Guardian (Friary Superior)
    | 'vice_admin'            // Vice Guardian
    | 'provincial_treasurer'  // Provincial Treasurer
    | 'treasurer'             // Local Treasurer
    | 'staff'                 // General Friar
    | 'guest';                // External collaborator

// Helper function to get friary type display name
export const getFriaryTypeDisplay = (type: FriaryType): string => {
    const displayNames: Record<FriaryType, string> = {
        friary: 'Friary',
        school: 'School',
        formation_house: 'Formation House',
        retreat_center: 'Retreat Center',
        parish: 'Parish'
    };
    return displayNames[type] || type;
};

// Helper function to get ministry type display name
export const getMinistryTypeDisplay = (type: Ministry['type']): string => {
    const displayNames: Record<Ministry['type'], string> = {
        parish: 'Parish Ministry',
        education: 'Education',
        social: 'Social Services',
        formation: 'Formation',
        healthcare: 'Healthcare',
        retreat: 'Retreat Ministry',
        mission: 'Mission Work',
        other: 'Other'
    };
    return displayNames[type] || type;
};

// Sample data for development - Actual San Antonio de Padua Province Communities
export const SAMPLE_FRIARIES: Friary[] = [
    // CEBU
    {
        id: 'cebu-postulancy',
        name: 'Postulancy Formation House',
        location: 'Cebu',
        type: 'formation_house',
        guardian: '',
        guardianName: 'Fr. Formator',
        members: [],
        memberCount: 0,
        ministries: ['Postulancy Formation']
    },
    {
        id: 'cebu-renewal-center',
        name: 'Franciscan Renewal Center',
        location: 'Minglanilla, Cebu',
        type: 'retreat_center',
        guardian: '',
        guardianName: 'Fr. Director',
        members: [],
        memberCount: 0,
        ministries: ['Retreats', 'Spiritual Renewal']
    },
    {
        id: 'cebu-provincial-house',
        name: 'St. Francis of Assisi Provincial House Friary',
        location: 'Labangon, Cebu',
        type: 'friary',
        guardian: '',
        guardianName: 'Fr. Guardian',
        members: [],
        memberCount: 0,
        ministries: ['Provincial Administration', 'Community Life']
    },
    {
        id: 'cebu-sambag-parish',
        name: 'San Vicente Ferrer Parish–Franciscan Friary',
        location: 'Sambag 2, Cebu',
        type: 'parish',
        guardian: '',
        guardianName: 'Fr. Parish Priest',
        members: [],
        memberCount: 0,
        ministries: ['Parish Ministry', 'Sacraments']
    },

    // NORTHERN SAMAR
    {
        id: 'allen-college',
        name: 'St. Francis College',
        location: 'Allen, Northern Samar',
        type: 'school',
        guardian: '',
        guardianName: 'Fr. President',
        members: [],
        memberCount: 0,
        ministries: ['Higher Education', 'Formation']
    },

    // CALBAYOG, SAMAR
    {
        id: 'calbayog-aspirancy',
        name: 'San Damiano Aspirancy Formation House',
        location: 'Calbayog, Samar',
        type: 'formation_house',
        guardian: '',
        guardianName: 'Fr. Formator',
        members: [],
        memberCount: 0,
        ministries: ['Aspirancy Formation', 'Vocation Discernment']
    },
    {
        id: 'calbayog-college',
        name: 'Christ the King College',
        location: 'East Awang, Calbayog, Samar',
        type: 'school',
        guardian: '',
        guardianName: 'Fr. President',
        members: [],
        memberCount: 0,
        ministries: ['Higher Education', 'Community Service']
    },

    // NEGROS ORIENTAL
    {
        id: 'guihulngan-college',
        name: 'Saint Francis College',
        location: 'Guihulngan, Negros Oriental',
        type: 'school',
        guardian: '',
        guardianName: 'Fr. President',
        members: [],
        memberCount: 0,
        ministries: ['Higher Education', 'Values Formation']
    },
    {
        id: 'lalibertad-school',
        name: 'St. Francis School',
        location: 'La Libertad, Negros Oriental',
        type: 'school',
        guardian: '',
        guardianName: 'Fr. Director',
        members: [],
        memberCount: 0,
        ministries: ['Basic Education', 'Youth Formation']
    },

    // BILIRAN
    {
        id: 'kawayan-parish',
        name: 'Saint Raphael Archangel Parish',
        location: 'Kawayan, Biliran',
        type: 'parish',
        guardian: '',
        guardianName: 'Fr. Parish Priest',
        members: [],
        memberCount: 0,
        ministries: ['Parish Ministry', 'Community Outreach']
    },

    // LEYTE
    {
        id: 'ormoc-novitiate',
        name: 'St. Anthony of Padua Novitiate House',
        location: 'Ormoc City, Leyte',
        type: 'formation_house',
        guardian: '',
        guardianName: 'Fr. Novice Master',
        members: [],
        memberCount: 0,
        ministries: ['Novitiate Formation', 'Spiritual Formation']
    },

    // ZAMBOANGA DEL SUR
    {
        id: 'josefina-fatima-parish',
        name: 'Our Lady of Fatima Parish Friary',
        location: 'Josefina, Zamboanga del Sur',
        type: 'parish',
        guardian: '',
        guardianName: 'Fr. Parish Priest',
        members: [],
        memberCount: 0,
        ministries: ['Parish Ministry', 'Mission Work']
    },
    {
        id: 'josefina-intensification',
        name: 'Franciscan Intensification Year Balay Piksalabukan Friary',
        location: 'Josefina, Zamboanga del Sur',
        type: 'formation_house',
        guardian: '',
        guardianName: 'Fr. Formator',
        members: [],
        memberCount: 0,
        ministries: ['Intensification Year', 'Pastoral Formation']
    },
    {
        id: 'dumingag-pastoral',
        name: 'Sto. Niño Pastoral Station',
        location: 'Dumingag, Zamboanga del Sur',
        type: 'parish',
        guardian: '',
        guardianName: 'Fr. In-Charge',
        members: [],
        memberCount: 0,
        ministries: ['Pastoral Care', 'Mission Work']
    },

    // DAVAO CITY
    {
        id: 'davao-house-studies',
        name: 'St. Bonaventure House of Studies',
        location: 'Davao City',
        type: 'formation_house',
        guardian: '',
        guardianName: 'Fr. Rector',
        members: [],
        memberCount: 0,
        ministries: ['Theological Studies', 'Academic Formation']
    },

    // LANAO DEL NORTE
    {
        id: 'baloi-friary',
        name: 'Walay A Kalilintad Friary',
        location: 'Baloi, Lanao del Norte',
        type: 'friary',
        guardian: '',
        guardianName: 'Fr. Guardian',
        members: [],
        memberCount: 0,
        ministries: ['Inter-Religious Dialogue', 'Peace Building']
    },

    // BASILAN
    {
        id: 'lamitan-parish',
        name: 'Sagrado Corazon de Jesus Parish',
        location: 'Lamitan, Basilan',
        type: 'parish',
        guardian: '',
        guardianName: 'Fr. Parish Priest',
        members: [],
        memberCount: 0,
        ministries: ['Parish Ministry', 'Peace Ministry']
    },
    {
        id: 'tairan-parish',
        name: 'San Roque Parish',
        location: 'Tairan, Basilan',
        type: 'parish',
        guardian: '',
        guardianName: 'Fr. Parish Priest',
        members: [],
        memberCount: 0,
        ministries: ['Parish Ministry', 'Community Development']
    },

    // KIDAPAWAN CITY
    {
        id: 'kidapawan-damieta',
        name: 'Damieta Friary',
        location: 'Kidapawan City',
        type: 'friary',
        guardian: '',
        guardianName: 'Fr. Guardian',
        members: [],
        memberCount: 0,
        ministries: ['Inter-Religious Dialogue', 'Peace Building']
    },
    {
        id: 'kidapawan-dialogue-center',
        name: 'Center for Inter-Religious Dialogue',
        location: 'Kidapawan City',
        type: 'friary',
        guardian: '',
        guardianName: 'Fr. Director',
        members: [],
        memberCount: 0,
        ministries: ['Inter-Religious Dialogue', 'Peace Advocacy']
    }
];


// Role management helpers
export const getRoleDisplayName = (role: UserRole): string => {
    const displayNames: Record<UserRole, string> = {
        super_admin: 'Provincial Minister',
        vice_super_admin: 'Vice Provincial',
        admin: 'Guardian',
        vice_admin: 'Vice Guardian',
        provincial_treasurer: 'Provincial Treasurer',
        treasurer: 'Local Treasurer',
        staff: 'Friar',
        guest: 'Guest'
    };
    return displayNames[role] || role;
};

export const canManageFriaries = (role: UserRole): boolean => {
    return ['super_admin', 'vice_super_admin'].includes(role);
};

export const canManageOwnFriary = (role: UserRole): boolean => {
    return ['admin', 'vice_admin'].includes(role);
};

export const canViewAllFriaries = (role: UserRole): boolean => {
    return ['super_admin', 'vice_super_admin', 'provincial_treasurer'].includes(role);
};

export const canApproveExpenses = (role: UserRole, amount: number): boolean => {
    if (role === 'super_admin' || role === 'vice_super_admin') return true;
    if (role === 'provincial_treasurer' && amount <= 50000) return true;
    if ((role === 'admin' || role === 'vice_admin') && amount <= 5000) return true;
    return false;
};

// Get role hierarchy level (higher number = more authority)
export const getRoleLevel = (role: UserRole): number => {
    const levels: Record<UserRole, number> = {
        super_admin: 100,
        vice_super_admin: 90,
        provincial_treasurer: 80,
        admin: 70,
        vice_admin: 60,
        treasurer: 50,
        staff: 10,
        guest: 0
    };
    return levels[role] || 0;
};
