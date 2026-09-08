/**
 * NexoraOS™ — API Key Authentication Middleware
 * Supports multiple API keys with scoped permissions.
 * Used for external integrations, webhooks, and service-to-service auth.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface ApiKey {
  id: string;
  key: string; // Hashed with SHA-256
  name: string;
  permissions: string[];
  rateLimit: number; // requests per minute
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

interface ApiKeyConfig {
  /** Environment variable containing comma-separated API keys */
  envVar?: string;
  /** Custom key store (for database-backed keys) */
  keyStore?: ApiKeyStore;
  /** Required permissions for the route */
  requiredPermissions?: string[];
}

interface ApiKeyStore {
  getKey(hash: string): Promise<ApiKey | null>;
  updateLastUsed(hash: string): Promise<void>;
}

// In-memory API key store (for development)
const memoryStore = new Map<string, ApiKey>();

/**
 * Create a SHA-256 hash of an API key for secure storage.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key with prefix.
 * Format: `nx_live_<random48chars>`
 */
export function generateApiKey(): { key: string; hash: string } {
  const random = crypto.randomBytes(36).toString('base64url').slice(0, 48);
  const key = `nx_live_${random}`;
  const hash = hashApiKey(key);
  return { key, hash };
}

/**
 * Validate API key format.
 */
function isValidKeyFormat(key: string): boolean {
  return /^nx_live_[A-Za-z0-9_-]{48}$/.test(key);
}

/**
 * API Key authentication middleware.
 * Validates the X-API-Key header against known keys.
 */
export function apiKeyAuth(config: ApiKeyConfig = {}) {
  const { envVar = 'API_KEYS', keyStore, requiredPermissions = [] } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'Include X-API-Key header with your request',
      });
      return;
    }

    // Validate key format
    if (!isValidKeyFormat(apiKey)) {
      res.status(401).json({ error: 'Invalid API key format' });
      return;
    }

    // Hash the key for lookup
    const keyHash = hashApiKey(apiKey);

    // Check key store
    let keyData: ApiKey | null = null;

    if (keyStore) {
      keyData = await keyStore.getKey(keyHash);
    } else {
      // Check environment variable keys
      const envKeys = (process.env[envVar] || '').split(',').filter(Boolean);
      for (const envKey of envKeys) {
        if (hashApiKey(envKey.trim()) === keyHash) {
          keyData = {
            id: `env_${keyHash.slice(0, 8)}`,
            key: keyHash,
            name: 'environment-key',
            permissions: ['*'],
            rateLimit: 1000,
            createdAt: new Date().toISOString(),
          };
          break;
        }
      }

      // Check memory store
      if (!keyData) {
        keyData = memoryStore.get(keyHash) || null;
      }
    }

    // Key not found
    if (!keyData) {
      // Rate limit key validation attempts (prevent brute force)
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    // Check if key is revoked
    if (keyData.revokedAt) {
      res.status(403).json({ error: 'API key has been revoked' });
      return;
    }

    // Check if key is expired
    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      res.status(403).json({ error: 'API key has expired' });
      return;
    }

    // Check permissions
    if (requiredPermissions.length > 0 && !keyData.permissions.includes('*')) {
      const hasPermission = requiredPermissions.every(p =>
        keyData!.permissions.includes(p)
      );
      if (!hasPermission) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermissions,
          granted: keyData.permissions,
        });
        return;
      }
    }

    // Update last used timestamp
    if (keyStore) {
      await keyStore.updateLastUsed(keyHash);
    } else if (memoryStore.has(keyHash)) {
      const stored = memoryStore.get(keyHash)!;
      stored.lastUsedAt = new Date().toISOString();
      memoryStore.set(keyHash, stored);
    }

    // Attach key info to request
    res.locals.apiKey = {
      id: keyData.id,
      name: keyData.name,
      permissions: keyData.permissions,
    };

    // Add API key info to response headers
    res.setHeader('X-API-Key-ID', keyData.id);

    next();
  };
}

/**
 * Store an API key in memory (for development/testing).
 */
export function storeApiKey(key: ApiKey): void {
  memoryStore.set(key.key, key);
}

/**
 * List all stored API keys (redacted).
 */
export function listApiKeys(): Array<Omit<ApiKey, 'key'>> {
  return Array.from(memoryStore.values()).map(k => ({
    id: k.id,
    name: k.name,
    permissions: k.permissions,
    rateLimit: k.rateLimit,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt,
    lastUsedAt: k.lastUsedAt,
    revokedAt: k.revokedAt,
  }));
}

/**
 * Revoke an API key.
 */
export function revokeApiKey(keyHash: string): boolean {
  const key = memoryStore.get(keyHash);
  if (key) {
    key.revokedAt = new Date().toISOString();
    memoryStore.set(keyHash, key);
    return true;
  }
  return false;
}
