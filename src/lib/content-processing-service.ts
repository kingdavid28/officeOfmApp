// Content Processing Service
// Processes existing files to extract content for AI search

import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { FileContentExtractor } from './file-content-extractor';

export interface ProcessingResult {
    processed: number;
    failed: number;
    skipped: number;
    errors: string[];
}

export class ContentProcessingService {

    // Process all files in the database to extract content
    static async processAllFiles(): Promise<ProcessingResult> {
        const result: ProcessingResult = {
            processed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        try {
            console.log('Starting content processing for all files...');

            // Get all files that don't have extracted content yet
            const filesQuery = collection(db, 'files');

            const snapshot = await getDocs(filesQuery);
            console.log(`Found ${snapshot.docs.length} files to process`);

            // Filter files that need processing
            const filesToProcess = snapshot.docs.filter(doc => {
                const data = doc.data();
                return !data.hasContent && !data.contentProcessedAt;
            });

            console.log(`${filesToProcess.length} files need content processing`);

            for (const fileDoc of filesToProcess) {
                const fileData = fileDoc.data();

                try {
                    console.log(`Processing file: ${fileData.name}`);

                    // Handle different URL types and provide appropriate content
                    let extractedContent;

                    if (!fileData.url || fileData.url === 'https://example.com/file.pdf') {
                        console.log(`No valid URL for file ${fileData.name} - creating placeholder content`);
                        extractedContent = this.createPlaceholderContent(fileData.name, fileData.category);
                    } else if (fileData.url.startsWith('blob:')) {
                        console.log(`Blob URL detected for ${fileData.name} - creating enhanced placeholder content`);
                        extractedContent = this.createEnhancedPlaceholderContent(fileData.name, fileData.category, fileData.size);
                    } else {
                        console.log(`Processing file from URL: ${fileData.name}`);
                        // Try to extract content from the actual URL
                        extractedContent = await FileContentExtractor.extractContentFromURL(
                            fileData.url,
                            fileData.name
                        );
                    }

                    if (extractedContent.metadata.success && extractedContent.text.length > 0) {
                        // Update the document with extracted content and ensure proper naming
                        const updateData: any = {
                            extractedContent: extractedContent.text,
                            contentMetadata: extractedContent.metadata,
                            hasContent: true,
                            contentProcessedAt: new Date()
                        };

                        // Ensure the document has a proper name if it's missing
                        if (!fileData.name || fileData.name === 'undefined' || fileData.name === null) {
                            if (fileData.filename) {
                                updateData.name = fileData.filename;
                            } else if (fileData.url && typeof fileData.url === 'string') {
                                // Try to extract name from URL
                                const urlParts = fileData.url.split('/');
                                const lastPart = urlParts[urlParts.length - 1];
                                if (lastPart && lastPart.includes('.')) {
                                    updateData.name = decodeURIComponent(lastPart)
                                        .replace(/^\d+_/, '') // Remove timestamp prefix
                                        .replace(/%20/g, ' ') // Replace URL encoded spaces
                                        .replace(/\?.*$/, ''); // Remove query parameters
                                }
                            }

                            // Final fallback
                            if (!updateData.name) {
                                updateData.name = `${fileData.category || 'Document'} ${fileDoc.id.substring(0, 8)}`;
                            }
                        }

                        await updateDoc(doc(db, 'files', fileDoc.id), updateData);

                        console.log(`Successfully processed: ${fileData.name}`);
                        result.processed++;
                    } else {
                        console.log(`Failed to extract content from: ${fileData.name}`, extractedContent.metadata.error);

                        // Mark as processed but without content, and ensure proper naming
                        const updateData: any = {
                            extractedContent: '',
                            contentMetadata: extractedContent.metadata,
                            hasContent: false,
                            contentProcessedAt: new Date()
                        };

                        // Ensure the document has a proper name if it's missing
                        if (!fileData.name || fileData.name === 'undefined' || fileData.name === null) {
                            if (fileData.filename) {
                                updateData.name = fileData.filename;
                            } else if (fileData.url && typeof fileData.url === 'string') {
                                // Try to extract name from URL
                                const urlParts = fileData.url.split('/');
                                const lastPart = urlParts[urlParts.length - 1];
                                if (lastPart && lastPart.includes('.')) {
                                    updateData.name = decodeURIComponent(lastPart)
                                        .replace(/^\d+_/, '') // Remove timestamp prefix
                                        .replace(/%20/g, ' ') // Replace URL encoded spaces
                                        .replace(/\?.*$/, ''); // Remove query parameters
                                }
                            }

                            // Final fallback
                            if (!updateData.name) {
                                updateData.name = `${fileData.category || 'Document'} ${fileDoc.id.substring(0, 8)}`;
                            }
                        }

                        await updateDoc(doc(db, 'files', fileDoc.id), updateData);

                        result.failed++;
                        result.errors.push(`${fileData.name}: ${extractedContent.metadata.error}`);
                    }

                } catch (error) {
                    console.error(`Error processing file ${fileData.name}:`, error);
                    result.failed++;
                    result.errors.push(`${fileData.name}: ${error.message}`);
                }
            }

            console.log('Content processing completed:', result);
            return result;

        } catch (error) {
            console.error('Content processing failed:', error);
            result.errors.push(`Processing failed: ${error.message}`);
            return result;
        }
    }

    // Process a single file by ID
    static async processSingleFile(fileId: string): Promise<boolean> {
        try {
            const fileDoc = await getDocs(query(collection(db, 'files'), where('__name__', '==', fileId)));

            if (fileDoc.empty) {
                console.error('File not found:', fileId);
                return false;
            }

            const fileData = fileDoc.docs[0].data();

            if (!fileData.url || fileData.url === 'https://example.com/file.pdf') {
                console.error('No valid URL for file:', fileData.name);
                return false;
            }

            const extractedContent = await FileContentExtractor.extractContentFromURL(
                fileData.url,
                fileData.name
            );

            await updateDoc(doc(db, 'files', fileDoc.docs[0].id), {
                extractedContent: extractedContent.text,
                contentMetadata: extractedContent.metadata,
                hasContent: extractedContent.metadata.success && extractedContent.text.length > 0,
                contentProcessedAt: new Date()
            });

            return extractedContent.metadata.success;

        } catch (error) {
            console.error('Error processing single file:', error);
            return false;
        }
    }

    // Get processing statistics
    static async getProcessingStats(): Promise<{
        total: number;
        processed: number;
        withContent: number;
        pending: number;
    }> {
        try {
            const allFiles = await getDocs(collection(db, 'files'));
            const total = allFiles.docs.length;

            let processed = 0;
            let withContent = 0;

            allFiles.docs.forEach(doc => {
                const data = doc.data();
                if (data.contentProcessedAt) {
                    processed++;
                }
                if (data.hasContent) {
                    withContent++;
                }
            });

            return {
                total,
                processed,
                withContent,
                pending: total - processed
            };

        } catch (error) {
            console.error('Error getting processing stats:', error);
            return { total: 0, processed: 0, withContent: 0, pending: 0 };
        }
    }

    // Create placeholder content for files without valid URLs
    private static createPlaceholderContent(fileName: string, category: string): any {
        const fileType = this.getFileTypeFromName(fileName);
        const documentType = this.determineDocumentType(fileName, fileType);

        let content = `DOCUMENT: ${fileName}\n\n`;

        // Add content based on document type
        if (documentType === 'financial_report') {
            content += `This is a financial report document containing:
- Budget information and financial data
- Income and expense tracking
- Financial analysis and summaries
- Accounting records and transactions

Document Type: Financial Report
Category: ${category}
Format: ${fileType.toUpperCase()}
Status: Placeholder content (original file not accessible)

This document contains financial information that can be searched and referenced.`;

        } else if (documentType === 'policy') {
            content += `This is a policy document containing:
- Organizational policies and procedures
- Guidelines and regulations
- Compliance requirements
- Implementation instructions

Document Type: Policy/Procedure
Category: ${category}
Format: ${fileType.toUpperCase()}
Status: Placeholder content (original file not accessible)

This document contains policy information that can be searched and referenced.`;

        } else if (documentType === 'correspondence') {
            content += `This is a correspondence document containing:
- Letters and official communications
- Meeting requests and responses
- Inter-departmental communications
- External correspondence

Document Type: Correspondence
Category: ${category}
Format: ${fileType.toUpperCase()}
Status: Placeholder content (original file not accessible)

This document contains correspondence that can be searched and referenced.`;

        } else {
            content += `This document contains:
- ${category} related information
- Organizational data and records
- Reference materials and documentation

Document Type: ${documentType}
Category: ${category}
Format: ${fileType.toUpperCase()}
Status: Placeholder content (original file not accessible)

This document is available for search and reference purposes.`;
        }

        return {
            text: content,
            metadata: {
                wordCount: content.split(/\s+/).length,
                extractedAt: new Date(),
                fileType: fileType,
                success: true,
                documentType: documentType,
                placeholder: true
            }
        };
    }

    // Create enhanced placeholder content for files with blob URLs
    private static createEnhancedPlaceholderContent(fileName: string, category: string, fileSize?: number): any {
        const fileType = this.getFileTypeFromName(fileName);
        const documentType = this.determineDocumentType(fileName, fileType);

        let content = `DOCUMENT: ${fileName}\n\n`;

        content += `This document was uploaded but uses a temporary URL that is no longer accessible.

Document Information:
- Name: ${fileName}
- Category: ${category}
- Type: ${documentType}
- Format: ${fileType.toUpperCase()}`;

        if (fileSize) {
            content += `\n- Size: ${this.formatFileSize(fileSize)}`;
        }

        content += `\n- Status: Temporary URL (needs re-upload for full access)

To access the full content of this document:
1. Re-upload the file to get a permanent storage URL
2. The file will then be fully searchable and accessible
3. Contact your administrator if you need assistance

This placeholder allows the document to be tracked and referenced in searches.`;

        return {
            text: content,
            metadata: {
                wordCount: content.split(/\s+/).length,
                extractedAt: new Date(),
                fileType: fileType,
                success: true,
                documentType: documentType,
                placeholder: true,
                temporaryUrl: true
            }
        };
    }

    // Helper method to get file type from filename
    private static getFileTypeFromName(fileName: string): string {
        const extension = fileName.toLowerCase().split('.').pop();
        switch (extension) {
            case 'xlsx':
            case 'xls':
                return 'excel';
            case 'pdf':
                return 'pdf';
            case 'doc':
            case 'docx':
                return 'word';
            case 'txt':
                return 'text';
            case 'csv':
                return 'csv';
            case 'png':
            case 'jpg':
            case 'jpeg':
                return 'image';
            default:
                return 'document';
        }
    }

    // Helper method to determine document type
    private static determineDocumentType(fileName: string, fileType: string): string {
        const nameLower = fileName.toLowerCase();

        // Financial documents
        if (nameLower.includes('budget') || nameLower.includes('financial') || nameLower.includes('finrep')) {
            return 'financial_report';
        }
        if (nameLower.includes('expense') || nameLower.includes('cost') || nameLower.includes('invoice')) {
            return 'financial_data';
        }

        // Office documents
        if (nameLower.includes('policy') || nameLower.includes('procedure') || nameLower.includes('guideline')) {
            return 'policy';
        }
        if (nameLower.includes('form') || nameLower.includes('application') || nameLower.includes('request')) {
            return 'form';
        }
        if (nameLower.includes('minute') || nameLower.includes('meeting') || nameLower.includes('agenda')) {
            return 'minutes';
        }
        if (nameLower.includes('letter') || nameLower.includes('correspondence') || nameLower.includes('memo')) {
            return 'correspondence';
        }
        if (nameLower.includes('report') || nameLower.includes('analysis') || nameLower.includes('summary')) {
            return 'report';
        }

        // Default based on file type
        switch (fileType) {
            case 'excel': return 'spreadsheet';
            case 'word': return 'document';
            case 'pdf': return 'document';
            case 'csv': return 'data';
            default: return 'document';
        }
    }

    // Helper method to format file size
    private static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}