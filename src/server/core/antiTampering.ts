/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Anti-Tampering & Request Integrity
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Request payload tampering & replay attacks
 * - Man-in-the-middle modification
 * - Unauthorized data exfiltration
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Request Signing & Verification ─────────────────────────────────────────

const REQUEST_SIGNING_SECRET = process.env.REQUEST_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify an inbound request signature.
 */
export function verifyRequestSignature(
  signature: string,
  timestamp: string,
  method: string,
  path: string,
  body?: string
): { valid: boolean; reason?: string } {
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { valid: false, reason: 'Invalid timestamp' };
  }
  const now = Date.now();
  if (Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, reason: 'Request expired' };
  }

  const bodyHash = body ? crypto.createHash('sha256').update(body).digest('hex') : '';
  const payload = `${timestamp}:${method.toUpperCase()}:${path}:${bodyHash}`;
  const expected = crypto
    .createHmac('sha256', REQUEST_SIGNING_SECRET)
    .update(payload)
    .digest('hex');

  if (signature.length !== expected.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return valid ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
}

// ─── Request Fingerprinting & Replay Detection ──────────────────────────────

const recentRequests = new Map<string, { timestamp: number; count: number }>();
const REPLAY_WINDOW_MS = 60 * 1000;
const MAX_DUPLICATE_REQUESTS = 3;

export function generateRequestFingerprint(
  method: string,
  path: string,
  body: any,
  userId: string
): string {
  const timestampBucket = Math.floor(Date.now() / REPLAY_WINDOW_MS);
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body || {});
  const payload = `${method}:${path}:${bodyStr}:${userId}:${timestampBucket}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function detectReplayAttack(fingerprint: string): { isReplay: boolean; count: number } {
  const now = Date.now();
  for (const [key, entry] of recentRequests) {
    if (now - entry.timestamp > REPLAY_WINDOW_MS) {
      recentRequests.delete(key);
    }
  }
  const existing = recentRequests.get(fingerprint);
  if (existing) {
    existing.count++;
    return { isReplay: existing.count > MAX_DUPLICATE_REQUESTS, count: existing.count };
  }
  recentRequests.set(fingerprint, { timestamp: now, count: 1 });
  return { isReplay: false, count: 1 };
}

// ─── Anti-Tamper Middleware ──────────────────────────────────────────────────

export function antiTamperMiddleware() {
  return (req: any, res: any, next: any) => {
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }

    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/health')) {
      return next();
    }

    const signature = req.headers['x-request-signature'] as string;
    const timestamp = req.headers['x-request-timestamp'] as string;

    if (signature && timestamp) {
      const bodyStr = req.body ? JSON.stringify(req.body) : '';
      const result = verifyRequestSignature(signature, timestamp, req.method, req.path, bodyStr);

      if (!result.valid) {
        logger.warn(`[ANTI-TAMPER] Invalid request signature: ${result.reason}`, {
          context: 'anti-tamper',
          meta: { ip: req.ip, path: req.path, method: req.method },
        });
        return res.status(403).json({ error: 'Request integrity verification failed' });
      }
    }

    const userId = req.user?.id || req.ip;
    const fingerprint = generateRequestFingerprint(req.method, req.path, req.body, userId);
    const replayResult = detectReplayAttack(fingerprint);

    if (replayResult.isReplay) {
      logger.warn(`[ANTI-TAMPER] Replay attack detected: ${replayResult.count} duplicate requests`, {
        context: 'anti-tamper',
        meta: { ip: req.ip, path: req.path, userId, count: replayResult.count },
      });
      return res.status(429).json({ error: 'Duplicate request detected. Please wait before retrying.' });
    }

    next();
  };
}

// ─── Anti-Exfiltration Headers ──────────────────────────────────────────────

export function antiExfiltrationMiddleware() {
  return (req: any, res: any, next: any) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    next();
  };
}

export default {
  verifyRequestSignature,
  generateRequestFingerprint,
  detectReplayAttack,
  antiTamperMiddleware,
  antiExfiltrationMiddleware,
};
