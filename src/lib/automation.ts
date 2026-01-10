import cron from 'node-cron';
import { exportService } from './export';
import { crudService } from './crud';
import { UserRole } from './auth';
import { performanceMonitor } from './performance-monitor';
import { batchProcessor } from './batch-processor';

export interface AutomationTask {
  id: string;
  name: string;
  schedule: string; // cron expression
  type: 'reminder' | 'export' | 'cleanup' | 'batch-process';
  config: Record<string, any>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class AutomationService {
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private notifications: Array<{ message: string; timestamp: Date; type: string }> = [];

  async initialize() {
    // Schedule default weekly tasks
    await this.scheduleWeeklyTasks();
    
    // Schedule daily cleanup
    this.scheduleTask({
      id: 'daily-cleanup',
      name: 'Daily Cleanup',
      schedule: '0 2 * * *', // 2 AM daily
      type: 'cleanup',
      config: { retentionDays: 30 },
      enabled: true
    });
  }

  private async scheduleWeeklyTasks() {
    // Weekly report generation
    this.scheduleTask({
      id: 'weekly-report',
      name: 'Weekly Report Generation',
      schedule: '0 9 * * 1', // Monday 9 AM
      type: 'export',
      config: { 
        exportType: 'weekly-summary',
        recipients: ['admin@province.ph']
      },
      enabled: true
    });

    // Weekly task reminders
    this.scheduleTask({
      id: 'weekly-reminders',
      name: 'Weekly Task Reminders',
      schedule: '0 10 * * 1', // Monday 10 AM
      type: 'reminder',
      config: { 
        reminderType: 'overdue-tasks',
        daysOverdue: 3
      },
      enabled: true
    });

    // Weekly batch processing
    this.scheduleTask({
      id: 'weekly-batch-process',
      name: 'Weekly Batch Processing',
      schedule: '0 1 * * 0', // Sunday 1 AM
      type: 'batch-process',
      config: {
        processType: 'document-classification',
        batchSize: 50
      },
      enabled: true
    });
  }

  scheduleTask(task: AutomationTask) {
    // Cancel existing task if it exists
    if (this.scheduledTasks.has(task.id)) {
      this.scheduledTasks.get(task.id)?.stop();
    }

    if (!task.enabled) return;

    const scheduledTask = cron.schedule(task.schedule, async () => {
      try {
        await this.executeTask(task);
        task.lastRun = new Date();
        this.addNotification(`Task "${task.name}" completed successfully`, 'success');
      } catch (error) {
        console.error(`Task ${task.name} failed:`, error);
        this.addNotification(`Task "${task.name}" failed: ${error}`, 'error');
      }
    }, {
      scheduled: false
    });

    this.scheduledTasks.set(task.id, scheduledTask);
    scheduledTask.start();

    // Calculate next run time
    task.nextRun = this.getNextRunTime(task.schedule);
  }

  private async executeTask(task: AutomationTask) {
    switch (task.type) {
      case 'reminder':
        await this.executeReminderTask(task);
        break;
      case 'export':
        await this.executeExportTask(task);
        break;
      case 'cleanup':
        await this.executeCleanupTask(task);
        break;
      case 'batch-process':
        await this.executeBatchProcessTask(task);
        break;
    }
  }

  private async executeReminderTask(task: AutomationTask) {
    const { reminderType, daysOverdue } = task.config;

    if (reminderType === 'overdue-tasks') {
      // Get overdue tasks
      const tasks = await crudService.getTasks('admin', 'system');
      const overdueTasks = tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        const daysDiff = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= daysOverdue && t.status !== 'completed';
      });

      if (overdueTasks.length > 0) {
        this.addNotification(
          `${overdueTasks.length} tasks are overdue by ${daysOverdue}+ days`,
          'warning'
        );
      }
    }
  }

  private async executeExportTask(task: AutomationTask) {
    const { exportType } = task.config;

    if (exportType === 'weekly-summary') {
      const tasksSummary = await exportService.generateTasksSummary('admin', 'system');
      const receiptsSummary = await exportService.generateReceiptsSummary('admin', 'system');
      
      const summary = {
        week: this.getCurrentWeek(),
        tasks: tasksSummary,
        receipts: receiptsSummary,
        generatedAt: new Date()
      };

      // Store summary or send via email
      this.addNotification('Weekly summary generated', 'info');
    }
  }

  private async executeCleanupTask(task: AutomationTask) {
    const { retentionDays } = task.config;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Clean up old notifications
    this.notifications = this.notifications.filter(
      n => n.timestamp > cutoffDate
    );

    this.addNotification(`Cleanup completed - removed data older than ${retentionDays} days`, 'info');
  }

  private async executeBatchProcessTask(task: AutomationTask) {
    const { processType, batchSize } = task.config;
    const operationId = `automation-${task.id}-${Date.now()}`;
    
    performanceMonitor.startOperation(operationId, `automation-${processType}`);

    try {
      if (processType === 'document-classification') {
        const files = await crudService.getFiles('admin', 'system');
        const unprocessedFiles = files.filter(f => !f.tags.includes('auto-classified'));

        const batchJob = {
          id: 'document-classification',
          items: unprocessedFiles,
          processor: async (batch: any[]) => {
            const results = [];
            for (const file of batch) {
              const newTags = [...file.tags, 'auto-classified'];
              await crudService.updateTask(file.id, { tags: newTags }, 'admin', 'system');
              results.push({ id: file.id, processed: true });
            }
            return results;
          },
          batchSize: batchSize || 10,
          maxConcurrency: 3
        };

        const result = await batchProcessor.processBatch(batchJob);
        performanceMonitor.endOperation(operationId, `automation-${processType}`, result.failed === 0, result.processed);
        
        this.addNotification(
          `Batch processed ${result.processed} files (${result.failed} failed) in ${result.duration}ms`, 
          result.failed === 0 ? 'info' : 'warning'
        );
      }
    } catch (error) {
      performanceMonitor.endOperation(operationId, `automation-${processType}`, false);
      throw error;
    }
  }

  private getNextRunTime(cronExpression: string): Date {
    // Simple next run calculation - in production, use a proper cron parser
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(nextRun.getHours() + 1); // Simplified
    return nextRun;
  }

  private getCurrentWeek(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber}`;
  }

  private addNotification(message: string, type: string) {
    this.notifications.push({
      message,
      timestamp: new Date(),
      type
    });

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }
  }

  getNotifications() {
    return this.notifications.slice().reverse(); // Most recent first
  }

  getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
  }

  getAutomationStats() {
    const metrics = performanceMonitor.getMetrics();
    const automationMetrics = metrics.filter(m => m.operation.startsWith('automation-'));
    
    return {
      totalOperations: automationMetrics.length,
      averageDuration: automationMetrics.reduce((sum, m) => sum + m.duration, 0) / automationMetrics.length || 0,
      successRate: automationMetrics.filter(m => m.success).length / automationMetrics.length || 0,
      lastRun: automationMetrics[automationMetrics.length - 1]?.timestamp
    };
  }

  stopTask(taskId: string) {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(taskId);
    }
  }

  stopAll() {
    this.scheduledTasks.forEach(task => task.stop());
    this.scheduledTasks.clear();
  }
}

export const automationService = new AutomationService();