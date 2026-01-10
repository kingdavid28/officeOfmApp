import { platformAdapter } from './react-native-adapter';
import { crudService } from './crud';
import { auth } from './firebase';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  userId: string;
  organizationId: string;
}

export class OfflineSyncService {
  private queue: OfflineAction[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initializeOfflineHandling();
    this.loadQueueFromStorage();
  }

  private initializeOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async loadQueueFromStorage() {
    try {
      const queueData = await platformAdapter.storage.getItem('offline_queue');
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueueToStorage() {
    try {
      await platformAdapter.storage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'userId'>) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const queuedAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      userId: user.uid
    };

    this.queue.push(queuedAction);
    await this.saveQueueToStorage();

    // Try immediate sync if online
    if (this.isOnline) {
      this.syncPendingActions();
    }

    return queuedAction.id;
  }

  async syncPendingActions() {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const failedActions: OfflineAction[] = [];

    for (const action of this.queue) {
      try {
        await this.executeAction(action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        failedActions.push(action);
      }
    }

    this.queue = failedActions;
    await this.saveQueueToStorage();
    this.syncInProgress = false;
  }

  private async executeAction(action: OfflineAction) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    switch (action.type) {
      case 'create':
        await crudService.createDocument(
          action.collection,
          action.data,
          user.uid
        );
        break;
      case 'update':
        await crudService.updateDocument(
          action.collection,
          action.data.id,
          action.data,
          user.uid
        );
        break;
      case 'delete':
        await crudService.deleteDocument(
          action.collection,
          action.data.id,
          user.uid
        );
        break;
    }
  }

  // Local storage operations for offline use
  async storeLocalData(collection: string, data: any[]) {
    const key = `local_${collection}`;
    await platformAdapter.storage.setItem(key, JSON.stringify(data));
  }

  async getLocalData(collection: string): Promise<any[]> {
    const key = `local_${collection}`;
    const data = await platformAdapter.storage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async updateLocalItem(collection: string, id: string, updates: any) {
    const data = await this.getLocalData(collection);
    const index = data.findIndex(item => item.id === id);
    
    if (index >= 0) {
      data[index] = { ...data[index], ...updates };
      await this.storeLocalData(collection, data);
    }
  }

  async addLocalItem(collection: string, item: any) {
    const data = await this.getLocalData(collection);
    data.push(item);
    await this.storeLocalData(collection, data);
  }

  async removeLocalItem(collection: string, id: string) {
    const data = await this.getLocalData(collection);
    const filtered = data.filter(item => item.id !== id);
    await this.storeLocalData(collection, filtered);
  }

  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      pendingActions: this.queue.length,
      syncInProgress: this.syncInProgress
    };
  }
}

export const offlineSyncService = new OfflineSyncService();