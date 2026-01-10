import * as tf from '@tensorflow/tfjs';

export type DocumentType = 'receipt' | 'invoice' | 'contract' | 'memo' | 'report' | 'other';

export interface ClassificationResult {
  type: DocumentType;
  confidence: number;
  tags: string[];
}

export class DocumentClassifier {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load pre-trained model for document classification
      this.model = await tf.loadLayersModel('/models/document-classifier.json');
      this.isInitialized = true;
    } catch (error) {
      console.warn('Local model loading failed:', error);
    }
  }

  async classifyDocument(text: string, fileName?: string): Promise<ClassificationResult> {
    try {
      return await this.classifyLocal(text, fileName);
    } catch (error) {
      console.warn('Local classification failed, using cloud fallback:', error);
      return await this.classifyCloud(text, fileName);
    }
  }

  private async classifyLocal(text: string, fileName?: string): Promise<ClassificationResult> {
    if (!this.model) {
      return this.classifyRuleBased(text, fileName);
    }

    // Preprocess text for model input
    const features = this.extractFeatures(text);
    const prediction = this.model.predict(tf.tensor2d([features])) as tf.Tensor;
    const probabilities = await prediction.data();

    const types: DocumentType[] = ['receipt', 'invoice', 'contract', 'memo', 'report', 'other'];
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    
    return {
      type: types[maxIndex],
      confidence: probabilities[maxIndex],
      tags: this.generateTags(text, types[maxIndex])
    };
  }

  private classifyRuleBased(text: string, fileName?: string): ClassificationResult {
    const lowerText = text.toLowerCase();
    const lowerFileName = fileName?.toLowerCase() || '';

    // Receipt indicators
    if (lowerText.includes('receipt') || 
        lowerText.includes('total') || 
        lowerText.includes('tax') ||
        lowerFileName.includes('receipt')) {
      return {
        type: 'receipt',
        confidence: 0.8,
        tags: this.generateTags(text, 'receipt')
      };
    }

    // Invoice indicators
    if (lowerText.includes('invoice') || 
        lowerText.includes('bill to') || 
        lowerText.includes('due date') ||
        lowerFileName.includes('invoice')) {
      return {
        type: 'invoice',
        confidence: 0.8,
        tags: this.generateTags(text, 'invoice')
      };
    }

    // Contract indicators
    if (lowerText.includes('agreement') || 
        lowerText.includes('contract') || 
        lowerText.includes('terms and conditions')) {
      return {
        type: 'contract',
        confidence: 0.7,
        tags: this.generateTags(text, 'contract')
      };
    }

    // Memo indicators
    if (lowerText.includes('memo') || 
        lowerText.includes('memorandum') || 
        lowerFileName.includes('memo')) {
      return {
        type: 'memo',
        confidence: 0.7,
        tags: this.generateTags(text, 'memo')
      };
    }

    return {
      type: 'other',
      confidence: 0.5,
      tags: this.generateTags(text, 'other')
    };
  }

  private async classifyCloud(text: string, fileName?: string): Promise<ClassificationResult> {
    const response = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileName })
    });

    if (!response.ok) {
      throw new Error('Cloud classification failed');
    }

    return await response.json();
  }

  private extractFeatures(text: string): number[] {
    // Simple feature extraction for ML model
    const features = new Array(100).fill(0);
    
    const keywords = [
      'receipt', 'invoice', 'total', 'tax', 'amount', 'date',
      'contract', 'agreement', 'memo', 'report', 'summary'
    ];

    keywords.forEach((keyword, index) => {
      const count = (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      features[index] = Math.min(count / 10, 1); // Normalize
    });

    // Text length feature
    features[50] = Math.min(text.length / 1000, 1);
    
    // Number of lines
    features[51] = Math.min(text.split('\n').length / 50, 1);

    return features;
  }

  private generateTags(text: string, type: DocumentType): string[] {
    const tags: string[] = [type];
    const lowerText = text.toLowerCase();

    // Common tags based on content
    if (lowerText.includes('urgent')) tags.push('urgent');
    if (lowerText.includes('confidential')) tags.push('confidential');
    if (lowerText.includes('draft')) tags.push('draft');
    if (lowerText.includes('final')) tags.push('final');

    // Date-based tags
    const currentYear = new Date().getFullYear();
    if (lowerText.includes(currentYear.toString())) tags.push('current-year');

    // Amount-based tags
    if (lowerText.match(/\$\d+/)) tags.push('financial');

    return tags;
  }

  async smartTag(text: string, existingTags: string[] = []): Promise<string[]> {
    const classification = await this.classifyDocument(text);
    const newTags = [...existingTags, ...classification.tags];
    
    // Remove duplicates and return
    return [...new Set(newTags)];
  }
}

export const documentClassifier = new DocumentClassifier();