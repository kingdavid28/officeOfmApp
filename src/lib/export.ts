import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from './auth';
import { aiSummarizer } from './ai-summarizer';
import { documentClassifier } from './classification';

export class ExportService {
  async exportTasksToCSV(userRole: UserRole, userId: string): Promise<string> {
    const tasks = await this.getTasks(userRole, userId);
    
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...tasks.map(task => [
        task.id,
        `"${task.title}"`,
        task.status,
        task.priority,
        task.assignedTo,
        task.dueDate?.toDate?.()?.toISOString() || '',
        task.createdAt?.toDate?.()?.toISOString() || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  async exportReceiptsToCSV(userRole: UserRole, userId: string): Promise<string> {
    const receipts = await this.getReceipts(userRole, userId);
    
    const headers = ['ID', 'Title', 'Amount', 'Category', 'Vendor', 'Status', 'Receipt Date'];
    const csvContent = [
      headers.join(','),
      ...receipts.map(receipt => [
        receipt.id,
        `"${receipt.title}"`,
        receipt.amount,
        receipt.category,
        `"${receipt.vendor}"`,
        receipt.status,
        receipt.receiptDate?.toDate?.()?.toISOString() || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  async generateTasksSummary(userRole: UserRole, userId: string) {
    const tasks = await this.getTasks(userRole, userId);
    
    const summary = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length
      },
      overdue: tasks.filter(t => 
        t.dueDate && t.dueDate.toDate() < new Date() && t.status !== 'completed'
      ).length,
      aiInsights: await this.generateTasksAIInsights(tasks)
    };

    return summary;
  }

  async generateReceiptsSummary(userRole: UserRole, userId: string) {
    const receipts = await this.getReceipts(userRole, userId);
    
    const summary = {
      total: receipts.length,
      totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
      byStatus: {
        pending: receipts.filter(r => r.status === 'pending').length,
        approved: receipts.filter(r => r.status === 'approved').length,
        rejected: receipts.filter(r => r.status === 'rejected').length
      },
      byCategory: receipts.reduce((acc, receipt) => {
        acc[receipt.category] = (acc[receipt.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      aiInsights: await this.generateReceiptsAIInsights(receipts)
    };

    return summary;
  }

  private async getTasks(userRole: UserRole, userId: string) {
    const tasksRef = collection(db, 'tasks');
    const q = userRole === 'admin' 
      ? query(tasksRef, orderBy('createdAt', 'desc'))
      : query(tasksRef, where('assignedTo', '==', userId), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async getReceipts(userRole: UserRole, userId: string) {
    const receiptsRef = collection(db, 'receipts');
    const q = userRole === 'admin'
      ? query(receiptsRef, orderBy('createdAt', 'desc'))
      : query(receiptsRef, where('uploadedBy', '==', userId), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private async generateTasksAIInsights(tasks: any[]) {
    const taskTexts = tasks.map(t => `${t.title} - ${t.description || ''}`).join(' ');
    const summary = await aiSummarizer.summarizeDocument(taskTexts, 'tasks');
    
    return {
      trends: this.analyzeTaskTrends(tasks),
      recommendations: summary.keyPoints.slice(0, 3),
      productivity: this.calculateProductivityMetrics(tasks)
    };
  }

  private async generateReceiptsAIInsights(receipts: any[]) {
    const receiptTexts = receipts.map(r => `${r.vendor} ${r.category} ${r.amount}`).join(' ');
    const summary = await aiSummarizer.summarizeDocument(receiptTexts, 'receipts');
    
    return {
      spendingPatterns: this.analyzeSpendingPatterns(receipts),
      recommendations: summary.keyPoints.slice(0, 3),
      anomalies: this.detectSpendingAnomalies(receipts)
    };
  }

  private analyzeTaskTrends(tasks: any[]) {
    const completionRate = tasks.filter(t => t.status === 'completed').length / tasks.length;
    const avgDaysToComplete = tasks
      .filter(t => t.status === 'completed' && t.completedAt && t.createdAt)
      .reduce((sum, t) => sum + (t.completedAt.toDate() - t.createdAt.toDate()) / (1000 * 60 * 60 * 24), 0) / tasks.length;
    
    return {
      completionRate: Math.round(completionRate * 100),
      avgDaysToComplete: Math.round(avgDaysToComplete || 0),
      mostCommonPriority: this.getMostCommon(tasks.map(t => t.priority))
    };
  }

  private calculateProductivityMetrics(tasks: any[]) {
    const thisWeek = tasks.filter(t => this.isThisWeek(t.createdAt?.toDate()));
    const lastWeek = tasks.filter(t => this.isLastWeek(t.createdAt?.toDate()));
    
    return {
      weeklyChange: thisWeek.length - lastWeek.length,
      completedThisWeek: thisWeek.filter(t => t.status === 'completed').length
    };
  }

  private analyzeSpendingPatterns(receipts: any[]) {
    const monthlySpend = receipts.reduce((acc, r) => {
      const month = r.receiptDate?.toDate?.()?.getMonth() || new Date().getMonth();
      acc[month] = (acc[month] || 0) + r.amount;
      return acc;
    }, {});
    
    return {
      topCategory: this.getMostCommon(receipts.map(r => r.category)),
      avgAmount: receipts.reduce((sum, r) => sum + r.amount, 0) / receipts.length,
      monthlyTrend: Object.values(monthlySpend).slice(-3)
    };
  }

  private detectSpendingAnomalies(receipts: any[]) {
    const amounts = receipts.map(r => r.amount);
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const threshold = avg * 2;
    
    return receipts.filter(r => r.amount > threshold).length;
  }

  private getMostCommon(arr: any[]) {
    return arr.sort((a, b) => 
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
  }

  private isThisWeek(date: Date) {
    if (!date) return false;
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return date >= weekStart;
  }

  private isLastWeek(date: Date) {
    if (!date) return false;
    const now = new Date();
    const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
    const lastWeekEnd = new Date(now.setDate(now.getDate() - now.getDay()));
    return date >= lastWeekStart && date < lastWeekEnd;
  }
}

export const exportService = new ExportService();