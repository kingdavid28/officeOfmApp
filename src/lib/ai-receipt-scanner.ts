import { createWorker } from 'tesseract.js';

export interface ScannedReceiptData {
    text: string;
    confidence: number;
    extractedData: {
        amount?: number;
        date?: string;
        vendor?: string;
        items?: string[];
        taxAmount?: number;
        invoiceNumber?: string;
    };
    suggestedCategory?: string;
    categoryConfidence?: number;
}

export interface CameraConfig {
    width: number;
    height: number;
    facingMode: 'user' | 'environment';
    quality: number;
}

export class AIReceiptScanner {
    private worker: Tesseract.Worker | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            this.worker = await createWorker('eng');
            await this.worker.setParameters({
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$-: ',
                tessedit_pageseg_mode: '6', // Uniform block of text
            });
            this.isInitialized = true;
            console.log('AI Receipt Scanner initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Receipt Scanner:', error);
            throw new Error('Failed to initialize OCR engine');
        }
    }

    async scanImage(imageFile: File | string): Promise<ScannedReceiptData> {
        if (!this.isInitialized || !this.worker) {
            await this.initialize();
        }

        try {
            console.log('Starting OCR scan...');
            const { data } = await this.worker!.recognize(imageFile);

            const extractedData = this.extractReceiptData(data.text);
            const suggestedCategory = this.categorizeReceipt(data.text, extractedData);

            return {
                text: data.text,
                confidence: data.confidence,
                extractedData,
                suggestedCategory: suggestedCategory.category,
                categoryConfidence: suggestedCategory.confidence
            };
        } catch (error) {
            console.error('OCR scanning failed:', error);
            throw new Error('Failed to scan receipt');
        }
    }

    private extractReceiptData(text: string): ScannedReceiptData['extractedData'] {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        return {
            amount: this.extractAmount(text),
            date: this.extractDate(text),
            vendor: this.extractVendor(lines),
            items: this.extractItems(lines),
            taxAmount: this.extractTaxAmount(text),
            invoiceNumber: this.extractInvoiceNumber(text)
        };
    }

    private extractAmount(text: string): number | undefined {
        // Look for currency patterns (₱, PHP, $)
        const amountPatterns = [
            /₱\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /PHP\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
            /TOTAL[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /AMOUNT[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:₱|PHP|TOTAL|AMOUNT)/gi
        ];

        const amounts: number[] = [];

        for (const pattern of amountPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(amount) && amount > 0) {
                    amounts.push(amount);
                }
            }
        }

        // Return the largest amount found (likely the total)
        return amounts.length > 0 ? Math.max(...amounts) : undefined;
    }

    private extractDate(text: string): string | undefined {
        const datePatterns = [
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,
            /(\d{1,2}-\d{1,2}-\d{4})/g,
            /(\d{4}-\d{1,2}-\d{1,2})/g,
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,
            /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/gi
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                const dateStr = match[0];
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }

        return undefined;
    }

    private extractVendor(lines: string[]): string | undefined {
        // Usually the vendor is in the first few lines
        const topLines = lines.slice(0, 5);

        // Look for lines that might be vendor names (avoid common receipt words)
        const excludeWords = ['receipt', 'invoice', 'total', 'amount', 'date', 'time', 'cashier', 'thank you'];

        for (const line of topLines) {
            if (line.length > 3 && line.length < 50) {
                const hasExcludedWord = excludeWords.some(word =>
                    line.toLowerCase().includes(word)
                );

                if (!hasExcludedWord && !/^\d+$/.test(line)) {
                    return line;
                }
            }
        }

        return undefined;
    }

    private extractItems(lines: string[]): string[] {
        const items: string[] = [];

        for (const line of lines) {
            // Look for lines that might be items (have price patterns)
            if (this.looksLikeItemLine(line)) {
                const itemName = this.extractItemName(line);
                if (itemName) {
                    items.push(itemName);
                }
            }
        }

        return items;
    }

    private looksLikeItemLine(line: string): boolean {
        // Check if line contains price patterns
        const pricePatterns = [
            /\d+\.\d{2}/,
            /₱\s*\d+/,
            /\d+\s*₱/
        ];

        return pricePatterns.some(pattern => pattern.test(line));
    }

    private extractItemName(line: string): string | undefined {
        // Remove price information and clean up
        const cleaned = line
            .replace(/₱\s*\d+(?:\.\d{2})?/g, '')
            .replace(/\d+\.\d{2}/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned.length > 2 ? cleaned : undefined;
    }

    private extractTaxAmount(text: string): number | undefined {
        const taxPatterns = [
            /TAX[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /VAT[:\s]*₱?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
            /(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:TAX|VAT)/gi
        ];

        for (const pattern of taxPatterns) {
            const match = text.match(pattern);
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(amount)) {
                    return amount;
                }
            }
        }

        return undefined;
    }

    private extractInvoiceNumber(text: string): string | undefined {
        const invoicePatterns = [
            /(?:INVOICE|RECEIPT|REF|NO)[:\s#]*([A-Z0-9-]+)/gi,
            /(?:INV|RCT|REF)[:\s#]*([A-Z0-9-]+)/gi,
            /#([A-Z0-9-]{3,})/g
        ];

        for (const pattern of invoicePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return undefined;
    }

    private categorizeReceipt(text: string, extractedData: ScannedReceiptData['extractedData']): { category: string; confidence: number } {
        const categories = [
            {
                name: 'Office Supplies',
                keywords: ['paper', 'pen', 'stapler', 'folder', 'notebook', 'office', 'supplies', 'stationery'],
                confidence: 0
            },
            {
                name: 'Transportation',
                keywords: ['gas', 'fuel', 'taxi', 'uber', 'grab', 'bus', 'train', 'parking', 'toll'],
                confidence: 0
            },
            {
                name: 'Utilities',
                keywords: ['electric', 'water', 'internet', 'phone', 'meralco', 'pldt', 'globe', 'smart'],
                confidence: 0
            },
            {
                name: 'Meals & Entertainment',
                keywords: ['restaurant', 'food', 'coffee', 'lunch', 'dinner', 'catering', 'mcdonalds', 'jollibee'],
                confidence: 0
            },
            {
                name: 'Equipment',
                keywords: ['computer', 'laptop', 'printer', 'monitor', 'keyboard', 'mouse', 'furniture'],
                confidence: 0
            },
            {
                name: 'Services',
                keywords: ['consulting', 'service', 'maintenance', 'repair', 'cleaning', 'security'],
                confidence: 0
            },
            {
                name: 'Medical & Health',
                keywords: ['hospital', 'clinic', 'medicine', 'pharmacy', 'medical', 'health', 'doctor'],
                confidence: 0
            }
        ];

        const textLower = text.toLowerCase();
        const vendorLower = extractedData.vendor?.toLowerCase() || '';

        // Calculate confidence for each category
        categories.forEach(category => {
            let matches = 0;
            category.keywords.forEach(keyword => {
                if (textLower.includes(keyword) || vendorLower.includes(keyword)) {
                    matches++;
                }
            });
            category.confidence = matches / category.keywords.length;
        });

        // Find the category with highest confidence
        const bestMatch = categories.reduce((prev, current) =>
            current.confidence > prev.confidence ? current : prev
        );

        return {
            category: bestMatch.confidence > 0.1 ? bestMatch.name : 'Other',
            confidence: bestMatch.confidence
        };
    }

    async cleanup(): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
        }
    }
}

// Camera utilities
export class CameraManager {
    private stream: MediaStream | null = null;
    private video: HTMLVideoElement | null = null;

    async startCamera(config: CameraConfig = {
        width: 1280,
        height: 720,
        facingMode: 'environment',
        quality: 0.8
    }): Promise<HTMLVideoElement> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: config.width },
                    height: { ideal: config.height },
                    facingMode: config.facingMode
                }
            });

            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.autoplay = true;
            this.video.playsInline = true;

            return new Promise((resolve, reject) => {
                this.video!.onloadedmetadata = () => {
                    resolve(this.video!);
                };
                this.video!.onerror = reject;
            });
        } catch (error) {
            console.error('Failed to start camera:', error);
            throw new Error('Camera access denied or not available');
        }
    }

    captureImage(quality: number = 0.8): Promise<File> {
        if (!this.video) {
            throw new Error('Camera not started');
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;

            canvas.width = this.video!.videoWidth;
            canvas.height = this.video!.videoHeight;

            context.drawImage(this.video!, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob!], `receipt_${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });
                resolve(file);
            }, 'image/jpeg', quality);
        });
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }
    }
}