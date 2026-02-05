// Comprehensive AI Search Service - Access All App Data with Role-Based Security
// Includes: Friaries, Schools, Users, Receipts, Files, Tasks, Messages, Financial Data
// NOW WITH: File Content Search from Firebase Storage

import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    getDocs,
    QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { getAllFriaries } from './friary-service';
import { Friary, UserRole, canViewAllFriaries } from './friary-types';
import { AIStorageContentReader, StorageSearchResult } from './ai-storage-content-reader';

export interface ComprehensiveSearchResult {
    id: string;
    type: 'friary' | 'parish' | 'school' | 'formation_house' | 'retreat_center' |
    'receipt' | 'file' | 'task' | 'message' | 'user' | 'financial_transaction' | 'ministry' | 'file_content';
    title: string;
    content: string;
    date?: Date;
    category?: string;
    amount?: number;
    location?: string;
    accessLevel: 'public' | 'staff' | 'admin' | 'super_admin';
    ownerId?: string;
    relevanceScore: number;
    metadata?: Record<string, any>;
    fileUrl?: string; // For file content results
    matchedExcerpt?: string; // For file content matches
}

export interface ComprehensiveSearchQuery {
    query: string;
    userRole: UserRole;
    userId: string;
    organizationId?: string;
    friaryId?: string;
    limit?: number;
    includeTypes?: string[]; // Filter specific types
}

export class ComprehensiveAISearch {
    // Main comprehensive search function
    static async searchAll(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            console.log('🔍 Comprehensive AI Search:', searchQuery);
            const allResults: ComprehensiveSearchResult[] = [];

            // Determine what to search based on user role and query
            const searchTypes = searchQuery.includeTypes || this.determineSearchTypes(searchQuery.query);

            // Search organizational data (friaries, schools, parishes)
            if (searchTypes.includes('organization')) {
                const orgResults = await this.searchOrganizationalData(searchQuery);
                console.log('📍 Organization results:', orgResults.length);
                allResults.push(...orgResults);
            }

            // Search users/staff
            if (searchTypes.includes('users') && this.canSearchUsers(searchQuery.userRole)) {
                const userResults = await this.searchUsers(searchQuery);
                console.log('👥 User results:', userResults.length);
                allResults.push(...userResults);
            }

            // Search receipts
            if (searchTypes.includes('receipts')) {
                const receiptResults = await this.searchReceipts(searchQuery);
                console.log('🧾 Receipt results:', receiptResults.length);
                allResults.push(...receiptResults);
            }

            // Search files/documents
            if (searchTypes.includes('files')) {
                const fileResults = await this.searchFiles(searchQuery);
                console.log('📄 File results:', fileResults.length);
                allResults.push(...fileResults);

                // ALSO search inside file contents from Storage
                const fileContentResults = await this.searchFileContents(searchQuery);
                console.log('📑 File content results:', fileContentResults.length);
                allResults.push(...fileContentResults);
            }

            // Search financial transactions
            if (searchTypes.includes('financial') && this.canSearchFinancial(searchQuery.userRole)) {
                const financialResults = await this.searchFinancialTransactions(searchQuery);
                console.log('💰 Financial results:', financialResults.length);
                allResults.push(...financialResults);
            }

            // Search tasks
            if (searchTypes.includes('tasks')) {
                const taskResults = await this.searchTasks(searchQuery);
                console.log('✅ Task results:', taskResults.length);
                allResults.push(...taskResults);
            }

            // Search messages
            if (searchTypes.includes('messages')) {
                const messageResults = await this.searchMessages(searchQuery);
                console.log('💬 Message results:', messageResults.length);
                allResults.push(...messageResults);
            }

            // Sort by relevance and apply limit
            const sortedResults = allResults
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, searchQuery.limit || 50);

            console.log('✅ Total comprehensive results:', sortedResults.length);
            return sortedResults;
        } catch (error) {
            console.error('❌ Error in comprehensive search:', error);
            return [];
        }
    }

    // Search organizational data (friaries, schools, parishes, formation houses, retreat centers)
    private static async searchOrganizationalData(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const friaries = await getAllFriaries();
            const results: ComprehensiveSearchResult[] = [];

            for (const friary of friaries) {
                const matches = this.matchesQuery(
                    searchQuery.query,
                    friary.name,
                    friary.location,
                    friary.guardianName,
                    friary.type,
                    ...(friary.ministries || [])
                );

                if (matches) {
                    let content = `${friary.location}`;
                    if (friary.guardianName) content += ` | Guardian: ${friary.guardianName}`;
                    if (friary.type) content += ` | Type: ${friary.type}`;
                    if (friary.ministries) content += ` | Ministries: ${friary.ministries.join(', ')}`;
                    if (friary.phone) content += ` | Phone: ${friary.phone}`;
                    if (friary.email) content += ` | Email: ${friary.email}`;

                    results.push({
                        id: friary.id,
                        type: friary.type,
                        title: friary.name,
                        content,
                        location: friary.location,
                        accessLevel: 'staff', // All authenticated users can view
                        relevanceScore: this.calculateRelevance(searchQuery.query, friary.name, friary.location, friary.type),
                        metadata: {
                            guardian: friary.guardianName,
                            members: friary.memberCount,
                            established: friary.established,
                            ministries: friary.ministries
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching organizational data:', error);
            return [];
        }
    }

    // Search users/staff
    private static async searchUsers(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const constraints: QueryConstraint[] = [];

            // Role-based filtering
            if (searchQuery.userRole === 'staff') {
                // Staff can only see themselves
                constraints.push(where('uid', '==', searchQuery.userId));
            } else if (searchQuery.userRole === 'admin' && searchQuery.friaryId) {
                // Admins can see users in their friary
                constraints.push(where('friaryId', '==', searchQuery.friaryId));
            }
            // Super admins can see all users (no filter)

            constraints.push(firestoreLimit(20));

            const q = query(collection(db, 'users'), ...constraints);
            const snapshot = await getDocs(q);
            const results: ComprehensiveSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const matches = this.matchesQuery(searchQuery.query, data.name, data.email, data.role);

                if (matches) {
                    results.push({
                        id: doc.id,
                        type: 'user' as any,
                        title: data.name || data.email,
                        content: `${data.email} | Role: ${data.role}${data.friaryId ? ` | Friary: ${data.friaryId}` : ''}`,
                        accessLevel: 'admin',
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.name, data.email),
                        metadata: {
                            role: data.role,
                            email: data.email,
                            friaryId: data.friaryId
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }

    // Search receipts
    private static async searchReceipts(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const constraints: QueryConstraint[] = [];

            // Role-based filtering
            if (searchQuery.userRole === 'staff') {
                constraints.push(where('uploadedBy', '==', searchQuery.userId));
            } else if (searchQuery.userRole === 'admin' && searchQuery.friaryId) {
                constraints.push(where('friaryId', '==', searchQuery.friaryId));
            }

            constraints.push(orderBy('receiptDate', 'desc'), firestoreLimit(30));

            const q = query(collection(db, 'receipts'), ...constraints);
            const snapshot = await getDocs(q);
            const results: ComprehensiveSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const matches = this.matchesQuery(
                    searchQuery.query,
                    data.title,
                    data.description,
                    data.vendor,
                    data.category
                );

                if (matches) {
                    let content = data.description || '';
                    if (data.vendor) content += ` | Vendor: ${data.vendor}`;
                    if (data.amount) content += ` | Amount: ₱${data.amount}`;
                    if (data.category) content += ` | Category: ${data.category}`;

                    results.push({
                        id: doc.id,
                        type: 'receipt',
                        title: data.title || `Receipt - ${data.vendor || doc.id.substring(0, 8)}`,
                        content,
                        date: data.receiptDate?.toDate(),
                        category: data.category,
                        amount: data.amount,
                        accessLevel: 'staff',
                        ownerId: data.uploadedBy,
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.title, data.vendor),
                        metadata: {
                            vendor: data.vendor,
                            friaryId: data.friaryId
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching receipts:', error);
            return [];
        }
    }

    // Search files/documents
    private static async searchFiles(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const constraints: QueryConstraint[] = [];

            // Role-based filtering
            if (searchQuery.userRole === 'staff') {
                constraints.push(where('uploadedBy', '==', searchQuery.userId));
            } else if (searchQuery.userRole === 'admin' && searchQuery.friaryId) {
                constraints.push(where('friaryId', '==', searchQuery.friaryId));
            }

            constraints.push(orderBy('uploadedAt', 'desc'), firestoreLimit(30));

            const q = query(collection(db, 'files'), ...constraints);
            const snapshot = await getDocs(q);
            const results: ComprehensiveSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const matches = this.matchesQuery(
                    searchQuery.query,
                    data.title,
                    data.fileName,
                    data.category,
                    data.description
                );

                if (matches) {
                    let content = data.description || data.fileName || '';
                    if (data.category) content += ` | Category: ${data.category}`;
                    if (data.fileType) content += ` | Type: ${data.fileType}`;

                    results.push({
                        id: doc.id,
                        type: 'file',
                        title: data.title || data.fileName || `Document ${doc.id.substring(0, 8)}`,
                        content,
                        date: data.uploadedAt?.toDate(),
                        category: data.category,
                        accessLevel: data.accessLevel || 'staff',
                        ownerId: data.uploadedBy,
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.title, data.fileName),
                        metadata: {
                            fileType: data.fileType,
                            fileUrl: data.fileUrl,
                            friaryId: data.friaryId
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }

    // Search financial transactions
    private static async searchFinancialTransactions(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const constraints: QueryConstraint[] = [];

            if (searchQuery.userRole === 'admin' && searchQuery.friaryId) {
                constraints.push(where('friaryId', '==', searchQuery.friaryId));
            }

            constraints.push(orderBy('date', 'desc'), firestoreLimit(20));

            const q = query(collection(db, 'financial_transactions'), ...constraints);
            const snapshot = await getDocs(q);
            const results: ComprehensiveSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const matches = this.matchesQuery(
                    searchQuery.query,
                    data.description,
                    data.category,
                    data.type
                );

                if (matches) {
                    results.push({
                        id: doc.id,
                        type: 'financial_transaction' as any,
                        title: data.description || `Transaction ${doc.id.substring(0, 8)}`,
                        content: `${data.type} | Amount: ₱${data.amount} | Category: ${data.category}`,
                        date: data.date?.toDate(),
                        category: data.category,
                        amount: data.amount,
                        accessLevel: 'admin',
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.description),
                        metadata: {
                            type: data.type,
                            friaryId: data.friaryId
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching financial transactions:', error);
            return [];
        }
    }

    // Search tasks
    private static async searchTasks(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const constraints: QueryConstraint[] = [];

            if (searchQuery.userRole === 'staff') {
                constraints.push(where('assignedTo', '==', searchQuery.userId));
            }

            constraints.push(orderBy('createdAt', 'desc'), firestoreLimit(20));

            const q = query(collection(db, 'tasks'), ...constraints);
            const snapshot = await getDocs(q);
            const results: ComprehensiveSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const matches = this.matchesQuery(searchQuery.query, data.title, data.description);

                if (matches) {
                    results.push({
                        id: doc.id,
                        type: 'task',
                        title: data.title,
                        content: data.description || '',
                        date: data.createdAt?.toDate(),
                        accessLevel: 'staff',
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.title, data.description),
                        metadata: {
                            status: data.status,
                            priority: data.priority
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching tasks:', error);
            return [];
        }
    }

    // Search messages
    private static async searchMessages(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            const constraints: QueryConstraint[] = [
                orderBy('timestamp', 'desc'),
                firestoreLimit(20)
            ];

            const q = query(collection(db, 'messages'), ...constraints);
            const snapshot = await getDocs(q);
            const results: ComprehensiveSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const matches = this.matchesQuery(searchQuery.query, data.content, data.subject);

                if (matches) {
                    results.push({
                        id: doc.id,
                        type: 'message',
                        title: data.subject || 'Message',
                        content: data.content || '',
                        date: data.timestamp?.toDate(),
                        accessLevel: 'staff',
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.content),
                        metadata: {
                            senderId: data.senderId,
                            recipientId: data.recipientId
                        }
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching messages:', error);
            return [];
        }
    }

    // Search inside file contents from Firebase Storage
    private static async searchFileContents(searchQuery: ComprehensiveSearchQuery): Promise<ComprehensiveSearchResult[]> {
        try {
            console.log('🔍 Searching file contents from Storage...');

            const storageResults: StorageSearchResult[] = await AIStorageContentReader.searchFileContents(
                searchQuery.query,
                searchQuery.userRole,
                searchQuery.userId,
                searchQuery.friaryId,
                20 // limit
            );

            // Convert to ComprehensiveSearchResult format
            const results: ComprehensiveSearchResult[] = storageResults.map(result => ({
                id: result.fileId,
                type: 'file_content',
                title: `📄 ${result.fileName} (Content Match)`,
                content: result.matchedContent,
                accessLevel: 'staff',
                relevanceScore: result.relevanceScore,
                fileUrl: result.fileUrl,
                matchedExcerpt: result.matchedContent,
                metadata: {
                    ...result.metadata,
                    source: 'storage_content'
                }
            }));

            console.log('✅ File content search complete:', results.length, 'matches');
            return results;

        } catch (error) {
            console.error('Error searching file contents:', error);
            return [];
        }
    }

    // Helper: Determine what types to search based on query
    private static determineSearchTypes(query: string): string[] {
        const lowerQuery = query.toLowerCase();
        const types: string[] = [];

        // Organization-related keywords
        if (this.matchesAny(lowerQuery, ['friary', 'friaries', 'school', 'schools', 'parish', 'parishes',
            'formation', 'retreat', 'center', 'community', 'communities', 'location', 'guardian',
            'cebu', 'manila', 'davao', 'samar', 'basilan', 'mindanao', 'visayas', 'luzon'])) {
            types.push('organization');
        }

        // User-related keywords
        if (this.matchesAny(lowerQuery, ['user', 'users', 'staff', 'friar', 'friars', 'member', 'members',
            'guardian', 'director', 'priest', 'brother'])) {
            types.push('users');
        }

        // Receipt-related keywords
        if (this.matchesAny(lowerQuery, ['receipt', 'receipts', 'expense', 'expenses', 'purchase', 'vendor'])) {
            types.push('receipts');
        }

        // File-related keywords
        if (this.matchesAny(lowerQuery, ['file', 'files', 'document', 'documents', 'report', 'reports', 'pdf', 'excel'])) {
            types.push('files');
        }

        // Financial keywords
        if (this.matchesAny(lowerQuery, ['financial', 'transaction', 'transactions', 'budget', 'money', 'amount', 'peso'])) {
            types.push('financial');
        }

        // Task keywords
        if (this.matchesAny(lowerQuery, ['task', 'tasks', 'todo', 'assignment'])) {
            types.push('tasks');
        }

        // Message keywords
        if (this.matchesAny(lowerQuery, ['message', 'messages', 'chat', 'conversation'])) {
            types.push('messages');
        }

        // If no specific type detected, search everything
        if (types.length === 0) {
            return ['organization', 'receipts', 'files', 'tasks', 'messages'];
        }

        return types;
    }

    // Helper: Check if query matches any of the keywords
    private static matchesAny(query: string, keywords: string[]): boolean {
        return keywords.some(keyword => query.includes(keyword));
    }

    // Helper: Check if text matches query
    private static matchesQuery(query: string, ...texts: (string | undefined)[]): boolean {
        const lowerQuery = query.toLowerCase();
        const queryWords = lowerQuery.split(/\s+/);

        return texts.some(text => {
            if (!text) return false;
            const lowerText = text.toLowerCase();
            return queryWords.some(word => lowerText.includes(word));
        });
    }

    // Helper: Calculate relevance score
    private static calculateRelevance(query: string, ...texts: (string | undefined)[]): number {
        const lowerQuery = query.toLowerCase();
        const queryWords = lowerQuery.split(/\s+/);
        let score = 0;

        for (const text of texts) {
            if (!text) continue;
            const lowerText = text.toLowerCase();

            // Exact match
            if (lowerText === lowerQuery) score += 100;

            // Contains full query
            if (lowerText.includes(lowerQuery)) score += 50;

            // Contains query words
            for (const word of queryWords) {
                if (lowerText.includes(word)) score += 10;
            }

            // Starts with query
            if (lowerText.startsWith(lowerQuery)) score += 30;
        }

        return score;
    }

    // Helper: Check if user can search users
    private static canSearchUsers(role: UserRole): boolean {
        return ['admin', 'vice_admin', 'super_admin', 'vice_super_admin', 'provincial_treasurer'].includes(role);
    }

    // Helper: Check if user can search financial data
    private static canSearchFinancial(role: UserRole): boolean {
        return ['admin', 'vice_admin', 'super_admin', 'vice_super_admin', 'provincial_treasurer', 'treasurer'].includes(role);
    }
}
