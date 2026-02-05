// Document Content Extraction Service
// Extracts text content from various file types for AI search and analysis

export interface ExtractedContent {
    text: string;
    metadata: {
        pageCount?: number;
        wordCount: number;
        language?: string;
        extractionMethod: string;
        confidence: number;
        extractedAt: Date;
    };
    structure?: {
        headings: string[];
        tables: any[];
        images: any[];
    };
    errors?: string[];
}

export interface ExtractionOptions {
    includeMetadata: boolean;
    includeStructure: boolean;
    maxTextLength?: number;
    language?: string;
    ocrEnabled: boolean;
}

export class DocumentContentExtractor {
    private static readonly SUPPORTED_TYPES = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/msword': 'doc',
        'text/plain': 'txt',
        'text/html': 'html',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff'
    };

    private static readonly DEFAULT_OPTIONS: ExtractionOptions = {
        includeMetadata: true,
        includeStructure: false,
        maxTextLength: 50000,
        ocrEnabled: true
    };

    // Main extraction method
    static async extractContent(
        fileUrl: string,
        contentType: string,
        options: Partial<ExtractionOptions> = {}
    ): Promise<ExtractedContent> {
        const extractionOptions = { ...this.DEFAULT_OPTIONS, ...options };

        try {
            const fileType = this.SUPPORTED_TYPES[contentType];
            if (!fileType) {
                throw new Error(`Unsupported file type: ${contentType}`);
            }

            // Download file content
            const fileBuffer = await this.downloadFile(fileUrl);

            // Extract content based on file type
            let extractedContent: ExtractedContent;

            switch (fileType) {
                case 'pdf':
                    extractedContent = await this.extractFromPDF(fileBuffer, extractionOptions);
                    break;
                case 'docx':
                    extractedContent = await this.extractFromDocx(fileBuffer, extractionOptions);
                    break;
                case 'doc':
                    extractedContent = await this.extractFromDoc(fileBuffer, extractionOptions);
                    break;
                case 'txt':
                    extractedContent = await this.extractFromText(fileBuffer, extractionOptions);
                    break;
                case 'html':
                    extractedContent = await this.extractFromHTML(fileBuffer, extractionOptions);
                    break;
                case 'xlsx':
                case 'xls':
                    extractedContent = await this.extractFromExcel(fileBuffer, extractionOptions);
                    break;
                case 'pptx':
                case 'ppt':
                    extractedContent = await this.extractFromPowerPoint(fileBuffer, extractionOptions);
                    break;
                case 'jpg':
                case 'png':
                case 'gif':
                case 'bmp':
                case 'tiff':
                    extractedContent = await this.extractFromImage(fileBuffer, extractionOptions);
                    break;
                default:
                    throw new Error(`Extraction not implemented for file type: ${fileType}`);
            }

            // Apply text length limit
            if (extractionOptions.maxTextLength && extractedContent.text.length > extractionOptions.maxTextLength) {
                extractedContent.text = extractedContent.text.substring(0, extractionOptions.maxTextLength) + '... [truncated]';
            }

            return extractedContent;
        } catch (error) {
            console.error('Error extracting document content:', error);
            return {
                text: '',
                metadata: {
                    wordCount: 0,
                    extractionMethod: 'error',
                    confidence: 0,
                    extractedAt: new Date()
                },
                errors: [error.message]
            };
        }
    }

    // Download file from URL
    private static async downloadFile(url: string): Promise<ArrayBuffer> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }
            return await response.arrayBuffer();
        } catch (error) {
            throw new Error(`File download failed: ${error.message}`);
        }
    }

    // Extract content from PDF files
    private static async extractFromPDF(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            // In a real implementation, you would use a library like pdf-parse or PDF.js
            // For now, return a mock implementation

            const mockText = `[PDF Content Extracted]
This is extracted text from a PDF document. In a real implementation, this would contain the actual text content from the PDF file using libraries like pdf-parse or PDF.js.

The extraction would include:
- All text content from each page
- Metadata like page count, creation date, author
- Optional OCR for scanned PDFs
- Table and image extraction if requested`;

            return {
                text: mockText,
                metadata: {
                    pageCount: 1,
                    wordCount: mockText.split(' ').length,
                    extractionMethod: 'pdf-parse',
                    confidence: 0.95,
                    extractedAt: new Date()
                },
                structure: options.includeStructure ? {
                    headings: ['Document Title', 'Section 1'],
                    tables: [],
                    images: []
                } : undefined
            };
        } catch (error) {
            throw new Error(`PDF extraction failed: ${error.message}`);
        }
    }

    // Extract content from Word documents (.docx)
    private static async extractFromDocx(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            // In a real implementation, you would use a library like mammoth.js or docx-parser

            const mockText = `[Word Document Content Extracted]
This is extracted text from a Word document. In a real implementation, this would use libraries like mammoth.js to extract the actual content.

The extraction would include:
- All paragraph text
- Headings and formatting structure
- Table content
- Image alt text and captions
- Comments and footnotes`;

            return {
                text: mockText,
                metadata: {
                    wordCount: mockText.split(' ').length,
                    extractionMethod: 'mammoth',
                    confidence: 0.98,
                    extractedAt: new Date()
                },
                structure: options.includeStructure ? {
                    headings: ['Document Title', 'Introduction', 'Main Content'],
                    tables: [],
                    images: []
                } : undefined
            };
        } catch (error) {
            throw new Error(`Word document extraction failed: ${error.message}`);
        }
    }

    // Extract content from legacy Word documents (.doc)
    private static async extractFromDoc(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            // Legacy .doc files require different handling
            const mockText = `[Legacy Word Document Content]
Content extracted from .doc file. This would require specialized libraries for the older Word format.`;

            return {
                text: mockText,
                metadata: {
                    wordCount: mockText.split(' ').length,
                    extractionMethod: 'doc-parser',
                    confidence: 0.85,
                    extractedAt: new Date()
                }
            };
        } catch (error) {
            throw new Error(`Legacy Word document extraction failed: ${error.message}`);
        }
    }

    // Extract content from plain text files
    private static async extractFromText(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(buffer);

            return {
                text: text,
                metadata: {
                    wordCount: text.split(/\s+/).length,
                    extractionMethod: 'text-decoder',
                    confidence: 1.0,
                    extractedAt: new Date()
                }
            };
        } catch (error) {
            throw new Error(`Text file extraction failed: ${error.message}`);
        }
    }

    // Extract content from HTML files
    private static async extractFromHTML(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            const decoder = new TextDecoder('utf-8');
            const html = decoder.decode(buffer);

            // Remove HTML tags and extract text content
            const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            return {
                text: text,
                metadata: {
                    wordCount: text.split(' ').length,
                    extractionMethod: 'html-parser',
                    confidence: 0.90,
                    extractedAt: new Date()
                }
            };
        } catch (error) {
            throw new Error(`HTML extraction failed: ${error.message}`);
        }
    }

    // Extract content from Excel files
    private static async extractFromExcel(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            // In a real implementation, you would use a library like xlsx or exceljs

            const mockText = `[Excel Spreadsheet Content]
Sheet 1: Financial Data
- Revenue: ₱150,000
- Expenses: ₱85,000
- Net Income: ₱65,000

Sheet 2: Monthly Breakdown
January: ₱12,000
February: ₱15,000
March: ₱18,000

This would contain actual cell values, formulas, and sheet names from the Excel file.`;

            return {
                text: mockText,
                metadata: {
                    wordCount: mockText.split(' ').length,
                    extractionMethod: 'xlsx-parser',
                    confidence: 0.92,
                    extractedAt: new Date()
                },
                structure: options.includeStructure ? {
                    headings: ['Sheet 1', 'Sheet 2'],
                    tables: [
                        { sheet: 'Financial Data', rows: 3, cols: 2 },
                        { sheet: 'Monthly Breakdown', rows: 3, cols: 2 }
                    ],
                    images: []
                } : undefined
            };
        } catch (error) {
            throw new Error(`Excel extraction failed: ${error.message}`);
        }
    }

    // Extract content from PowerPoint files
    private static async extractFromPowerPoint(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            // In a real implementation, you would use a library for PowerPoint extraction

            const mockText = `[PowerPoint Presentation Content]
Slide 1: Title Slide
- Presentation Title
- Author Name
- Date

Slide 2: Overview
- Key points and objectives
- Main topics to be covered

Slide 3: Financial Summary
- Charts and graphs content
- Data points and analysis

This would contain actual slide text, speaker notes, and image descriptions.`;

            return {
                text: mockText,
                metadata: {
                    wordCount: mockText.split(' ').length,
                    extractionMethod: 'pptx-parser',
                    confidence: 0.88,
                    extractedAt: new Date()
                },
                structure: options.includeStructure ? {
                    headings: ['Slide 1', 'Slide 2', 'Slide 3'],
                    tables: [],
                    images: []
                } : undefined
            };
        } catch (error) {
            throw new Error(`PowerPoint extraction failed: ${error.message}`);
        }
    }

    // Extract text from images using OCR
    private static async extractFromImage(buffer: ArrayBuffer, options: ExtractionOptions): Promise<ExtractedContent> {
        try {
            if (!options.ocrEnabled) {
                return {
                    text: '[Image file - OCR disabled]',
                    metadata: {
                        wordCount: 0,
                        extractionMethod: 'ocr-disabled',
                        confidence: 0,
                        extractedAt: new Date()
                    }
                };
            }

            // In a real implementation, you would use OCR libraries like Tesseract.js
            const mockText = `[OCR Extracted Text]
This is text extracted from an image using OCR technology. 
In a real implementation, this would use libraries like Tesseract.js to recognize text in images.

Common OCR use cases:
- Scanned documents
- Receipt images
- Screenshots with text
- Handwritten notes (with varying accuracy)`;

            return {
                text: mockText,
                metadata: {
                    wordCount: mockText.split(' ').length,
                    extractionMethod: 'tesseract-ocr',
                    confidence: 0.75, // OCR typically has lower confidence
                    extractedAt: new Date()
                }
            };
        } catch (error) {
            throw new Error(`Image OCR extraction failed: ${error.message}`);
        }
    }

    // Check if file type is supported
    static isSupported(contentType: string): boolean {
        return contentType in this.SUPPORTED_TYPES;
    }

    // Get supported file types
    static getSupportedTypes(): string[] {
        return Object.keys(this.SUPPORTED_TYPES);
    }

    // Get file type category
    static getFileCategory(contentType: string): string {
        const type = this.SUPPORTED_TYPES[contentType];
        if (!type) return 'unknown';

        if (['pdf'].includes(type)) return 'document';
        if (['docx', 'doc'].includes(type)) return 'word-document';
        if (['xlsx', 'xls'].includes(type)) return 'spreadsheet';
        if (['pptx', 'ppt'].includes(type)) return 'presentation';
        if (['txt', 'html'].includes(type)) return 'text';
        if (['jpg', 'png', 'gif', 'bmp', 'tiff'].includes(type)) return 'image';

        return 'other';
    }

    // Estimate extraction time based on file size and type
    static estimateExtractionTime(fileSize: number, contentType: string): number {
        const type = this.SUPPORTED_TYPES[contentType];
        if (!type) return 0;

        // Base time in milliseconds per MB
        const baseTimePerMB = {
            'pdf': 2000,
            'docx': 1000,
            'doc': 1500,
            'xlsx': 1200,
            'xls': 1500,
            'pptx': 1000,
            'ppt': 1200,
            'txt': 100,
            'html': 200,
            'jpg': 3000, // OCR is slower
            'png': 3000,
            'gif': 3000,
            'bmp': 3000,
            'tiff': 3000
        };

        const fileSizeMB = fileSize / (1024 * 1024);
        return Math.max(500, fileSizeMB * (baseTimePerMB[type] || 1000));
    }
}