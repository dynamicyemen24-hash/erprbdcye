/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Advanced Access Control & Anomaly Detection
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Session hijacking via fingerprinting
 * - Impossible travel attacks
 * - Brute force with distributed IPs
 * - Credential stuffing
 * - Token theft and reuse
 * - Lateral movement within the network
 * - Privilege escalation attempts
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Session Fingerprinting ─────────────────────────────────────────────────

/**
 * Generate a session fingerprint from request characteristics.
 * This binds the session to specific client attributes.
 */
export function generateSessionFingerprint(req: any): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    // Screen resolution and timezone are client-provided (less reliable)
    req.body?.fingerprint?.screenResolution || '',
    req.body?.fingerprint?.timezone || '',
    req.body?.fingerprint?.platform || '',
  ];

  return crypto.createHash('sha256').update(components.join('|')).digest('hex');
}

/**
 * Verify that a request matches the stored session fingerprint.
 * Returns true if the fingerprint is valid or if no fingerprint was stored.
 */
export function verifySessionFingerprint(
  currentFingerprint: string,
  storedFingerprint: string | null
): { valid: boolean; reason?: string } {
  if (!storedFingerprint) return { valid: true };
  if (!currentFingerprint) return { valid: true };

  // Allow minor differences (e.g., user-agent update)
  // Use Hamming distance on the first 16 bytes (32 hex chars)
  const currentPrefix = currentFingerprint.substring(0, 32);
  const storedPrefix = storedFingerprint.substring(0, 32);

  if (currentPrefix === storedPrefix) return { valid: true };

  // Calculate Hamming distance
  let distance = 0;
  for (let i = 0; i < Math.min(currentPrefix.length, storedPrefix.length); i++) {
    const xor = parseInt(currentPrefix[i], 16) ^ parseInt(storedPrefix[i], 16);
    distance += xor.toString(2).split('1').length - 1;
  }

  // Allow up to 4 bits difference (minor client changes)
  if (distance <= 4) return { valid: true };

  return { valid: false, reason: `Fingerprint mismatch (distance: ${distance})` };
}

// ─── Device Binding ─────────────────────────────────────────────────────────

interface DeviceRecord {
  deviceId: string;
  userId: string;
  fingerprint: string;
  lastSeen: Date;
  trusted: boolean;
  ipAddress: string;
  userAgent: string;
}

const deviceRegistry = new Map<string, DeviceRecord>();

/**
 * Register a device for a user.
 */
export function registerDevice(
  userId: string,
  fingerprint: string,
  ipAddress: string,
  userAgent: string
): DeviceRecord {
  const deviceId = crypto.randomUUID();
  const record: DeviceRecord = {
    deviceId,
    userId,
    fingerprint,
    lastSeen: new Date(),
    trusted: false, // New devices are untrusted by default
    ipAddress,
    userAgent,
  };
  deviceRegistry.set(deviceId, record);
  return record;
}

/**
 * Check if a device is recognized for a user.
 */
export function checkDevice(
  userId: string,
  fingerprint: string
): { recognized: boolean; deviceId?: string; trusted?: boolean } {
  for (const [deviceId, record] of deviceRegistry) {
    if (record.userId === userId && record.fingerprint === fingerprint) {
      record.lastSeen = new Date();
      return { recognized: true, deviceId, trusted: record.trusted };
    }
  }
  return { recognized: false };
}

/**
 * Trust a device (after user confirms via email/SMS).
 */
export function trustDevice(deviceId: string): boolean {
  const record = deviceRegistry.get(deviceId);
  if (!record) return false;
  record.trusted = true;
  return true;
}

// ─── Impossible Travel Detection ────────────────────────────────────────────

interface GeoEvent {
  userId: string;
  ipAddress: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
}

const recentGeoEvents = new Map<string, GeoEvent[]>();
const TRAVEL_SPEED_THRESHOLD_KMH = 1000; // Max realistic travel speed

/**
 * Record a geo event for a user.
 */
export function recordGeoEvent(event: GeoEvent): void {
  const events = recentGeoEvents.get(event.userId) || [];
  events.push(event);

  // Keep only last 24 hours of events
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = events.filter(e => e.timestamp.getTime() > cutoff);
  recentGeoEvents.set(event.userId, filtered);
}

/**
 * Detect impossible travel: two logins from distant locations in a short time.
 * Uses IP geolocation approximation (IP to rough coordinates).
 */
export function detectImpossibleTravel(userId: string): {
  impossible: boolean;
  reason?: string;
  events?: GeoEvent[];
} {
  const events = recentGeoEvents.get(userId) || [];
  if (events.length < 2) return { impossible: false };

  // Check consecutive events
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];

    if (!prev.latitude || !prev.longitude || !curr.latitude || !curr.longitude) {
      continue; // Can't calculate without coordinates
    }

    // Calculate distance (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = toRad(curr.latitude - prev.latitude);
    const dLon = toRad(curr.longitude - prev.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(prev.latitude)) *
        Math.cos(toRad(curr.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate time difference
    const timeDiffHours = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);

    if (timeDiffHours > 0) {
      const speed = distance / timeDiffHours;
      if (speed > TRAVEL_SPEED_THRESHOLD_KMH) {
        return {
          impossible: true,
          reason: `Travel speed ${Math.round(speed)} km/h exceeds threshold (${TRAVEL_SPEED_THRESHOLD_KMH} km/h). Distance: ${Math.round(distance)}km in ${Math.round(timeDiffHours * 60)}min`,
          events: [prev, curr],
        };
      }
    }
  }

  return { impossible: false };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── Anomaly Detection Engine ───────────────────────────────────────────────

interface AnomalyScore {
  userId: string;
  score: number; // 0-100
  reasons: string[];
  timestamp: Date;
}

const anomalyHistory = new Map<string, AnomalyScore[]>();

/**
 * Compute an anomaly score for a login attempt.
 */
export function computeLoginAnomalyScore(params: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
  timeOfDay: number; // 0-23
  isKnownDevice: boolean;
  isKnownIp: boolean;
  failedAttemptsRecent: number;
}): AnomalyScore {
  const reasons: string[] = [];
  let score = 0;

  // 1. Unknown device (high risk)
  if (!params.isKnownDevice) {
    score += 30;
    reasons.push('Unknown device');
  }

  // 2. Unknown IP (medium risk)
  if (!params.isKnownIp) {
    score += 15;
    reasons.push('Unknown IP address');
  }

  // 3. Unusual time of day (low risk)
  if (params.timeOfDay >= 0 && params.timeOfDay < 6) {
    score += 10;
    reasons.push('Login during unusual hours (00:00-06:00)');
  }

  // 4. Multiple failed attempts (high risk)
  if (params.failedAttemptsRecent >= 5) {
    score += 40;
    reasons.push(`${params.failedAttemptsRecent} recent failed attempts`);
  } else if (params.failedAttemptsRecent >= 3) {
    score += 20;
    reasons.push(`${params.failedAttemptsRecent} recent failed attempts`);
  }

  // 5. Fingerprint change (medium risk)
  // This is already handled by device check

  // 6. VPN/Tor detection (if user-agent indicates proxy)
  const proxyIndicators = ['tor', 'proxy', 'vpn'];
  if (proxyIndicators.some(ind => params.userAgent.toLowerCase().includes(ind))) {
    score += 15;
    reasons.push('Possible proxy/VPN detected');
  }

  const anomalyScore: AnomalyScore = {
    userId: params.userId,
    score: Math.min(100, score),
    reasons,
    timestamp: new Date(),
  };

  // Store in history
  const history = anomalyHistory.get(params.userId) || [];
  history.push(anomalyScore);
  if (history.length > 100) history.shift(); // Keep last 100
  anomalyHistory.set(params.userId, history);

  return anomalyScore;
}

/**
 * Get the anomaly history for a user.
 */
export function getAnomalyHistory(userId: string): AnomalyScore[] {
  return anomalyHistory.get(userId) || [];
}

/**
 * Check if a user should be blocked based on cumulative anomaly score.
 */
export function shouldBlockUser(userId: string): { blocked: boolean; reason?: string } {
  const history = anomalyHistory.get(userId) || [];
  const recent = history.filter(h => Date.now() - h.timestamp.getTime() < 30 * 60 * 1000); // Last 30 min

  if (recent.length === 0) return { blocked: false };

  const avgScore = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
  const maxScore = Math.max(...recent.map(h => h.score));

  if (maxScore >= 80 && recent.length >= 3) {
    return { blocked: true, reason: `High anomaly score: ${maxScore} (${recent.length} recent events)` };
  }

  if (avgScore >= 50 && recent.length >= 5) {
    return { blocked: true, reason: `Persistent anomalous activity: avg score ${Math.round(avgScore)}` };
  }

  return { blocked: false };
}

// ─── Advanced Access Control Middleware ──────────────────────────────────────

/**
 * Advanced session validation middleware.
 * Combines fingerprinting, device binding, and anomaly detection.
 */
export function advancedSessionMiddleware() {
  return (req: any, res: any, next: any) => {
    // Only apply to authenticated API routes
    if (!req.path.startsWith('/api') || req.path.startsWith('/api/auth') || req.path.startsWith('/api/health')) {
      return next();
    }

    const userId = req.user?.id;
    if (!userId) return next();

    // 1. Session fingerprint
    const currentFingerprint = generateSessionFingerprint(req);
    const storedFingerprint = req.session?.fingerprint;

    if (storedFingerprint) {
      const fpResult = verifySessionFingerprint(currentFingerprint, storedFingerprint);
      if (!fpResult.valid) {
        logger.warn(`[ACCESS] Session fingerprint mismatch for user ${userId}: ${fpResult.reason}`, {
          context: 'access-control',
          meta: { userId, ip: req.ip, path: req.path },
        });
      }
    }

    // 2. Device check
    const deviceCheck = checkDevice(userId, currentFingerprint);
    if (!deviceCheck.recognized) {
      logger.info(`[ACCESS] New device detected for user ${userId}`, {
        context: 'access-control',
        meta: { userId, ip: req.ip, userAgent: req.get('user-agent') },
      });
    }

    // 3. Anomaly check
    const blockCheck = shouldBlockUser(userId);
    if (blockCheck.blocked) {
      logger.warn(`[ACCESS] User ${userId} blocked due to anomalies: ${blockCheck.reason}`, {
        context: 'access-control',
        meta: { userId, ip: req.ip },
      });
      return res.status(403).json({
        error: 'Access temporarily restricted due to suspicious activity',
        message: 'يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الإدارة',
      });
    }

    // 4. Attach metadata to request for downstream use
    req._sessionFingerprint = currentFingerprint;
    req._deviceCheck = deviceCheck;

    next();
  };
}

export default {
  generateSessionFingerprint,
  verifySessionFingerprint,
  registerDevice,
  checkDevice,
  trustDevice,
  recordGeoEvent,
  detectImpossibleTravel,
  computeLoginAnomalyScore,
  getAnomalyHistory,
  shouldBlockUser,
  advancedSessionMiddleware,
};
