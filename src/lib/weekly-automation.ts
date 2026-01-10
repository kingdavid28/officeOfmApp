import { automationService } from './automation';
import { aiSummarizer } from './ai-summarizer';
import { documentClassifier } from './classification';
import { exportService } from './export';
import { performanceMonitor } from './performance-monitor';
import { batchProcessor } from './batch-processor';

export interface WeeklyReport {
  week: string;
  documentsProcessed: number;
  receiptsProcessed: number;
  totalAmount: number;
  topCategories: Array<{ category: string; count: number; amount: number }>;
  aiInsights: {
    mostCommonTags: string[];
    averageConfidence: number;
    processingTime: number;
  };
  automationStats: {
    tasksCompleted: number;
    remindersSet: number;
    exportsTrigger: number;
  };
}

export class WeeklyAutomationService {
  private isRunning = false;
  private weeklyReports: WeeklyReport[] = [];

  async initialize() {
    // Schedule weekly automation tasks
    await this.scheduleWeeklyTasks();
    console.log('Weekly automation service initialized');
  }

  private async scheduleWeeklyTasks() {
    // Weekly batch processing - Sunday 2 AM
    automationService.scheduleTask({
      id: 'weekly-batch-ai-processing',
      name: 'Weekly AI Batch Processing',
      schedule: '0 2 * * 0', // Sunday 2 AM
      type: 'batch-process',
      config: {
        processType: 'ai-enhancement',
        batchSize: 100,
        includeOCR: true,
        includeSummarization: true,
        includeClassification: true
      },
      enabled: true
    });

    // Weekly report generation - Monday 8 AM
    automationService.scheduleTask({
      id: 'weekly-report-generation',
      name: 'Weekly Report Generation',
      schedule: '0 8 * * 1', // Monday 8 AM
      type: 'export',
      config: {
        exportType: 'weekly-ai-report',
        includeInsights: true,
        recipients: ['admin@province.ph']
      },
      enabled: true
    });

    // Weekly reminder cleanup - Friday 6 PM
    automationService.scheduleTask({
      id: 'weekly-reminder-cleanup',
      name: 'Weekly Reminder Cleanup',
      schedule: '0 18 * * 5', // Friday 6 PM
      type: 'reminder',
      config: {
        reminderType: 'weekly-summary',
        includeUpcoming: true,
        daysAhead: 7
      },
      enabled: true
    });
  }

  async runWeeklyBatchProcessing(): Promise<void> {
    if (this.isRunning) {
      console.log('Weekly batch processing already running');
      return;
    }

    this.isRunning = true;
    const operationId = `weekly-batch-${Date.now()}`;
    performanceMonitor.startOperation(operationId, 'weekly-batch-processing');

    try {
      console.log('Starting weekly AI batch processing...');

      const unprocessedDocs = await this.getUnprocessedDocuments();
      const unprocessedReceipts = await this.getUnprocessedReceipts();

      // Process documents using batch processor
      const docBatchJob = {
        id: 'weekly-documents',
        items: unprocessedDocs,
        processor: async (batch: any[]) => this.processBatchDocuments(batch),
        batchSize: 10,
        maxConcurrency: 3
      };

      const receiptBatchJob = {
        id: 'weekly-receipts', 
        items: unprocessedReceipts,
        processor: async (batch: any[]) => this.processBatchReceipts(batch),
        batchSize: 10,
        maxConcurrency: 3
      };

      const [docResults, receiptResults] = await Promise.all([
        batchProcessor.processBatch(docBatchJob),
        batchProcessor.processBatch(receiptBatchJob)
      ]);

      const totalProcessed = docResults.processed + receiptResults.processed;
      const totalFailed = docResults.failed + receiptResults.failed;
      const totalDuration = docResults.duration + receiptResults.duration;

      // Calculate average confidence from receipt results
      const confidenceValues = receiptResults.results
        .filter(r => r.success && r.confidence)
        .map(r => r.confidence);
      const averageConfidence = confidenceValues.length > 0 
        ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
        : 0.85;

      performanceMonitor.endOperation(operationId, 'weekly-batch-processing', totalFailed === 0, totalProcessed);

      console.log(`Weekly batch processing completed:
        - Total processed: ${totalProcessed}
        - Total failed: ${totalFailed}
        - Total duration: ${totalDuration}ms`);

      await this.generateWeeklyReport({
        documentsProcessed: docResults.processed,
        receiptsProcessed: receiptResults.processed,
        averageConfidence,
        processingTime: totalDuration
      });

    } catch (error) {
      performanceMonitor.endOperation(operationId, 'weekly-batch-processing', false);
      console.error('Weekly batch processing failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async processBatchDocuments(documents: any[]): Promise<any[]> {
    const results = [];
    const batchTexts = documents.map(doc => ({
      text: doc.content || doc.name,
      type: 'document',
      id: doc.id
    }));

    const summaryResults = await aiSummarizer.batchSummarize(batchTexts);
    
    for (const doc of documents) {
      try {
        const summaryResult = summaryResults.get(doc.id);
        const classificationResult = await documentClassifier.classifyDocument(
          doc.content || doc.name,
          doc.name
        );

        await this.updateDocumentWithAI(doc.id, {
          summary: summaryResult?.summary,
          keyPoints: summaryResult?.keyPoints,
          tags: classificationResult.tags,
          aiProcessed: true,
          confidence: Math.min(
            summaryResult?.confidence || 0,
            classificationResult.confidence
          )
        });

        results.push({ id: doc.id, success: true });
      } catch (error) {
        console.error(`Failed to process document ${doc.id}:`, error);
        results.push({ id: doc.id, success: false, error: error.message });
      }
    }

    return results;
  }

  private async processBatchReceipts(receipts: any[]): Promise<any[]> {
    const results = [];

    for (const receipt of receipts) {
      try {
        const summaryResult = await aiSummarizer.summarizeReceipt(
          receipt.title || receipt.vendor || 'Receipt'
        );
        
        const classificationResult = await documentClassifier.classifyDocument(
          `${receipt.title} ${receipt.vendor} ${receipt.category}`,
          'receipt'
        );

        const smartTags = await documentClassifier.smartTag(
          `${receipt.title} ${receipt.vendor} ${receipt.category}`,
          receipt.tags || []
        );

        await this.updateReceiptWithAI(receipt.id, {
          summary: summaryResult.summary,
          keyPoints: summaryResult.keyPoints,
          tags: smartTags,
          aiProcessed: true,
          confidence: Math.min(
            summaryResult.confidence,
            classificationResult.confidence
          )
        });

        results.push({ id: receipt.id, success: true, confidence: summaryResult.confidence });
      } catch (error) {
        console.error(`Failed to process receipt ${receipt.id}:`, error);
        results.push({ id: receipt.id, success: false, error: error.message });
      }
    }

    return results;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async getUnprocessedDocuments(): Promise<any[]> {
    // Mock implementation - replace with actual data fetching
    return [
      { id: '1', name: 'document1.pdf', content: 'Sample document content' },
      { id: '2', name: 'document2.pdf', content: 'Another document content' }
    ];
  }

  private async getUnprocessedReceipts(): Promise<any[]> {
    // Mock implementation - replace with actual data fetching
    return [
      { id: '1', title: 'Office Supplies', vendor: 'Staples', category: 'Office Supplies' },
      { id: '2', title: 'Lunch Meeting', vendor: 'Restaurant', category: 'Meals & Entertainment' }
    ];
  }

  private async updateDocumentWithAI(docId: string, aiData: any): Promise<void> {
    // Mock implementation - replace with actual database update
    console.log(`Updating document ${docId} with AI data:`, aiData);
  }

  private async updateReceiptWithAI(receiptId: string, aiData: any): Promise<void> {
    // Mock implementation - replace with actual database update
    console.log(`Updating receipt ${receiptId} with AI data:`, aiData);
  }

  private async generateWeeklyReport(stats: {
    documentsProcessed: number;
    receiptsProcessed: number;
    averageConfidence: number;
    processingTime: number;
  }): Promise<void> {
    const currentWeek = this.getCurrentWeekString();
    
    const report: WeeklyReport = {
      week: currentWeek,
      documentsProcessed: stats.documentsProcessed,
      receiptsProcessed: stats.receiptsProcessed,
      totalAmount: 0, // Would be calculated from actual data
      topCategories: [], // Would be calculated from actual data
      aiInsights: {
        mostCommonTags: [], // Would be calculated from actual data
        averageConfidence: stats.averageConfidence,
        processingTime: stats.processingTime
      },
      automationStats: {
        tasksCompleted: stats.documentsProcessed + stats.receiptsProcessed,
        remindersSet: 0, // Would be calculated from actual data
        exportsTrigger: 1 // This report generation
      }
    };

    this.weeklyReports.push(report);
    
    // Export report
    await exportService.exportWeeklyReport(report);
    
    console.log('Weekly report generated:', report);
  }

  private getCurrentWeekString(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  async triggerWeeklyReminders(): Promise<void> {
    console.log('Triggering weekly reminders...');
    
    // Get upcoming tasks and deadlines
    const upcomingTasks = await this.getUpcomingTasks();
    const overdueItems = await this.getOverdueItems();
    
    if (upcomingTasks.length > 0 || overdueItems.length > 0) {
      const reminderData = {
        week: this.getCurrentWeekString(),
        upcomingTasks,
        overdueItems,
        generatedAt: new Date()
      };
      
      // Send reminders (email, notifications, etc.)
      await this.sendWeeklyReminders(reminderData);
    }
  }

  private async getUpcomingTasks(): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private async getOverdueItems(): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private async sendWeeklyReminders(reminderData: any): Promise<void> {
    console.log('Sending weekly reminders:', reminderData);
    // Implementation would send actual notifications/emails
  }

  getWeeklyReports(): WeeklyReport[] {
    return this.weeklyReports;
  }

  async exportWeeklyTriggers(): Promise<void> {
    console.log('Triggering weekly exports...');
    
    // Trigger various export operations
    await Promise.all([
      exportService.exportWeeklyTasksSummary(),
      exportService.exportWeeklyReceiptsSummary(),
      exportService.exportWeeklyAIInsights()
    ]);
  }
}

export const weeklyAutomationService = new WeeklyAutomationService();