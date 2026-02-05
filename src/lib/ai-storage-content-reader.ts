// AI Storage Content Reader - Read and Index File Contents from Firebase Storage
// Allows AI to search inside PDFs, Word docs, Excel files, etc.
// Follows best practices: caching, rate limiting, role-based access

import { ref, getDownloadURL, getBlob } from 'firebase/storage';
import { storage } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { FileContentExtractor, ExtractedContent } from './file-content-extractor';
import { UserRole } from './friary-types';

export interface FileContentCache {
    fileId: string;
    fileName: string;
    fileUrl: string;
    extractedText: string;
    metadata: {
        fileType: string;
        wordCount: number;
        pageCount?: number;
        extractedAt: Date;
        fileSize: number;
        lastModified: Date;
    };
    searchableContent: string; // Preprocessed for search
    accessLevel: 'public' | 'staff' | 'admin' | 'super_admin';
    ownerId?: string;
    friaryId?: string;
}

export interface StorageSearchResult {
    fileId: string;
    fileName: string;
    fileUrl: string;
    matchedContent: string; // Excerpt showing the match
    relevanceScore: number;
    metadata: any;
}

export class AIStorageContentReader {
    private static readonly CACHE_COLLECTION = 'file_content_cache';
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
    private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    private static readonly RATE_LIMIT_PER_MINUTE = 10;
    private static requestCount = 0;
    private static lastResetTime = Date.now();

    // Main method: Search file contents with role-based access
    static async searchFileContents(
        query: string,
        userRole: UserRole,
        userId: string,
        friaryId?: string,
        limit: number = 10
    ): Promise<StorageSearchResult[]> {
        try {
            console.log('🔍 Searching file contents:', query);

            // Check rate limit
            if (!this.checkRateLimit()) {
                console.warn('⚠️ Rate limit exceeded');
                return [];
            }

            // Get all files user has access to
            const accessibleFiles = await this.getAccessibleFiles(userRole, userId, friaryId);
            console.log('📁 Accessible files:', accessibleFiles.length);

            const results: StorageSearchResult[] = [];

            for (const file of accessibleFiles) {
                // Get or extract file content
                const cachedContent = await this.getOrExtractContent(file);

                if (cachedContent && cachedContent.searchableContent) {
                    // Search in the content
                    const matches = this.searchInContent(query, cachedContent);

                    if (matches.relevanceScore > 0) {
                        results.push({
                            fileId: file.id,
                            fileName: file.fileName || file.title,
                            fileUrl: file.fileUrl,
                            matchedContent: matches.excerpt,
                            relevanceScore: matches.relevanceScore,
                            metadata: {
                                fileType: cachedContent.metadata.fileType,
                                wordCount: cachedContent.metadata.wordCount,
                                pageCount: cachedContent.metadata.pageCount,
                                category: file.category
                            }
                        });
                    }
                }
            }

            // Sort by relevance and limit
            const sortedResults = results
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, limit);

            console.log('✅ Found', sortedResults.length, 'matching files');
            return sortedResults;

        } catch (error) {
            console.error('❌ Error searching file contents:', error);
            return [];
        }
    }

    // Get or extract file content (with caching)
    private static async getOrExtractContent(file: any): Promise<FileContentCache | null> {
        try {
            // Check cache first
            const cached = await this.getCachedContent(file.id);

            if (cached && this.isCacheValid(cached)) {
                console.log('✅ Using cached content for:', file.fileName);
                return cached;
            }

            // Extract content from storage
            console.log('📥 Extracting content from:', file.fileName);
            const extracted = await this.extractFromStorage(file);

            if (extracted) {
                // Cache the extracted content
                await this.cacheContent(file, extracted);
                return extracted;
            }

            return null;

        } catch (error) {
            console.error('Error getting file content:', error);
            return null;
        }
    }

    // Extract content from Firebase Storage
    private static async extractFromStorage(file: any): Promise<FileContentCache | null> {
        try {
            // Check file size
            if (file.size && file.size > this.MAX_FILE_SIZE) {
                console.warn('⚠️ File too large:', file.fileName, file.size);
                return null;
            }

            // Get file from storage
            const fileUrl = file.fileUrl || file.url;
            if (!fileUrl) {
                console.warn('⚠️ No file URL:', file.fileName);
                return null;
            }

            // Download file as blob
            const response = await fetch(fileUrl);
            if (!response.ok) {
                console.error('Failed to download file:', response.statusText);
                return null;
            }

            const blob = await response.blob();
            const fileName = file.fileName || file.title || 'unknown';

            // Extract content using FileContentExtractor
            const extracted: ExtractedContent = await FileContentExtractor.extractContent(blob, fileName);

            if (!extracted.metadata.success) {
                console.warn('⚠️ Extraction failed:', extracted.metadata.error);
                return null;
            }

            // Create searchable content (lowercase, remove extra spaces)
            const searchableContent = this.preprocessForSearch(extracted.text);

            return {
                fileId: file.id,
                fileName: fileName,
                fileUrl: fileUrl,
                extractedText: extracted.text,
                metadata: {
                    fileType: extracted.metadata.fileType,
                    wordCount: extracted.metadata.wordCount,
                    pageCount: extracted.metadata.pageCount,
                    extractedAt: new Date(),
                    fileSize: blob.size,
                    lastModified: file.uploadedAt?.toDate() || new Date()
                },
                searchableContent: searchableContent,
                accessLevel: file.accessLevel || 'staff',
                ownerId: file.uploadedBy,
                friaryId: file.friaryId
            };

        } catch (error) {
            console.error('Error extracting from storage:', error);
            return null;
        }
    }

    // Get cached content from Firestore
    private static async getCachedContent(fileId: string): Promise<FileContentCache | null> {
        try {
            const cacheRef = doc(db, this.CACHE_COLLECTION, fileId);
            const cacheDoc = await getDoc(cacheRef);

            if (cacheDoc.exists()) {
                const data = cacheDoc.data();
                return {
                    ...data,
                    metadata: {
                        ...data.metadata,
                        extractedAt: data.metadata.extractedAt?.toDate(),
                        lastModified: data.metadata.lastModified?.toDate()
                    }
                } as FileContentCache;
            }

            return null;
        } catch (error) {
            console.error('Error getting cached content:', error);
            return null;
        }
    }

    // Cache extracted content in Firestore
    private static async cacheContent(file: any, content: FileContentCache): Promise<void> {
        try {
            const cacheRef = doc(db, this.CACHE_COLLECTION, file.id);
            await setDoc(cacheRef, {
                ...content,
                cachedAt: new Date()
            });
            console.log('✅ Cached content for:', file.fileName);
        } catch (error) {
            console.error('Error caching content:', error);
        }
    }

    // Check if cache is still valid
    private static isCacheValid(cached: FileContentCache): boolean {
        const cacheAge = Date.now() - cached.metadata.extractedAt.getTime();
        return cacheAge < this.CACHE_DURATION;
    }

    // Get files accessible to user based on role
    private static async getAccessibleFiles(
        userRole: UserRole,
        userId: string,
        friaryId?: string
    ): Promise<any[]> {
        try {
            const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');

            let constraints: any[] = [];

            // Role-based filtering
            if (userRole === 'staff') {
                constraints.push(where('uploadedBy', '==', userId));
            } else if (['admin', 'vice_admin', 'treasurer'].includes(userRole) && friaryId) {
                constraints.push(where('friaryId', '==', friaryId));
            }
            // Super admins and vice super admins see all files (no filter)

            constraints.push(orderBy('uploadedAt', 'desc'), limit(50));

            const q = query(collection(db, 'files'), ...constraints);
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error getting accessible files:', error);
            return [];
        }
    }

    // Search in content and return matches
    private static searchInContent(
        query: string,
        content: FileContentCache
    ): { relevanceScore: number; excerpt: string } {
        const lowerQuery = query.toLowerCase();
        const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

        if (queryWords.length === 0) {
            return { relevanceScore: 0, excerpt: '' };
        }

        const searchableText = content.searchableContent;
        let score = 0;
        let bestMatch = '';
        let bestMatchScore = 0;

        // Search for each query word
        for (const word of queryWords) {
            const regex = new RegExp(word, 'gi');
            const matches = searchableText.match(regex);

            if (matches) {
                score += matches.length * 10;

                // Find best excerpt
                const index = searchableText.indexOf(word);
                if (index !== -1) {
                    const start = Math.max(0, index - 100);
                    const end = Math.min(searchableText.length, index + 200);
                    const excerpt = '...' + content.extractedText.substring(start, end) + '...';

                    if (matches.length > bestMatchScore) {
                        bestMatchScore = matches.length;
                        bestMatch = excerpt;
                    }
                }
            }
        }

        // Bonus for exact phrase match
        if (searchableText.includes(lowerQuery)) {
            score += 50;
        }

        // Bonus for match in filename
        if (content.fileName.toLowerCase().includes(lowerQuery)) {
            score += 30;
        }

        return {
            relevanceScore: score,
            excerpt: bestMatch || content.extractedText.substring(0, 200) + '...'
        };
    }

    // Preprocess text for search (lowercase, normalize spaces)
    private static preprocessForSearch(text: string): string {
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Rate limiting
    private static checkRateLimit(): boolean {
        const now = Date.now();

        // Reset counter every minute
        if (now - this.lastResetTime > 60000) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }

        // Check limit
        if (this.requestCount >= this.RATE_LIMIT_PER_MINUTE) {
            return false;
        }

        this.requestCount++;
        return true;
    }

    // Clear cache for a specific file (call when file is updated)
    static async clearCache(fileId: string): Promise<void> {
        try {
            const cacheRef = doc(db, this.CACHE_COLLECTION, fileId);
            await updateDoc(cacheRef, {
                invalidated: true,
                invalidatedAt: new Date()
            });
            console.log('✅ Cleared cache for:', fileId);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    // Clear all expired cache entries (maintenance task)
    static async clearExpiredCache(): Promise<void> {
        try {
            const { collection, query, where, getDocs, deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');

            const expiryDate = new Date(Date.now() - this.CACHE_DURATION);
            const q = query(
                collection(db, this.CACHE_COLLECTION),
                where('metadata.extractedAt', '<', expiryDate)
            );

            const snapshot = await getDocs(q);
            console.log('🗑️ Clearing', snapshot.size, 'expired cache entries');

            for (const docSnapshot of snapshot.docs) {
                await deleteDoc(firestoreDoc(db, this.CACHE_COLLECTION, docSnapshot.id));
            }

            console.log('✅ Cache cleanup complete');
        } catch (error) {
            console.error('Error clearing expired cache:', error);
        }
    }

    // Get cache statistics
    static async getCacheStats(): Promise<{
        totalCached: number;
        totalSize: number;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    }> {
        try {
            const { collection, getDocs } = await import('firebase/firestore');

            const snapshot = await getDocs(collection(db, this.CACHE_COLLECTION));

            let totalSize = 0;
            let oldestEntry: Date | null = null;
            let newestEntry: Date | null = null;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                totalSize += data.metadata?.fileSize || 0;

                const extractedAt = data.metadata?.extractedAt?.toDate();
                if (extractedAt) {
                    if (!oldestEntry || extractedAt < oldestEntry) {
                        oldestEntry = extractedAt;
                    }
                    if (!newestEntry || extractedAt > newestEntry) {
                        newestEntry = extractedAt;
                    }
                }
            });

            return {
                totalCached: snapshot.size,
                totalSize,
                oldestEntry,
                newestEntry
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return {
                totalCached: 0,
                totalSize: 0,
                oldestEntry: null,
                newestEntry: null
            };
        }
    }
}
