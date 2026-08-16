import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff, CloudUpload } from 'lucide-react';
import { getSyncStatus, forceSync, SyncStatus, syncManager } from '../core/services/syncService';

interface OfflineSyncStatusWidgetProps {
  lang: 'ar' | 'en';
}

export default function OfflineSyncStatusWidget({ lang }: OfflineSyncStatusWidgetProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ pendingTasksCount: 0, status: 'synced', conflicts: [] });

  useEffect(() => {
    // Initial fetch
    setSyncStatus(syncManager.getStatus());
    
    // Subscribe to real-time events (online/offline/syncing)
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    if (syncStatus.status === 'offline') return; // Cannot sync if offline
    await forceSync();
  };

  const isOffline = syncStatus.status === 'offline';
  const isSyncing = syncStatus.status === 'syncing';
  const hasPending = syncStatus.pendingTasksCount > 0;

  // Determine styling and labels based on exact state
  let bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300';
  let label = lang === 'ar' ? 'متصل ومحدث' : 'Online & Synced';
  let Icon = Wifi;

  if (isOffline) {
    bgClass = 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300';
    label = lang === 'ar' ? 'غير متصل (يتم حفظ التعديلات)' : 'Offline (Saving locally)';
    Icon = CloudOff;
  } else if (isSyncing) {
    bgClass = 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300';
    label = lang === 'ar' ? `جاري المزامنة (${syncStatus.pendingTasksCount})...` : `Syncing (${syncStatus.pendingTasksCount})...`;
    Icon = RefreshCw;
  } else if (hasPending) {
    bgClass = 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300';
    label = lang === 'ar' ? `بانتظار المزامنة (${syncStatus.pendingTasksCount})` : `Pending Sync (${syncStatus.pendingTasksCount})`;
    Icon = CloudUpload;
  }

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing || (isOffline && !hasPending)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${bgClass} ${(!isOffline && hasPending) ? 'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50' : 'cursor-default'}`}
    >
      <Icon className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
      {label}
      {hasPending && !isSyncing && !isOffline && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      )}
    </button>
  );
}
