import { 
  collection, 
  doc, 
  onSnapshot, 
  enableNetwork, 
  disableNetwork,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { SyncMetadata } from './types';

export class OfflineSyncService {
  private syncQueue: Array<{ operation: string; data: any; timestamp: Date }> = [];
  private isOnline = navigator.onLine;
  private listeners: Array<() => void> = [];

  constructor() {
    this.setupNetworkListeners();
    this.setupOfflineSupport();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async setupOfflineSupport() {
    try {
      if (!this.isOnline) {
        await disableNetwork(db);
      } else {
        await enableNetwork(db);
      }
    } catch (error) {
      console.error('Error setting up offline support:', error);
    }
  }

  async queueOperation(operation: string, data: any) {
    const queueItem = {
      operation,
      data,
      timestamp: new Date()
    };

    this.syncQueue.push(queueItem);
    
    // Store in localStorage for persistence
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));

    if (this.isOnline) {
      await this.syncPendingOperations();
    }
  }

  private async syncPendingOperations() {
    const storedQueue = localStorage.getItem('syncQueue');
    if (storedQueue) {
      this.syncQueue = JSON.parse(storedQueue);
    }

    for (const item of this.syncQueue) {
      try {
        await this.executeOperation(item);
        this.syncQueue = this.syncQueue.filter(q => q !== item);
      } catch (error) {
        console.error('Sync operation failed:', error);
        break; // Stop syncing on first failure
      }
    }

    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  private async executeOperation(item: { operation: string; data: any; timestamp: Date }) {
    const { operation, data } = item;

    switch (operation) {
      case 'create':
        await this.handleCreate(data);
        break;
      case 'update':
        await this.handleUpdate(data);
        break;
      case 'delete':
        await this.handleDelete(data);
        break;
    }
  }

  private async handleCreate(data: any) {
    const docRef = doc(collection(db, data.collection));
    await setDoc(docRef, {
      ...data.payload,
      createdAt: Timestamp.now(),
      syncVersion: 1
    });
  }

  private async handleUpdate(data: any) {
    const docRef = doc(db, data.collection, data.id);
    const currentDoc = await getDoc(docRef);
    
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      const currentVersion = currentData.syncVersion || 0;
      
      // Conflict resolution: last-write-wins with version check
      if (data.syncVersion > currentVersion) {
        await setDoc(docRef, {
          ...data.payload,
          updatedAt: Timestamp.now(),
          syncVersion: currentVersion + 1
        }, { merge: true });
      } else {
        // Handle conflict - could implement more sophisticated resolution
        console.warn('Sync conflict detected, skipping update');
      }
    }
  }

  private async handleDelete(data: any) {
    const docRef = doc(db, data.collection, data.id);
    await setDoc(docRef, { 
      deleted: true, 
      deletedAt: Timestamp.now() 
    }, { merge: true });
  }

  setupRealtimeSync(collection: string, callback: (data: any[]) => void) {
    const unsubscribe = onSnapshot(
      collection(db, collection),
      (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => !item.deleted);
        callback(data);
      },
      (error) => {
        console.error('Realtime sync error:', error);
      }
    );

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  async createSyncMetadata(entityType: string, entityId: string): Promise<void> {
    const syncData: Omit<SyncMetadata, 'id'> = {
      entityType,
      entityId,
      lastSync: new Date(),
      version: 1,
      conflictResolved: false
    };

    await setDoc(doc(db, 'sync_metadata', `${entityType}_${entityId}`), syncData);
  }

  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

export const offlineSyncService = new OfflineSyncService();