export interface OfflineTask {
  id: string;
  url?: string;
  method: string;
  body?: any;
  headers?: any;
  timestamp: number;
  description: string;
}

export interface SyncStatus {
    pendingTasksCount: number;
    status: 'online' | 'offline' | 'syncing' | 'synced' | 'pending';
    conflicts: { id: string; description: string }[];
}

class OfflineSyncManager {
  private queueKey = 'nexora_offline_sync_queue';
  private syncing = false;
  private cachedQueue: any[] | null = null;
  private isDirty = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notify();
        this.processQueue();
      });
      window.addEventListener('offline', () => {
        this.notify();
      });
    }
  }

  get isOnline() {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  getQueue(): any[] {
    if (this.cachedQueue !== null) return this.cachedQueue;
    try {
      const stored = localStorage.getItem(this.queueKey);
      this.cachedQueue = stored ? JSON.parse(stored) : [];
    } catch {
      this.cachedQueue = [];
    }
    return this.cachedQueue;
  }

  saveQueue(q: any[]) {
    this.cachedQueue = q;
    this.isDirty = true;
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(q));
    } catch {}
    this.notify();
  }

  addTask(task: Omit<OfflineTask, 'id' | 'timestamp'>) {
    const q = this.getQueue();
    q.push({
      ...task,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    });
    this.saveQueue(q);
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  removeTask(id: string) {
    const q = this.getQueue();
    this.saveQueue(q.filter(t => t.id !== id));
  }

  async processQueue() {
    if (this.syncing || !this.isOnline) return;
    const q = this.getQueue();
    if (q.length === 0) return;

    this.syncing = true;
    this.notify();

    for (const task of [...q]) {
      try {
        if (task.url && task.url.startsWith('/api')) {
           const res = await fetch(task.url, {
             method: task.method,
             headers: { 'Content-Type': 'application/json', ...task.headers },
             body: task.body ? JSON.stringify(task.body) : undefined
           });
           if (res.ok || res.status >= 400) {
              this.removeTask(task.id);
           }
        } else {
           await new Promise(r => setTimeout(r, 800)); 
           this.removeTask(task.id);
        }
      } catch (err) {
        console.error('Failed to sync task:', task, err);
        break; 
      }
    }

    this.syncing = false;
    this.notify();
  }

  subscribe(callback: (status: SyncStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.getStatus()));
  }
  
  getStatus(): SyncStatus {
    const q = this.getQueue();
    let st: SyncStatus['status'] = 'synced';
    if (!this.isOnline) st = 'offline';
    else if (this.syncing) st = 'syncing';
    else if (q.length > 0) st = 'pending';
    
    return {
      pendingTasksCount: q.length,
      status: st,
      conflicts: []
    };
  }
}

export const syncManager = new OfflineSyncManager();

export async function getSyncStatus(): Promise<SyncStatus> {
    return syncManager.getStatus();
}

export async function forceSync(): Promise<void> {
    await syncManager.processQueue();
}

if (typeof window !== 'undefined') {
  (window as any).nexoraSyncManager = syncManager;
}
