export interface PerformanceMetrics {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  memoryUsage?: number;
  batchSize?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private activeOperations: Map<string, number> = new Map();

  startOperation(operationId: string, operation: string): void {
    this.activeOperations.set(operationId, performance.now());
  }

  endOperation(operationId: string, operation: string, success: boolean = true, batchSize?: number): void {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    this.activeOperations.delete(operationId);

    this.metrics.push({
      timestamp: new Date(),
      operation,
      duration,
      success,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      batchSize
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    return operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
  }

  getAveragePerformance(operation: string): { avgDuration: number; successRate: number } {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return { avgDuration: 0, successRate: 0 };

    const avgDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length;
    const successRate = operationMetrics.filter(m => m.success).length / operationMetrics.length;

    return { avgDuration, successRate };
  }
}

export const performanceMonitor = new PerformanceMonitor();