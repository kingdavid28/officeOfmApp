import * as tf from '@tensorflow/tfjs';
import { platformAdapter } from './react-native-adapter';

export interface OptimizedModel {
  model: tf.LayersModel;
  metadata: {
    version: string;
    size: number;
    accuracy: number;
    lastUpdated: number;
  };
}

export class OptimizedAIService {
  private models: Map<string, OptimizedModel> = new Map();
  private modelCache: Map<string, any> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set backend for optimal performance
      if (platformAdapter.isMobile) {
        await tf.setBackend('rn-webgl');
      } else {
        await tf.setBackend('webgl');
      }

      // Load compressed models
      await this.loadOptimizedModels();
      this.isInitialized = true;
    } catch (error) {
      console.warn('AI service initialization failed:', error);
    }
  }

  private async loadOptimizedModels() {
    const modelConfigs = [
      {
        name: 'document-classifier',
        url: '/models/document-classifier-quantized.json',
        fallbackUrl: '/models/document-classifier-lite.json'
      },
      {
        name: 'receipt-extractor',
        url: '/models/receipt-extractor-quantized.json',
        fallbackUrl: '/models/receipt-extractor-lite.json'
      }
    ];

    for (const config of modelConfigs) {
      try {
        await this.loadModel(config.name, config.url, config.fallbackUrl);
      } catch (error) {
        console.warn(`Failed to load model ${config.name}:`, error);
      }
    }
  }

  private async loadModel(name: string, primaryUrl: string, fallbackUrl: string) {
    try {
      // Try to load from cache first
      const cachedModel = await this.getCachedModel(name);
      if (cachedModel) {
        this.models.set(name, cachedModel);
        return;
      }

      // Load primary model
      let model: tf.LayersModel;
      try {
        model = await tf.loadLayersModel(primaryUrl);
      } catch {
        // Fallback to lighter model
        model = await tf.loadLayersModel(fallbackUrl);
      }

      // Quantize model for better performance
      const quantizedModel = await this.quantizeModel(model);

      const optimizedModel: OptimizedModel = {
        model: quantizedModel,
        metadata: {
          version: '1.0',
          size: this.getModelSize(quantizedModel),
          accuracy: 0.85, // Mock accuracy
          lastUpdated: Date.now()
        }
      };

      this.models.set(name, optimizedModel);
      await this.cacheModel(name, optimizedModel);
    } catch (error) {
      throw new Error(`Failed to load model ${name}: ${error}`);
    }
  }

  private async quantizeModel(model: tf.LayersModel): Promise<tf.LayersModel> {
    // Apply post-training quantization for mobile optimization
    const quantizedModel = await tf.quantization.quantize(model, {
      quantizationBytes: 1 // 8-bit quantization
    });
    
    return quantizedModel;
  }

  private getModelSize(model: tf.LayersModel): number {
    return model.getWeights().reduce((total, weight) => {
      return total + weight.size * 4; // 4 bytes per float32
    }, 0);
  }

  private async getCachedModel(name: string): Promise<OptimizedModel | null> {
    try {
      const cached = await platformAdapter.storage.getItem(`model_${name}`);
      if (cached) {
        const modelData = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - modelData.metadata.lastUpdated < 24 * 60 * 60 * 1000) {
          const model = await tf.loadLayersModel(`indexeddb://model_${name}`);
          return { ...modelData, model };
        }
      }
    } catch (error) {
      console.warn('Failed to load cached model:', error);
    }
    return null;
  }

  private async cacheModel(name: string, optimizedModel: OptimizedModel) {
    try {
      // Save model to IndexedDB
      await optimizedModel.model.save(`indexeddb://model_${name}`);
      
      // Save metadata
      await platformAdapter.storage.setItem(
        `model_${name}`,
        JSON.stringify({ metadata: optimizedModel.metadata })
      );
    } catch (error) {
      console.warn('Failed to cache model:', error);
    }
  }

  async classifyDocument(text: string, fileName?: string): Promise<any> {
    const cacheKey = `classify_${this.hashString(text)}`;
    
    // Check cache first
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey);
    }

    const model = this.models.get('document-classifier');
    if (!model) {
      throw new Error('Document classifier not loaded');
    }

    try {
      // Preprocess text efficiently
      const features = this.extractFeaturesOptimized(text);
      const inputTensor = tf.tensor2d([features]);
      
      // Run inference
      const prediction = model.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Cleanup tensors
      inputTensor.dispose();
      prediction.dispose();

      const result = this.processClassificationResult(probabilities, text);
      
      // Cache result
      this.modelCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new Error(`Classification failed: ${error}`);
    }
  }

  async extractReceiptData(imageFile: File): Promise<any> {
    const model = this.models.get('receipt-extractor');
    if (!model) {
      throw new Error('Receipt extractor not loaded');
    }

    try {
      // Preprocess image
      const imageTensor = await this.preprocessImage(imageFile);
      
      // Run inference
      const prediction = model.model.predict(imageTensor) as tf.Tensor;
      const result = await prediction.data();
      
      // Cleanup
      imageTensor.dispose();
      prediction.dispose();

      return this.processReceiptResult(result);
    } catch (error) {
      throw new Error(`Receipt extraction failed: ${error}`);
    }
  }

  private extractFeaturesOptimized(text: string): number[] {
    // Optimized feature extraction with reduced dimensionality
    const features = new Array(50).fill(0); // Reduced from 100
    
    const keywords = [
      'receipt', 'invoice', 'total', 'tax', 'amount', 'date',
      'contract', 'agreement', 'memo', 'report', 'summary'
    ];

    // Vectorized keyword matching
    const lowerText = text.toLowerCase();
    keywords.forEach((keyword, index) => {
      const matches = lowerText.split(keyword).length - 1;
      features[index] = Math.min(matches / 5, 1); // Normalize
    });

    // Additional optimized features
    features[25] = Math.min(text.length / 2000, 1);
    features[26] = Math.min(text.split('\n').length / 100, 1);

    return features;
  }

  private async preprocessImage(imageFile: File): Promise<tf.Tensor> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Resize for efficiency
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(img, 0, 0, 224, 224);
        
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const tensor = tf.browser.fromPixels(imageData)
          .expandDims(0)
          .div(255.0); // Normalize
        
        resolve(tensor);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  }

  private processClassificationResult(probabilities: Float32Array, text: string) {
    const types = ['receipt', 'invoice', 'contract', 'memo', 'report', 'other'];
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    
    return {
      type: types[maxIndex],
      confidence: probabilities[maxIndex],
      tags: this.generateSmartTags(text, types[maxIndex])
    };
  }

  private processReceiptResult(result: Float32Array) {
    // Process receipt extraction result
    return {
      vendor: 'Extracted Vendor',
      amount: result[0] * 1000, // Mock processing
      date: new Date().toISOString(),
      items: []
    };
  }

  private generateSmartTags(text: string, type: string): string[] {
    const tags = [type];
    const lowerText = text.toLowerCase();

    // Efficient tag generation
    const tagRules = [
      { pattern: /urgent|priority/i, tag: 'urgent' },
      { pattern: /confidential|private/i, tag: 'confidential' },
      { pattern: /draft|preliminary/i, tag: 'draft' },
      { pattern: /final|approved/i, tag: 'final' },
      { pattern: /\$\d+/i, tag: 'financial' }
    ];

    tagRules.forEach(rule => {
      if (rule.pattern.test(text)) {
        tags.push(rule.tag);
      }
    });

    return [...new Set(tags)];
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  getModelInfo() {
    const info: any = {};
    this.models.forEach((model, name) => {
      info[name] = {
        size: `${(model.metadata.size / 1024 / 1024).toFixed(2)} MB`,
        accuracy: `${(model.metadata.accuracy * 100).toFixed(1)}%`,
        version: model.metadata.version
      };
    });
    return info;
  }

  clearCache() {
    this.modelCache.clear();
  }
}

export const optimizedAI = new OptimizedAIService();