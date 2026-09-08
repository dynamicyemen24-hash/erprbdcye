/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Secure Logout & Session Invalidation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Provides:
 * - Complete session invalidation on logout
 * - Token revocation (blacklist)
 * - All-device logout option
 * - Audit logging of logout events
 * - CSRF-safe logout (POST only)
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../../core/logger';
import { revokeToken, revokeAllUserTokens } from '../../core/tokenRevocation';
import { revokeSession, revokeAllUserSessions } from '../../core/sessionManagement';
import { recordSecurityEvent } from '../../core/securityAlerting';

const router = Router();

// POST /api/auth/logout — Secure logout with full session invalidation
router.post('/logout', async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const sessionId = req.headers['x-session-id'] as string;

    let userId: string | undefined;

    // 1. Revoke the current token
    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        userId = decoded?.id || decoded?.sub;
        revokeToken(token, 'user_logout');
      } catch {
        // Token already invalid — proceed
      }
    }

    // 2. Revoke the current session
    if (sessionId) {
      revokeSession(sessionId, 'user_logout');
    }

    // 3. Log the event
    recordSecurityEvent({
      eventType: 'USER_LOGOUT',
      severity: 'INFO',
      source: 'auth',
      ip: req.ip,
      userId,
      path: req.path,
      details: { sessionId, tokenId: token ? 'present' : 'absent' },
    });

    logger.info(`[LOGOUT] User ${userId || 'unknown'} logged out`, {
      context: 'auth',
      meta: { userId, ip: req.ip },
    });

    res.json({
      status: 'success',
      message: 'تم تسجيل الخروج بنجاح',
    });
  } catch (err: any) {
    logger.error(`[LOGOUT] Error: ${err.message}`, { context: 'auth' });
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/logout-all — Revoke ALL sessions and tokens for the user
router.post('/logout-all', async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    let userId: string | undefined;

    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        userId = decoded?.id || decoded?.sub;
      } catch {
        // Token invalid
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unable to identify user' });
    }

    // Revoke all tokens for this user
    revokeAllUserTokens(userId, 'user_logout_all');

    // Revoke all sessions for this user
    const sessionCount = revokeAllUserSessions(userId, 'user_logout_all');

    // Log security event
    recordSecurityEvent({
      eventType: 'ALL_SESSIONS_REVOKED',
      severity: 'MEDIUM',
      source: 'auth',
      ip: req.ip,
      userId,
      path: req.path,
      details: { sessionsRevoked: sessionCount, reason: 'user_logout_all' },
    });

    logger.info(`[LOGOUT-ALL] All sessions revoked for user ${userId}: ${sessionCount} sessions`, {
      context: 'auth',
      meta: { userId, sessionCount, ip: req.ip },
    });

    res.json({
      status: 'success',
      message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
      sessionsRevoked: sessionCount,
    });
  } catch (err: any) {
    logger.error(`[LOGOUT-ALL] Error: ${err.message}`, { context: 'auth' });
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/sessions — Get active sessions for current user
router.get('/sessions', async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.decode(token) as any;
    const userId = decoded?.id || decoded?.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { getUserSessions } = await import('../../core/sessionManagement');
    const sessions = getUserSessions(userId);

    res.json({
      status: 'success',
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        ipAddress: s.ipAddress,
        browser: s.metadata.browser,
        os: s.metadata.os,
        device: s.metadata.device,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
      })),
    });
  } catch (err: any) {
    logger.error(`[SESSIONS] Error: ${err.message}`, { context: 'auth' });
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// POST /api/auth/revoke-session — Revoke a specific session
router.post('/revoke-session', async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.decode(token) as any;
    const userId = decoded?.id || decoded?.sub;
    const { sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const { revokeSession: revoke } = await import('../../core/sessionManagement');
    const revoked = revoke(sessionId, 'user_revoke');

    if (!revoked) {
      return res.status(404).json({ error: 'Session not found' });
    }

    recordSecurityEvent({
      eventType: 'SESSION_REVOKED',
      severity: 'INFO',
      source: 'auth',
      ip: req.ip,
      userId,
      path: req.path,
      details: { sessionId },
    });

    res.json({
      status: 'success',
      message: 'تم إلغاء الجلسة بنجاح',
    });
  } catch (err: any) {
    logger.error(`[REVOKE-SESSION] Error: ${err.message}`, { context: 'auth' });
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

export default router;
