// Simplified Document Search Service - No Complex Indexes Required
// Provides basic document search functionality while avoiding Firestore index requirements

import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase';

export interface SimpleSearchResult {
    id: string;
    type: 'receipt' | 'file' | 'task' | 'message';
    title: string;
    content: string;
    date: Date;
    category?: string;
    amount?: number;
    accessLevel: 'public' | 'staff' | 'admin' | 'super_admin';
    ownerId?: string;
    relevanceScore: number;
}

export interface SimpleSearchQuery {
    query: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    userId: string;
    organizationId?: string;
    limit?: number;
}

export class SimpleDocumentSearch {
    // Main search function with basic queries only
    static async searchDocuments(searchQuery: SimpleSearchQuery): Promise<SimpleSearchResult[]> {
        try {
            console.log('SimpleDocumentSearch query:', searchQuery);
            const allResults: SimpleSearchResult[] = [];

            // Search each document type with simple queries
            const receiptResults = await this.searchReceipts(searchQuery);
            console.log('Receipt results:', receiptResults.length);

            const fileResults = await this.searchFiles(searchQuery);
            console.log('File results:', fileResults.length);

            const taskResults = await this.searchTasks(searchQuery);
            console.log('Task results:', taskResults.length);

            const messageResults = await this.searchMessages(searchQuery);
            console.log('Message results:', messageResults.length);

            allResults.push(...receiptResults, ...fileResults, ...taskResults, ...messageResults);

            // Sort by relevance and apply limit
            const sortedResults = allResults
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, searchQuery.limit || 20);

            console.log('Total search results:', sortedResults.length);
            return sortedResults;
        } catch (error) {
            console.error('Error in simple document search:', error);
            return [];
        }
    }

    // Simple receipt search
    private static async searchReceipts(searchQuery: SimpleSearchQuery): Promise<SimpleSearchResult[]> {
        try {
            let q = query(collection(db, 'receipts'));

            // Apply basic role-based filtering
            if (searchQuery.userRole === 'staff') {
                q = query(q,
                    where('uploadedBy', '==', searchQuery.userId),
                    orderBy('receiptDate', 'desc'),
                    firestoreLimit(20)
                );
            } else if (searchQuery.userRole === 'admin' && searchQuery.organizationId) {
                q = query(q,
                    where('organizationId', '==', searchQuery.organizationId),
                    orderBy('receiptDate', 'desc'),
                    firestoreLimit(20)
                );
            } else {
                // Super admin - simple query
                q = query(q,
                    orderBy('receiptDate', 'desc'),
                    firestoreLimit(20)
                );
            }

            const snapshot = await getDocs(q);
            const results: SimpleSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();

                // Enhanced text matching including category synonyms
                const textMatches = this.matchesQuery(searchQuery.query, data.title, data.description, data.vendor);
                const categoryMatches = this.matchesCategory(searchQuery.query, data.category);
                const matches = textMatches || categoryMatches;

                if (matches) {
                    // Enhanced content for receipts
                    let content = data.description || '';
                    if (data.vendor) {
                        content += content ? ` | Vendor: ${data.vendor}` : `Vendor: ${data.vendor}`;
                    }
                    if (data.amount) {
                        content += content ? ` | Amount: $${data.amount}` : `Amount: $${data.amount}`;
                    }
                    if (data.category) {
                        content += content ? ` | Category: ${data.category}` : `Category: ${data.category}`;
                    }

                    results.push({
                        id: doc.id,
                        type: 'receipt',
                        title: data.title || (data.vendor ? `Receipt - ${data.vendor}` : `Receipt ${doc.id.substring(0, 8)}`),
                        content: content,
                        date: data.receiptDate?.toDate() || data.createdAt?.toDate() || new Date(),
                        category: data.category,
                        amount: data.amount,
                        accessLevel: data.accessLevel || 'staff',
                        ownerId: data.uploadedBy,
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.title, data.description, data.vendor)
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching receipts:', error);
            return [];
        }
    }

    // Simple file search
    private static async searchFiles(searchQuery: SimpleSearchQuery): Promise<SimpleSearchResult[]> {
        try {
            console.log('Searching files with query:', searchQuery.query);
            let q = query(collection(db, 'files'));

            // Apply basic role-based filtering
            if (searchQuery.userRole === 'staff') {
                q = query(q,
                    where('uploadedBy', '==', searchQuery.userId),
                    orderBy('createdAt', 'desc'),
                    firestoreLimit(20)
                );
            } else {
                // Admin and super admin
                q = query(q,
                    orderBy('createdAt', 'desc'),
                    firestoreLimit(20)
                );
            }

            const snapshot = await getDocs(q);
            const results: SimpleSearchResult[] = [];

            console.log(`Found ${snapshot.docs.length} files in database`);

            for (const doc of snapshot.docs) {
                const data = doc.data();
                console.log('File data:', {
                    id: doc.id,
                    name: data.name,
                    filename: data.filename,
                    title: data.title,
                    category: data.category,
                    accessLevel: data.accessLevel,
                    uploadedBy: data.uploadedBy,
                    allFields: Object.keys(data)
                });

                // Check access level
                if (!this.hasAccess(data.accessLevel, searchQuery.userRole)) {
                    console.log('Access denied for file:', data.name);
                    continue;
                }

                // Enhanced text matching - check name, description, category, and extracted content
                const textMatches = this.matchesQuery(searchQuery.query, data.name, data.description, data.category, data.extractedContent);
                const categoryMatches = this.matchesCategory(searchQuery.query, data.category);
                const matches = textMatches || categoryMatches;

                console.log(`File "${data.name}" matches query "${searchQuery.query}":`, {
                    textMatches,
                    categoryMatches,
                    finalMatch: matches,
                    hasExtractedContent: !!(data.extractedContent && data.extractedContent.length > 0)
                });

                console.log(`File "${data.name}" matches query "${searchQuery.query}":`, {
                    textMatches,
                    categoryMatches,
                    finalMatch: matches
                });

                if (matches) {
                    // Enhanced content extraction - include extracted file content
                    let content = '';
                    if (data.extractedContent && data.extractedContent.length > 0) {
                        // Use extracted content if available
                        content = data.extractedContent.substring(0, 500) + (data.extractedContent.length > 500 ? '...' : '');
                    } else if (data.description) {
                        content = data.description;
                    } else if (data.category) {
                        content = `${data.category} document`;
                    } else {
                        content = `File: ${data.name}`;
                    }

                    // Add metadata to content for better AI understanding
                    if (data.size) {
                        content += ` (Size: ${Math.round(data.size / 1024)}KB)`;
                    }
                    if (data.uploadedBy) {
                        content += ` (Uploaded by: ${data.uploadedBy})`;
                    }
                    if (data.hasContent) {
                        content += ` (Content extracted and searchable)`;
                    }

                    // Determine the best title for the document with improved logic
                    let documentTitle = '';

                    // Priority order: name -> filename -> title -> extract from URL -> fallback
                    if (data.name && data.name !== 'undefined' && data.name !== null && data.name.trim() !== '') {
                        documentTitle = data.name;
                    } else if (data.filename && data.filename !== 'undefined' && data.filename !== null && data.filename.trim() !== '') {
                        documentTitle = data.filename;
                    } else if (data.title && data.title !== 'undefined' && data.title !== null && data.title.trim() !== '') {
                        documentTitle = data.title;
                    } else if (data.url && typeof data.url === 'string' && data.url !== 'https://example.com/file.pdf') {
                        // Extract filename from URL if available
                        const urlParts = data.url.split('/');
                        const lastPart = urlParts[urlParts.length - 1];
                        if (lastPart && lastPart.includes('.')) {
                            // Decode and clean up the filename
                            documentTitle = decodeURIComponent(lastPart)
                                .replace(/^\d+_/, '') // Remove timestamp prefix
                                .replace(/%20/g, ' ') // Replace URL encoded spaces
                                .replace(/\?.*$/, ''); // Remove query parameters
                        }
                    }

                    // Final fallback with better naming
                    if (!documentTitle || documentTitle === 'undefined' || documentTitle === 'null' || documentTitle.trim() === '') {
                        if (data.category && data.category !== 'undefined') {
                            documentTitle = `${data.category} Document`;
                        } else {
                            documentTitle = `Document ${doc.id.substring(0, 8)}`;
                        }
                    }

                    // Clean up the title one more time
                    documentTitle = documentTitle.replace(/^undefined\s*/, '').replace(/\s*undefined$/, '').trim();
                    if (!documentTitle) {
                        documentTitle = 'Document';
                    }

                    const result = {
                        id: doc.id,
                        type: 'file' as const,
                        title: documentTitle,
                        content: content,
                        date: data.createdAt?.toDate() || new Date(),
                        category: data.category,
                        accessLevel: data.accessLevel || 'staff',
                        ownerId: data.uploadedBy,
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.name, data.description, data.category)
                    };
                    console.log('Adding file result:', result);
                    results.push(result);
                }
            }

            console.log(`Returning ${results.length} file results`);
            return results;
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }

    // Simple task search
    private static async searchTasks(searchQuery: SimpleSearchQuery): Promise<SimpleSearchResult[]> {
        try {
            let q = query(collection(db, 'tasks'));

            // Apply basic role-based filtering
            if (searchQuery.userRole === 'staff') {
                q = query(q,
                    where('assignedTo', '==', searchQuery.userId),
                    orderBy('createdAt', 'desc'),
                    firestoreLimit(20)
                );
            } else if (searchQuery.userRole === 'admin' && searchQuery.organizationId) {
                q = query(q,
                    where('organizationId', '==', searchQuery.organizationId),
                    orderBy('createdAt', 'desc'),
                    firestoreLimit(20)
                );
            } else {
                // Super admin
                q = query(q,
                    orderBy('createdAt', 'desc'),
                    firestoreLimit(20)
                );
            }

            const snapshot = await getDocs(q);
            const results: SimpleSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();

                // Simple text matching
                if (this.matchesQuery(searchQuery.query, data.title, data.description)) {
                    results.push({
                        id: doc.id,
                        type: 'task',
                        title: data.title,
                        content: data.description || '',
                        date: data.createdAt?.toDate() || new Date(),
                        accessLevel: 'staff',
                        ownerId: data.createdBy,
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.title, data.description)
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching tasks:', error);
            return [];
        }
    }

    // Simple message search
    private static async searchMessages(searchQuery: SimpleSearchQuery): Promise<SimpleSearchResult[]> {
        try {
            if (!searchQuery.organizationId) {
                return []; // Messages require organization context
            }

            const q = query(
                collection(db, 'messages'),
                where('organizationId', '==', searchQuery.organizationId),
                orderBy('timestamp', 'desc'),
                firestoreLimit(20)
            );

            const snapshot = await getDocs(q);
            const results: SimpleSearchResult[] = [];

            for (const doc of snapshot.docs) {
                const data = doc.data();

                // Simple text matching
                if (this.matchesQuery(searchQuery.query, data.content)) {
                    results.push({
                        id: doc.id,
                        type: 'message',
                        title: `Message from ${data.senderName}`,
                        content: data.content,
                        date: data.timestamp?.toDate() || new Date(),
                        accessLevel: 'staff',
                        ownerId: data.senderId,
                        relevanceScore: this.calculateRelevance(searchQuery.query, data.content)
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching messages:', error);
            return [];
        }
    }

    // Enhanced text matching helper with fuzzy matching
    private static matchesQuery(query: string, ...textFields: (string | undefined)[]): boolean {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

        return textFields.some(field => {
            if (!field) return false;
            const fieldLower = field.toLowerCase();

            // Exact phrase match (highest priority)
            if (fieldLower.includes(queryLower)) return true;

            // All words match (partial matching)
            if (queryWords.every(word => fieldLower.includes(word))) return true;

            // At least 50% of words match for longer queries
            if (queryWords.length > 2) {
                const matchingWords = queryWords.filter(word => fieldLower.includes(word));
                return matchingWords.length >= Math.ceil(queryWords.length * 0.5);
            }

            // Single word partial match for short queries
            if (queryWords.length === 1) {
                const word = queryWords[0];
                return fieldLower.includes(word) || (word.length > 3 && fieldLower.includes(word.substring(0, word.length - 1)));
            }

            return false;
        });
    }

    private static calculateRelevance(query: string, ...textFields: (string | undefined)[]): number {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
        let score = 0;

        textFields.forEach((field, index) => {
            if (!field) return;

            const fieldLower = field.toLowerCase();
            const fieldWeight = index === 0 ? 1.0 : 0.6; // Title gets higher weight

            // Exact phrase match
            if (fieldLower.includes(queryLower)) {
                score += fieldWeight * 1.0;
                return;
            }

            // Word-based scoring
            let wordScore = 0;
            queryWords.forEach(word => {
                if (fieldLower.includes(word)) {
                    // Exact word match
                    if (fieldLower.includes(` ${word} `) || fieldLower.startsWith(`${word} `) || fieldLower.endsWith(` ${word}`)) {
                        wordScore += 0.8;
                    } else {
                        // Partial word match
                        wordScore += 0.5;
                    }
                }
            });

            score += fieldWeight * (wordScore / queryWords.length);
        });

        return Math.min(score, 1.0);
    }

    // Enhanced category matching for better search results
    private static matchesCategory(query: string, category: string): boolean {
        if (!category) return false;

        const queryLower = query.toLowerCase();
        const categoryLower = category.toLowerCase();

        // Direct category matches
        const categoryMappings: Record<string, string[]> = {
            'reports': ['report', 'reporting', 'financial', 'finance', 'finrep'],
            'forms': ['form', 'application', 'request'],
            'policies': ['policy', 'procedure', 'guideline', 'rule'],
            'minutes': ['meeting', 'minutes', 'notes'],
            'correspondence': ['letter', 'email', 'communication', 'message'],
            'receipts': ['receipt', 'invoice', 'bill', 'purchase', 'expense'],
            'supplies': ['supply', 'supplies', 'office', 'stationery', 'equipment'],
            'food': ['food', 'meal', 'dining', 'restaurant', 'grocery'],
            'maintenance': ['repair', 'maintenance', 'fix', 'service'],
            'utilities': ['utility', 'utilities', 'electric', 'water', 'gas', 'internet']
        };

        // Check if query matches any category or its synonyms
        for (const [cat, synonyms] of Object.entries(categoryMappings)) {
            if (categoryLower.includes(cat) || synonyms.some(syn => queryLower.includes(syn))) {
                return true;
            }
        }

        return categoryLower.includes(queryLower) || queryLower.includes(categoryLower);
    }

    private static hasAccess(accessLevel: string, userRole: string): boolean {
        const roleHierarchy = { staff: 1, admin: 2, super_admin: 3 };
        const requiredLevel = roleHierarchy[accessLevel] || 1;
        const userLevel = roleHierarchy[userRole];

        return userLevel >= requiredLevel;
    }
}