/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Anti-Automation & Behavioral Analysis
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Protects against:
 * - Bot and crawler attacks
 * - API abuse and scraping
 * - Sequential parameter guessing
 * - Form spam and injection
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Behavioral Fingerprint ─────────────────────────────────────────────────

interface BehavioralProfile {
  userId: string;
  requestPatterns: {
    avgInterval: number;
    avgPayloadSize: number;
    commonPaths: Map<string, number>;
    methodDistribution: Record<string, number>;
  };
  timingPatterns: {
    dayHours: number[];
    weekendRatio: number;
  };
  lastSeen: Date;
}

const behavioralProfiles = new Map<string, BehavioralProfile>();

function recordBehavior(userId: string, req: any): void {
  let profile = behavioralProfiles.get(userId);
  if (!profile) {
    profile = {
      userId,
      requestPatterns: {
        avgInterval: 0,
        avgPayloadSize: 0,
        commonPaths: new Map(),
        methodDistribution: { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0 },
      },
      timingPatterns: {
        dayHours: new Array(24).fill(0),
        weekendRatio: 0,
      },
      lastSeen: new Date(),
    };
    behavioralProfiles.set(userId, profile);
  }

  const now = new Date();
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  profile.timingPatterns.dayHours[hour]++;
  const totalDays = profile.timingPatterns.dayHours.reduce((a, b) => a + b, 0);
  const weekendRequests = profile.timingPatterns.dayHours.slice(0, 8).reduce((a, b) => a + b, 0);
  profile.timingPatterns.weekendRatio = totalDays > 0 ? weekendRequests / totalDays : 0;

  const method = req.method as keyof typeof profile.requestPatterns.methodDistribution;
  if (profile.requestPatterns.methodDistribution[method] !== undefined) {
    profile.requestPatterns.methodDistribution[method]++;
  }

  profile.requestPatterns.commonPaths.set(
    req.path,
    (profile.requestPatterns.commonPaths.get(req.path) || 0) + 1
  );

  profile.lastSeen = now;
}

function detectBehavioralAnomaly(userId: string, req: any): {
  anomalous: boolean;
  reasons: string[];
  confidence: number;
} {
  const profile = behavioralProfiles.get(userId);
  if (!profile) return { anomalous: false, reasons: [], confidence: 0 };

  const reasons: string[] = [];
  let confidence = 0;

  const hour = new Date().getHours();
  if (profile.timingPatterns.dayHours[hour] < 2) {
    reasons.push('unusual_time');
    confidence += 0.3;
  }

  if (!profile.requestPatterns.commonPaths.has(req.path)) {
    reasons.push('new_endpoint');
    confidence += 0.2;
  }

  if (req.method === 'DELETE' && profile.requestPatterns.methodDistribution.DELETE > 10) {
    reasons.push('excessive_deletes');
    confidence += 0.4;
  }

  const avgSize = profile.requestPatterns.avgPayloadSize;
  const currentSize = req.body ? JSON.stringify(req.body).length : 0;
  if (currentSize > avgSize * 10 && avgSize > 0) {
    reasons.push('unusual_payload_size');
    confidence += 0.3;
  }

  return {
    anomalous: confidence > 0.5,
    reasons,
    confidence: Math.min(confidence, 1),
  };
}

// ─── Sequential Attack Detection ────────────────────────────────────────────

function detectSequentialAttack(userId: string, path: string): {
  isSequential: boolean;
  sequence?: string[];
} {
  const profile = behavioralProfiles.get(userId);
  if (!profile) return { isSequential: false };

  const pathParts = path.split('/');
  const lastPart = pathParts[pathParts.length - 1];

  if (/^\d+$/.test(lastPart)) {
    const num = parseInt(lastPart);
    const nearbyAccessed = [];
    for (let i = num - 5; i <= num + 5; i++) {
      if (i === num) continue;
      const testPath = [...pathParts.slice(0, -1), i.toString()].join('/');
      if (profile.requestPatterns.commonPaths.has(testPath)) {
        nearbyAccessed.push(testPath);
      }
    }

    if (nearbyAccessed.length >= 3) {
      return { isSequential: true, sequence: nearbyAccessed };
    }
  }

  return { isSequential: false };
}

// ─── Anti-Automation Middleware ──────────────────────────────────────────────

export function antiAutomationMiddleware() {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python-requests/i, /go-http/i,
    /java\//i, /perl/i, /ruby/i, /php/i,
    /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
  ];

  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip',
    'x-client-ip',
  ];

  return (req: any, res: any, next: any) => {
    const userAgent = req.get('user-agent') || '';

    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/health')) {
      for (const pattern of botPatterns) {
        if (pattern.test(userAgent)) {
          logger.warn(`[ANTI-AUTO] Bot detected on sensitive endpoint: ${userAgent}`, {
            context: 'anti-automation',
            meta: { ip: req.ip, path: req.path, userAgent },
          });
          return res.status(403).json({ error: 'Automated access not permitted' });
        }
      }
    }

    for (const header of suspiciousHeaders) {
      const value = req.get(header);
      if (value && value.includes(',')) {
        logger.warn(`[ANTI-AUTO] Suspicious header value: ${header}: ${value}`, {
          context: 'anti-automation',
          meta: { ip: req.ip, path: req.path, header, value },
        });
      }
    }

    if (!req.get('accept') || !req.get('accept-language')) {
      if (req.path.startsWith('/api/') && req.method !== 'OPTIONS') {
        logger.warn(`[ANTI-AUTO] Missing standard headers`, {
          context: 'anti-automation',
          meta: { ip: req.ip, path: req.path },
        });
      }
    }

    next();
  };
}

// ─── Behavioral Analysis Middleware ─────────────────────────────────────────

export function behavioralAnalysisMiddleware() {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) return next();

    recordBehavior(userId, req);

    const anomaly = detectBehavioralAnomaly(userId, req);
    if (anomaly.anomalous) {
      logger.warn(`[BEHAVIOR] Anomalous behavior detected for user ${userId}: ${anomaly.reasons.join(', ')}`, {
        context: 'behavioral-analysis',
        meta: {
          userId,
          confidence: anomaly.confidence,
          reasons: anomaly.reasons,
          ip: req.ip,
          path: req.path,
        },
      });
      req._behavioralAnomaly = anomaly;
    }

    const seqCheck = detectSequentialAttack(userId, req.path);
    if (seqCheck.isSequential) {
      logger.warn(`[BEHAVIOR] Sequential attack detected for user ${userId}`, {
        context: 'behavioral-analysis',
        meta: { userId, path: req.path, sequence: seqCheck.sequence },
      });
    }

    next();
  };
}

export default {
  antiAutomationMiddleware,
  behavioralAnalysisMiddleware,
};
