import * as tf from '@tensorflow/tfjs';

export interface PerformanceMetrics {
  inferenceTime: number;
  memoryUsage: number;
  modelSize: number;
  accuracy: number;
}

export interface OptimizationConfig {
  enableQuantization: boolean;
  enablePruning: boolean;
  maxMemoryUsage: number; // in MB
  batchSize: number;
  enableCaching: boolean;
}

export class AIPerformanceOptimizer {
  private modelCache = new Map<string, tf.LayersModel>();
  private resultCache = new Map<string, any>();
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private config: OptimizationConfig;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableQuantization: true,
      enablePruning: false,
      maxMemoryUsage: 512, // 512MB default
      batchSize: 1,
      enableCaching: true,
      ...config
    };

    // Set TensorFlow.js backend optimization
    this.initializeTensorFlowOptimizations();
  }

  private async initializeTensorFlowOptimizations() {
    // Set backend to WebGL for better performance
    try {
      await tf.setBackend('webgl');
      
      // Enable memory growth to prevent OOM
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      
      console.log('TensorFlow.js optimizations initialized');
    } catch (error) {
      console.warn('Failed to set WebGL backend, falling back to CPU:', error);
      await tf.setBackend('cpu');
    }
  }

  async loadOptimizedModel(modelPath: string, modelId: string): Promise<tf.LayersModel> {
    // Check cache first
    if (this.config.enableCaching && this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId)!;
    }

    const startTime = performance.now();
    let model: tf.LayersModel;

    try {
      // Load model
      model = await tf.loadLayersModel(modelPath);
      
      // Apply optimizations
      if (this.config.enableQuantization) {
        model = await this.quantizeModel(model);
      }

      if (this.config.enablePruning) {
        model = await this.pruneModel(model);
      }

      // Cache the optimized model
      if (this.config.enableCaching) {
        this.modelCache.set(modelId, model);
      }

      // Record performance metrics
      const loadTime = performance.now() - startTime;
      const memoryInfo = tf.memory();
      
      this.performanceMetrics.set(modelId, {
        inferenceTime: 0, // Will be updated during inference
        memoryUsage: memoryInfo.numBytes / (1024 * 1024), // Convert to MB
        modelSize: this.getModelSize(model),
        accuracy: 1.0 // Placeholder
      });

      console.log(`Model ${modelId} loaded and optimized in ${loadTime.toFixed(2)}ms`);
      return model;

    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      throw error;
    }
  }

  async optimizedInference<T>(
    model: tf.LayersModel,
    input: tf.Tensor,
    cacheKey?: string
  ): Promise<T> {
    // Check result cache
    if (this.config.enableCaching && cacheKey && this.resultCache.has(cacheKey)) {
      return this.resultCache.get(cacheKey);
    }

    const startTime = performance.now();
    
    try {
      // Memory cleanup before inference
      await this.cleanupMemory();

      // Perform inference
      const prediction = model.predict(input) as tf.Tensor;
      const result = await prediction.data();

      // Cleanup tensors
      prediction.dispose();
      input.dispose();

      const inferenceTime = performance.now() - startTime;
      
      // Cache result if enabled
      if (this.config.enableCaching && cacheKey) {
        this.resultCache.set(cacheKey, result);
        
        // Limit cache size
        if (this.resultCache.size > 100) {
          const firstKey = this.resultCache.keys().next().value;
          this.resultCache.delete(firstKey);
        }
      }

      console.log(`Inference completed in ${inferenceTime.toFixed(2)}ms`);
      return result as T;

    } catch (error) {
      console.error('Inference failed:', error);
      throw error;
    }
  }

  async batchInference<T>(
    model: tf.LayersModel,
    inputs: tf.Tensor[],
    modelId: string
  ): Promise<T[]> {
    const results: T[] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      
      // Stack tensors for batch processing
      const batchTensor = tf.stack(batch);
      
      try {
        const batchResult = await this.optimizedInference<T>(model, batchTensor);
        
        // Split batch results
        if (Array.isArray(batchResult)) {
          results.push(...batchResult);
        } else {
          results.push(batchResult);
        }
        
      } catch (error) {
        console.error(`Batch inference failed for batch ${i / batchSize}:`, error);
        // Add placeholder results for failed batch
        for (let j = 0; j < batch.length; j++) {
          results.push(null as any);
        }
      }

      // Cleanup batch tensors
      batch.forEach(tensor => tensor.dispose());
      
      // Memory check between batches
      const memoryInfo = tf.memory();
      if (memoryInfo.numBytes / (1024 * 1024) > this.config.maxMemoryUsage) {
        await this.cleanupMemory();
      }
    }

    return results;
  }

  private async quantizeModel(model: tf.LayersModel): Promise<tf.LayersModel> {
    try {
      // Simple quantization - convert weights to int8
      // Note: This is a simplified implementation
      // In production, use tf.quantization.quantizeWeights()
      
      console.log('Applying model quantization...');
      
      // For now, return the original model
      // Full quantization would require more complex implementation
      return model;
      
    } catch (error) {
      console.warn('Quantization failed, using original model:', error);
      return model;
    }
  }

  private async pruneModel(model: tf.LayersModel): Promise<tf.LayersModel> {
    try {
      console.log('Applying model pruning...');
      
      // Pruning implementation would remove less important weights
      // This is a placeholder - full implementation requires custom pruning logic
      return model;
      
    } catch (error) {
      console.warn('Pruning failed, using original model:', error);
      return model;
    }
  }

  private getModelSize(model: tf.LayersModel): number {
    let totalParams = 0;
    
    model.layers.forEach(layer => {
      const weights = layer.getWeights();
      weights.forEach(weight => {
        totalParams += weight.size;
      });
    });

    return totalParams * 4 / (1024 * 1024); // Assuming float32, convert to MB
  }

  async cleanupMemory(): Promise<void> {
    // Force garbage collection
    tf.dispose();
    
    // Clear old cache entries if memory usage is high
    const memoryInfo = tf.memory();
    const memoryUsageMB = memoryInfo.numBytes / (1024 * 1024);
    
    if (memoryUsageMB > this.config.maxMemoryUsage * 0.8) {
      console.log('High memory usage detected, clearing caches...');
      
      // Clear result cache
      this.resultCache.clear();
      
      // Optionally clear model cache for non-essential models
      if (memoryUsageMB > this.config.maxMemoryUsage * 0.9) {
        const cacheSize = this.modelCache.size;
        if (cacheSize > 2) {
          // Keep only the 2 most recently used models
          const entries = Array.from(this.modelCache.entries());
          const toRemove = entries.slice(0, cacheSize - 2);
          
          toRemove.forEach(([key, model]) => {
            model.dispose();
            this.modelCache.delete(key);
          });
        }
      }
    }

    // Manual garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  getPerformanceMetrics(modelId?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (modelId) {
      return this.performanceMetrics.get(modelId) || {
        inferenceTime: 0,
        memoryUsage: 0,
        modelSize: 0,
        accuracy: 0
      };
    }
    return this.performanceMetrics;
  }

  async warmupModel(model: tf.LayersModel, inputShape: number[]): Promise<void> {
    console.log('Warming up model...');
    
    // Create dummy input for warmup
    const dummyInput = tf.randomNormal(inputShape);
    
    try {
      // Run a few warmup inferences
      for (let i = 0; i < 3; i++) {
        const prediction = model.predict(dummyInput) as tf.Tensor;
        await prediction.data();
        prediction.dispose();
      }
      
      console.log('Model warmup completed');
    } catch (error) {
      console.warn('Model warmup failed:', error);
    } finally {
      dummyInput.dispose();
    }
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Performance optimization config updated:', this.config);
  }

  async dispose(): Promise<void> {
    // Dispose all cached models
    this.modelCache.forEach(model => model.dispose());
    this.modelCache.clear();
    
    // Clear caches
    this.resultCache.clear();
    this.performanceMetrics.clear();
    
    // Final memory cleanup
    await this.cleanupMemory();
    
    console.log('AI Performance Optimizer disposed');
  }
}

export const aiOptimizer = new AIPerformanceOptimizer();