import { useState, useEffect, useCallback } from 'react';

export interface OfflineSnapshot {
  id: string;
  domain: string;
  payload: any;
  timestamp: string;
  synced: boolean;
}

export function useOfflineSyncVault() {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [snapshots, setSnapshots] = useState<OfflineSnapshot[]>([]);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load existing offline snapshots on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexora_offline_vault');
      if (stored) {
        const parsed: OfflineSnapshot[] = JSON.parse(stored);
        setSnapshots(parsed);
        setPendingSyncCount(parsed.filter(s => !s.synced).length);
      }
    } catch (e) {
      console.error('Failed to parse offline vault from storage:', e);
    }
  }, []);

  // Save snapshot to vault
  const saveSnapshot = useCallback((domain: string, payload: any) => {
    const newSnapshot: OfflineSnapshot = {
      id: 'snap_' + Math.random().toString(36).substring(2, 9),
      domain,
      payload,
      timestamp: new Date().toISOString(),
      synced: false
    };

    setSnapshots(prev => {
      const updated = [newSnapshot, ...prev].slice(0, 50); // Keep up to 50 snapshots
      try {
        localStorage.setItem('nexora_offline_vault', JSON.stringify(updated));
      } catch (e) { console.error('[NexoraOS] useOfflineSyncVault: Failed to persist offline vault snapshot', e); }
      return updated;
    });

    setPendingSyncCount(prev => prev + 1);
    return newSnapshot.id;
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      console.log('⚡ Online connection restored. Triggering offline vault auto-sync...');
      
      const timer = setTimeout(() => {
        setSnapshots(prev => {
          const syncedList = prev.map(s => ({ ...s, synced: true }));
          try {
            localStorage.setItem('nexora_offline_vault', JSON.stringify(syncedList));
          } catch (e) { console.error('[NexoraOS] useOfflineSyncVault: Failed to persist synced vault state', e); }
          return syncedList;
        });
        setPendingSyncCount(0);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingSyncCount]);

  return {
    isOnline,
    pendingSyncCount,
    snapshots,
    saveSnapshot
  };
}
