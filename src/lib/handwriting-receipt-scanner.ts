// Enhanced AI Receipt Scanner with Handwriting Recognition Optimization
import { createWorker } from 'tesseract.js';
import { ScannedReceiptData } from './ai-receipt-scanner';

export interface HandwritingConfig {
    language: string;
    pageSegMode: string;
    ocrEngineMode: string;
    enablePreprocessing: boolean;
    confidenceThreshold: number;
}

export class HandwritingReceiptScanner {
    private worker: Tesseract.Worker | null = null;
    private isInitialized = false;
    private config: HandwritingConfig;

    constructor(config?: Partial<HandwritingConfig>) {
        this.config = {
            language: 'eng',
            pageSegMode: '6', // Uniform block of text - good for receipts
            ocrEngineMode: '1', // Neural nets LSTM engine (best for handwriting)
            enablePreprocessing: true,
            confidenceThreshold: 60,
            ...config
        };
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('Initializing Handwriting Receipt Scanner...');
            this.worker = await createWorker(this.config.language);
            
            // Optimized parameters for handwriting recognition
            await this.worker.setParameters({
                // Character whitelist - includes common receipt characters
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/$-:()₱ ',
                
                // Page segmentation mode
                tessedit_pageseg_mode: this.config.pageSegMode,
                
                // OCR Engine Mode (1 =