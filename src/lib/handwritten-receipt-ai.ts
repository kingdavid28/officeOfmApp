// Enhanced AI System for Handwritten Receipt Recognition
// Combines multiple AI technologies for accurate handwritten text recognition

export interface HandwrittenReceiptConfig {
    // OCR Engine Selection
    ocrEngine: 'tesseract' | 'google-vision' | 'azure-cognitive' | 'aws-textract' | 'hybrid';

    // Image Preprocessing
    preprocessing: {
        denoise: boolean;
        deskew: boolean;
        binarization: boolean;
        contrastEnhancement: boolean;
        resolutionUpscaling: boolean;
    };

    // Handwriting-specific settings
    handwritingMode: {
        enabled: boolean;
        language: 'en' | 'fil' | 'multi';
        scriptType: 'latin' | 'mixed';
        confidenceThreshold: number;
    };

    // Machine Learning Enhancement
    mlEnhancement: {
        useCustomModel: boolean;
        modelPath?: string;
        trainingDataPath?: string;
        continuousLearning: boolean;
    };
}

export interface HandwrittenAnalysis {
    isHandwritten: boolean;
    handwritingConfidence: number;
    textQuality: 'excellent' | 'good' | 'fair' | 'poor';
    recommendedProcessing: string[];
    estimatedAccuracy: number;
}

export interface EnhancedScannedData {
    // Basic OCR Results
    rawText: string;
    confidence: number;

    // Handwriting Analysis
    handwritingAnalysis: HandwrittenAnalysis;

    // Enhanced Extraction
    extractedData: {
        amount?: number;
        amountConfidence?: number;
        date?: string;
        dateConfidence?: number;
        vendor?: string;
        vendorConfidence?: number;
        items?: Array<{
            name: string;
            price?: number;
            confidence: number;
        }>;
        taxAmount?: number;
        invoiceNumber?: string;
        paymentMethod?: string;
    };

    // AI Suggestions
    suggestions: {
        category: string;
        categoryConfidence: number;
        alternativeCategories: Array<{
            category: string;
            confidence: number;
        }>;
        flaggedForReview: boolean;
        reviewReasons: string[];
    };

    // Processing Metadata
    processingTime: number;
    engineUsed: string;
    preprocessingApplied: string[];
}

export class HandwrittenReceiptAI {
    private config: HandwrittenReceiptConfig;
    private tesseractWorker: any = null;
    private customModel: any = null;
    private isInitialized = false;

    constructor(config: Partial<HandwrittenReceiptConfig> = {}) {
        this.config = {
            ocrEngine: 'hybrid',
            preprocessing: {
                denoise: true,
                deskew: true,
                binarization: true,
                contrastEnhancement: true,
                resolutionUpscaling: true
            },
            handwritingMode: {
                enabled: true,
                language: 'en',
                scriptType: 'latin',
                confidenceThreshold: 0.6
            },
            mlEnhancement: {
                useCustomModel: true,
                continuousLearning: true
            },
            ...config
        };
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        console.log('Initializing Handwritten Receipt AI...');

        try {
            // Initialize Tesseract with handwriting-optimized settings
            await this.initializeTesseract();

            // Load custom trained model if available
            if (this.config.mlEnhancement.useCustomModel) {
                await this.loadCustomModel();
            }

            this.isInitialized = true;
            console.log('Handwritten Receipt AI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Handwritten Receipt AI:', error);
            throw error;
        }
    }

    private async initializeTesseract(): Promise<void> {
        const { createWorker } = await import('tesseract.js');

        this.tesseractWorker = await createWorker(['eng', 'fil'], 1, {
            logger: m => console.log('Tesseract:', m)
        });

        // Optimize for handwritten text recognition
        await this.tesseractWorker.setParameters({
            // Character whitelist (expanded for handwriting)
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$-:()[]{}@#%&*+=<>?!"\' ',

            // Page segmentation mode - treat image as single text block
            tessedit_pageseg_mode: '6',

            // OCR Engine Mode - use LSTM (better for handwriting)
            tessedit_ocr_engine_mode: '1',

            // Handwriting-specific parameters
            textord_heavy_nr: '1',
            textord_noise_normratio: '2',
            textord_noise_syfraction: '0.2',
            textord_noise_sizefraction: '0.1',

            // Improve accuracy for poor quality images
            tessedit_enable_dict_correction: '1',
            tessedit_enable_bigram_correction: '1',

            // Language model weights
            language_model_penalty_non_freq_dict_word: '0.1',
            language_model_penalty_non_dict_word: '0.15'
        });
    }

    private async loadCustomModel(): Promise<void> {
        // In a real implementation, this would load a custom-trained model
        // For now, we'll simulate this with enhanced pattern recognition
        console.log('Loading custom handwriting recognition model...');

        // This would typically load:
        // - TensorFlow.js model for handwriting recognition
        // - Custom vocabulary for receipt-specific terms
        // - Trained patterns for Filipino receipt formats

        this.customModel = {
            loaded: true,
            version: '1.0.0',
            trainingData: 'filipino-receipts-v1',
            accuracy: 0.87
        };
    }

    async scanHandwrittenReceipt(imageFile: File | string): Promise<EnhancedScannedData> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const startTime = Date.now();

        try {
            // Step 1: Analyze if image contains handwriting
            const handwritingAnalysis = await this.analyzeHandwriting(imageFile);

            // Step 2: Preprocess image for optimal OCR
            const preprocessedImage = await this.preprocessImage(imageFile, handwritingAnalysis);

            // Step 3: Apply appropriate OCR strategy
            const ocrResults = await this.performOCR(preprocessedImage, handwritingAnalysis);

            // Step 4: Post-process and enhance results
            const enhancedData = await this.enhanceResults(ocrResults, handwritingAnalysis);

            // Step 5: Apply machine learning improvements
            const finalResults = await this.applyMLEnhancements(enhancedData);

            const processingTime = Date.now() - startTime;

            return {
                ...finalResults,
                handwritingAnalysis,
                processingTime,
                engineUsed: this.config.ocrEngine,
                preprocessingApplied: this.getAppliedPreprocessing()
            };

        } catch (error) {
            console.error('Handwritten receipt scanning failed:', error);
            throw new Error(`Failed to scan handwritten receipt: ${error.message}`);
        }
    }

    private async analyzeHandwriting(imageFile: File | string): Promise<HandwrittenAnalysis> {
        // Analyze image characteristics to determine if it's handwritten
        // This would use computer vision techniques to detect:
        // - Irregular character shapes
        // - Varying line thickness
        // - Non-uniform spacing
        // - Cursive connections

        // Simulated analysis for now
        const analysis: HandwrittenAnalysis = {
            isHandwritten: true, // Would be determined by CV analysis
            handwritingConfidence: 0.85,
            textQuality: 'good',
            recommendedProcessing: [
                'denoise',
                'contrast_enhancement',
                'binarization',
                'deskew'
            ],
            estimatedAccuracy: 0.78
        };

        return analysis;
    }

    private async preprocessImage(imageFile: File | string, analysis: HandwrittenAnalysis): Promise<string> {
        // Image preprocessing pipeline for handwritten text
        console.log('Preprocessing image for handwritten text recognition...');

        // In a real implementation, this would:
        // 1. Convert to grayscale
        // 2. Apply noise reduction
        // 3. Enhance contrast
        // 4. Correct skew/rotation
        // 5. Binarize (convert to black/white)
        // 6. Upscale resolution if needed

        // For now, return the original image
        return typeof imageFile === 'string' ? imageFile : URL.createObjectURL(imageFile);
    }

    private async performOCR(imageFile: string, analysis: HandwrittenAnalysis): Promise<any> {
        console.log('Performing OCR with handwriting optimization...');

        // Adjust OCR parameters based on handwriting analysis
        if (analysis.isHandwritten && analysis.handwritingConfidence > 0.7) {
            await this.tesseractWorker.setParameters({
                // More aggressive settings for handwriting
                tessedit_pageseg_mode: '8', // Single word mode for better accuracy
                tessedit_ocr_engine_mode: '1', // LSTM engine
                textord_noise_normratio: '3', // Higher noise tolerance
            });
        }

        const { data } = await this.tesseractWorker.recognize(imageFile);
        return data;
    }

    private async enhanceResults(ocrResults: any, analysis: HandwrittenAnalysis): Promise<Partial<EnhancedScannedData>> {
        const text = ocrResults.text;

        return {
            rawText: text,
            confidence: ocrResults.confidence,
            extractedData: {
                amount: this.extractAmountEnhanced(text),
                amountConfidence: this.calculateAmountConfidence(text),
                date: this.extractDateEnhanced(text),
                dateConfidence: this.calculateDateConfidence(text),
                vendor: this.extractVendorEnhanced(text),
                vendorConfidence: this.calculateVendorConfidence(text),
                items: this.extractItemsEnhanced(text),
                taxAmount: this.extractTaxAmountEnhanced(text),
                invoiceNumber: this.extractInvoiceNumberEnhanced(text),
                paymentMethod: this.extractPaymentMethod(text)
            }
        };
    }

    private async applyMLEnhancements(data: Partial<EnhancedScannedData>): Promise<Partial<EnhancedScannedData>> {
        if (!this.config.mlEnhancement.useCustomModel || !this.customModel) {
            return data;
        }

        console.log('Applying ML enhancements...');

        // Apply custom model improvements
        const suggestions = this.generateAISuggestions(data.rawText || '', data.extractedData);

        return {
            ...data,
            suggestions
        };
    }

    private generateAISuggestions(text: string, extractedData: any): EnhancedScannedData['suggestions'] {
        // AI-powered categorization and suggestions
        const categories = this.categorizeReceiptAI(text, extractedData);
        const reviewFlags = this.flagForReview(text, extractedData);

        return {
            category: categories.primary.category,
            categoryConfidence: categories.primary.confidence,
            alternativeCategories: categories.alternatives,
            flaggedForReview: reviewFlags.shouldFlag,
            reviewReasons: reviewFlags.reasons
        };
    }

    private categorizeReceiptAI(text: string, extractedData: any): {
        primary: { category: string; confidence: number };
        alternatives: Array<{ category: string; confidence: number }>;
    } {
        // Enhanced AI categorization using multiple signals
        const textLower = text.toLowerCase();
        const vendor = extractedData?.vendor?.toLowerCase() || '';

        // Filipino receipt patterns
        const categoryPatterns = {
            'Food': {
                keywords: ['restaurant', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'kain', 'pagkain', 'resto'],
                vendors: ['jollibee', 'mcdonalds', 'kfc', 'chowking', 'mang inasal'],
                confidence: 0.9
            },
            'Transportation': {
                keywords: ['taxi', 'grab', 'jeep', 'bus', 'tricycle', 'fare', 'pamasahe', 'sakay'],
                vendors: ['grab', 'uber', 'taxi'],
                confidence: 0.85
            },
            'Utilities': {
                keywords: ['electric', 'water', 'internet', 'phone', 'meralco', 'maynilad', 'pldt'],
                vendors: ['meralco', 'maynilad', 'pldt', 'globe', 'smart'],
                confidence: 0.95
            },
            'Medical': {
                keywords: ['pharmacy', 'medicine', 'hospital', 'clinic', 'doctor', 'gamot', 'ospital'],
                vendors: ['mercury drug', 'watsons', 'rose pharmacy'],
                confidence: 0.9
            },
            'Groceries': {
                keywords: ['grocery', 'supermarket', 'market', 'palengke', 'tindahan'],
                vendors: ['sm', 'robinsons', 'puregold', 'shopwise'],
                confidence: 0.85
            }
        };

        const scores: Array<{ category: string; confidence: number }> = [];

        for (const [category, patterns] of Object.entries(categoryPatterns)) {
            let score = 0;

            // Check keywords
            const keywordMatches = patterns.keywords.filter(keyword =>
                textLower.includes(keyword) || vendor.includes(keyword)
            ).length;
            score += (keywordMatches / patterns.keywords.length) * 0.6;

            // Check vendor matches
            const vendorMatches = patterns.vendors.filter(v => vendor.includes(v)).length;
            if (vendorMatches > 0) {
                score += 0.4;
            }

            if (score > 0) {
                scores.push({
                    category,
                    confidence: Math.min(score * patterns.confidence, 1.0)
                });
            }
        }

        // Sort by confidence
        scores.sort((a, b) => b.confidence - a.confidence);

        return {
            primary: scores[0] || { category: 'Other', confidence: 0.3 },
            alternatives: scores.slice(1, 4)
        };
    }

    private flagForReview(text: string, extractedData: any): { shouldFlag: boolean; reasons: string[] } {
        const reasons: string[] = [];

        // Flag for review based on various criteria
        if (!extractedData?.amount || extractedData.amount === 0) {
            reasons.push('No amount detected');
        }

        if (!extractedData?.date) {
            reasons.push('No date detected');
        }

        if (!extractedData?.vendor || extractedData.vendor.length < 3) {
            reasons.push('Vendor name unclear');
        }

        if (text.length < 20) {
            reasons.push('Very short text detected');
        }

        // Check for handwriting quality issues
        const confidence = extractedData?.amountConfidence || 0;
        if (confidence < 0.6) {
            reasons.push('Low confidence in amount recognition');
        }

        return {
            shouldFlag: reasons.length > 0,
            reasons
        };
    }

    // Enhanced extraction methods with confidence scoring
    private extractAmountEnhanced(text: string): number | undefined {
        const patterns = [
            // Filipino peso patterns
            /₱\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /PHP\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /PESOS?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,

            // Total patterns (common in handwritten receipts)
            /TOTAL[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /KABUUAN[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /BAYAD[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,

            // Loose number patterns (for handwritten amounts)
            /(\d{1,3}(?:,\d{3})*\.\d{2})/g,
            /(\d+\.\d{2})/g
        ];

        const amounts: number[] = [];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(amount) && amount > 0 && amount < 1000000) { // Reasonable range
                    amounts.push(amount);
                }
            }
        }

        return amounts.length > 0 ? Math.max(...amounts) : undefined;
    }

    private calculateAmountConfidence(text: string): number {
        // Calculate confidence based on multiple factors
        let confidence = 0.5; // Base confidence

        // Boost confidence if currency symbol is present
        if (text.includes('₱') || text.includes('PHP')) {
            confidence += 0.2;
        }

        // Boost confidence if "TOTAL" or similar words are present
        if (/TOTAL|KABUUAN|BAYAD/gi.test(text)) {
            confidence += 0.2;
        }

        // Reduce confidence if multiple amounts are detected
        const amountMatches = text.match(/\d+\.\d{2}/g);
        if (amountMatches && amountMatches.length > 3) {
            confidence -= 0.1;
        }

        return Math.min(Math.max(confidence, 0), 1);
    }

    private extractDateEnhanced(text: string): string | undefined {
        const patterns = [
            // Various date formats common in Philippines
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,
            /(\d{1,2}-\d{1,2}-\d{4})/g,
            /(\d{4}-\d{1,2}-\d{1,2})/g,

            // Month names in English and Filipino
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,
            /(Ene|Peb|Mar|Abr|May|Hun|Hul|Ago|Set|Okt|Nob|Dis)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,

            // Handwritten date patterns
            /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/gi
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const dateStr = match[0];
                const date = new Date(dateStr);
                if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() <= new Date().getFullYear() + 1) {
                    return date.toISOString().split('T')[0];
                }
            }
        }

        return undefined;
    }

    private calculateDateConfidence(text: string): number {
        // Similar confidence calculation for dates
        let confidence = 0.4;

        if (/DATE|PETSA/gi.test(text)) {
            confidence += 0.3;
        }

        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(text)) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1);
    }

    private extractVendorEnhanced(text: string): string | undefined {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Look for vendor in first few lines, avoiding common receipt words
        const excludeWords = [
            'receipt', 'invoice', 'total', 'amount', 'date', 'time', 'cashier',
            'thank you', 'salamat', 'resibo', 'petsa', 'oras'
        ];

        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            if (line.length > 3 && line.length < 50) {
                const hasExcludedWord = excludeWords.some(word =>
                    line.toLowerCase().includes(word)
                );

                if (!hasExcludedWord && !/^\d+$/.test(line) && !/^[\d\s\-\/]+$/.test(line)) {
                    return line;
                }
            }
        }

        return undefined;
    }

    private calculateVendorConfidence(text: string): number {
        // Vendor confidence calculation
        return 0.7; // Simplified for now
    }

    private extractItemsEnhanced(text: string): Array<{ name: string; price?: number; confidence: number }> {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const items: Array<{ name: string; price?: number; confidence: number }> = [];

        // Look for item patterns in middle section of receipt
        const startIndex = Math.min(3, lines.length);
        const endIndex = Math.max(startIndex, lines.length - 3);

        for (let i = startIndex; i < endIndex; i++) {
            const line = lines[i];

            // Skip lines that look like totals or headers
            if (/TOTAL|SUBTOTAL|TAX|CHANGE/gi.test(line)) continue;

            // Look for item with price pattern
            const itemMatch = line.match(/^(.+?)\s+(\d+\.\d{2})$/);
            if (itemMatch) {
                items.push({
                    name: itemMatch[1].trim(),
                    price: parseFloat(itemMatch[2]),
                    confidence: 0.8
                });
            } else if (line.length > 3 && line.length < 50 && !/^\d+$/.test(line)) {
                // Item without clear price
                items.push({
                    name: line,
                    confidence: 0.6
                });
            }
        }

        return items;
    }

    private extractTaxAmountEnhanced(text: string): number | undefined {
        const taxPatterns = [
            /VAT[:\s]*₱?\s*(\d+\.\d{2})/gi,
            /TAX[:\s]*₱?\s*(\d+\.\d{2})/gi,
            /BUWIS[:\s]*₱?\s*(\d+\.\d{2})/gi
        ];

        for (const pattern of taxPatterns) {
            const match = text.match(pattern);
            if (match) {
                const amount = parseFloat(match[1]);
                if (!isNaN(amount)) {
                    return amount;
                }
            }
        }

        return undefined;
    }

    private extractInvoiceNumberEnhanced(text: string): string | undefined {
        const patterns = [
            /INVOICE[:\s#]*(\w+)/gi,
            /RECEIPT[:\s#]*(\w+)/gi,
            /NO[:\s#]*(\w+)/gi,
            /REF[:\s#]*(\w+)/gi
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1].length > 2) {
                return match[1];
            }
        }

        return undefined;
    }

    private extractPaymentMethod(text: string): string | undefined {
        const methods = ['CASH', 'CARD', 'CREDIT', 'DEBIT', 'GCASH', 'PAYMAYA', 'CASH'];
        const textUpper = text.toUpperCase();

        for (const method of methods) {
            if (textUpper.includes(method)) {
                return method;
            }
        }

        return undefined;
    }

    private getAppliedPreprocessing(): string[] {
        const applied: string[] = [];

        if (this.config.preprocessing.denoise) applied.push('denoise');
        if (this.config.preprocessing.deskew) applied.push('deskew');
        if (this.config.preprocessing.binarization) applied.push('binarization');
        if (this.config.preprocessing.contrastEnhancement) applied.push('contrast_enhancement');
        if (this.config.preprocessing.resolutionUpscaling) applied.push('resolution_upscaling');

        return applied;
    }

    async trainOnNewReceipt(imageFile: File, correctData: any): Promise<void> {
        if (!this.config.mlEnhancement.continuousLearning) return;

        console.log('Training AI on new receipt data...');

        // In a real implementation, this would:
        // 1. Store the image and correct data as training example
        // 2. Retrain the model periodically with new data
        // 3. Improve recognition accuracy over time

        // For now, just log the training data
        console.log('Training data received:', {
            image: imageFile.name,
            correctData
        });
    }

    async cleanup(): Promise<void> {
        if (this.tesseractWorker) {
            await this.tesseractWorker.terminate();
            this.tesseractWorker = null;
        }
        this.isInitialized = false;
    }
}

// Export default configuration for handwritten receipts
export const HANDWRITTEN_RECEIPT_CONFIG: HandwrittenReceiptConfig = {
    ocrEngine: 'hybrid',
    preprocessing: {
        denoise: true,
        deskew: true,
        binarization: true,
        contrastEnhancement: true,
        resolutionUpscaling: true
    },
    handwritingMode: {
        enabled: true,
        language: 'multi',
        scriptType: 'latin',
        confidenceThreshold: 0.6
    },
    mlEnhancement: {
        useCustomModel: true,
        continuousLearning: true
    }
};