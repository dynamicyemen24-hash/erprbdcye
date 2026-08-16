/**
 * NexoraOS™ High-Concurrency Client-Side Persistence Service
 * Powered by high-speed native IndexedDB with transparent sandboxed fallback.
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
  version: string;
}

const DB_NAME = 'NexoraOS_Offline_Cache';
const DB_VERSION = 1;
const STORE_VIEW_MODELS = 'view_models';
const STORE_PREFERENCES = 'user_preferences';

class NexoraPersistenceService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: Map<string, CacheEntry> = new Map();
  private hasIndexedDBSupport = typeof window !== 'undefined' && 'indexedDB' in window;

  constructor() {
    if (this.hasIndexedDBSupport) {
      this.initDB();
    } else {
      console.warn('[Persistence] IndexedDB is not supported in this runtime environment. Falling back to memory storage.');
    }
  }

  /**
   * Initializes the IndexedDB database structure.
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = request.result;
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains(STORE_VIEW_MODELS)) {
            db.createObjectStore(STORE_VIEW_MODELS, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(STORE_PREFERENCES)) {
            db.createObjectStore(STORE_PREFERENCES, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error('[Persistence] Failed to open IndexedDB:', request.error);
          reject(request.error || new Error('IndexedDB failed to initialize'));
        };
      } catch (err) {
        console.error('[Persistence] Critical error opening database:', err);
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Saves a typed model into the specified database store.
   */
  public async set<T = any>(
    storeName: 'view_models' | 'user_preferences',
    key: string,
    data: T,
    ttlMs?: number
  ): Promise<boolean> {
    const timestamp = Date.now();
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp,
      expiresAt: ttlMs ? timestamp + ttlMs : undefined,
      version: '2.0.0'
    };

    if (!this.hasIndexedDBSupport) {
      this.memoryFallback.set(`${storeName}:${key}`, entry);
      return true;
    }

    try {
      const db = await this.initDB();
      return new Promise<boolean>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(entry);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.warn(`[Persistence] Error writing to IndexedDB for key ${key}:`, request.error);
          // Fall back to memory on write failure (quota exceeded, sandbox, etc.)
          this.memoryFallback.set(`${storeName}:${key}`, entry);
          resolve(true);
        };
      });
    } catch (e) {
      this.memoryFallback.set(`${storeName}:${key}`, entry);
      return true;
    }
  }

  /**
   * Retrieves a typed model from the specified store, respecting expiration guidelines.
   */
  public async get<T = any>(
    storeName: 'view_models' | 'user_preferences',
    key: string
  ): Promise<T | null> {
    const fallbackKey = `${storeName}:${key}`;

    if (!this.hasIndexedDBSupport) {
      const entry = this.memoryFallback.get(fallbackKey);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.memoryFallback.delete(fallbackKey);
        return null;
      }
      return entry.data;
    }

    try {
      const db = await this.initDB();
      const entry = await new Promise<CacheEntry<T> | null>((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
          console.warn(`[Persistence] Read failed for key ${key}, checking fallback`);
          resolve(null);
        };
      });

      if (!entry) {
        // Double check fallback memory map
        const fbEntry = this.memoryFallback.get(fallbackKey);
        if (!fbEntry) return null;
        if (fbEntry.expiresAt && fbEntry.expiresAt < Date.now()) {
          this.memoryFallback.delete(fallbackKey);
          return null;
        }
        return fbEntry.data;
      }

      // Check TTL expiry
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        await this.delete(storeName, key);
        return null;
      }

      return entry.data;
    } catch (e) {
      const entry = this.memoryFallback.get(fallbackKey);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.memoryFallback.delete(fallbackKey);
        return null;
      }
      return entry.data;
    }
  }

  /**
   * Deletes a specific cached record.
   */
  public async delete(storeName: 'view_models' | 'user_preferences', key: string): Promise<boolean> {
    const fallbackKey = `${storeName}:${key}`;
    this.memoryFallback.delete(fallbackKey);

    if (!this.hasIndexedDBSupport) return true;

    try {
      const db = await this.initDB();
      return new Promise<boolean>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  /**
   * Flushes and clears entire cached stores.
   */
  public async clearStore(storeName: 'view_models' | 'user_preferences'): Promise<boolean> {
    // Clear relevant memory fallback records
    for (const key of Array.from(this.memoryFallback.keys())) {
      if (key.startsWith(`${storeName}:`)) {
        this.memoryFallback.delete(key);
      }
    }

    if (!this.hasIndexedDBSupport) return true;

    try {
      const db = await this.initDB();
      return new Promise<boolean>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }
}

export const persistenceService = new NexoraPersistenceService();
export default persistenceService;
