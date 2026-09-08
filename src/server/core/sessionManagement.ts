/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Session Management & Security
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Provides:
 * - Active session tracking per user
 * - Concurrent session limits
 * - Session invalidation on logout / password change
 * - Session metadata (IP, user-agent, device, location)
 * - Anomalous session detection
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Session Store ──────────────────────────────────────────────────────────

interface Session {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  metadata: {
    browser?: string;
    os?: string;
    device?: string;
    location?: string;
  };
}

const sessionStore = new Map<string, Session>();
const userSessions = new Map<string, Set<string>>(); // userId -> Set<sessionId>

// Configuration
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENT_SESSIONS = 5;
const SESSION_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Session Creation ───────────────────────────────────────────────────────

/**
 * Create a new session for a user.
 */
export function createSession(params: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
}): Session {
  const { userId, ipAddress, userAgent, fingerprint } = params;

  // Check concurrent session limit
  const existingSessions = getUserSessions(userId);
  if (existingSessions.length >= MAX_CONCURRENT_SESSIONS) {
    // Revoke oldest session
    const oldest = existingSessions.sort((a, b) =>
      a.lastActivity.getTime() - b.lastActivity.getTime()
    )[0];
    revokeSession(oldest.sessionId, 'concurrent_limit');
    logger.warn(`[SESSION] Concurrent limit reached for user ${userId}, revoked oldest session`, {
      context: 'session',
      meta: { userId, revokedSessionId: oldest.sessionId },
    });
  }

  const sessionId = crypto.randomUUID();
  const now = new Date();

  const session: Session = {
    sessionId,
    userId,
    ipAddress,
    userAgent,
    fingerprint,
    createdAt: now,
    lastActivity: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    isActive: true,
    metadata: parseUserAgent(userAgent),
  };

  sessionStore.set(sessionId, session);

  // Track by user
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  userSessions.get(userId)!.add(sessionId);

  logger.info(`[SESSION] Created session for user ${userId}`, {
    context: 'session',
    meta: { sessionId, userId, ipAddress, browser: session.metadata.browser },
  });

  return session;
}

// ─── Session Validation ─────────────────────────────────────────────────────

/**
 * Validate a session and update last activity.
 */
export function validateSession(
  sessionId: string,
  ipAddress: string,
  userAgent: string
): { valid: boolean; session?: Session; reason?: string } {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  if (!session.isActive) {
    return { valid: false, reason: 'Session is inactive' };
  }

  if (new Date() > session.expiresAt) {
    session.isActive = false;
    sessionStore.delete(sessionId);
    userSessions.get(session.userId)?.delete(sessionId);
    return { valid: false, reason: 'Session expired' };
  }

  // Check idle timeout
  const idleTime = Date.now() - session.lastActivity.getTime();
  if (idleTime > IDLE_TIMEOUT_MS) {
    session.isActive = false;
    sessionStore.delete(sessionId);
    userSessions.get(session.userId)?.delete(sessionId);
    return { valid: false, reason: 'Session idle timeout' };
  }

  // Update last activity
  session.lastActivity = new Date();

  // Detect IP change (session hijacking indicator)
  if (session.ipAddress !== ipAddress) {
    logger.warn(`[SESSION] IP change detected for session ${sessionId}: ${session.ipAddress} -> ${ipAddress}`, {
      context: 'session',
      meta: { sessionId, oldIp: session.ipAddress, newIp: ipAddress, userId: session.userId },
    });
  }

  // Detect user-agent change
  if (session.userAgent !== userAgent) {
    logger.warn(`[SESSION] User-Agent change detected for session ${sessionId}`, {
      context: 'session',
      meta: { sessionId, userId: session.userId },
    });
  }

  return { valid: true, session };
}

// ─── Session Operations ─────────────────────────────────────────────────────

/**
 * Get all active sessions for a user.
 */
export function getUserSessions(userId: string): Session[] {
  const sessionIds = userSessions.get(userId) || new Set();
  const sessions: Session[] = [];

  for (const sessionId of sessionIds) {
    const session = sessionStore.get(sessionId);
    if (session && session.isActive && new Date() <= session.expiresAt) {
      sessions.push(session);
    } else if (session) {
      // Clean up expired/inactive sessions
      session.isActive = false;
      sessionStore.delete(sessionId);
      sessionIds.delete(sessionId);
    }
  }

  return sessions;
}

/**
 * Revoke a specific session.
 */
export function revokeSession(sessionId: string, reason: string = 'logout'): boolean {
  const session = sessionStore.get(sessionId);
  if (!session) return false;

  session.isActive = false;
  sessionStore.delete(sessionId);
  userSessions.get(session.userId)?.delete(sessionId);

  logger.info(`[SESSION] Revoked session ${sessionId}: ${reason}`, {
    context: 'session',
    meta: { sessionId, userId: session.userId, reason },
  });

  return true;
}

/**
 * Revoke all sessions for a user.
 */
export function revokeAllUserSessions(userId: string, reason: string = 'security'): number {
  const sessionIds = userSessions.get(userId) || new Set();
  let count = 0;

  for (const sessionId of sessionIds) {
    const session = sessionStore.get(sessionId);
    if (session) {
      session.isActive = false;
      sessionStore.delete(sessionId);
      count++;
    }
  }

  userSessions.set(userId, new Set());

  logger.info(`[SESSION] Revoked ${count} sessions for user ${userId}: ${reason}`, {
    context: 'session',
    meta: { userId, count, reason },
  });

  return count;
}

/**
 * Get session count for a user.
 */
export function getSessionCount(userId: string): number {
  return getUserSessions(userId).length;
}

// ─── Anomalous Session Detection ────────────────────────────────────────────

/**
 * Detect suspicious session activity.
 */
export function detectSuspiciousSession(session: Session): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // 1. Multiple IP addresses for same user
  const userSessionsList = getUserSessions(session.userId);
  const uniqueIps = new Set(userSessionsList.map(s => s.ipAddress));
  if (uniqueIps.size > 3) {
    reasons.push(`${uniqueIps.size} different IP addresses for this user`);
  }

  // 2. Session from unusual location (simplified)
  // In production, integrate with GeoIP service

  // 3. Very long session
  const sessionDuration = Date.now() - session.createdAt.getTime();
  if (sessionDuration > 12 * 60 * 60 * 1000) { // 12 hours
    reasons.push(`Session active for ${Math.round(sessionDuration / 3600000)} hours`);
  }

  return { suspicious: reasons.length > 0, reasons };
}

// ─── Session Cleanup ────────────────────────────────────────────────────────

setInterval(() => {
  const now = new Date();
  let cleaned = 0;

  for (const [sessionId, session] of sessionStore) {
    if (!session.isActive || now > session.expiresAt) {
      sessionStore.delete(sessionId);
      userSessions.get(session.userId)?.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`[SESSION] Cleaned up ${cleaned} expired sessions`, { context: 'session' });
  }
}, SESSION_CLEANUP_INTERVAL_MS);

// ─── User-Agent Parser ──────────────────────────────────────────────────────

function parseUserAgent(userAgent: string): Session['metadata'] {
  const ua = userAgent.toLowerCase();

  let browser = 'Unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone')) os = 'iOS';

  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, os, device };
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * Session management middleware.
 * Validates and tracks sessions for authenticated requests.
 */
export function sessionManagementMiddleware() {
  return (req: any, res: any, next: any) => {
    // Only apply to authenticated API routes
    if (!req.path.startsWith('/api') || req.path.startsWith('/api/auth') || req.path.startsWith('/api/health')) {
      return next();
    }

    const userId = req.user?.id;
    if (!userId) return next();

    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      // No session ID — continue without session validation
      // (Some endpoints may not require session tracking)
      return next();
    }

    const validation = validateSession(sessionId, req.ip || 'unknown', req.get('user-agent') || '');

    if (!validation.valid) {
      logger.warn(`[SESSION] Invalid session: ${validation.reason}`, {
        context: 'session',
        meta: { sessionId, userId, reason: validation.reason },
      });
      return res.status(401).json({ error: `Session invalid: ${validation.reason}` });
    }

    // Check for suspicious activity
    if (validation.session) {
      const suspicious = detectSuspiciousSession(validation.session);
      if (suspicious.suspicious) {
        logger.warn(`[SESSION] Suspicious session detected: ${suspicious.reasons.join(', ')}`, {
          context: 'session',
          meta: { sessionId, userId, reasons: suspicious.reasons },
        });
      }
    }

    // Attach session to request
    req._session = validation.session;
    next();
  };
}

export default {
  createSession,
  validateSession,
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
  getSessionCount,
  detectSuspiciousSession,
  sessionManagementMiddleware,
};
