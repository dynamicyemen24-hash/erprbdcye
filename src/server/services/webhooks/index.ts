import { webhookDispatcher } from './dispatcher';
import { WebhookEvent } from './types';

export { webhookDispatcher } from './dispatcher';
export { webhookDeliverer } from './deliverer';
export { webhookManager } from './manager';
export { registerInternalHandlers } from './handlers';
export { WebhookEvent } from './types';
export type { Webhook, EventPayload, DeliveryResult, CreateWebhookInput } from './types';

export async function emitEvent(event: WebhookEvent, payload: { entity_type: string; entity_id: string; organization_id: string; user_id: string; data: Record<string, any> }) {
  return webhookDispatcher.dispatch(event, { ...payload, event });
}
