import { webhookDispatcher } from './dispatcher';
import { WebhookEvent } from './types';

export function registerInternalHandlers() {
  webhookDispatcher.on(WebhookEvent.USER_CREATED, async (payload) => {
    console.log(`[WEBHOOK-HANDLER] User created: ${payload.entity_id}`);
  });

  webhookDispatcher.on(WebhookEvent.TRANSACTION_APPROVED, async (payload) => {
    console.log(`[WEBHOOK-HANDLER] Transaction approved: ${payload.entity_id}`);
  });

  webhookDispatcher.on(WebhookEvent.APPROVAL_REQUESTED, async (payload) => {
    console.log(`[WEBHOOK-HANDLER] Approval requested: ${payload.entity_id}`);
  });

  webhookDispatcher.on(WebhookEvent.COMPLIANCE_VIOLATION, async (payload) => {
    console.warn(`[WEBHOOK-HANDLER] Compliance violation: ${payload.entity_id}`, payload.data);
  });

  webhookDispatcher.on(WebhookEvent.SYSTEM_ERROR, async (payload) => {
    console.error(`[WEBHOOK-HANDLER] System error:`, payload.data);
  });

  webhookDispatcher.on(WebhookEvent.BUDGET_ALERT, async (payload) => {
    console.warn(`[WEBHOOK-HANDLER] Budget alert:`, payload.data);
  });

  console.log('[WEBHOOK] Internal handlers registered');
}
