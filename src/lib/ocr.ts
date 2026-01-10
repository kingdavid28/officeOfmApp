import Tesseract from 'tesseract.js';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import { aiSummarizer } from './ai-summarizer';
import { aiOptimizer } from './ai-optimizer';
import { documentClassifier } from './classification';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;
  private onnxSession: InferenceSession | null = null;
  private isInitialized = false;
  private useONNX = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Try ONNX first for better performance
      try {
        this.onnxSession = await InferenceSession.create('/models/ocr-model.onnx');
        this.useONNX = true;
        console.log('ONNX OCR model loaded successfully');
      } catch (onnxError) {
        console.warn('ONNX model loading failed, falling back to Tesseract:', onnxError);
        
        // Fallback to Tesseract
        this.worker = await Tesseract.createWorker('eng');
        console.log('Tesseract OCR initialized');
      }
      
      // Initialize AI modules
      await Promise.all([
        aiSummarizer.initialize(),
        documentClassifier.initialize()
      ]);
      
      this.isInitialized = true;
      console.log('OCR service with AI enhancements initialized');
    } catch (error) {
      console.error('OCR initialization failed:', error);
      throw error;
    }
  }

  async extractText(imageFile: File | string): Promise<OCRResult> {
    try {
      // Try ONNX first if available
      if (this.useONNX && this.onnxSession) {
        return await this.extractTextONNX(imageFile);
      }
      // Fallback to Tesseract
      return await this.extractTextLocal(imageFile);
    } catch (error) {
      console.warn('Local OCR failed, falling back to cloud:', error);
      return await this.extractTextCloud(imageFile);
    }
  }

  private async extractTextONNX(imageFile: File | string): Promise<OCRResult> {
    if (!this.onnxSession) {
      throw new Error('ONNX session not initialized');
    }

    // Preprocess image for ONNX model
    const imageData = await this.preprocessImageForONNX(imageFile);
    
    // Run inference
    const feeds = { input: new Tensor('float32', imageData.data, imageData.dims) };
    const results = await this.onnxSession.run(feeds);
    
    // Process ONNX output
    return this.processONNXOutput(results);
  }

  private async preprocessImageForONNX(imageFile: File | string): Promise<{ data: Float32Array; dims: number[] }> {
    // Create canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Load image
    const img = new Image();
    if (imageFile instanceof File) {
      img.src = URL.createObjectURL(imageFile);
    } else {
      img.src = imageFile;
    }
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Resize to model input size (e.g., 224x224)
    const targetSize = 224;
    canvas.width = targetSize;
    canvas.height = targetSize;
    
    ctx.drawImage(img, 0, 0, targetSize, targetSize);
    
    // Get image data and normalize
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    const data = new Float32Array(3 * targetSize * targetSize);
    
    // Convert RGBA to RGB and normalize to [0,1]
    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = i / 4;
      data[pixelIndex] = imageData.data[i] / 255.0; // R
      data[pixelIndex + targetSize * targetSize] = imageData.data[i + 1] / 255.0; // G
      data[pixelIndex + 2 * targetSize * targetSize] = imageData.data[i + 2] / 255.0; // B
    }
    
    return {
      data,
      dims: [1, 3, targetSize, targetSize]
    };
  }

  private processONNXOutput(results: any): OCRResult {
    // Process ONNX model output (simplified)
    // In a real implementation, this would decode the model's specific output format
    const outputTensor = results.output;
    const outputData = outputTensor.data;
    
    // Mock processing - replace with actual model output parsing
    return {
      text: 'ONNX OCR Result',
      confidence: 0.9,
      words: []
    };
  }

  private async extractTextLocal(imageFile: File | string): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const result = await this.worker!.recognize(imageFile);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      }))
    };
  }

  private async extractTextCloud(imageFile: File | string): Promise<OCRResult> {
    // Fallback to cloud OCR service (Google Vision API)
    const formData = new FormData();
    if (imageFile instanceof File) {
      formData.append('image', imageFile);
    }

    const response = await fetch('/api/ocr/extract', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Cloud OCR failed');
    }

    return await response.json();
  }

  async extractReceiptData(imageFile: File): Promise<{
    vendor: string;
    amount: number;
    date: string;
    items: string[];
    summary?: string;
    keyPoints?: string[];
    tags?: string[];
  }> {
    const ocrResult = await this.extractText(imageFile);
    const basicData = this.parseReceiptText(ocrResult.text);
    
    try {
      // Get AI summary and classification
      const [summaryResult, classificationResult] = await Promise.all([
        aiSummarizer.summarizeReceipt(ocrResult.text),
        documentClassifier.classifyDocument(ocrResult.text)
      ]);
      
      return {
        ...basicData,
        summary: summaryResult.summary,
        keyPoints: summaryResult.keyPoints,
        tags: classificationResult.tags
      };
    } catch (error) {
      console.warn('AI enhancement failed, returning basic data:', error);
      return basicData;
    }
  }

  private parseReceiptText(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract amount (look for currency patterns)
    const amountMatch = text.match(/\$?(\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract date (various formats)
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract vendor (usually first meaningful line)
    const vendor = lines.find(line => 
      line.length > 3 && 
      !line.match(/^\d/) && 
      !line.includes('$')
    ) || '';

    // Extract items (lines with prices)
    const items = lines.filter(line => 
      line.includes('$') || 
      line.match(/\d+\.?\d*/)
    );

    return { vendor, amount, date, items };
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    
    // Cleanup AI optimizer
    await aiOptimizer.dispose();
    
    this.isInitialized = false;
    console.log('OCR service cleanup completed');
  }
}

export const ocrService = new OCRService();