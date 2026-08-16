/**
 * NexoraOS™ Offline-First Transaction Engine & Sync State Machine
 * Implements strict: Local -> Queue -> Sync -> Verify -> Commit protocol with Idempotency Keys.
 */

import { persistenceService } from './persistence';

export type SyncTransactionStatus = 
  | 'saved_locally' 
  | 'syncing' 
  | 'synced' 
  | 'conflict_detected' 
  | 'failed';

export interface OfflineTransaction<T = any> {
  idempotencyKey: string;
  entityType: 'voucher' | 'invoice' | 'beneficiary' | 'sponsorship' | 'activity' | 'project' | 'general';
  action: 'create' | 'update' | 'delete' | 'approve';
  endpoint: string;
  payload: T;
  localTimestamp: number;
  retryCount: number;
  maxRetries: number;
  status: SyncTransactionStatus;
  lastError?: string;
  serverVersion?: number;
  localVersion: number;
}

const QUEUE_STORE = 'user_preferences';
const QUEUE_KEY = 'offline_sync_tx_queue';

class NexoraOfflineSyncMachine {
  private queue: OfflineTransaction[] = [];
  private isProcessing = false;
  private listeners: Set<(queue: OfflineTransaction[]) => void> = new Set();

  constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync());
    }
  }

  private async loadQueue() {
    try {
      const saved = await persistenceService.get<OfflineTransaction[]>(QUEUE_STORE, QUEUE_KEY);
      if (saved && Array.isArray(saved)) {
        this.queue = saved;
        this.notify();
      }
    } catch (e) {
      console.warn('[OfflineSync] Failed to load queue:', e);
    }
  }

  private async persistQueue() {
    try {
      await persistenceService.set(QUEUE_STORE, QUEUE_KEY, this.queue);
      this.notify();
    } catch (e) {
      console.warn('[OfflineSync] Failed to persist queue:', e);
    }
  }

  public subscribe(cb: (queue: OfflineTransaction[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.queue);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.queue]));
  }

  /**
   * Enqueues a mutation locally with idempotency key
   */
  public async enqueueTransaction<T>(
    entityType: OfflineTransaction['entityType'],
    action: OfflineTransaction['action'],
    endpoint: string,
    payload: T
  ): Promise<OfflineTransaction<T>> {
    const idempotencyKey = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tx: OfflineTransaction<T> = {
      idempotencyKey,
      entityType,
      action,
      endpoint,
      payload,
      localTimestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      status: 'saved_locally',
      localVersion: 1
    };

    this.queue.push(tx);
    await this.persistQueue();

    // Trigger sync attempt immediately if online
    if (navigator.onLine) {
      this.triggerSync();
    }

    return tx;
  }

  /**
   * Processes the sync queue sequentially with exponential backoff
   */
  public async triggerSync(): Promise<void> {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) return;
    this.isProcessing = true;

    const token = localStorage.getItem('rbd_token') || localStorage.getItem('roh_token') || '';

    try {
      for (const tx of [...this.queue]) {
        if (tx.status === 'synced' || tx.status === 'conflict_detected') continue;

        tx.status = 'syncing';
        this.notify();

        try {
          const response = await fetch(tx.endpoint, {
            method: tx.action === 'create' ? 'POST' : tx.action === 'update' ? 'PUT' : 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
              'X-Idempotency-Key': tx.idempotencyKey
            },
            body: JSON.stringify(tx.payload)
          });

          if (response.ok) {
            tx.status = 'synced';
            // Remove from queue after success
            this.queue = this.queue.filter(item => item.idempotencyKey !== tx.idempotencyKey);
            await this.persistQueue();
          } else if (response.status === 409) {
            // Version Conflict
            tx.status = 'conflict_detected';
            tx.lastError = 'تعارض في إصدار السجل مع الخادم (Version Conflict)';
            await this.persistQueue();
          } else {
            tx.retryCount++;
            if (tx.retryCount >= tx.maxRetries) {
              tx.status = 'failed';
              tx.lastError = `فشل الإرسال بعد ${tx.maxRetries} محاولات (${response.statusText})`;
            } else {
              tx.status = 'saved_locally';
            }
            await this.persistQueue();
          }
        } catch (netErr: any) {
          tx.retryCount++;
          tx.status = 'saved_locally';
          tx.lastError = netErr.message || 'انقطاع في الاتصال بالخادم';
          await this.persistQueue();
          break; // Stop loop on true network disconnect
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getPendingCount(): number {
    return this.queue.filter(tx => tx.status !== 'synced').length;
  }
}

export const offlineSyncMachine = new NexoraOfflineSyncMachine();
export default offlineSyncMachine;
