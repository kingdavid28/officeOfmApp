import * as tf from '@tensorflow/tfjs';

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  confidence: number;
  extractedData?: {
    vendor?: string;
    amount?: number;
    date?: string;
    items?: string[];
    category?: string;
  };
}

export class AISummarizer {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Try to load local summarization model
      this.model = await tf.loadLayersModel('/models/text-summarizer.json');
      this.isInitialized = true;
    } catch (error) {
      console.warn('Local AI model loading failed, will use rule-based fallback:', error);
      this.isInitialized = true;
    }
  }

  async summarizeReceipt(text: string, imageUrl?: string): Promise<SummaryResult> {
    try {
      return await this.summarizeLocal(text, 'receipt');
    } catch (error) {
      console.warn('Local summarization failed, using cloud fallback:', error);
      return await this.summarizeCloud(text, 'receipt', imageUrl);
    }
  }

  async summarizeDocument(text: string, documentType: string = 'document'): Promise<SummaryResult> {
    try {
      return await this.summarizeLocal(text, documentType);
    } catch (error) {
      console.warn('Local summarization failed, using cloud fallback:', error);
      return await this.summarizeCloud(text, documentType);
    }
  }

  private async summarizeLocal(text: string, type: string): Promise<SummaryResult> {
    if (!this.model) {
      return this.summarizeRuleBased(text, type);
    }

    // Use ML model for summarization
    const features = this.extractTextFeatures(text);
    const prediction = this.model.predict(tf.tensor2d([features])) as tf.Tensor;
    const result = await prediction.data();

    // Convert model output to summary (simplified)
    const summary = this.generateSummaryFromFeatures(text, type);
    const keyPoints = this.extractKeyPoints(text, type);
    const extractedData = type === 'receipt' ? this.extractReceiptData(text) : undefined;

    return {
      summary,
      keyPoints,
      confidence: Math.max(...result),
      extractedData
    };
  }

  private summarizeRuleBased(text: string, type: string): SummaryResult {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (type === 'receipt') {
      return this.summarizeReceiptRuleBased(text, lines);
    }
    
    return this.summarizeDocumentRuleBased(text, lines);
  }

  private summarizeReceiptRuleBased(text: string, lines: string[]): SummaryResult {
    const extractedData = this.extractReceiptData(text);
    
    const summary = `Receipt from ${extractedData.vendor || 'Unknown vendor'} ` +
      `for ₱${extractedData.amount?.toFixed(2) || '0.00'} ` +
      `on ${extractedData.date || 'unknown date'}. ` +
      `${extractedData.items?.length || 0} items purchased.`;

    const keyPoints = [
      `Vendor: ${extractedData.vendor || 'Not identified'}`,
      `Amount: ₱${extractedData.amount?.toFixed(2) || '0.00'}`,
      `Date: ${extractedData.date || 'Not found'}`,
      `Items: ${extractedData.items?.length || 0} items`
    ];

    if (extractedData.category) {
      keyPoints.push(`Category: ${extractedData.category}`);
    }

    return {
      summary,
      keyPoints,
      confidence: 0.8,
      extractedData
    };
  }

  private summarizeDocumentRuleBased(text: string, lines: string[]): SummaryResult {
    const wordCount = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    // Extract first few sentences as summary
    const summaryLength = Math.min(3, sentences.length);
    const summary = sentences.slice(0, summaryLength).join('. ').trim() + '.';

    // Extract key points from document structure
    const keyPoints = this.extractDocumentKeyPoints(text, lines);

    return {
      summary,
      keyPoints,
      confidence: 0.7
    };
  }

  private extractReceiptData(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract vendor (usually first meaningful line)
    const vendor = lines.find(line => 
      line.length > 3 && 
      !line.match(/^\d/) && 
      !line.includes('$') &&
      !line.includes('₱') &&
      !line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
    ) || '';

    // Extract amount
    const amountMatch = text.match(/₱?(\d+\.?\d*)|(\d+\.?\d*)\s*₱/);
    const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : 0;

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract items (lines that might contain products/services)
    const items = lines.filter(line => {
      const hasPrice = line.match(/₱?\d+\.?\d*/) && !line.match(/^\d{1,2}[\/\-]/);
      const isNotHeader = !line.toLowerCase().includes('receipt') && 
                         !line.toLowerCase().includes('total') &&
                         !line.toLowerCase().includes('tax');
      return hasPrice && isNotHeader && line.length > 3;
    });

    // Determine category based on vendor or items
    let category = 'Other';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restaurant') || lowerText.includes('food')) category = 'Meals & Entertainment';
    else if (lowerText.includes('office') || lowerText.includes('supplies')) category = 'Office Supplies';
    else if (lowerText.includes('transport') || lowerText.includes('taxi')) category = 'Transportation';
    else if (lowerText.includes('utility') || lowerText.includes('electric')) category = 'Utilities';

    return { vendor, amount, date, items, category };
  }

  private extractDocumentKeyPoints(text: string, lines: string[]): string[] {
    const keyPoints: string[] = [];
    
    // Look for numbered lists or bullet points
    const listItems = lines.filter(line => 
      line.match(/^\d+\./) || 
      line.match(/^[-•*]/) ||
      line.match(/^[A-Z][a-z]+:/)
    );

    if (listItems.length > 0) {
      keyPoints.push(...listItems.slice(0, 5).map(item => item.replace(/^[-•*\d.]\s*/, '')));
    } else {
      // Extract sentences with important keywords
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      const importantSentences = sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        return lower.includes('important') || 
               lower.includes('required') || 
               lower.includes('must') ||
               lower.includes('deadline') ||
               lower.includes('action');
      });

      keyPoints.push(...importantSentences.slice(0, 3));
    }

    // If no key points found, use first few non-empty lines
    if (keyPoints.length === 0) {
      keyPoints.push(...lines.slice(0, 3).filter(line => line.length > 10));
    }

    return keyPoints;
  }

  private extractTextFeatures(text: string): number[] {
    const features = new Array(50).fill(0);
    
    // Basic text statistics
    features[0] = Math.min(text.length / 1000, 1);
    features[1] = Math.min(text.split(' ').length / 500, 1);
    features[2] = Math.min(text.split('\n').length / 50, 1);
    
    // Keyword presence
    const keywords = [
      'receipt', 'total', 'amount', 'date', 'vendor', 'tax',
      'invoice', 'bill', 'payment', 'purchase', 'transaction'
    ];
    
    keywords.forEach((keyword, index) => {
      const count = (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      features[index + 3] = Math.min(count / 5, 1);
    });

    return features;
  }

  private generateSummaryFromFeatures(text: string, type: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const maxSentences = type === 'receipt' ? 2 : 3;
    
    return sentences.slice(0, maxSentences).join('. ').trim() + '.';
  }

  private async summarizeCloud(text: string, type: string, imageUrl?: string): Promise<SummaryResult> {
    const payload: any = { text, type };
    if (imageUrl) payload.imageUrl = imageUrl;

    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Cloud summarization failed');
    }

    return await response.json();
  }

  async batchSummarize(documents: Array<{ text: string; type: string; id: string }>): Promise<Map<string, SummaryResult>> {
    const results = new Map<string, SummaryResult>();
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async doc => {
        try {
          const result = await this.summarizeDocument(doc.text, doc.type);
          return { id: doc.id, result };
        } catch (error) {
          console.error(`Failed to summarize document ${doc.id}:`, error);
          return { 
            id: doc.id, 
            result: { 
              summary: 'Failed to generate summary', 
              keyPoints: [], 
              confidence: 0 
            } 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });

      // Small delay between batches to prevent overwhelming
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

export const aiSummarizer = new AISummarizer();