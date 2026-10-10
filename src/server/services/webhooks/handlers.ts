import { webhookDispatcher } from './dispatcher';
import { WebhookEvent } from './types';
import logger, { toLogMeta } from '../../core/logger';

export function registerInternalHandlers() {
  webhookDispatcher.on(WebhookEvent.USER_CREATED, async (payload) => {
    logger.info(`[WEBHOOK-HANDLER] User created: ${payload.entity_id}`);
  });

  webhookDispatcher.on(WebhookEvent.TRANSACTION_APPROVED, async (payload) => {
    logger.info(`[WEBHOOK-HANDLER] Transaction approved: ${payload.entity_id}`);
  });

  webhookDispatcher.on(WebhookEvent.APPROVAL_REQUESTED, async (payload) => {
    logger.info(`[WEBHOOK-HANDLER] Approval requested: ${payload.entity_id}`);
  });

  webhookDispatcher.on(WebhookEvent.COMPLIANCE_VIOLATION, async (payload) => {
    logger.warn(`[WEBHOOK-HANDLER] Compliance violation: ${payload.entity_id}`, { meta: toLogMeta(payload.data) });
  });

  webhookDispatcher.on(WebhookEvent.SYSTEM_ERROR, async (payload) => {
    logger.error(`[WEBHOOK-HANDLER] System error:`, { meta: toLogMeta(payload.data) });
  });

  webhookDispatcher.on(WebhookEvent.BUDGET_ALERT, async (payload) => {
    logger.warn(`[WEBHOOK-HANDLER] Budget alert:`, { meta: toLogMeta(payload.data) });
  });

  logger.info('[WEBHOOK] Internal handlers registered');
}
