import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Receipt, FileMetadata, AuditLog } from './types';
import { UserRole } from './auth';

class CRUDService {
  private async checkPermission(userRole: UserRole, operation: string, resource: string): Promise<boolean> {
    const permissions = {
      admin: ['create', 'read', 'update', 'delete'],
      staff: ['create', 'read', 'update']
    };
    return permissions[userRole]?.includes(operation) || false;
  }

  private async logAction(action: string, entityType: string, entityId: string, userId: string, details: any) {
    const log: Omit<AuditLog, 'id'> = {
      action,
      entityType,
      entityId,
      userId,
      details,
      timestamp: new Date()
    };
    await addDoc(collection(db, 'audit_logs'), log);
  }

  // Tasks CRUD
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'create', 'tasks')) {
      throw new Error('Insufficient permissions');
    }

    const newTask = {
      ...task,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    await this.logAction('create', 'task', docRef.id, userId, newTask);
    return docRef.id;
  }

  async getTasks(userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'read', 'tasks')) {
      throw new Error('Insufficient permissions');
    }

    const q = userRole === 'admin' 
      ? query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'tasks'), where('assignedTo', '==', userId), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateTask(taskId: string, updates: Partial<Task>, userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'update', 'tasks')) {
      throw new Error('Insufficient permissions');
    }

    const taskRef = doc(db, 'tasks', taskId);
    const updateData = { ...updates, updatedAt: Timestamp.now() };
    
    await updateDoc(taskRef, updateData);
    await this.logAction('update', 'task', taskId, userId, updates);
  }

  async deleteTask(taskId: string, userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'delete', 'tasks')) {
      throw new Error('Insufficient permissions');
    }

    await deleteDoc(doc(db, 'tasks', taskId));
    await this.logAction('delete', 'task', taskId, userId, {});
  }

  // Receipts CRUD
  async createReceipt(receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>, userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'create', 'receipts')) {
      throw new Error('Insufficient permissions');
    }

    const newReceipt = {
      ...receipt,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'receipts'), newReceipt);
    await this.logAction('create', 'receipt', docRef.id, userId, newReceipt);
    return docRef.id;
  }

  async getReceipts(userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'read', 'receipts')) {
      throw new Error('Insufficient permissions');
    }

    const q = userRole === 'admin'
      ? query(collection(db, 'receipts'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'receipts'), where('uploadedBy', '==', userId), orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Files CRUD
  async createFileMetadata(file: Omit<FileMetadata, 'id' | 'createdAt' | 'updatedAt'>, userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'create', 'files')) {
      throw new Error('Insufficient permissions');
    }

    const newFile = {
      ...file,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'files'), newFile);
    await this.logAction('create', 'file', docRef.id, userId, newFile);
    return docRef.id;
  }

  async getFiles(userRole: UserRole, userId: string) {
    if (!await this.checkPermission(userRole, 'read', 'files')) {
      throw new Error('Insufficient permissions');
    }

    const accessLevels = userRole === 'admin' ? ['public', 'staff', 'admin'] : ['public', 'staff'];
    const q = query(
      collection(db, 'files'),
      where('accessLevel', 'in', accessLevels),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export const crudService = new CRUDService();