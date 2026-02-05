// Machine Learning Document Service for Semantic Search and Embeddings
// Implements vector similarity search and document understanding

export interface DocumentEmbedding {
    id: string;
    documentId: string;
    embedding: number[];
    text: string;
    metadata: {
        type: string;
        category?: string;
        amount?: number;
        date: Date;
        userRole: string;
    };
    createdAt: Date;
}

export interface SimilarityResult {
    documentId: string;
    similarity: number;
    text: string;
    metadata: any;
}

export interface MLSearchQuery {
    query: string;
    userRole: 'staff' | 'admin' | 'super_admin';
    filters?: {
        documentTypes?: string[];
        categories?: string[];
        dateRange?: { start: Date; end: Date };
        amountRange?: { min: number; max: number };
    };
    limit?: number;
    threshold?: number; // Minimum similarity threshold
}

export class MLDocumentService {
    private static readonly EMBEDDING_DIMENSION = 384; // Using sentence-transformers dimension
    private static readonly SIMILARITY_THRESHOLD = 0.3;

    // Generate embeddings for document text
    static async generateEmbedding(text: string): Promise<number[]> {
        try {
            // In production, this would call a local ML model or API
            // For now, return a mock embedding
            return this.mockEmbedding(text);
        } catch (error) {
            console.error('Error generating embedding:', error);
            return new Array(this.EMBEDDING_DIMENSION).fill(0);
        }
    }

    // Mock embedding generation (replace with actual ML model)
    private static mockEmbedding(text: string): number[] {
        // Simple hash-based mock embedding for demonstration
        const embedding = new Array(this.EMBEDDING_DIMENSION).fill(0);
        const words = text.toLowerCase().split(/\s+/);

        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            const position = Math.abs(hash) % this.EMBEDDING_DIMENSION;
            embedding[position] += 1 / (index + 1); // Weight by position
        });

        // Normalize the embedding
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
    }

    private static simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    // Calculate cosine similarity between two embeddings
    static calculateSimilarity(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have the same dimension');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        const magnitude1 = Math.sqrt(norm1);
        const magnitude2 = Math.sqrt(norm2);

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    // Perform semantic search using embeddings
    static async semanticSearch(query: MLSearchQuery): Promise<SimilarityResult[]> {
        try {
            // Generate embedding for the search query
            const queryEmbedding = await this.generateEmbedding(query.query);

            // Get all document embeddings from database
            const documentEmbeddings = await this.getDocumentEmbeddings(query);

            // Calculate similarities
            const similarities = documentEmbeddings.map(doc => ({
                documentId: doc.documentId,
                similarity: this.calculateSimilarity(queryEmbedding, doc.embedding),
                text: doc.text,
                metadata: doc.metadata
            }));

            // Filter by threshold and sort by similarity
            const filteredResults = similarities
                .filter(result => result.similarity >= (query.threshold || this.SIMILARITY_THRESHOLD))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, query.limit || 10);

            return filteredResults;
        } catch (error) {
            console.error('Error performing semantic search:', error);
            return [];
        }
    }

    // Get document embeddings with role-based filtering
    private static async getDocumentEmbeddings(query: MLSearchQuery): Promise<DocumentEmbedding[]> {
        // In production, this would query the database
        // For now, return mock data
        const mockEmbeddings: DocumentEmbedding[] = [
            {
                id: 'emb_001',
                documentId: 'receipt_001',
                embedding: await this.generateEmbedding('Food expenses meat vegetables friary meals Richard A'),
                text: 'Food expenses including meat and vegetables purchased for friary meals by Richard A',
                metadata: {
                    type: 'receipt',
                    category: 'food',
                    amount: 850.00,
                    date: new Date('2024-01-15'),
                    userRole: 'staff'
                },
                createdAt: new Date()
            },
            {
                id: 'emb_002',
                documentId: 'receipt_002',
                embedding: await this.generateEmbedding('Office supplies papers pens printed materials administrative work'),
                text: 'Office supplies including papers, pens, and printed materials for administrative work',
                metadata: {
                    type: 'receipt',
                    category: 'officeSupplies',
                    amount: 1250.00,
                    date: new Date('2024-01-10'),
                    userRole: 'admin'
                },
                createdAt: new Date()
            },
            {
                id: 'emb_003',
                documentId: 'report_001',
                embedding: await this.generateEmbedding('Monthly financial report receipts disbursements cash flow January'),
                text: 'Comprehensive monthly financial report showing receipts, disbursements, and cash flow for January 2024',
                metadata: {
                    type: 'financial_report',
                    date: new Date('2024-01-31'),
                    userRole: 'admin'
                },
                createdAt: new Date()
            }
        ];

        // Filter based on user role and permissions
        return mockEmbeddings.filter(embedding =>
            this.hasAccessToEmbedding(embedding, query.userRole)
        );
    }

    // Check if user has access to embedding based on role
    private static hasAccessToEmbedding(
        embedding: DocumentEmbedding,
        userRole: 'staff' | 'admin' | 'super_admin'
    ): boolean {
        const roleHierarchy = { staff: 1, admin: 2, super_admin: 3 };
        const requiredLevel = roleHierarchy[embedding.metadata.userRole as keyof typeof roleHierarchy];
        const userLevel = roleHierarchy[userRole];

        return userLevel >= requiredLevel;
    }

    // Store document embedding in database
    static async storeDocumentEmbedding(
        documentId: string,
        text: string,
        metadata: any
    ): Promise<void> {
        try {
            const embedding = await this.generateEmbedding(text);

            const documentEmbedding: DocumentEmbedding = {
                id: `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                documentId,
                embedding,
                text,
                metadata,
                createdAt: new Date()
            };

            // In production, store in database
            console.log('Storing document embedding:', documentEmbedding.id);
        } catch (error) {
            console.error('Error storing document embedding:', error);
        }
    }

    // Update document embedding when document changes
    static async updateDocumentEmbedding(
        documentId: string,
        newText: string,
        newMetadata: any
    ): Promise<void> {
        try {
            // Delete old embedding
            await this.deleteDocumentEmbedding(documentId);

            // Create new embedding
            await this.storeDocumentEmbedding(documentId, newText, newMetadata);
        } catch (error) {
            console.error('Error updating document embedding:', error);
        }
    }

    // Delete document embedding
    static async deleteDocumentEmbedding(documentId: string): Promise<void> {
        try {
            // In production, delete from database
            console.log('Deleting document embedding for:', documentId);
        } catch (error) {
            console.error('Error deleting document embedding:', error);
        }
    }

    // Batch process documents for embedding generation
    static async batchProcessDocuments(documents: Array<{
        id: string;
        text: string;
        metadata: any;
    }>): Promise<void> {
        try {
            const batchSize = 10;
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);

                await Promise.all(
                    batch.map(doc =>
                        this.storeDocumentEmbedding(doc.id, doc.text, doc.metadata)
                    )
                );

                // Add delay to avoid overwhelming the system
                if (i + batchSize < documents.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('Error batch processing documents:', error);
        }
    }

    // Get similar documents based on a document ID
    static async findSimilarDocuments(
        documentId: string,
        userRole: 'staff' | 'admin' | 'super_admin',
        limit: number = 5
    ): Promise<SimilarityResult[]> {
        try {
            // Get the embedding for the source document
            const sourceEmbedding = await this.getDocumentEmbeddingById(documentId);
            if (!sourceEmbedding) {
                return [];
            }

            // Get all other embeddings
            const allEmbeddings = await this.getDocumentEmbeddings({
                query: '',
                userRole,
                limit: 1000
            });

            // Calculate similarities (excluding the source document)
            const similarities = allEmbeddings
                .filter(emb => emb.documentId !== documentId)
                .map(emb => ({
                    documentId: emb.documentId,
                    similarity: this.calculateSimilarity(sourceEmbedding.embedding, emb.embedding),
                    text: emb.text,
                    metadata: emb.metadata
                }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return similarities;
        } catch (error) {
            console.error('Error finding similar documents:', error);
            return [];
        }
    }

    // Get document embedding by ID
    private static async getDocumentEmbeddingById(documentId: string): Promise<DocumentEmbedding | null> {
        // In production, query database
        // For now, return null
        return null;
    }

    // Extract key terms from text for enhanced search
    static extractKeyTerms(text: string): string[] {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
        ]);

        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        // Count word frequencies
        const wordCounts = words.reduce((counts, word) => {
            counts[word] = (counts[word] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        // Return top terms by frequency
        return Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    // Analyze document sentiment (for financial context)
    static analyzeDocumentSentiment(text: string): {
        sentiment: 'positive' | 'negative' | 'neutral';
        confidence: number;
        financialIndicators: string[];
    } {
        const positiveWords = ['profit', 'income', 'revenue', 'gain', 'surplus', 'increase', 'growth'];
        const negativeWords = ['loss', 'deficit', 'decrease', 'expense', 'cost', 'debt', 'reduction'];
        const financialTerms = ['budget', 'financial', 'money', 'cash', 'payment', 'transaction', 'amount'];

        const words = text.toLowerCase().split(/\s+/);

        let positiveScore = 0;
        let negativeScore = 0;
        const foundFinancialTerms: string[] = [];

        words.forEach(word => {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
            if (financialTerms.includes(word)) foundFinancialTerms.push(word);
        });

        const totalScore = positiveScore + negativeScore;
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        let confidence = 0;

        if (totalScore > 0) {
            if (positiveScore > negativeScore) {
                sentiment = 'positive';
                confidence = positiveScore / totalScore;
            } else if (negativeScore > positiveScore) {
                sentiment = 'negative';
                confidence = negativeScore / totalScore;
            }
        }

        return {
            sentiment,
            confidence,
            financialIndicators: [...new Set(foundFinancialTerms)]
        };
    }
}