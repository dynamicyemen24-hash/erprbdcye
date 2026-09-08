/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — Security Event Alerting & Monitoring
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Provides:
 * - Real-time security event classification and severity scoring
 * - Alert aggregation and deduplication
 * - Threshold-based alerting (brute force, intrusion detection)
 * - Security event dashboard API
 * - Integration with external alerting (webhooks, email)
 */

import crypto from 'crypto';
import logger from './logger';

// ─── Event Classification ───────────────────────────────────────────────────

export type EventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Runtime enum-like object for EventSeverity
export const EventSeverityValues = {
  INFO: 'INFO' as const,
  LOW: 'LOW' as const,
  MEDIUM: 'MEDIUM' as const,
  HIGH: 'HIGH' as const,
  CRITICAL: 'CRITICAL' as const,
} satisfies Record<EventSeverity, EventSeverity>;

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: EventSeverity;
  source: string;
  ip?: string;
  userId?: string;
  path?: string;
  details: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// ─── Event Store ────────────────────────────────────────────────────────────

const eventStore: SecurityEvent[] = [];
const MAX_EVENTS = 10000;
const ALERT_THRESHOLDS: Record<string, { count: number; windowMs: number; severity: EventSeverity }> = {
  'LOGIN_FAILED': { count: 5, windowMs: 15 * 60 * 1000, severity: 'HIGH' },
  'BRUTE_FORCE_DETECTED': { count: 10, windowMs: 15 * 60 * 1000, severity: 'CRITICAL' },
  'CREDENTIAL_STUFFING': { count: 20, windowMs: 15 * 60 * 1000, severity: 'CRITICAL' },
  'SQL_INJECTION_ATTEMPT': { count: 3, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'HONEYPOT_ACCESS': { count: 1, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'DEBUGGER_ATTACHED': { count: 1, windowMs: 60 * 1000, severity: 'CRITICAL' },
  'CANARY_TOKEN_TRIGGERED': { count: 1, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'TOKEN_REVOKED': { count: 5, windowMs: 15 * 60 * 1000, severity: 'HIGH' },
  'SESSION_HIJACK_ATTEMPT': { count: 1, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'PRIVILEGE_ESCALATION': { count: 1, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'DATA_EXFILTRATION_ATTEMPT': { count: 1, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'CODE_INJECTION_ATTEMPT': { count: 1, windowMs: 5 * 60 * 1000, severity: 'CRITICAL' },
  'REPLAY_ATTACK': { count: 3, windowMs: 10 * 60 * 1000, severity: 'HIGH' },
  'IMPOSSIBLE_TRAVEL': { count: 1, windowMs: 5 * 60 * 1000, severity: 'HIGH' },
  'RATE_LIMIT_EXCEEDED': { count: 10, windowMs: 15 * 60 * 1000, severity: 'MEDIUM' },
  'UNUSUAL_BEHAVIOR': { count: 5, windowMs: 30 * 60 * 1000, severity: 'MEDIUM' },
};

// ─── Event Recording ────────────────────────────────────────────────────────

/**
 * Record a security event.
 */
export function recordSecurityEvent(params: {
  eventType: string;
  severity: EventSeverity;
  source: string;
  ip?: string;
  userId?: string;
  path?: string;
  details?: Record<string, any>;
}): SecurityEvent {
  const event: SecurityEvent = {
    id: crypto.randomUUID(),
    eventType: params.eventType,
    severity: params.severity,
    source: params.source,
    ip: params.ip,
    userId: params.userId,
    path: params.path,
    details: params.details || {},
    timestamp: new Date(),
    acknowledged: false,
  };

  // Add to store
  eventStore.unshift(event);
  if (eventStore.length > MAX_EVENTS) {
    eventStore.pop();
  }

  // Log based on severity
  const logFn = params.severity === 'CRITICAL' || params.severity === 'HIGH'
    ? logger.error
    : params.severity === 'MEDIUM'
    ? logger.warn
    : logger.info;

  logFn(`[SECURITY] ${params.eventType}: ${params.severity}`, {
    context: 'security-event',
    meta: {
      eventId: event.id,
      eventType: event.eventType,
      severity: event.severity,
      ip: event.ip,
      userId: event.userId,
      path: event.path,
    },
  });

  // Check thresholds and trigger alerts
  checkAlertThreshold(event);

  // Persist to database
  persistEvent(event).catch(() => {});

  return event;
}

// ─── Alert Threshold Checking ───────────────────────────────────────────────

function checkAlertThreshold(event: SecurityEvent): void {
  const threshold = ALERT_THRESHOLDS[event.eventType];
  if (!threshold) return;

  const windowStart = Date.now() - threshold.windowMs;
  const recentEvents = eventStore.filter(
    e => e.eventType === event.eventType && e.timestamp.getTime() > windowStart
  );

  if (recentEvents.length >= threshold.count) {
    triggerAlert(event.eventType, threshold.severity, recentEvents);
  }
}

function triggerAlert(eventType: string, severity: EventSeverity, events: SecurityEvent[]): void {
  const alertId = crypto.randomUUID();
  const uniqueIps = new Set(events.map(e => e.ip).filter(Boolean));
  const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));

  logger.error(`[ALERT] ${eventType} — Threshold exceeded! ${events.length} events in window`, {
    context: 'security-alert',
    meta: {
      alertId,
      eventType,
      severity,
      eventCount: events.length,
      uniqueIps: Array.from(uniqueIps),
      uniqueUsers: Array.from(uniqueUsers),
      timeWindow: `${ALERT_THRESHOLDS[eventType].windowMs / 60000} minutes`,
    },
  });

  // Send webhook alert if configured
  sendWebhookAlert({
    alertId,
    eventType,
    severity,
    eventCount: events.length,
    uniqueIps: Array.from(uniqueIps),
    timestamp: new Date(),
  }).catch(() => {});
}

// ─── Webhook Alerting ───────────────────────────────────────────────────────

interface AlertPayload {
  alertId: string;
  eventType: string;
  severity: EventSeverity;
  eventCount: number;
  uniqueIps: string[];
  timestamp: Date;
}

async function sendWebhookAlert(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Security Alert: ${payload.eventType}`,
        ...payload,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logger.warn(`[ALERT] Webhook alert failed: ${response.status}`, { context: 'security-alert' });
    }
  } catch (err: any) {
    logger.debug(`[ALERT] Webhook alert error: ${err.message}`, { context: 'security-alert' });
  }
}

// ─── Database Persistence ───────────────────────────────────────────────────

async function persistEvent(event: SecurityEvent): Promise<void> {
  try {
    const { getPool } = await import('./database');
    const pool = getPool();
    await pool.query(
      `INSERT INTO security_events (id, event_type, severity, source, ip_address, user_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.id,
        event.eventType,
        event.severity,
        event.source,
        event.ip || null,
        event.userId || null,
        JSON.stringify(event.details),
        event.timestamp,
      ]
    );
  } catch {
    // Non-critical
  }
}

// ─── Query Operations ───────────────────────────────────────────────────────

/**
 * Get recent security events.
 */
export function getRecentEvents(options: {
  limit?: number;
  severity?: EventSeverity;
  eventType?: string;
  userId?: string;
  ip?: string;
} = {}): SecurityEvent[] {
  let events = [...eventStore];

  if (options.severity) {
    events = events.filter(e => e.severity === options.severity);
  }
  if (options.eventType) {
    events = events.filter(e => e.eventType === options.eventType);
  }
  if (options.userId) {
    events = events.filter(e => e.userId === options.userId);
  }
  if (options.ip) {
    events = events.filter(e => e.ip === options.ip);
  }

  return events.slice(0, options.limit || 100);
}

/**
 * Get security event statistics.
 */
export function getEventStats(windowMs: number = 60 * 60 * 1000): {
  total: number;
  bySeverity: Record<EventSeverity, number>;
  byType: Record<string, number>;
  topIps: { ip: string; count: number }[];
} {
  const cutoff = Date.now() - windowMs;
  const events = eventStore.filter(e => e.timestamp.getTime() > cutoff);

  const bySeverity: Record<EventSeverity, number> = {
    INFO: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0,
  };
  const byType: Record<string, number> = {};
  const ipCounts = new Map<string, number>();

  for (const event of events) {
    bySeverity[event.severity]++;
    byType[event.eventType] = (byType[event.eventType] || 0) + 1;
    if (event.ip) {
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
    }
  }

  const topIps = Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { total: events.length, bySeverity, byType, topIps };
}

/**
 * Acknowledge a security event.
 */
export function acknowledgeEvent(eventId: string, acknowledgedBy: string): boolean {
  const event = eventStore.find(e => e.id === eventId);
  if (!event) return false;
  event.acknowledged = true;
  event.acknowledgedBy = acknowledgedBy;
  event.acknowledgedAt = new Date();
  return true;
}

// ─── Security Dashboard Data ────────────────────────────────────────────────

/**
 * Get comprehensive security dashboard data.
 */
export function getSecurityDashboard(): {
  summary: {
    totalEvents24h: number;
    criticalAlerts: number;
    activeSessions: number;
    blockedIps: number;
  };
  eventStats: ReturnType<typeof getEventStats>;
  recentCritical: SecurityEvent[];
  topThreats: { eventType: string; count: number; severity: EventSeverity }[];
} {
  const stats1h = getEventStats(60 * 60 * 1000);
  const stats24h = getEventStats(24 * 60 * 60 * 1000);
  const recentCritical = getRecentEvents({ severity: 'CRITICAL', limit: 20 });

  const topThreats = Object.entries(stats24h.byType)
    .map(([eventType, count]) => ({
      eventType,
      count,
      severity: ALERT_THRESHOLDS[eventType]?.severity || 'LOW' as EventSeverity,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    summary: {
      totalEvents24h: stats24h.total,
      criticalAlerts: stats24h.bySeverity.CRITICAL,
      activeSessions: 0, // Will be populated by session module
      blockedIps: 0, // Will be populated by IP blocklist
    },
    eventStats: stats1h,
    recentCritical,
    topThreats,
  };
}

export default {
  recordSecurityEvent,
  getRecentEvents,
  getEventStats,
  acknowledgeEvent,
  getSecurityDashboard,
  EventSeverity: EventSeverityValues,
};
