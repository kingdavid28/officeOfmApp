export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  createdBy: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Receipt {
  id: string;
  title: string;
  amount: number;
  category: string;
  vendor: string;
  receiptDate: Date;
  uploadedBy: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  tags: string[];
  accessLevel: 'public' | 'staff' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  authProvider?: 'email' | 'google';
  requestedAdminId?: string; // For staff requests - which admin they want to be assigned to
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'user' | 'task' | 'receipt' | 'file' | 'pending_user' | 'organization';
  entityId: string;
  userId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface SyncMetadata {
  id: string;
  entityType: string;
  entityId: string;
  lastSync: Date;
  version: number;
  conflictResolved: boolean;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  organizationId: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  edited?: boolean;
  editedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}