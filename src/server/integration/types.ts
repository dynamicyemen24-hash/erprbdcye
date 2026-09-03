// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Hyper-Scale Integration Mesh™ (NEB-12)
// Core Type Definitions for Event-Driven Architecture
// Enterprise Service Bus + Event Bus + CDC + GraphQL Federation
// ═══════════════════════════════════════════════════════════════════

/**
 * Domain-Aware Event Envelope
 * - كل حدث يحمل: tenant, domain (NEB-XX), entity, action, version
 * - موقّع رقمياً بـ HMAC-SHA256 + مرتبط بـ Merkle Root
 */
export interface DomainEventEnvelope<T = unknown> {
  /** معرف فريد للحدث (UUIDv7 للترتيب الزمني) */
  eventId: string;
  /** الطابع الزمني بـ ISO 8601 + nanosecond precision */
  occurredAt: string;
  /** معرّف المستأجر (multi-tenant isolation) */
  tenantId: string;
  /** اسم النطاق المؤسسي (NEB-01..NEB-15) */
  domainCode: string;
  /** الكيان المتأثر (transaction, beneficiary, project...) */
  entityType: string;
  /** معرّف الكيان */
  entityId: string;
  /** نوع الإجراء: created, updated, deleted, approved, posted */
  action: DomainEventAction;
  /** رقم النسخة (للـ optimistic concurrency) */
  version: number;
  /** الـ payload (depends on event type) */
  payload: T;
  /** Metadata للـ tracing */
  metadata: {
    correlationId: string;
    causationId?: string;
    userId: string;
    sessionId?: string;
    source: EventSource;
    idempotencyKey: string;
  };
  /** التوقيع الرقمي (HMAC-SHA256) */
  signature: string;
  /** Merkle Tree Hash للـ tamper-proof audit */
  merkleHash: string;
}

export type DomainEventAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'approved'
  | 'rejected'
  | 'posted'
  | 'voided'
  | 'archived'
  | 'restored'
  | 'sync.failed'
  | 'sync.completed';

export type EventSource =
  | 'rest.api'
  | 'graphql'
  | 'internal.workflow'
  | 'cdc.debezium'
  | 'cron.scheduler'
  | 'ai.copilot'
  | 'integration.webhook';

/** Change Data Capture (CDC) Record */
export interface CDCRecord {
  lsn: string; // Log Sequence Number من PostgreSQL WAL
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  transactionId: string;
  timestamp: string;
}

/** Outbox Pattern Entry — لضمان exactly-once delivery */
export interface OutboxEntry {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: DomainEventEnvelope;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTERED';
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  publishedAt?: string;
  failureReason?: string;
  createdAt: string;
}

/** Subscription — لوكلاء الأحداث الخارجيين */
export interface EventSubscription {
  id: string;
  name: string;
  description: string;
  topicPattern: string; // e.g. "neb-10.finance.transaction.*"
  consumerGroup: string;
  transport: 'webhook' | 'kafka' | 'rabbitmq' | 'nats' | 'sqs';
  endpoint: string;
  authConfig: SubscriptionAuth;
  filterExpression?: string;
  retryPolicy: RetryPolicy;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  createdAt: string;
  metrics: SubscriptionMetrics;
}

export interface SubscriptionAuth {
  type: 'hmac' | 'jwt' | 'oauth2' | 'mtls' | 'api_key';
  secretRef?: string;
  tokenUrl?: string;
  scope?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelayMs: number;
  maxDelayMs: number;
  deadLetterTopic?: string;
}

export interface SubscriptionMetrics {
  totalEvents: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  lastDeliveryAt?: string;
  lastErrorAt?: string;
}

/** Integration Adapter — لكل نظام خارجي (UN OCHA, IATI, SAP...) */
export interface IntegrationAdapter {
  id: string;
  systemCode: 'IATI' | 'UN_OCHA_FTS' | 'UNHCR_PROGRES' | 'WFP_SCOPE' | 'SAP_S4' | 'ORACLE_FUSION' | 'MOZAMBIQUE_GOVT' | 'CUSTOM';
  displayName: string;
  displayNameAr: string;
  version: string;
  specUrl: string; // OpenAPI/AsyncAPI URL
  transport: 'rest' | 'graphql' | 'soap' | 'sftp' | 'kafka';
  endpoint: string;
  authProfile: SubscriptionAuth;
  mappings: FieldMapping[];
  status: 'PROVISIONING' | 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  healthCheck: HealthCheckResult;
  lastSyncAt?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'upper' | 'lower' | 'date.iso' | 'currency.iso' | 'number' | 'json';
  required: boolean;
  defaultValue?: unknown;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  checkedAt: string;
  message?: string;
}

/** GraphQL Federation Gateway Config */
export interface FederationConfig {
  gatewayId: string;
  subgraphs: FederatedSubgraph[];
  enableQueryPlan: boolean;
  enablePersistedQueries: boolean;
  rateLimits: {
    complexity: number;
    depth: number;
    requestsPerMinute: number;
  };
  securityPolicy: {
    requireAuthentication: boolean;
    allowedIntrospectionRoles: string[];
    fieldLevelAuthz: Record<string, string[]>;
  };
}

export interface FederatedSubgraph {
  name: string;
  domainCode: string;
  endpoint: string;
  schemaSdl: string;
  owner: string;
}

/** Saga Pattern — للمعاملات الموزعة طويلة المدى */
export interface SagaDefinition {
  sagaId: string;
  name: string;
  steps: SagaStep[];
  compensationPolicy: 'rollback' | 'best-effort' | 'manual';
  timeout: number; // ms
}

export interface SagaStep {
  stepId: string;
  action: string;
  endpoint: string;
  payload: Record<string, unknown>;
  compensator?: {
    action: string;
    endpoint: string;
  };
  retryPolicy: RetryPolicy;
}

/** Cross-System Reconciliation */
export interface ReconciliationReport {
  id: string;
  systemA: string;
  systemB: string;
  matchedCount: number;
  mismatchCount: number;
  missingInACount: number;
  missingInBCount: number;
  mismatches: ReconciliationMismatch[];
  generatedAt: string;
}

export interface ReconciliationMismatch {
  entityId: string;
  fieldPath: string;
  valueA: unknown;
  valueB: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
