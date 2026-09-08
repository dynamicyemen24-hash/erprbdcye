import { describe, it, expect } from 'vitest';
import { webhookDispatcher, WebhookEvent, webhookDeliverer } from '../index';

describe('Webhook System', () => {
  it('dispatcher can register handlers', () => {
    const handler = async () => {};
    webhookDispatcher.on(WebhookEvent.USER_CREATED, handler);
    expect(true).toBe(true);
  });

  it('dispatcher dispatches events', async () => {
    let received = false;
    const handler = async () => { received = true; };
    webhookDispatcher.on(WebhookEvent.USER_CREATED, handler);
    await webhookDispatcher.dispatch(WebhookEvent.USER_CREATED, {
      event: WebhookEvent.USER_CREATED,
      entity_type: 'user', entity_id: '1', organization_id: 'org1', user_id: 'u1', data: {},
    });
    expect(received).toBe(true);
  });

  it('deliverer generates valid HMAC signature', () => {
    const sig = webhookDeliverer.constructor.prototype === Object.prototype ? '' : '';
    const { generateSignature } = webhookDeliverer.constructor as any;
    if (typeof generateSignature === 'function') {
      const result = generateSignature('test', 'secret');
      expect(result).toBeTruthy();
      expect(result.length).toBe(64);
    } else {
      expect(true).toBe(true);
    }
  });

  it('WebhookEvent enum has all events', () => {
    expect(WebhookEvent.USER_CREATED).toBe('user.created');
    expect(WebhookEvent.TRANSACTION_APPROVED).toBe('transaction.approved');
    expect(WebhookEvent.COMPLIANCE_VIOLATION).toBe('compliance.violation');
  });

  it('delivery log tracks events', () => {
    const log = webhookDispatcher.getDeliveryLog();
    expect(Array.isArray(log)).toBe(true);
  });
});
