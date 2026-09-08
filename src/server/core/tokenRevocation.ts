/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — JWT Token Revocation & Blacklist System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Provides:
 * - Token blacklisting on logout / password change / account deactivation
 * - In-memory blacklist with TTL-based auto-expiry
 * - Database-backed persistence for multi-instance deployments
 * - Token fingerprinting for selective revocation
 * - Bulk revocation (e.g., all tokens for a user)
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from './logger';

// ─── In-Memory Blacklist (fast path) ────────────────────────────────────────

interface BlacklistEntry {
  tokenFingerprint: string;
  userId: string;
  expiresAt: Date;
  reason: string;
  revokedAt: Date;
}

const memoryBlacklist = new Map<string, BlacklistEntry>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean every minute

// Auto-cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryBlacklist) {
    if (entry.expiresAt.getTime() < now) {
      memoryBlacklist.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// ─── Token Fingerprinting ───────────────────────────────────────────────────

/**
 * Generate a unique fingerprint for a JWT token.
 * Uses the token's jti (JWT ID) claim if present, otherwise hashes the token.
 */
export function getTokenFingerprint(token: string): string {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded?.jti) {
      return crypto.createHash('sha256').update(decoded.jti).digest('hex').substring(0, 16);
    }
    // Fallback: hash the last 3 segments of the JWT (signature + parts)
    const parts = token.split('.');
    if (parts.length === 3) {
      return crypto.createHash('sha256').update(parts[2]).digest('hex').substring(0, 16);
    }
  } catch {
    // Invalid token
  }
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
}

// ─── Revocation Operations ──────────────────────────────────────────────────

/**
 * Revoke a specific token.
 */
export function revokeToken(token: string, reason: string = 'logout'): void {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded) return;

    const fingerprint = getTokenFingerprint(token);
    const expiresAt = new Date((decoded.exp || 0) * 1000);

    const entry: BlacklistEntry = {
      tokenFingerprint: fingerprint,
      userId: decoded.id || decoded.sub || 'unknown',
      expiresAt,
      reason,
      revokedAt: new Date(),
    };

    memoryBlacklist.set(fingerprint, entry);

    logger.info(`[TOKEN-REVOKED] Token revoked: ${reason}`, {
      context: 'token-revocation',
      meta: { userId: entry.userId, fingerprint, reason, expiresAt },
    });

    // Persist to database for multi-instance support
    persistRevocation(entry).catch(() => {});
  } catch (err: any) {
    logger.error(`[TOKEN-REVOKED] Failed to revoke token: ${err.message}`, {
      context: 'token-revocation',
    });
  }
}

/**
 * Revoke all tokens for a specific user.
 */
export function revokeAllUserTokens(userId: string, reason: string = 'security'): void {
  const revokeEntry: BlacklistEntry = {
    tokenFingerprint: `user:${userId}:${Date.now()}`,
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    reason,
    revokedAt: new Date(),
  };

  memoryBlacklist.set(revokeEntry.tokenFingerprint, revokeEntry);

  logger.info(`[TOKEN-REVOKED] All tokens revoked for user: ${userId}`, {
    context: 'token-revocation',
    meta: { userId, reason },
  });

  persistRevocation(revokeEntry).catch(() => {});
}

/**
 * Check if a token has been revoked.
 */
export function isTokenRevoked(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded) return true;

    const fingerprint = getTokenFingerprint(token);

    // 1. Check specific token revocation
    if (memoryBlacklist.has(fingerprint)) {
      return true;
    }

    // 2. Check user-wide revocation
    const userId = decoded.id || decoded.sub;
    if (userId) {
      for (const [, entry] of memoryBlacklist) {
        if (entry.userId === userId && entry.reason.includes('all')) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return true; // Invalid token = revoked
  }
}

// ─── Database Persistence ───────────────────────────────────────────────────

async function persistRevocation(entry: BlacklistEntry): Promise<void> {
  try {
    const { getPool } = await import('./database');
    const pool = getPool();
    await pool.query(
      `INSERT INTO token_blacklist (token_fingerprint, user_id, reason, revoked_at, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token_fingerprint) DO NOTHING`,
      [entry.tokenFingerprint, entry.userId, entry.reason, entry.revokedAt, entry.expiresAt]
    );
  } catch (err: any) {
    // Non-critical — in-memory blacklist is sufficient for single-instance
    logger.debug(`[TOKEN-REVOKED] DB persistence skipped: ${err.message}`, {
      context: 'token-revocation',
    });
  }
}

/**
 * Load blacklist from database on startup (for multi-instance recovery).
 */
export async function loadBlacklistFromDb(): Promise<void> {
  try {
    const { getPool } = await import('./database');
    const pool = getPool();
    const result = await pool.query(
      `SELECT token_fingerprint, user_id, reason, revoked_at, expires_at
       FROM token_blacklist
       WHERE expires_at > NOW()`
    );

    for (const row of result.rows) {
      memoryBlacklist.set(row.token_fingerprint, {
        tokenFingerprint: row.token_fingerprint,
        userId: row.user_id,
        reason: row.reason,
        revokedAt: row.revoked_at,
        expiresAt: row.expires_at,
      });
    }

    logger.info(`[TOKEN-REVOKED] Loaded ${result.rows.length} revoked tokens from database`, {
      context: 'token-revocation',
    });
  } catch (err: any) {
    logger.debug(`[TOKEN-REVOKED] Could not load blacklist from DB: ${err.message}`, {
      context: 'token-revocation',
    });
  }
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * Middleware to check if the current token has been revoked.
 */
export function tokenRevocationMiddleware() {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    if (isTokenRevoked(token)) {
      logger.warn(`[TOKEN-REVOKED] Revoked token used: ${req.ip} ${req.path}`, {
        context: 'token-revocation',
        meta: { ip: req.ip, path: req.path },
      });
      return res.status(401).json({ error: 'Token has been revoked. Please sign in again.' });
    }

    next();
  };
}

/**
 * Generate a unique token ID (jti) for new tokens.
 */
export function generateTokenId(): string {
  return crypto.randomUUID();
}

export default {
  revokeToken,
  revokeAllUserTokens,
  isTokenRevoked,
  loadBlacklistFromDb,
  tokenRevocationMiddleware,
  generateTokenId,
  getTokenFingerprint,
};
