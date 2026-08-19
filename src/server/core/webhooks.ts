/**
 * NexoraOS™ — Webhook System
 * Event-driven notifications with retry logic and HMAC signing
 */

import crypto from 'crypto';
import logger from './logger';

export interface WebhookEvent {
  id: string;
  type: string;
  tenantId: string;
  timestamp: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  responseBody?: string;
  responseCode?: number;
}

const SIGNATURE_HEADER = 'X-Nexora-Signature';
const EVENT_ID_HEADER = 'X-Nexora-Event-Id';
const TIMESTAMP_HEADER = 'X-Nexora-Timestamp';

class WebhookService {
  private subscriptions = new Map<string, WebhookSubscription>();
  private deliveries = new Map<string, WebhookDelivery>();
  private queue: WebhookEvent[] = [];
  private processing = false;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(maxRetries = 3, timeoutMs = 10000) {
    this.maxRetries = parseInt(process.env.WEBHOOK_MAX_RETRIES || String(maxRetries));
    this.timeoutMs = parseInt(process.env.WEBHOOK_TIMEOUT_MS || String(timeoutMs));
  }

  // ─── Subscription Management ───────────────────────

  subscribe(tenantId: string, url: string, events: string[], secret?: string): WebhookSubscription {
    const id = `wh_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const subscription: WebhookSubscription = {
      id, tenantId, url, events, secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true, createdAt: new Date().toISOString(),
    };
    this.subscriptions.set(id, subscription);
    logger.info(`Webhook subscribed: ${id} for ${events.join(',')}`, { context: 'webhook' });
    return subscription;
  }

  unsubscribe(id: string): boolean {
    const deleted = this.subscriptions.delete(id);
    if (deleted) logger.info(`Webhook unsubscribed: ${id}`, { context: 'webhook' });
    return deleted;
  }

  getSubscriptions(tenantId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.tenantId === tenantId && s.active);
  }

  // ─── Event Emission ────────────────────────────────

  async emit(type: string, tenantId: string, data: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    const event: WebhookEvent = {
      id: `evt_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`,
      type, tenantId, timestamp: new Date().toISOString(), data, metadata,
    };
    this.queue.push(event);
    logger.info(`Webhook event emitted: ${type}`, { context: 'webhook', meta: { eventId: event.id } });
    if (!this.processing) this.processQueue();
  }

  // ─── Queue Processing ──────────────────────────────

  private async processQueue(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      const matchingSubs = this.getSubscriptions(event.tenantId)
        .filter(s => s.events.includes('*') || s.events.includes(event.type));

      for (const sub of matchingSubs) {
        const delivery: WebhookDelivery = {
          id: `del_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`,
          webhookId: sub.id, eventId: event.id, status: 'pending', attempts: 0,
        };
        this.deliveries.set(delivery.id, delivery);
        await this.deliver(event, sub, delivery);
      }
    }
    this.processing = false;
  }

  private async deliver(event: WebhookEvent, sub: WebhookSubscription, delivery: WebhookDelivery): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({ event: event.type, data: event.data, timestamp: event.timestamp, id: event.id });
    const signature = crypto.createHmac('sha256', sub.secret).update(`${timestamp}.${payload}`).digest('hex');

    delivery.attempts++;
    delivery.lastAttemptAt = new Date().toISOString();
    delivery.status = 'retrying';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const response = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [SIGNATURE_HEADER]: `sha256=${signature}`,
          [EVENT_ID_HEADER]: event.id,
          [TIMESTAMP_HEADER]: timestamp,
          'User-Agent': 'NexoraOS-Webhook/1.0',
        },
        body: payload,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      delivery.responseCode = response.status;
      delivery.responseBody = await response.text();
      delivery.status = response.ok ? 'success' : 'failed';
    } catch (error: any) {
      delivery.status = 'failed';
      delivery.responseBody = error.message;
    }

    if (delivery.status === 'failed' && delivery.attempts < this.maxRetries) {
      const delay = Math.pow(2, delivery.attempts) * 1000;
      delivery.nextRetryAt = new Date(Date.now() + delay).toISOString();
      setTimeout(() => this.deliver(event, sub, delivery), delay);
      logger.warn(`Webhook delivery retrying: ${delivery.id}`, { context: 'webhook', meta: { attempt: delivery.attempts, nextRetry: delivery.nextRetryAt } });
    } else if (delivery.status === 'failed') {
      logger.error(`Webhook delivery failed after ${delivery.attempts} attempts: ${delivery.id}`, { context: 'webhook' });
    } else {
      logger.info(`Webhook delivery success: ${delivery.id}`, { context: 'webhook' });
    }
  }

  // ─── Signature Verification ────────────────────────

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  // ─── Delivery History ──────────────────────────────

  getDeliveries(webhookId: string, limit: number = 50): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.webhookId === webhookId)
      .sort((a, b) => (b.lastAttemptAt || '').localeCompare(a.lastAttemptAt || ''))
      .slice(0, limit);
  }

  getDeliveryStats(): Record<string, number> {
    const stats = { pending: 0, success: 0, failed: 0, retrying: 0 };
    for (const d of this.deliveries.values()) { stats[d.status]++; }
    return stats;
  }
}

// ─── Predefined Event Types ───────────────────────────

export const WebhookEvents = {
  // Finance
  TRANSACTION_CREATED: 'finance.transaction.created',
  TRANSACTION_POSTED: 'finance.transaction.posted',
  PAYMENT_RECEIVED: 'finance.payment.received',
  PAYMENT_SENT: 'finance.payment.sent',
  // Projects
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  MILESTONE_COMPLETED: 'project.milestone.completed',
  // Services
  SERVICE_DELIVERED: 'service.delivered',
  BENEFICIARY_REGISTERED: 'beneficiary.registered',
  // Community
  VOLUNTEER_REGISTERED: 'volunteer.registered',
  MEMBERSHIP_APPROVED: 'membership.approved',
  // Funding
  DONATION_RECEIVED: 'donation.received',
  GRANT_RECEIVED: 'grant.received',
  // Procurement
  PURCHASE_ORDER_CREATED: 'procurement.po.created',
  PURCHASE_ORDER_APPROVED: 'procurement.po.approved',
  RFQ_PUBLISHED: 'procurement.rfq.published',
  // System
  USER_CREATED: 'system.user.created',
  BACKUP_COMPLETED: 'system.backup.completed',
  ANOMALY_DETECTED: 'system.anomaly.detected',
  AI_INSIGHT_GENERATED: 'ai.insight.generated',
} as const;

export const webhookService = new WebhookService();
export default webhookService;
