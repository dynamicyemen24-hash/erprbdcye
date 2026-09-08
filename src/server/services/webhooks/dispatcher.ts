import { WebhookEvent, EventPayload } from './types';
import crypto from 'crypto';

type EventHandler = (payload: EventPayload) => Promise<void>;

class WebhookDispatcher {
  private handlers = new Map<WebhookEvent, EventHandler[]>();
  private deliveryLog: Array<{ event: WebhookEvent; timestamp: string; success: boolean }> = [];

  on(event: WebhookEvent, handler: EventHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
  }

  async dispatch(event: WebhookEvent, payload: Omit<EventPayload, 'timestamp' | 'idempotency_key'>): Promise<void> {
    const fullPayload: EventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      idempotency_key: crypto.randomUUID(),
    };

    const handlers = this.handlers.get(event) || [];
    const results = await Promise.allSettled(handlers.map(h => h(fullPayload)));
    
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[WEBHOOK] Handler ${i} failed for ${event}:`, result.reason);
      }
    });

    this.deliveryLog.push({ event, timestamp: fullPayload.timestamp, success: results.every(r => r.status === 'fulfilled') });
  }

  getDeliveryLog(limit: number = 50) {
    return this.deliveryLog.slice(-limit);
  }
}

export const webhookDispatcher = new WebhookDispatcher();
