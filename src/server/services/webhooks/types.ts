export enum WebhookEvent {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_APPROVED = 'transaction.approved',
  TRANSACTION_REJECTED = 'transaction.rejected',
  BUDGET_ALERT = 'budget.alert',
  PROJECT_CREATED = 'project.created',
  PROJECT_COMPLETED = 'project.completed',
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  APPROVAL_REQUESTED = 'approval.requested',
  APPROVAL_GRANTED = 'approval.granted',
  APPROVAL_REJECTED = 'approval.rejected',
  PURCHASE_ORDER_CREATED = 'purchase_order.created',
  DOCUMENT_UPLOADED = 'document.uploaded',
  COMPLIANCE_VIOLATION = 'compliance.violation',
  SYSTEM_ERROR = 'system.error',
  BENEFICIARY_REGISTERED = 'beneficiary.registered',
}

export interface Webhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  is_active: boolean;
  retry_count: number;
  timeout_ms: number;
  headers: Record<string, string>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventPayload {
  event: WebhookEvent;
  entity_type: string;
  entity_id: string;
  organization_id: string;
  user_id: string;
  data: Record<string, any>;
  timestamp: string;
  idempotency_key: string;
}

export interface DeliveryResult {
  success: boolean;
  status_code?: number;
  response?: string;
  error?: string;
  duration_ms: number;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  description?: string;
  retry_count?: number;
  timeout_ms?: number;
  headers?: Record<string, string>;
}

export type UpdateWebhookInput = Partial<CreateWebhookInput>;

export interface Delivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: string;
  status_code?: number;
  response_body?: string;
  attempts: number;
  created_at: string;
  completed_at?: string;
}

export interface TestResult {
  success: boolean;
  status_code?: number;
  response_time_ms: number;
  message: string;
}
