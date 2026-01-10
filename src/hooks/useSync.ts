import { useState, useEffect, useCallback } from 'react';
import { enhancedSyncService } from '../lib/enhanced-sync';

export interface SyncStatus {
  isOnline: boolean;
  queueLength: number;
  syncInProgress: boolean;
  highPriorityActions: number;
  failedActions: number;
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    queueLength: 0,
    syncInProgress: false,
    highPriorityActions: 0,
    failedActions: 0
  });

  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(enhancedSyncService.getStatus());
    };

    const loadConflicts = async () => {
      const conflictData = await enhancedSyncService.getConflicts();
      setConflicts(conflictData.filter(c => !c.resolved));
    };

    // Initial load
    updateStatus();
    loadConflicts();

    // Update status periodically
    const interval = setInterval(() => {
      updateStatus();
      loadConflicts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const queueAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    collection: string,
    data: any,
    options?: {
      documentId?: string;
      priority?: 'low' | 'normal' | 'high';
      organizationId?: string;
    }
  ) => {
    return enhancedSyncService.queueAction(type, collection, data, options);
  }, []);

  const resolveConflict = useCallback(async (conflictId: string, resolution: any) => {
    await enhancedSyncService.resolveManualConflict(conflictId, resolution);
    const updatedConflicts = await enhancedSyncService.getConflicts();
    setConflicts(updatedConflicts.filter(c => !c.resolved));
  }, []);

  const forceSync = useCallback(() => {
    enhancedSyncService.processSyncQueue();
  }, []);

  return {
    status,
    conflicts,
    queueAction,
    resolveConflict,
    forceSync
  };
}