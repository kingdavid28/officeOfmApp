// Organization Types and Interfaces
// Following enterprise best practices for multi-tenant office management

export type OrganizationStatus = 'active' | 'suspended' | 'trial' | 'pending';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Core Organization Interface
export interface Organization {
    id: string;
    name: string;
    displayName: string;
    slug: string; // URL-friendly identifier
    domain?: string; // e.g., "company.com" for email-based assignment
    logo?: string;
    address: Address;
    contactInfo: ContactInfo;
    settings: OrganizationSettings;
    subscription: SubscriptionInfo;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    status: OrganizationStatus;
    metadata: OrganizationMetadata;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

export interface ContactInfo {
    email: string;
    phone?: string;
    website?: string;
    socialMedia?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
    };
}

export interface OrganizationMetadata {
    industry?: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    founded?: Date;
    description?: string;
    tags: string[];
}

// Department Management
export interface Department {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    code?: string; // Department code (e.g., "IT", "HR", "FIN")
    managerId?: string; // Department head
    parentDepartmentId?: string; // For nested departments
    budget?: DepartmentBudget;
    location?: string;
    members: string[]; // User IDs
    settings: DepartmentSettings;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'inactive';
}

export interface DepartmentBudget {
    allocated: number;
    spent: number;
    currency: string;
    fiscalYear: number;
    categories: BudgetCategory[];
}

export interface BudgetCategory {
    name: string;
    allocated: number;
    spent: number;
    description?: string;
}

export interface DepartmentSettings {
    allowCrossDepartmentAccess: boolean;
    requireApprovalForExpenses: boolean;
    expenseApprovalLimit: number;
    defaultProjectVisibility: 'department' | 'organization' | 'private';
}

// User Management within Organizations
export interface OrganizationUser {
    userId: string;
    organizationId: string;
    role: OrganizationRole;
    departmentId?: string;
    position: string;
    employeeId?: string;
    startDate: Date;
    endDate?: Date;
    permissions: Permission[];
    customPermissions: CustomPermission[];
    status: UserStatus;
    profile: UserProfile;
    settings: UserSettings;
    createdAt: Date;
    updatedAt: Date;
}

export type OrganizationRole =
    | 'org_admin'     // Organization administrator
    | 'dept_manager'  // Department manager
    | 'team_lead'     // Team leader
    | 'project_manager' // Project manager
    | 'staff'         // Regular employee
    | 'contractor'    // External contractor
    | 'intern'        // Intern/trainee
    | 'viewer';       // Read-only access

export interface Permission {
    resource: string; // e.g., 'projects', 'documents', 'users'
    actions: string[]; // e.g., ['read', 'write', 'delete', 'approve']
    scope: 'organization' | 'department' | 'project' | 'own';
    conditions?: PermissionCondition[];
}

export interface CustomPermission {
    id: string;
    name: string;
    description: string;
    resource: string;
    actions: string[];
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
}

export interface PermissionCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
    value: any;
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    skills: string[];
    certifications: Certification[];
    emergencyContact?: EmergencyContact;
}

export interface Certification {
    name: string;
    issuer: string;
    issuedDate: Date;
    expiryDate?: Date;
    credentialId?: string;
}

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
}

export interface UserSettings {
    timezone: string;
    language: string;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    preferences: UserPreferences;
}

// Project Management
export interface Project {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    code?: string; // Project code
    departmentId?: string;
    managerId: string;
    teamMembers: ProjectMember[];
    status: ProjectStatus;
    priority: Priority;
    budget: ProjectBudget;
    timeline: ProjectTimeline;
    milestones: Milestone[];
    tasks: Task[];
    documents: string[]; // Document IDs
    tags: string[];
    visibility: 'public' | 'department' | 'team' | 'private';
    settings: ProjectSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectMember {
    userId: string;
    role: 'manager' | 'lead' | 'member' | 'observer';
    joinedAt: Date;
    permissions: string[];
    allocation: number; // Percentage of time allocated
}

export interface ProjectBudget {
    total: number;
    spent: number;
    currency: string;
    categories: BudgetCategory[];
    approvals: BudgetApproval[];
}

export interface BudgetApproval {
    amount: number;
    approvedBy: string;
    approvedAt: Date;
    purpose: string;
}

export interface ProjectTimeline {
    startDate: Date;
    endDate: Date;
    estimatedHours: number;
    actualHours: number;
    phases: ProjectPhase[];
}

export interface ProjectPhase {
    id: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
    dependencies: string[]; // Phase IDs
}

export interface Milestone {
    id: string;
    name: string;
    description?: string;
    dueDate: Date;
    completedAt?: Date;
    status: 'pending' | 'completed' | 'overdue';
    assignedTo: string[];
    deliverables: string[];
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    assignedTo: string[];
    status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
    priority: Priority;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    dependencies: string[]; // Task IDs
    subtasks: string[]; // Task IDs
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectSettings {
    allowGuestAccess: boolean;
    requireTimeTracking: boolean;
    autoArchiveOnCompletion: boolean;
    notificationSettings: ProjectNotificationSettings;
}

// Document Management
export interface Document {
    id: string;
    organizationId: string;
    name: string;
    type: DocumentType;
    category: string;
    departmentId?: string;
    projectId?: string;
    folderId?: string;
    uploadedBy: string;
    permissions: DocumentPermissions;
    versions: DocumentVersion[];
    tags: string[];
    metadata: DocumentMetadata;
    size: number; // in bytes
    mimeType: string;
    checksum: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'archived' | 'deleted';
}

export type DocumentType =
    | 'document' | 'spreadsheet' | 'presentation' | 'pdf'
    | 'image' | 'video' | 'audio' | 'archive' | 'other';

export interface DocumentPermissions {
    public: boolean;
    allowedUsers: string[];
    allowedRoles: OrganizationRole[];
    allowedDepartments: string[];
    permissions: {
        read: string[];
        write: string[];
        delete: string[];
        share: string[];
    };
}

export interface DocumentVersion {
    version: number;
    uploadedBy: string;
    uploadedAt: Date;
    size: number;
    checksum: string;
    changes?: string;
    storageUrl: string;
}

export interface DocumentMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords: string[];
    createdWith?: string;
    lastModified?: Date;
    pageCount?: number;
    wordCount?: number;
    customFields: { [key: string]: any };
}

// Communication & Collaboration
export interface Channel {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    type: 'public' | 'private' | 'department' | 'project' | 'direct';
    members: ChannelMember[];
    departmentId?: string;
    projectId?: string;
    settings: ChannelSettings;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'archived';
}

export interface ChannelMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
    lastReadAt?: Date;
    notifications: boolean;
}

export interface ChannelSettings {
    allowFileSharing: boolean;
    allowGuestAccess: boolean;
    retentionDays?: number;
    moderationEnabled: boolean;
}

export interface Message {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    type: 'text' | 'file' | 'image' | 'system';
    attachments: MessageAttachment[];
    mentions: string[]; // User IDs
    reactions: MessageReaction[];
    threadId?: string; // For threaded conversations
    editedAt?: Date;
    deletedAt?: Date;
    createdAt: Date;
}

export interface MessageAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
}

export interface MessageReaction {
    emoji: string;
    users: string[];
    count: number;
}

// Organization Settings
export interface OrganizationSettings {
    general: GeneralSettings;
    security: SecuritySettings;
    features: FeatureSettings;
    integrations: IntegrationSettings;
    branding: BrandingSettings;
    billing: BillingSettings;
}

export interface GeneralSettings {
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    currency: string;
    language: string;
    weekStart: 'monday' | 'sunday';
    fiscalYearStart: number; // Month (1-12)
}

export interface SecuritySettings {
    passwordPolicy: PasswordPolicy;
    mfaRequired: boolean;
    mfaGracePeriod: number; // Days
    sessionTimeout: number; // Minutes
    ipWhitelist: string[];
    allowedDomains: string[];
    ssoRequired: boolean;
    auditLogRetention: number; // Days
}

export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number; // Number of previous passwords to check
    maxAge: number; // Days before password expires
}

export interface FeatureSettings {
    enabledModules: string[];
    customFields: CustomField[];
    workflows: Workflow[];
    automations: Automation[];
}

export interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
    required: boolean;
    options?: string[]; // For select/multiselect
    validation?: FieldValidation;
    appliesTo: string[]; // Entity types
}

export interface FieldValidation {
    pattern?: string; // Regex pattern
    min?: number;
    max?: number;
    message?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    trigger: WorkflowTrigger;
    conditions: WorkflowCondition[];
    actions: WorkflowAction[];
    enabled: boolean;
    createdBy: string;
    createdAt: Date;
}

export interface WorkflowTrigger {
    type: 'create' | 'update' | 'delete' | 'status_change' | 'schedule';
    entity: string;
    conditions?: any;
}

export interface WorkflowCondition {
    field: string;
    operator: string;
    value: any;
}

export interface WorkflowAction {
    type: 'notify' | 'assign' | 'update' | 'create' | 'approve' | 'webhook';
    parameters: any;
}

export interface Automation {
    id: string;
    name: string;
    description?: string;
    schedule: AutomationSchedule;
    actions: AutomationAction[];
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}

export interface AutomationSchedule {
    type: 'daily' | 'weekly' | 'monthly' | 'cron';
    value: string; // Cron expression or simple schedule
    timezone: string;
}

export interface AutomationAction {
    type: string;
    parameters: any;
}

export interface IntegrationSettings {
    emailProvider: EmailIntegration;
    calendarSync: CalendarIntegration;
    fileStorage: FileStorageIntegration;
    ssoConfig?: SSOConfig;
    webhooks: WebhookConfig[];
    apiKeys: APIKeyConfig[];
}

export interface EmailIntegration {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    config: any;
    enabled: boolean;
}

export interface CalendarIntegration {
    provider: 'google' | 'outlook' | 'exchange';
    config: any;
    enabled: boolean;
}

export interface FileStorageIntegration {
    provider: 'local' | 's3' | 'gcs' | 'azure' | 'dropbox' | 'gdrive';
    config: any;
    enabled: boolean;
}

export interface SSOConfig {
    provider: 'saml' | 'oauth2' | 'oidc';
    config: any;
    enabled: boolean;
    domains: string[];
}

export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret?: string;
    enabled: boolean;
}

export interface APIKeyConfig {
    id: string;
    name: string;
    key: string;
    permissions: string[];
    lastUsed?: Date;
    expiresAt?: Date;
    enabled: boolean;
}

export interface BrandingSettings {
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily?: string;
    customCSS?: string;
}

export interface BillingSettings {
    plan: SubscriptionPlan;
    paymentMethod?: PaymentMethod;
    billingAddress?: Address;
    invoiceEmail?: string;
    taxId?: string;
}

// Subscription & Billing
export interface SubscriptionInfo {
    planId: string;
    status: 'active' | 'cancelled' | 'past_due' | 'trial';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    cancelAtPeriodEnd: boolean;
    usage: UsageMetrics;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    maxUsers: number;
    maxStorage: number; // in GB
    maxProjects: number;
    maxDepartments: number;
    features: string[];
    price: {
        monthly: number;
        yearly: number;
        currency: string;
    };
    limits: PlanLimits;
}

export interface PlanLimits {
    apiCalls: number; // per month
    fileUploadSize: number; // in MB
    videoCallMinutes: number; // per month
    customFields: number;
    workflows: number;
    integrations: number;
}

export interface UsageMetrics {
    users: number;
    storage: number; // in GB
    projects: number;
    departments: number;
    apiCalls: number;
    lastUpdated: Date;
}

export interface PaymentMethod {
    type: 'card' | 'bank' | 'paypal';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
}

// Notification System
export interface NotificationSettings {
    email: EmailNotificationSettings;
    push: PushNotificationSettings;
    inApp: InAppNotificationSettings;
}

export interface EmailNotificationSettings {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    types: string[];
}

export interface PushNotificationSettings {
    enabled: boolean;
    types: string[];
}

export interface InAppNotificationSettings {
    enabled: boolean;
    types: string[];
    sound: boolean;
}

export interface ProjectNotificationSettings {
    taskAssigned: boolean;
    taskCompleted: boolean;
    milestoneReached: boolean;
    budgetAlert: boolean;
    deadlineReminder: boolean;
}

export interface PrivacySettings {
    profileVisibility: 'public' | 'organization' | 'department' | 'private';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    shareContactInfo: boolean;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showAvatars: boolean;
    autoSave: boolean;
    defaultView: string;
    sidebarCollapsed: boolean;
}

// Analytics & Reporting
export interface OrganizationMetrics {
    organizationId: string;
    period: {
        start: Date;
        end: Date;
    };
    users: UserMetrics;
    projects: ProjectMetrics;
    departments: DepartmentMetrics[];
    documents: DocumentMetrics;
    collaboration: CollaborationMetrics;
    performance: PerformanceMetrics;
    generatedAt: Date;
}

export interface UserMetrics {
    total: number;
    active: number;
    newThisPeriod: number;
    averageSessionDuration: number;
    topContributors: UserContribution[];
}

export interface UserContribution {
    userId: string;
    name: string;
    tasksCompleted: number;
    documentsCreated: number;
    messagesPosted: number;
    score: number;
}

export interface ProjectMetrics {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    averageCompletionTime: number;
    budgetUtilization: number;
    topPerforming: ProjectPerformance[];
}

export interface ProjectPerformance {
    projectId: string;
    name: string;
    completionRate: number;
    budgetEfficiency: number;
    teamSatisfaction: number;
    score: number;
}

export interface DepartmentMetrics {
    departmentId: string;
    name: string;
    userCount: number;
    projectCount: number;
    budgetUtilization: number;
    productivity: number;
    collaboration: number;
}

export interface DocumentMetrics {
    total: number;
    created: number;
    accessed: number;
    shared: number;
    storageUsed: number;
    topCategories: CategoryUsage[];
}

export interface CategoryUsage {
    category: string;
    count: number;
    size: number;
}

export interface CollaborationMetrics {
    messagesPosted: number;
    channelsActive: number;
    meetingsHeld: number;
    documentsShared: number;
    averageResponseTime: number;
}

export interface PerformanceMetrics {
    averageLoadTime: number;
    uptime: number;
    errorRate: number;
    apiResponseTime: number;
    userSatisfaction: number;
}

// Audit & Compliance
export interface AuditLog {
    id: string;
    organizationId: string;
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId: string;
    details: AuditDetails;
    metadata: AuditMetadata;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditDetails {
    before?: any;
    after?: any;
    changes?: string[];
    reason?: string;
    approvedBy?: string;
}

export interface AuditMetadata {
    ipAddress: string;
    userAgent: string;
    location?: string;
    sessionId: string;
    requestId: string;
}

// API Response Types
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: APIError;
    pagination?: PaginationInfo;
    metadata?: ResponseMetadata;
}

export interface APIError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ResponseMetadata {
    requestId: string;
    timestamp: Date;
    version: string;
    executionTime: number;
}

// Search & Filter Types
export interface SearchQuery {
    query: string;
    filters: SearchFilter[];
    sort: SortOption[];
    pagination: PaginationOptions;
}

export interface SearchFilter {
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'range';
    value: any;
}

export interface SortOption {
    field: string;
    direction: 'asc' | 'desc';
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface SearchResult<T> {
    items: T[];
    total: number;
    facets: SearchFacet[];
    suggestions: string[];
    executionTime: number;
}

export interface SearchFacet {
    field: string;
    values: FacetValue[];
}

export interface FacetValue {
    value: string;
    count: number;
    selected: boolean;
}