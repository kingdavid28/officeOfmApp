import { addDoc, collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from './types';

export interface SecurityEvent {
  type: 'login_attempt' | 'permission_denied' | 'suspicious_activity' | 'data_breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditContext {
  userId: string;
  userRole: 'admin' | 'staff';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class EnhancedAuditService {
  private context: AuditContext | null = null;

  setContext(context: AuditContext) {
    this.context = context;
  }

  async logAction(
    action: string,
    entityType: 'user' | 'task' | 'receipt' | 'file' | 'system',
    entityId: string,
    details: Record<string, any> = {},
    severity: 'info' | 'warning' | 'error' = 'info'
  ) {
    if (!this.context) {
      console.warn('Audit context not set');
      return;
    }

    const auditLog: Omit<AuditLog, 'id'> = {
      action,
      entityType,
      entityId,
      userId: this.context.userId,
      details: {
        ...details,
        severity,
        userRole: this.context.userRole,
        sessionId: this.context.sessionId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date(),
      ipAddress: this.context.ipAddress
    };

    try {
      const docRef = await addDoc(collection(db, 'audit_logs'), {
        ...auditLog,
        timestamp: Timestamp.fromDate(auditLog.timestamp)
      });
      
      // Log security events separately for monitoring
      if (this.isSecuritySensitive(action)) {
        await this.logSecurityEvent({
          type: this.getSecurityEventType(action),
          severity: severity as any,
          details: auditLog.details
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }

  async logSecurityEvent(event: SecurityEvent) {
    const securityLog = {
      ...event,
      timestamp: Timestamp.now(),
      userId: this.context?.userId,
      ipAddress: this.context?.ipAddress,
      userAgent: this.context?.userAgent
    };

    try {
      await addDoc(collection(db, 'security_logs'), securityLog);
      
      // Alert on critical events
      if (event.severity === 'critical') {
        await this.triggerSecurityAlert(event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private isSecuritySensitive(action: string): boolean {
    const sensitiveActions = [
      'delete_file',
      'change_role',
      'delete_user',
      'bulk_delete',
      'export_data',
      'access_admin_files',
      'modify_permissions'
    ];
    return sensitiveActions.includes(action);
  }

  private getSecurityEventType(action: string): SecurityEvent['type'] {
    const mapping: Record<string, SecurityEvent['type']> = {
      'delete_file': 'suspicious_activity',
      'change_role': 'suspicious_activity',
      'delete_user': 'suspicious_activity',
      'bulk_delete': 'suspicious_activity',
      'export_data': 'data_breach_attempt',
      'access_admin_files': 'permission_denied'
    };
    return mapping[action] || 'suspicious_activity';
  }

  private async triggerSecurityAlert(event: SecurityEvent) {
    // In a real implementation, this would send alerts to security team
    console.error('SECURITY ALERT:', event);
    
    // Store critical alerts for immediate review
    await addDoc(collection(db, 'security_alerts'), {
      ...event,
      timestamp: Timestamp.now(),
      status: 'pending_review',
      alertId: `alert_${Date.now()}`
    });
  }

  // Audit query methods
  async getAuditLogs(
    startDate: Date,
    endDate: Date,
    entityType?: string,
    userId?: string
  ) {
    let q = query(
      collection(db, 'audit_logs'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );

    if (entityType) {
      q = query(q, where('entityType', '==', entityType));
    }

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  }

  async getSecurityLogs(severity?: SecurityEvent['severity']) {
    let q = query(
      collection(db, 'security_logs'),
      orderBy('timestamp', 'desc')
    );

    if (severity) {
      q = query(q, where('severity', '==', severity));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  }

  async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getAuditLogs(startDate, new Date(), undefined, userId);
    
    return {
      totalActions: logs.length,
      actionsByType: logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: logs.slice(0, 10),
      securityEvents: logs.filter(log => this.isSecuritySensitive(log.action))
    };
  }
}

export const auditService = new EnhancedAuditService();