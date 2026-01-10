import { platformAdapter } from './react-native-adapter';
import { crudService } from './crud';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, collection } from 'firebase/firestore';

export interface SyncAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data: any;
  timestamp: number;
  userId: string;
  organizationId: string;
  version: number;
  retryCount: number;
  priority: 'low' | 'normal' | 'high';
}

export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolver?: (client: any, server: any) => any;
}

export class EnhancedSyncService {
  private queue: SyncAction[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private maxRetries = 3;
  private listeners: Map<string, () => void> = new Map();
  private conflictResolvers: Map<string, ConflictResolution> = new Map();

  constructor() {
    this.initializeNetworkHandling();
    this.loadQueueFromStorage();
    this.setupDefaultConflictResolvers();
  }

  private initializeNetworkHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupDefaultConflictResolvers() {
    // Default: client wins for most operations
    this.setConflictResolver('default', { strategy: 'client-wins' });
    
    // Server wins for critical data
    this.setConflictResolver('users', { strategy: 'server-wins' });
    
    // Merge strategy for messages
    this.setConflictResolver('messages', { 
      strategy: 'merge',
      resolver: (client, server) => ({
        ...server,
        content: client.content,
        edited: true,
        editedAt: new Date()
      })
    });
  }

  setConflictResolver(collection: string, resolution: ConflictResolution) {
    this.conflictResolvers.set(collection, resolution);
  }

  private async loadQueueFromStorage() {
    try {
      const queueData = await platformAdapter.storage.getItem('enhanced_sync_queue');
      if (queueData) {
        this.queue = JSON.parse(queueData);
        // Sort by priority and timestamp
        this.queue.sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority] || a.timestamp - b.timestamp;
        });
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveQueueToStorage() {
    try {
      await platformAdapter.storage.setItem('enhanced_sync_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  async queueAction(
    type: SyncAction['type'],
    collection: string,
    data: any,
    options: {
      documentId?: string;
      priority?: SyncAction['priority'];
      organizationId?: string;
    } = {}
  ): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const action: SyncAction = {
      id: actionId,
      type,
      collection,
      documentId: options.documentId || data.id,
      data,
      timestamp: Date.now(),
      userId: user.uid,
      organizationId: options.organizationId || data.organizationId || 'default',
      version: data.version || 1,
      retryCount: 0,
      priority: options.priority || 'normal'
    };

    // Add to queue with priority sorting
    this.queue.push(action);
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || a.timestamp - b.timestamp;
    });

    await this.saveQueueToStorage();

    // Update local storage immediately
    await this.updateLocalStorage(action);

    // Try sync if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return actionId;
  }

  private async updateLocalStorage(action: SyncAction) {
    const localData = await this.getLocalData(action.collection);
    
    switch (action.type) {
      case 'create':
        localData.push({ ...action.data, _pending: true });
        break;
      case 'update':
        const updateIndex = localData.findIndex(item => item.id === action.documentId);
        if (updateIndex >= 0) {
          localData[updateIndex] = { ...localData[updateIndex], ...action.data, _pending: true };
        }
        break;
      case 'delete':
        const deleteIndex = localData.findIndex(item => item.id === action.documentId);
        if (deleteIndex >= 0) {
          localData[deleteIndex] = { ...localData[deleteIndex], _deleted: true, _pending: true };
        }
        break;
    }

    await this.storeLocalData(action.collection, localData);
  }

  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const failedActions: SyncAction[] = [];

    for (const action of this.queue) {
      try {
        await this.executeAction(action);
        // Remove _pending flag from local storage
        await this.markActionComplete(action);
      } catch (error) {
        console.error('Sync action failed:', action, error);
        
        action.retryCount++;
        if (action.retryCount < this.maxRetries) {
          failedActions.push(action);
        } else {
          console.error('Action exceeded max retries:', action);
          await this.handleFailedAction(action, error);
        }
      }
    }

    this.queue = failedActions;
    await this.saveQueueToStorage();
    this.syncInProgress = false;
  }

  private async executeAction(action: SyncAction): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    switch (action.type) {
      case 'create':
        await this.handleCreate(action);
        break;
      case 'update':
        await this.handleUpdate(action);
        break;
      case 'delete':
        await this.handleDelete(action);
        break;
    }
  }

  private async handleCreate(action: SyncAction) {
    const docRef = doc(db, action.collection, action.documentId || action.data.id);
    await setDoc(docRef, {
      ...action.data,
      createdAt: Timestamp.now(),
      version: 1,
      syncedAt: Timestamp.now()
    });
  }

  private async handleUpdate(action: SyncAction) {
    const docRef = doc(db, action.collection, action.documentId!);
    const serverDoc = await getDoc(docRef);
    
    if (serverDoc.exists()) {
      const serverData = serverDoc.data();
      const serverVersion = serverData.version || 0;
      
      if (action.version <= serverVersion) {
        // Conflict detected - resolve using strategy
        const resolved = await this.resolveConflict(action.collection, action.data, serverData);
        await setDoc(docRef, {
          ...resolved,
          updatedAt: Timestamp.now(),
          version: serverVersion + 1,
          syncedAt: Timestamp.now()
        }, { merge: true });
      } else {
        // No conflict
        await setDoc(docRef, {
          ...action.data,
          updatedAt: Timestamp.now(),
          version: action.version,
          syncedAt: Timestamp.now()
        }, { merge: true });
      }
    } else {
      // Document doesn't exist, create it
      await this.handleCreate(action);
    }
  }

  private async handleDelete(action: SyncAction) {
    const docRef = doc(db, action.collection, action.documentId!);
    await setDoc(docRef, {
      deleted: true,
      deletedAt: Timestamp.now(),
      syncedAt: Timestamp.now()
    }, { merge: true });
  }

  private async resolveConflict(collection: string, clientData: any, serverData: any): Promise<any> {
    const resolver = this.conflictResolvers.get(collection) || this.conflictResolvers.get('default')!;
    
    switch (resolver.strategy) {
      case 'client-wins':
        return clientData;
      case 'server-wins':
        return serverData;
      case 'merge':
        return resolver.resolver ? resolver.resolver(clientData, serverData) : { ...serverData, ...clientData };
      case 'manual':
        // Store conflict for manual resolution
        await this.storeConflict(collection, clientData, serverData);
        return serverData; // Keep server data until manual resolution
      default:
        return clientData;
    }
  }

  private async storeConflict(collection: string, clientData: any, serverData: any) {
    const conflicts = await this.getLocalData('_conflicts') || [];
    conflicts.push({
      id: `conflict_${Date.now()}`,
      collection,
      clientData,
      serverData,
      timestamp: Date.now(),
      resolved: false
    });
    await this.storeLocalData('_conflicts', conflicts);
  }

  private async markActionComplete(action: SyncAction) {
    const localData = await this.getLocalData(action.collection);
    const item = localData.find(item => item.id === action.documentId);
    if (item) {
      delete item._pending;
      await this.storeLocalData(action.collection, localData);
    }
  }

  private async handleFailedAction(action: SyncAction, error: any) {
    // Store failed action for manual review
    const failedActions = await this.getLocalData('_failed_actions') || [];
    failedActions.push({
      action,
      error: error.message,
      timestamp: Date.now()
    });
    await this.storeLocalData('_failed_actions', failedActions);
  }

  // Local storage operations
  async storeLocalData(collection: string, data: any[]) {
    const key = `local_${collection}`;
    await platformAdapter.storage.setItem(key, JSON.stringify(data));
  }

  async getLocalData(collection: string): Promise<any[]> {
    const key = `local_${collection}`;
    const data = await platformAdapter.storage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // Real-time sync setup
  setupRealtimeSync(collection: string, callback: (data: any[]) => void) {
    const unsubscribe = onSnapshot(
      collection(db, collection),
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => !item.deleted);
        
        // Update local storage with server data
        this.storeLocalData(collection, data);
        callback(data);
      },
      (error) => {
        console.error('Realtime sync error:', error);
        // Fallback to local data
        this.getLocalData(collection).then(callback);
      }
    );

    this.listeners.set(collection, unsubscribe);
    return unsubscribe;
  }

  // Status and management
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      syncInProgress: this.syncInProgress,
      highPriorityActions: this.queue.filter(a => a.priority === 'high').length,
      failedActions: this.queue.filter(a => a.retryCount >= this.maxRetries).length
    };
  }

  async getConflicts() {
    return this.getLocalData('_conflicts');
  }

  async resolveManualConflict(conflictId: string, resolution: any) {
    const conflicts = await this.getLocalData('_conflicts');
    const conflict = conflicts.find(c => c.id === conflictId);
    if (conflict) {
      conflict.resolved = true;
      conflict.resolution = resolution;
      await this.storeLocalData('_conflicts', conflicts);
      
      // Queue the resolution
      await this.queueAction('update', conflict.collection, resolution, {
        documentId: resolution.id,
        priority: 'high'
      });
    }
  }

  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const enhancedSyncService = new EnhancedSyncService();