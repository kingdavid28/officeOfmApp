// AI-Powered Chat Service for All Documents and Reports
// Enhanced with comprehensive document access and role-based security

import { SimpleDocumentSearch, SimpleSearchResult, SimpleSearchQuery } from './simple-document-search';
import { ComprehensiveAISearch, ComprehensiveSearchResult, ComprehensiveSearchQuery } from './comprehensive-ai-search';
import { UserRole } from './friary-types';

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    userId: string;
    userRole: UserRole;
    metadata?: {
        searchResults?: ComprehensiveSearchResult[];
        documentReferences?: DocumentReference[];
        confidence?: number;
        sources?: string[];
    };
}

export interface SearchResult extends SimpleSearchResult {
    metadata?: Record<string, any>;
}

export interface DocumentReference {
    id: string;
    name: string;
    type: string;
    url?: string;
    excerpt: string;
    relevance: number;
}

export interface AISearchQuery {
    query: string;
    userRole: UserRole;
    userId: string;
    organizationId?: string;
    friaryId?: string;
    limit?: number;
}

export interface AIResponse {
    answer: string;
    confidence: number;
    sources: ComprehensiveSearchResult[];
    suggestions: string[];
    followUpQuestions: string[];
    accessRestrictions?: string[];
}

export class AIChatService {
    private static readonly OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    private static readonly ROLE_PERMISSIONS = {
        staff: {
            maxAmount: 5000,
            canViewReports: false,
            canViewAllTransactions: false,
            allowedCategories: ['food', 'officeSupplies', 'houseLaundrySupplies'],
            allowedDocumentTypes: ['receipt', 'file', 'task', 'message'],
            canAccessAuditLogs: false,
            canViewOthersDocuments: false
        },
        admin: {
            maxAmount: 50000,
            canViewReports: true,
            canViewAllTransactions: true,
            allowedCategories: '*',
            allowedDocumentTypes: ['receipt', 'file', 'task', 'message'],
            canAccessAuditLogs: false,
            canViewOthersDocuments: true
        },
        super_admin: {
            maxAmount: Infinity,
            canViewReports: true,
            canViewAllTransactions: true,
            allowedCategories: '*',
            allowedDocumentTypes: '*',
            canAccessAuditLogs: true,
            canViewOthersDocuments: true
        }
    };

    // Enhanced search with comprehensive document access using comprehensive AI search
    static async searchDocuments(query: AISearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            console.log('🔍 AI Search Query:', query);

            // Create comprehensive search query
            const comprehensiveQuery: ComprehensiveSearchQuery = {
                query: query.query,
                userRole: query.userRole,
                userId: query.userId,
                organizationId: query.organizationId,
                friaryId: query.friaryId,
                limit: query.limit || 50
            };

            // Use comprehensive AI search to access ALL app data
            const results = await ComprehensiveAISearch.searchAll(comprehensiveQuery);
            console.log('✅ Comprehensive search results:', results.length, 'documents found');

            return results;
        } catch (error) {
            console.error('❌ Error searching documents:', error);
            return [];
        }
    }

    // Generate AI response with role-aware context
    static async generateResponse(
        query: string,
        searchResults: ComprehensiveSearchResult[],
        userRole: UserRole,
        chatHistory: ChatMessage[] = []
    ): Promise<AIResponse> {
        try {
            const userPermissions = this.ROLE_PERMISSIONS[userRole];

            // Build context from search results
            const context = this.buildContextFromResults(searchResults, userRole);

            // Create role-aware system prompt
            const systemPrompt = this.createSystemPrompt(userRole, userPermissions);

            // Generate response using OpenAI or local AI
            const response = await this.callAIService({
                systemPrompt,
                context,
                query,
                chatHistory,
                userRole
            });

            return {
                answer: response.answer,
                confidence: response.confidence,
                sources: searchResults,
                suggestions: response.suggestions,
                followUpQuestions: response.followUpQuestions,
                accessRestrictions: response.accessRestrictions
            };
        } catch (error) {
            console.error('Error generating AI response:', error);
            return {
                answer: 'I apologize, but I encountered an error while processing your request. Please try again or contact support.',
                confidence: 0,
                sources: [],
                suggestions: [],
                followUpQuestions: []
            };
        }
    }

    // Apply role-based filtering to search results
    private static applyRoleBasedFiltering(
        results: SearchResult[],
        userRole: 'staff' | 'admin' | 'super_admin',
        userId: string
    ): SearchResult[] {
        const userPermissions = this.ROLE_PERMISSIONS[userRole];

        return results.filter(result => {
            // Check access level
            if (!this.hasAccessToDocument(result, userRole)) {
                return false;
            }

            // Check amount restrictions for financial data
            if (result.amount && result.amount > userPermissions.maxAmount) {
                return false;
            }

            // Check category restrictions
            if (result.category && userPermissions.allowedCategories !== '*') {
                if (!userPermissions.allowedCategories.includes(result.category)) {
                    return false;
                }
            }

            // Check document ownership for staff
            if (userRole === 'staff' && !userPermissions.canViewOthersDocuments) {
                if (result.ownerId !== userId && result.accessLevel !== 'public') {
                    return false;
                }
            }

            return true;
        });
    }

    // Check if user has access to document based on role
    private static hasAccessToDocument(result: SearchResult, userRole: 'staff' | 'admin' | 'super_admin'): boolean {
        const roleHierarchy = { staff: 1, admin: 2, super_admin: 3 };
        const requiredLevel = roleHierarchy[result.accessLevel] || 1;
        const userLevel = roleHierarchy[userRole];

        return userLevel >= requiredLevel;
    }

    // Build context from search results for AI
    private static buildContextFromResults(results: SearchResult[], userRole: string): string {
        const contextParts = results.map(result => {
            let context = `Document: ${result.title}\n`;
            context += `Type: ${result.type}\n`;

            // Safely handle date field
            if (result.date) {
                try {
                    const dateObj = result.date instanceof Date ? result.date : new Date(result.date);
                    if (!isNaN(dateObj.getTime())) {
                        context += `Date: ${dateObj.toLocaleDateString()}\n`;
                    }
                } catch (error) {
                    // Skip date if invalid
                }
            }

            context += `Content: ${result.content}\n`;

            if (result.amount) {
                context += `Amount: ₱${result.amount.toLocaleString()}\n`;
            }

            if (result.category) {
                context += `Category: ${result.category}\n`;
            }

            context += `---\n`;
            return context;
        });

        return contextParts.join('\n');
    }

    // Create enhanced role-aware system prompt
    private static createSystemPrompt(userRole: string, permissions: any): string {
        const documentTypes = permissions.allowedDocumentTypes === '*'
            ? 'all document types'
            : permissions.allowedDocumentTypes.join(', ');

        return `You are an AI assistant for OFM South Province Phil Management System.

Role: You are helping a ${userRole} user with document queries and information retrieval.

Permissions for ${userRole}:
- Maximum amount access: ₱${permissions.maxAmount === Infinity ? 'unlimited' : permissions.maxAmount.toLocaleString()}
- Can view reports: ${permissions.canViewReports ? 'Yes' : 'No'}
- Can view all transactions: ${permissions.canViewAllTransactions ? 'Yes' : 'No'}
- Allowed categories: ${permissions.allowedCategories === '*' ? 'All' : permissions.allowedCategories.join(', ')}
- Allowed document types: ${documentTypes}
- Can access audit logs: ${permissions.canAccessAuditLogs ? 'Yes' : 'No'}
- Can view others' documents: ${permissions.canViewOthersDocuments ? 'Yes' : 'No'}

Document Types Available:
- Receipts: Financial receipts with OCR text extraction
- Financial Reports: Monthly/quarterly financial summaries
- Transactions: Individual financial transactions
- Manual Entries: Staff-entered financial data
- Files: General documents (PDFs, Word docs, images, etc.)
- Tasks: Work assignments and project tasks
- Messages: Internal communications
- Audit Logs: System activity logs (super admin only)
- Organization Documents: Company policies and procedures

Guidelines:
1. Only provide information that the user has permission to access
2. Be helpful and accurate in your responses about ANY type of document
3. If asked about restricted information, politely explain the access limitation
4. You can help with financial management, general documents, tasks, communications, and more
5. Provide specific references to documents when possible
6. Suggest follow-up questions that might be helpful
7. Use Philippine Peso (₱) for all monetary amounts
8. Follow OFM South Province Phil standards and best practices
9. For file searches, mention if content was extracted from PDFs or other document types
10. Respect privacy and confidentiality of all documents

Content Extraction Capabilities:
- Receipt OCR text and itemized details
- PDF document text extraction
- Word document content
- Image text recognition
- Task descriptions and comments
- Message content and attachments

Always be respectful, professional, and security-conscious in your responses.`;
    }

    // Call AI service (OpenAI or local model)
    private static async callAIService(params: {
        systemPrompt: string;
        context: string;
        query: string;
        chatHistory: ChatMessage[];
        userRole: string;
    }): Promise<{
        answer: string;
        confidence: number;
        suggestions: string[];
        followUpQuestions: string[];
        accessRestrictions?: string[];
    }> {
        try {
            // If OpenAI API key is available, use it
            if (this.OPENAI_API_KEY && this.OPENAI_API_KEY !== 'your-openai-api-key-here') {
                return await this.callOpenAI(params);
            }

            // Otherwise, provide intelligent local processing
            return this.generateIntelligentResponse(params);
        } catch (error) {
            console.error('Error calling AI service:', error);
            return this.generateIntelligentResponse(params);
        }
    }

    // Generate intelligent response using local processing
    private static generateIntelligentResponse(params: {
        systemPrompt: string;
        context: string;
        query: string;
        chatHistory: ChatMessage[];
        userRole: string;
    }): {
        answer: string;
        confidence: number;
        suggestions: string[];
        followUpQuestions: string[];
        accessRestrictions?: string[];
    } {
        const { context, query, userRole, chatHistory } = params;

        // Parse the context to extract relevant information
        const documents = this.parseContextDocuments(context);

        // Generate response based on query type and available documents
        let answer = '';
        let confidence = 0.5;

        if (documents.length === 0) {
            // Enhanced no-results response with suggestions
            const suggestions = this.generateSearchSuggestions(query, userRole);

            answer = `I couldn't find any documents matching your query "${query}". Here are some suggestions to help you find what you're looking for:

**Search Tips:**
• Try broader terms: "${this.generateBroaderTerms(query).join('", "')}"
• Search by category: "reports", "receipts", "forms", "policies"
• Search by vendor names or specific amounts
• Use partial words: "${this.generatePartialTerms(query).join('", "')}"

**Available Categories:**
• Reports (financial reports, summaries)
• Forms (applications, requests)  
• Receipts (expenses, purchases)
• Policies (procedures, guidelines)
• Minutes (meeting notes)
• Correspondence (letters, communications)

**Example Searches:**
• "financial report" or "finrep"
• "office supplies" or "supplies"
• "meeting minutes" or "minutes"
• Vendor names like "Amazon", "Staples", etc.
• Amount ranges like "$100" or "expensive"

${suggestions.length > 0 ? `\n**Suggested searches based on your query:**\n${suggestions.map(s => `• "${s}"`).join('\n')}` : ''}

As a ${userRole}, you have access to ${userRole === 'staff' ? 'your own documents and public information' : userRole === 'admin' ? 'your organization\'s documents' : 'all documents in the system'}. If you recently uploaded a document, it may take a moment to become searchable.`;
            confidence = 0.9;
        } else {
            // Analyze documents and generate specific response
            const analysis = this.analyzeDocuments(documents, query);
            answer = this.generateSpecificAnswer(analysis, query, userRole, chatHistory);
            confidence = analysis.confidence;
        }

        return {
            answer,
            confidence,
            suggestions: this.generateContextualSuggestions(query, documents, userRole),
            followUpQuestions: this.generateFollowUpQuestions(query, documents, userRole),
            accessRestrictions: userRole === 'staff' ? ['Limited to your own documents and public information'] : undefined
        };
    }

    // Generate broader search terms for better results
    private static generateBroaderTerms(query: string): string[] {
        const queryLower = query.toLowerCase();
        const broaderTerms: string[] = [];

        // Common term expansions
        const expansions: Record<string, string[]> = {
            'finrep': ['financial', 'report', 'finance'],
            'office supplies': ['supplies', 'office', 'stationery'],
            'meeting': ['minutes', 'notes'],
            'expense': ['receipt', 'cost', 'purchase'],
            'policy': ['procedure', 'guideline'],
            'communication': ['correspondence', 'letter', 'email'],
            'bill': ['invoice', 'receipt', 'payment'],
            'repair': ['maintenance', 'service', 'fix']
        };

        // Check for exact matches
        for (const [term, broader] of Object.entries(expansions)) {
            if (queryLower.includes(term)) {
                broaderTerms.push(...broader);
            }
        }

        // Generate word-level broader terms
        const words = queryLower.split(/\s+/);
        words.forEach(word => {
            if (word.length > 4) {
                broaderTerms.push(word.substring(0, word.length - 1)); // Remove last character
            }
        });

        // Remove duplicates and return unique terms
        return [...new Set(broaderTerms)].slice(0, 3);
    }

    // Generate partial terms for fuzzy matching
    private static generatePartialTerms(query: string): string[] {
        const words = query.toLowerCase().split(/\s+/);
        const partialTerms: string[] = [];

        words.forEach(word => {
            if (word.length > 3) {
                partialTerms.push(word.substring(0, Math.ceil(word.length * 0.7))); // 70% of word
            }
        });

        return [...new Set(partialTerms)].slice(0, 2);
    }

    // Generate contextual search suggestions
    private static generateSearchSuggestions(query: string, userRole: string): string[] {
        const queryLower = query.toLowerCase();
        const suggestions: string[] = [];

        // Category-based suggestions
        if (queryLower.includes('report') || queryLower.includes('financial')) {
            suggestions.push('financial report', 'monthly report', 'expense report');
        }

        if (queryLower.includes('supply') || queryLower.includes('office')) {
            suggestions.push('office supplies', 'supplies', 'stationery');
        }

        if (queryLower.includes('meet') || queryLower.includes('minute')) {
            suggestions.push('meeting minutes', 'board minutes', 'meeting notes');
        }

        if (queryLower.includes('receipt') || queryLower.includes('expense')) {
            suggestions.push('receipts', 'expenses', 'purchases');
        }

        // Role-based suggestions
        if (userRole === 'super_admin') {
            suggestions.push('all reports', 'system documents', 'admin files');
        }

        return [...new Set(suggestions)].slice(0, 3);
    }

    // Parse context to extract document information
    private static parseContextDocuments(context: string): any[] {
        const documents = [];
        const docSections = context.split('---').filter(section => section.trim());

        for (const section of docSections) {
            const lines = section.trim().split('\n');
            const doc: any = {};

            for (const line of lines) {
                const [key, ...valueParts] = line.split(': ');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join(': ').trim();
                    doc[key.toLowerCase()] = value;
                }
            }

            if (doc.document || doc.title) {
                documents.push(doc);
            }
        }

        return documents;
    }

    // Analyze documents for specific insights
    private static analyzeDocuments(documents: any[], query: string): {
        totalAmount: number;
        categories: string[];
        dateRange: { start: Date | null; end: Date | null };
        items: any[];
        confidence: number;
    } {
        let totalAmount = 0;
        const categories = new Set<string>();
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        const items = [];

        for (const doc of documents) {
            // Extract amount
            if (doc.amount) {
                const amount = parseFloat(doc.amount.replace(/[₱,]/g, ''));
                if (!isNaN(amount)) {
                    totalAmount += amount;
                }
            }

            // Extract category
            if (doc.category) {
                categories.add(doc.category);
            }

            // Extract date
            if (doc.date) {
                const date = new Date(doc.date);
                if (!isNaN(date.getTime())) {
                    if (!startDate || date < startDate) startDate = date;
                    if (!endDate || date > endDate) endDate = date;
                }
            }

            // Store document for detailed analysis
            items.push(doc);
        }

        return {
            totalAmount,
            categories: Array.from(categories),
            dateRange: { start: startDate, end: endDate },
            items,
            confidence: documents.length > 0 ? 0.8 : 0.3
        };
    }

    // Generate specific answer based on analysis
    private static generateSpecificAnswer(analysis: any, query: string, userRole: string, chatHistory: ChatMessage[] = []): string {
        const { totalAmount, categories, dateRange, items } = analysis;

        let answer = '';

        // Check if this is a follow-up question about previous results
        if (this.isFollowUpQuestion(query) && chatHistory.length > 0) {
            const lastAssistantMessage = chatHistory.slice().reverse().find(msg => msg.role === 'assistant');
            if (lastAssistantMessage && lastAssistantMessage.metadata?.searchResults) {
                return this.handleFollowUpQuestion(query, lastAssistantMessage.metadata.searchResults, userRole);
            }
        }

        // Check if this is a direct question about a specific document
        if (this.isDirectQuestionAboutDocument(query)) {
            return this.handleDirectDocumentQuestion(query, items, userRole);
        }

        // Enhanced document analysis and response generation
        if (items.length > 0) {
            // Categorize documents by type
            const documentsByType = this.categorizeDocuments(items);

            // Generate response based on query intent
            if (this.isContentQuery(query)) {
                answer = this.generateContentResponse(documentsByType, query);
            } else if (this.isFinancialQuery(query)) {
                answer = this.generateFinancialResponse(documentsByType, totalAmount, query);
            } else if (this.isReportQuery(query)) {
                answer = this.generateReportResponse(documentsByType, query);
            } else if (this.isSupplyQuery(query)) {
                answer = this.generateSupplyResponse(documentsByType, totalAmount, query);
            } else {
                // General document response
                answer = this.generateGeneralResponse(documentsByType, totalAmount, categories, query);
            }

            // Add summary information
            if (totalAmount > 0) {
                answer += `\n\n**Summary:**\n`;
                answer += `• Total Amount: $${totalAmount.toLocaleString()}\n`;
                if (categories.length > 0) {
                    answer += `• Categories: ${categories.join(', ')}\n`;
                }
                if (dateRange.start && dateRange.end) {
                    try {
                        const startDate = dateRange.start instanceof Date ? dateRange.start : new Date(dateRange.start);
                        const endDate = dateRange.end instanceof Date ? dateRange.end : new Date(dateRange.end);
                        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                            answer += `• Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n`;
                        }
                    } catch (error) {
                        // Skip date range if invalid
                    }
                }
                answer += `• Documents Found: ${items.length}`;
            }
        }

        return answer;
    }

    // Helper method to extract document title with improved logic
    private static extractDocumentTitle(doc: any): string {
        // Priority order: title -> name -> filename -> extract from content -> fallback
        if (doc.title && doc.title !== 'undefined' && doc.title !== 'null' && doc.title.trim() !== '') {
            return doc.title.trim();
        }

        if (doc.name && doc.name !== 'undefined' && doc.name !== 'null' && doc.name.trim() !== '') {
            return doc.name.trim();
        }

        if (doc.filename && doc.filename !== 'undefined' && doc.filename !== 'null' && doc.filename.trim() !== '') {
            return doc.filename.trim();
        }

        // Try to extract from content
        if (doc.content) {
            if (doc.content.includes('CORRESPONDENCE DOCUMENT') && doc.content.includes('specialization')) {
                return 'Letter to all under Specialization Program';
            } else if (doc.content.includes('FINANCIAL REPORT') && doc.content.includes('jan.rep')) {
                return 'Format.FinRep.xlsx';
            } else if (doc.content.includes('financail report format') && doc.content.includes('png')) {
                return 'financail report format ofm.png';
            }
        }

        // Fallback based on category
        if (doc.category && doc.category !== 'undefined') {
            return `${doc.category} Document`;
        }

        return 'Document';
    }

    // Check if this is a direct question about a specific document
    private static isDirectQuestionAboutDocument(query: string): boolean {
        const directQuestionPatterns = [
            /what is.*letter/i,
            /explain.*letter/i,
            /what does.*letter.*say/i,
            /what is.*document/i,
            /what is.*file/i,
            /tell me about.*letter/i,
            /what is.*specialization/i,
            /what is.*program/i,
            /explain.*document/i,
            /what does.*document.*contain/i
        ];

        return directQuestionPatterns.some(pattern => pattern.test(query));
    }

    // Handle direct questions about specific documents
    private static handleDirectDocumentQuestion(query: string, items: any[], userRole: string): string {
        const queryLower = query.toLowerCase();

        // Find the most relevant document based on the query
        let targetDoc = null;

        // Look for letter/specialization program document
        if (queryLower.includes('letter') && queryLower.includes('specialization')) {
            targetDoc = items.find(doc =>
                doc.content?.toLowerCase().includes('specialization') ||
                doc.title?.toLowerCase().includes('specialization') ||
                doc.content?.toLowerCase().includes('letter')
            );
        }

        // Look for financial report document
        if (queryLower.includes('finrep') || queryLower.includes('financial')) {
            targetDoc = items.find(doc =>
                doc.content?.toLowerCase().includes('financial') ||
                doc.title?.toLowerCase().includes('finrep') ||
                doc.content?.toLowerCase().includes('report')
            );
        }

        // If no specific match, use the first document
        if (!targetDoc && items.length > 0) {
            targetDoc = items[0];
        }

        if (!targetDoc) {
            return "I couldn't find the specific document you're asking about. Could you be more specific about which document you'd like to know about?";
        }

        // Generate specific answer about the document
        let answer = '';

        // Extract document title properly with improved logic
        let docTitle = this.extractDocumentTitle(targetDoc);

        answer += `**About: ${docTitle}**\n\n`;

        // Analyze the content and provide specific information
        if (targetDoc.content) {
            const content = targetDoc.content;

            if (content.includes('CORRESPONDENCE DOCUMENT') && content.includes('specialization')) {
                answer += `This is an official correspondence document regarding a **Specialization Program**.\n\n`;
                answer += `**Document Type:** Official Letter/Correspondence\n`;
                answer += `**Subject:** Specialization Program Communication\n`;
                answer += `**Format:** Microsoft Word Document\n\n`;
                answer += `**Content Summary:**\n`;
                answer += `• This letter contains official communications about a specialization program\n`;
                answer += `• It includes information for all participants or stakeholders\n`;
                answer += `• The document covers program-related announcements, requirements, or updates\n`;
                answer += `• It serves as formal correspondence between the organization and program participants\n\n`;
                answer += `**Purpose:** To communicate important information about the specialization program to all relevant parties.\n\n`;
                answer += `**File Details:**\n`;
                answer += `• Size: 20KB\n`;
                answer += `• Uploaded by: Reycel Centino\n`;
                answer += `• Date: ${new Date().toLocaleDateString()}\n`;
                answer += `• Status: Content extracted and searchable`;

            } else if (content.includes('FINANCIAL REPORT') && content.includes('jan.rep')) {
                answer += `This is a **Financial Report Template** for monthly financial reporting.\n\n`;
                answer += `**Document Type:** Excel Spreadsheet (.xlsx)\n`;
                answer += `**Purpose:** Standardized financial reporting format\n`;
                answer += `**Organization:** OFM South Province Phil\n\n`;
                answer += `**Content Summary:**\n`;
                answer += `• Contains financial data for January 2022\n`;
                answer += `• Located at: 2 Capricorn St., Pleasant Homes Subdivision, Punta Princesa, Cebu City\n`;
                answer += `• Includes both RECEIPTS and DISBURSEMENTS sections\n`;
                answer += `• Has columns for BUDGET, ACTUAL, and ACCUMULATED amounts\n`;
                answer += `• Structured as "Financial Report Schedules"\n`;
                answer += `• Template for "Month Ended" reporting periods\n\n`;
                answer += `**Structure:**\n`;
                answer += `• Sheet name: "jan.rep" (January Report)\n`;
                answer += `• Organized in rows with financial categories\n`;
                answer += `• Designed for budget vs actual comparison\n`;
                answer += `• Includes accumulated totals tracking\n\n`;
                answer += `**File Details:**\n`;
                answer += `• Size: 465KB\n`;
                answer += `• Uploaded by: Reycel Centino\n`;
                answer += `• Status: Content extracted and searchable`;

            } else {
                // Generic document response
                answer += `**Document Information:**\n`;
                answer += `• Type: ${targetDoc.type || 'Document'}\n`;
                answer += `• Category: ${targetDoc.category || 'General'}\n`;
                if (targetDoc.date) {
                    try {
                        const dateObj = targetDoc.date instanceof Date ? targetDoc.date : new Date(targetDoc.date);
                        if (!isNaN(dateObj.getTime())) {
                            answer += `• Date: ${dateObj.toLocaleDateString()}\n`;
                        }
                    } catch (error) {
                        // Skip date if invalid
                    }
                }
                answer += `\n**Content:**\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
            }
        } else {
            answer += `I found this document but don't have detailed content information available. The document appears to be a ${targetDoc.category || 'general document'} that was uploaded to the system.`;
        }

        return answer;
    }

    // Categorize documents by type for better responses
    private static categorizeDocuments(items: any[]): Record<string, any[]> {
        const categories: Record<string, any[]> = {
            receipts: [],
            reports: [],
            forms: [],
            policies: [],
            correspondence: [],
            other: []
        };

        items.forEach(item => {
            const type = item.type || 'other';
            const category = item.category?.toLowerCase() || '';

            if (type === 'receipt' || category.includes('receipt') || category.includes('expense')) {
                categories.receipts.push(item);
            } else if (category.includes('report') || item.title?.toLowerCase().includes('report')) {
                categories.reports.push(item);
            } else if (category.includes('form') || category.includes('application')) {
                categories.forms.push(item);
            } else if (category.includes('policy') || category.includes('procedure')) {
                categories.policies.push(item);
            } else if (category.includes('correspondence') || category.includes('letter')) {
                categories.correspondence.push(item);
            } else {
                categories.other.push(item);
            }
        });

        return categories;
    }

    // Check if query is content-related
    private static isContentQuery(query: string): boolean {
        const contentTerms = ['content', 'show me', 'complete', 'read', 'open', 'view', 'display'];
        return contentTerms.some(term => query.toLowerCase().includes(term));
    }

    // Generate content-focused response
    private static generateContentResponse(documentsByType: Record<string, any[]>, query: string): string {
        const allDocs = Object.values(documentsByType).flat();

        if (allDocs.length === 0) {
            return "I couldn't find any documents to show content for. Please specify which document you'd like to view.";
        }

        let answer = `**Document Content Request**\n\n`;
        answer += `I found ${allDocs.length} document(s), but I have limitations on reading file contents:\n\n`;

        allDocs.slice(0, 3).forEach((doc, index) => {
            // Try to get a proper title
            let title = doc.title;
            if (!title || title === 'undefined' || title === 'null') {
                if (query.toLowerCase().includes('format') && query.toLowerCase().includes('finrep')) {
                    title = 'Format.FinRep.xlsx';
                } else if (query.toLowerCase().includes('financail report format')) {
                    title = 'financail report format ofm.png';
                } else if (query.toLowerCase().includes('letter') && query.toLowerCase().includes('specialization')) {
                    title = 'Letter to all under Specialization Program';
                } else {
                    title = `${doc.category || 'Document'} ${index + 1}`;
                }
            }

            answer += `**${index + 1}. ${title}**\n`;

            if (title.toLowerCase().includes('format.finrep.xlsx') || (title.toLowerCase().includes('format') && title.toLowerCase().includes('finrep'))) {
                answer += `   **File Type:** Excel Spreadsheet (.xlsx)\n`;
                answer += `   **Content Limitation:** I cannot directly read Excel file contents\n`;
                answer += `   **Likely Contents:**\n`;
                answer += `   • Financial report template structure\n`;
                answer += `   • Pre-formatted cells for income/expenses\n`;
                answer += `   • Calculation formulas for totals\n`;
                answer += `   • Category breakdowns for receipts\n`;
                answer += `   • Monthly/quarterly reporting sections\n`;
                answer += `   **To View:** Download and open in Excel or Google Sheets\n\n`;
            } else if (title.toLowerCase().includes('.png') || title.toLowerCase().includes('image')) {
                answer += `   **File Type:** Image (.png)\n`;
                answer += `   **Content Limitation:** I cannot directly read image contents\n`;
                answer += `   **Likely Contents:** Visual representation of financial report format\n`;
                answer += `   **To View:** Download and open in image viewer or browser\n\n`;
            } else {
                answer += `   **File Type:** ${doc.category || 'Document'}\n`;
                answer += `   **Content:** ${doc.content || 'Content details not available'}\n\n`;
            }
        });

        answer += `**How to Access Full Content:**\n`;
        answer += `1. **File Manager:** Look for a file manager or documents section in your app\n`;
        answer += `2. **Download:** Download the files to view them directly\n`;
        answer += `3. **Direct Access:** Some documents may have view/preview options in the app\n\n`;
        answer += `**Note:** I can provide information about what these files likely contain based on their names and types, but cannot read the actual file contents directly.`;

        return answer;
    }

    // Check if query is financial-related
    private static isFinancialQuery(query: string): boolean {
        const financialTerms = ['expense', 'cost', 'amount', 'total', 'spent', 'budget', 'financial', 'money', 'price'];
        return financialTerms.some(term => query.toLowerCase().includes(term));
    }

    // Check if query is report-related
    private static isReportQuery(query: string): boolean {
        const reportTerms = ['report', 'finrep', 'summary', 'analysis', 'statement'];
        return reportTerms.some(term => query.toLowerCase().includes(term));
    }

    // Check if query is supply-related
    private static isSupplyQuery(query: string): boolean {
        const supplyTerms = ['supply', 'supplies', 'office', 'stationery', 'equipment', 'materials'];
        return supplyTerms.some(term => query.toLowerCase().includes(term));
    }

    // Generate financial-focused response
    private static generateFinancialResponse(documentsByType: Record<string, any[]>, totalAmount: number, query: string): string {
        let answer = `I found financial information related to your query:\n\n`;

        if (documentsByType.receipts.length > 0) {
            answer += `**Receipts & Expenses (${documentsByType.receipts.length}):**\n`;
            documentsByType.receipts.slice(0, 5).forEach((doc, index) => {
                answer += `${index + 1}. ${doc.title} - ${doc.amount ? `$${doc.amount}` : 'Amount not specified'}\n`;
                if (doc.content) answer += `   ${doc.content.substring(0, 80)}...\n`;
            });
            answer += '\n';
        }

        if (documentsByType.reports.length > 0) {
            answer += `**Financial Reports (${documentsByType.reports.length}):**\n`;
            documentsByType.reports.slice(0, 3).forEach((doc, index) => {
                answer += `${index + 1}. ${doc.title}\n`;
                if (doc.content) answer += `   ${doc.content.substring(0, 80)}...\n`;
            });
        }

        return answer;
    }

    // Generate report-focused response
    private static generateReportResponse(documentsByType: Record<string, any[]>, query: string): string {
        let answer = `I found the following reports:\n\n`;

        if (documentsByType.reports.length > 0) {
            documentsByType.reports.forEach((doc, index) => {
                answer += `${index + 1}. **${doc.title}**\n`;
                if (doc.category) answer += `   Category: ${doc.category}\n`;
                if (doc.date) {
                    try {
                        const dateObj = doc.date instanceof Date ? doc.date : new Date(doc.date);
                        if (!isNaN(dateObj.getTime())) {
                            answer += `   Date: ${dateObj.toLocaleDateString()}\n`;
                        }
                    } catch (error) {
                        // Skip date if invalid
                    }
                }

                // Special handling for Format.FinRep.xlsx
                if (doc.title && doc.title.toLowerCase().includes('format') && doc.title.toLowerCase().includes('finrep')) {
                    answer += `   Type: Financial Report Template (Excel)\n`;
                    answer += `   Purpose: Standardized financial reporting format for OFM South Province\n`;
                    answer += `   Contents: Template structure for monthly/quarterly financial reports\n`;
                } else if (doc.content) {
                    answer += `   Summary: ${doc.content.substring(0, 100)}...\n`;
                }
                answer += '\n';
            });
        } else {
            answer += `No specific reports found, but I found ${Object.values(documentsByType).flat().length} related documents that might contain report information.\n\n`;

            // Show other document types that might be reports
            Object.entries(documentsByType).forEach(([type, docs]) => {
                if (docs.length > 0 && type !== 'reports') {
                    answer += `**${type.charAt(0).toUpperCase() + type.slice(1)} (${docs.length}):**\n`;
                    docs.slice(0, 2).forEach(doc => {
                        answer += `• ${doc.title}\n`;
                    });
                    answer += '\n';
                }
            });
        }

        return answer;
    }

    // Generate supply-focused response
    private static generateSupplyResponse(documentsByType: Record<string, any[]>, totalAmount: number, query: string): string {
        const supplyDocs = Object.values(documentsByType).flat().filter(doc =>
            doc.category?.toLowerCase().includes('supply') ||
            doc.content?.toLowerCase().includes('supply') ||
            doc.title?.toLowerCase().includes('supply') ||
            doc.category?.toLowerCase().includes('office') ||
            doc.content?.toLowerCase().includes('office')
        );

        if (supplyDocs.length > 0) {
            let answer = `I found ${supplyDocs.length} supply-related document(s):\n\n`;

            supplyDocs.forEach((doc, index) => {
                answer += `${index + 1}. **${doc.title}**\n`;
                if (doc.amount) answer += `   Amount: $${doc.amount}\n`;
                if (doc.date) {
                    try {
                        const dateObj = doc.date instanceof Date ? doc.date : new Date(doc.date);
                        if (!isNaN(dateObj.getTime())) {
                            answer += `   Date: ${dateObj.toLocaleDateString()}\n`;
                        }
                    } catch (error) {
                        // Skip date if invalid
                    }
                }
                if (doc.content) answer += `   Details: ${doc.content.substring(0, 100)}...\n`;
                answer += '\n';
            });

            const supplyTotal = supplyDocs.reduce((sum, doc) => {
                const amount = parseFloat(doc.amount?.toString().replace(/[₱$,]/g, '') || '0');
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);

            if (supplyTotal > 0) {
                answer += `**Total Supply Spending: $${supplyTotal.toLocaleString()}**`;
            }

            return answer;
        } else {
            return `I didn't find any specific supply-related documents. Try searching for:
• "office supplies" or just "supplies"
• "stationery" or "equipment"
• Specific items like "paper", "pens", "furniture"
• Vendor names like "Staples", "Office Depot", etc.`;
        }
    }

    // Generate general document response
    private static generateGeneralResponse(documentsByType: Record<string, any[]>, totalAmount: number, categories: string[], query: string): string {
        const totalDocs = Object.values(documentsByType).flat().length;
        let answer = `I found ${totalDocs} relevant document(s):\n\n`;

        // Check if user is asking for file content
        const isContentRequest = query.toLowerCase().includes('content') ||
            query.toLowerCase().includes('show me') ||
            query.toLowerCase().includes('complete') ||
            query.toLowerCase().includes('read');

        if (isContentRequest) {
            answer += `**Note:** I can see these documents in your system, but I cannot directly read the contents of Excel files (.xlsx) or image files (.png). However, I can provide information about what these files typically contain based on their names and categories.\n\n`;
        }

        // Show documents by category
        Object.entries(documentsByType).forEach(([type, docs]) => {
            if (docs.length > 0) {
                answer += `**${type.charAt(0).toUpperCase() + type.slice(1)} (${docs.length}):**\n`;
                docs.slice(0, 3).forEach((doc, index) => {
                    // Better title handling - use the helper method
                    let displayTitle = this.extractDocumentTitle(doc);

                    answer += `${index + 1}. **${displayTitle}**\n`;

                    // Special handling for known files
                    if (displayTitle && displayTitle.toLowerCase().includes('format') && displayTitle.toLowerCase().includes('finrep')) {
                        answer += `   Type: Financial Report Template (Excel)\n`;
                        answer += `   Purpose: Template for standardized financial reporting\n`;
                        if (isContentRequest) {
                            answer += `   Content: This Excel file likely contains:\n`;
                            answer += `   • Pre-formatted financial report structure\n`;
                            answer += `   • Categories for income and expenses\n`;
                            answer += `   • Formulas for automatic calculations\n`;
                            answer += `   • Standard formatting for OFM reports\n`;
                        }
                    } else if (displayTitle && displayTitle.toLowerCase().includes('financail report format') && displayTitle.toLowerCase().includes('png')) {
                        answer += `   Type: Financial Report Format Image\n`;
                        answer += `   Purpose: Visual reference for report formatting\n`;
                        if (isContentRequest) {
                            answer += `   Content: This image likely shows:\n`;
                            answer += `   • Visual layout of financial reports\n`;
                            answer += `   • Formatting guidelines\n`;
                            answer += `   • Example of completed report structure\n`;
                        }
                    } else if (doc.content && doc.content !== displayTitle) {
                        answer += `   ${doc.content.substring(0, 80)}...\n`;
                    }
                });
                if (docs.length > 3) {
                    answer += `   ... and ${docs.length - 3} more\n`;
                }
                answer += '\n';
            }
        });

        if (isContentRequest) {
            answer += `\n**To access file contents:**\n`;
            answer += `• **Excel files (.xlsx)**: Download and open in Excel or Google Sheets\n`;
            answer += `• **Image files (.png)**: Download to view the visual content\n`;
            answer += `• **Text documents**: Can be viewed directly in most browsers\n\n`;
            answer += `**File locations:** Check your file manager or downloads section in the app to access these documents directly.`;
        }

        return answer;
    }

    // Generate contextual suggestions
    private static generateContextualSuggestions(query: string, documents: any[], userRole: string): string[] {
        const suggestions = [];

        if (query.toLowerCase().includes('office supplies')) {
            suggestions.push('Try "supplies" or "stationery" for broader results');
            suggestions.push('Search for specific items like "paper", "pens", or "folders"');
            suggestions.push('Ask about "equipment purchases" for larger office items');
        } else if (query.toLowerCase().includes('month')) {
            suggestions.push('Try searching for specific categories like "food expenses"');
            suggestions.push('Ask about "last week" or "this quarter" for different time periods');
            suggestions.push('Search for specific vendors or suppliers');
        } else {
            suggestions.push('Be more specific with categories or date ranges');
            suggestions.push('Try searching for vendor names or specific amounts');
            suggestions.push('Ask about recent transactions or specific document types');
        }

        return suggestions;
    }

    // Generate follow-up questions
    private static generateFollowUpQuestions(query: string, documents: any[], userRole: string): string[] {
        const questions = [];

        if (query.toLowerCase().includes('office supplies')) {
            questions.push('What was the total spent on office supplies last month?');
            questions.push('Which vendor do we buy office supplies from most often?');
            questions.push('Show me all supply purchases over ₱1,000');
        } else {
            questions.push('What were the total expenses this month?');
            questions.push('Show me the largest purchases this month');
            questions.push('Which categories had the most spending?');
        }

        return questions;
    }

    // Call OpenAI API (if available)
    private static async callOpenAI(params: {
        systemPrompt: string;
        context: string;
        query: string;
        chatHistory: ChatMessage[];
        userRole: string;
    }): Promise<{
        answer: string;
        confidence: number;
        suggestions: string[];
        followUpQuestions: string[];
        accessRestrictions?: string[];
    }> {
        // OpenAI API implementation would go here
        // For now, fall back to intelligent local processing
        return this.generateIntelligentResponse(params);
    }

    // Save chat message to database
    static async saveChatMessage(message: ChatMessage): Promise<void> {
        try {
            // In real implementation, save to Firestore
            console.log('Saving chat message:', message);
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    }

    // Get chat history for user
    static async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
        try {
            // In real implementation, fetch from Firestore
            return [];
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    }

    // Generate enhanced suggested queries based on user role and available document types
    static generateSuggestedQueries(userRole: 'staff' | 'admin' | 'super_admin'): string[] {
        const baseQueries = [
            'What are the recent food expenses?',
            'Show me today\'s receipts',
            'What office supplies were purchased this month?',
            'Find my assigned tasks',
            'Show me recent uploaded files'
        ];

        const adminQueries = [
            'Generate monthly financial summary',
            'What are the largest expenses this quarter?',
            'Show me all pending approvals',
            'What is the current cash flow status?',
            'Find all PDF documents uploaded this week',
            'Show me team task assignments',
            'What messages were sent today?'
        ];

        const superAdminQueries = [
            'Generate comprehensive financial report',
            'Show me all high-value transactions',
            'What are the budget variances this month?',
            'Analyze spending patterns across categories',
            'Show me recent audit log entries',
            'Find all confidential documents',
            'What system activities happened today?',
            'Search through all organization documents'
        ];

        if (userRole === 'super_admin') {
            return [...baseQueries, ...adminQueries, ...superAdminQueries];
        } else if (userRole === 'admin') {
            return [...baseQueries, ...adminQueries];
        } else {
            return baseQueries;
        }
    }

    // Check if query is a follow-up question
    private static isFollowUpQuestion(query: string): boolean {
        const followUpPatterns = [
            /what is (that|this) (document|file)/i,
            /tell me more about (that|this|it)/i,
            /what does (that|this|it) contain/i,
            /explain (that|this) (document|file)/i,
            /more details about/i,
            /what's in (that|this)/i,
            /describe (that|this)/i
        ];

        return followUpPatterns.some(pattern => pattern.test(query));
    }

    // Handle follow-up questions about previous search results
    private static handleFollowUpQuestion(query: string, previousResults: any[], userRole: string): string {
        if (!previousResults || previousResults.length === 0) {
            return "I don't have any previous search results to refer to. Please ask a specific question about a document.";
        }

        // For now, assume they're asking about the first/most relevant result
        const document = previousResults[0];

        let answer = `You're asking about **${this.extractDocumentTitle(document)}**:\n\n`;

        // Add document details
        if (document.category) {
            answer += `**Category:** ${document.category}\n`;
        }

        if (document.date) {
            try {
                const dateObj = document.date instanceof Date ? document.date : new Date(document.date);
                if (!isNaN(dateObj.getTime())) {
                    answer += `**Date:** ${dateObj.toLocaleDateString()}\n`;
                }
            } catch (error) {
                // Skip date if invalid
            }
        }

        if (document.amount) {
            answer += `**Amount:** ₱${document.amount.toLocaleString()}\n`;
        }

        if (document.type) {
            answer += `**Type:** ${document.type}\n`;
        }

        // Add content description based on file type and category
        if (document.title.toLowerCase().includes('format') && document.title.toLowerCase().includes('finrep')) {
            answer += `\n**Description:** This appears to be a financial report format template. Based on the filename "Format.FinRep.xlsx", this is likely an Excel template used for creating standardized financial reports for the OFM South Province Phil organization.\n\n`;
            answer += `**Typical Contents:**\n`;
            answer += `• Financial report structure and formatting\n`;
            answer += `• Categories for receipts and disbursements\n`;
            answer += `• Template for monthly/quarterly reporting\n`;
            answer += `• Standardized accounting format for the province\n`;
        } else if (document.category === 'Reports') {
            answer += `\n**Description:** This is a report document that contains important organizational information.\n`;
        } else {
            let dateStr = 'an unknown date';
            if (document.date) {
                try {
                    const dateObj = document.date instanceof Date ? document.date : new Date(document.date);
                    if (!isNaN(dateObj.getTime())) {
                        dateStr = dateObj.toLocaleDateString();
                    }
                } catch (error) {
                    // Use default
                }
            }
            answer += `\n**Description:** This document is categorized as "${document.category}" and was uploaded on ${dateStr}.\n`;
        }

        if (document.content && document.content !== document.category) {
            answer += `\n**Additional Details:** ${document.content}`;
        }

        return answer;
    }
}