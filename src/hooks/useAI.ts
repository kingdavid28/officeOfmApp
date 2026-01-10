import { useState, useCallback, useEffect } from 'react';
import { ocrService } from '../lib/ocr';
import { aiSummarizer } from '../lib/ai-summarizer';
import { documentClassifier } from '../lib/classification';
import { automationService } from '../lib/automation';

export interface AIProcessingResult {
  text?: string;
  summary?: string;
  keyPoints?: string[];
  tags?: string[];
  extractedData?: any;
  confidence?: number;
}

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize AI services
    const initializeServices = async () => {
      try {
        await Promise.all([
          ocrService.initialize(),
          aiSummarizer.initialize(),
          documentClassifier.initialize(),
          automationService.initialize()
        ]);
      } catch (err) {
        console.warn('Some AI services failed to initialize:', err);
      }
    };

    initializeServices();
  }, []);

  const processReceipt = useCallback(async (imageFile: File): Promise<AIProcessingResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await ocrService.extractReceiptData(imageFile);
      return {
        text: result.vendor,
        summary: result.summary,
        keyPoints: result.keyPoints,
        tags: result.tags,
        extractedData: {
          vendor: result.vendor,
          amount: result.amount,
          date: result.date,
          items: result.items
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processDocument = useCallback(async (file: File): Promise<AIProcessingResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Extract text from document (simplified - would need proper document parsing)
      const text = await file.text();
      
      const [summaryResult, classificationResult] = await Promise.all([
        aiSummarizer.summarizeDocument(text),
        documentClassifier.classifyDocument(text, file.name)
      ]);

      return {
        text,
        summary: summaryResult.summary,
        keyPoints: summaryResult.keyPoints,
        tags: classificationResult.tags,
        confidence: Math.min(summaryResult.confidence, classificationResult.confidence)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Document processing failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const smartTag = useCallback(async (text: string, existingTags: string[] = []): Promise<string[]> => {
    try {
      return await documentClassifier.smartTag(text, existingTags);
    } catch (err) {
      console.warn('Smart tagging failed:', err);
      return existingTags;
    }
  }, []);

  return {
    isProcessing,
    error,
    processReceipt,
    processDocument,
    smartTag
  };
}