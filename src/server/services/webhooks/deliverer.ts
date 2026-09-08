import crypto from 'crypto';
import { Webhook, EventPayload, DeliveryResult } from './types';

class WebhookDeliverer {
  async deliver(webhook: Webhook, payload: EventPayload): Promise<DeliveryResult> {
    const start = Date.now();
    const body = JSON.stringify(payload);
    const signature = webhook.secret ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex') : '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), webhook.timeout_ms || 5000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'UAMEX-ERP-Webhooks/1.0',
          'X-UAMEX-Event': payload.event,
          'X-UAMEX-Timestamp': payload.timestamp,
          'X-UAMEX-Delivery': payload.idempotency_key,
          ...(signature ? { 'X-UAMEX-Signature': `sha256=${signature}` } : {}),
          ...webhook.headers,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const duration = Date.now() - start;
      const responseBody = await response.text().catch(() => '');

      return { success: response.ok, status_code: response.status, response: responseBody.slice(0, 1000), duration_ms: duration };
    } catch (error: any) {
      return { success: false, error: error.message, duration_ms: Date.now() - start };
    }
  }

  async deliverWithRetry(webhook: Webhook, payload: EventPayload, maxRetries: number = 3): Promise<DeliveryResult> {
    let lastResult: DeliveryResult = { success: false, error: 'No attempts', duration_ms: 0 };
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await this.deliver(webhook, payload);
      if (lastResult.success) return lastResult;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return lastResult;
  }

  static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}

export const webhookDeliverer = new WebhookDeliverer();
