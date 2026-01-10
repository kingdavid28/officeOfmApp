import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Secure RPC functions for sensitive operations
export const secureRPCs = {
  // User management RPCs
  createUser: httpsCallable(functions, 'createUser'),
  updateUserRole: httpsCallable(functions, 'updateUserRole'),
  deactivateUser: httpsCallable(functions, 'deactivateUser'),
  
  // Bulk operations
  bulkDeleteTasks: httpsCallable(functions, 'bulkDeleteTasks'),
  bulkUpdateTaskStatus: httpsCallable(functions, 'bulkUpdateTaskStatus'),
  
  // Advanced file operations
  moveFileToArchive: httpsCallable(functions, 'moveFileToArchive'),
  generateFileAccessToken: httpsCallable(functions, 'generateFileAccessToken'),
  
  // Audit and reporting
  generateAuditReport: httpsCallable(functions, 'generateAuditReport'),
  exportDataWithAudit: httpsCallable(functions, 'exportDataWithAudit'),
  
  // System maintenance
  cleanupDeletedFiles: httpsCallable(functions, 'cleanupDeletedFiles'),
  syncUserPermissions: httpsCallable(functions, 'syncUserPermissions')
};

export type RPCFunction = keyof typeof secureRPCs;

export interface RPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  auditId?: string;
}

export class RPCService {
  async callSecureFunction<T>(
    functionName: RPCFunction, 
    data: any
  ): Promise<RPCResponse<T>> {
    try {
      const result = await secureRPCs[functionName](data);
      return result.data as RPCResponse<T>;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'RPC call failed'
      };
    }
  }

  // User management
  async createUserWithRole(email: string, password: string, role: 'admin' | 'staff', name: string) {
    return this.callSecureFunction('createUser', { email, password, role, name });
  }

  async updateUserRole(userId: string, newRole: 'admin' | 'staff') {
    return this.callSecureFunction('updateUserRole', { userId, newRole });
  }

  // Bulk operations
  async bulkDeleteTasks(taskIds: string[]) {
    return this.callSecureFunction('bulkDeleteTasks', { taskIds });
  }

  async bulkUpdateTaskStatus(taskIds: string[], status: string) {
    return this.callSecureFunction('bulkUpdateTaskStatus', { taskIds, status });
  }

  // File operations
  async archiveFile(fileId: string) {
    return this.callSecureFunction('moveFileToArchive', { fileId });
  }

  async generateFileToken(fileId: string, expirationHours: number = 24) {
    return this.callSecureFunction('generateFileAccessToken', { fileId, expirationHours });
  }

  // Reporting
  async generateAuditReport(startDate: Date, endDate: Date, entityType?: string) {
    return this.callSecureFunction('generateAuditReport', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(), 
      entityType 
    });
  }

  async exportWithAudit(exportType: 'tasks' | 'receipts' | 'files', format: 'csv' | 'pdf') {
    return this.callSecureFunction('exportDataWithAudit', { exportType, format });
  }
}

export const rpcService = new RPCService();