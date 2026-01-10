import { performanceMonitor } from './performance-monitor';

export interface BatchJob<T> {
  id: string;
  items: T[];
  processor: (batch: T[]) => Promise<any[]>;
  batchSize: number;
  maxConcurrency: number;
}

export interface BatchResult<T> {
  processed: number;
  failed: number;
  results: T[];
  errors: Error[];
  duration: number;
}

export class BatchProcessor {
  async processBatch<T, R>(job: BatchJob<T>): Promise<BatchResult<R>> {
    const operationId = `batch-${job.id}-${Date.now()}`;
    performanceMonitor.startOperation(operationId, `batch-process-${job.id}`);

    const startTime = Date.now();
    const results: R[] = [];
    const errors: Error[] = [];
    let processed = 0;
    let failed = 0;

    try {
      const batches = this.createBatches(job.items, job.batchSize);
      const semaphore = new Semaphore(job.maxConcurrency);

      const batchPromises = batches.map(async (batch, index) => {
        await semaphore.acquire();
        try {
          const batchResults = await job.processor(batch);
          results.push(...batchResults);
          processed += batch.length;
        } catch (error) {
          errors.push(error as Error);
          failed += batch.length;
        } finally {
          semaphore.release();
        }
      });

      await Promise.all(batchPromises);

      const duration = Date.now() - startTime;
      performanceMonitor.endOperation(operationId, `batch-process-${job.id}`, errors.length === 0, job.items.length);

      return { processed, failed, results, errors, duration };
    } catch (error) {
      performanceMonitor.endOperation(operationId, `batch-process-${job.id}`, false, job.items.length);
      throw error;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

export const batchProcessor = new BatchProcessor();