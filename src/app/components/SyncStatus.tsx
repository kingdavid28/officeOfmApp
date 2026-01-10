import React from 'react';
import { Badge } from './ui/badge';

interface SyncStatusProps {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastSync?: Date;
}

export function SyncStatus({ status, lastSync }: SyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return { variant: 'default' as const, text: 'Synced', color: 'text-green-600' };
      case 'syncing':
        return { variant: 'secondary' as const, text: 'Syncing...', color: 'text-blue-600' };
      case 'error':
        return { variant: 'destructive' as const, text: 'Sync Error', color: 'text-red-600' };
      case 'offline':
        return { variant: 'outline' as const, text: 'Offline', color: 'text-gray-600' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
      {lastSync && status === 'synced' && (
        <span className="text-muted-foreground">
          {lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}