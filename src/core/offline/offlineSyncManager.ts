import { OfflineQueueItem } from './types';
import { persistenceService } from '../services/persistence';

class OfflineSyncManager {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(online: boolean) => void> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private handleOnline = async () => {
    console.log('[OfflineSyncManager] Connection restored. Synchronizing queued offline mutations...');
    this.isOnlineState = true;
    this.notifyListeners();
    await this.processQueue();
  };

  private handleOffline = () => {
    console.warn('[OfflineSyncManager] Connection lost. Switching to Local-First Offline Mode.');
    this.isOnlineState = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isOnlineState);
      } catch (err) {
        console.error('[OfflineSyncManager] Error in listener callback:', err);
      }
    });
  }

  public async enqueueMutation(action: string, payload: any): Promise<void> {
    const item: OfflineQueueItem = {
      id: 'mut_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      action,
      payload,
      timestamp: new Date().toISOString(),
      synced: false
    };

    const currentQueue = (await persistenceService.get<OfflineQueueItem[]>('view_models', 'offline_sync_queue')) || [];
    currentQueue.push(item);
    await persistenceService.set('view_models', 'offline_sync_queue', currentQueue);
    console.log('[OfflineSyncManager] Queued offline mutation:', item);

    if (this.isOnlineState) {
      this.processQueue();
    }
  }

  public async processQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnlineState) return;
    this.isSyncing = true;

    try {
      const queue = (await persistenceService.get<OfflineQueueItem[]>('view_models', 'offline_sync_queue')) || [];
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log('[OfflineSyncManager] Processing ' + queue.length + ' queued mutations...');
      const remaining: OfflineQueueItem[] = [];

      for (const item of queue) {
        try {
          const token = typeof localStorage !== 'undefined' ? localStorage.getItem('rbd_token') : null;
          const res = await fetch('/api/offline-sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: 'Bearer ' + token } : {})
            },
            body: JSON.stringify(item)
          });

          if (!res.ok) {
            console.warn('[OfflineSyncManager] Sync item pending retry:', item.id);
            remaining.push(item);
          }
        } catch (err) {
          console.warn('[OfflineSyncManager] Sync item deferred due to network error:', err);
          remaining.push(item);
        }
      }

      await persistenceService.set('view_models', 'offline_sync_queue', remaining);
      console.log('[OfflineSyncManager] Sync cycle completed. Remaining in outbox:', remaining.length);
    } catch (err) {
      console.error('[OfflineSyncManager] Error processing sync queue:', err);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager();
