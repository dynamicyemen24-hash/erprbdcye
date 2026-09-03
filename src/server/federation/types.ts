// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Global Federation Cockpit™ Types
// Multi-Tenant + ESG + Post-Quantum Cryptography + Observability
// ═══════════════════════════════════════════════════════════════════

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// 1. MULTI-TENANT FEDERATION TYPES
// ═══════════════════════════════════════════════════════════════════

export type TenantIsolationLevel = 'database' | 'schema' | 'row' | 'compute';
export type TenantTier = 'starter' | 'professional' | 'enterprise' | 'sovereign';
export type TenantStatus = 'active' | 'suspended' | 'archived' | 'onboarding';
export type FederationRegion = 'mea' | 'apac' | 'eur' | 'amer' | 'global';
export type DataResidency = 'local' | 'regional' | 'global';

export interface TenantFederationConfig {
  tenantId: string;
  displayName: string;
  legalEntity: string;
  countryCode: string;
  defaultCurrency: string;
  defaultLocale: string;
  tier: TenantTier;
  isolationLevel: TenantIsolationLevel;
  dataResidency: DataResidency;
  region: FederationRegion;
  databaseUrl?: string;
  schemaName?: string;
  featureFlags: Record<string, boolean>;
  quotas: TenantQuotas;
  branding: TenantBranding;
  complianceFrameworks: string[];
  parentTenantId?: string;
  childTenantIds: string[];
  status: 'active' | 'suspended' | 'archived' | 'onboarding';
  createdAt: string;
  contractExpiresAt?: string;
}

export interface TenantQuotas {
  maxUsers: number;
  maxBeneficiaries: number;
  maxTransactions: number;
  storageGB: number;
  apiCallsPerDay: number;
  aiTokensPerMonth: number;
  concurrentSessions: number;
}

export interface TenantBranding {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  faviconUrl: string;
  supportEmail: string;
  supportPhone?: string;
  customDomain?: string;
}

export interface TenantUsageMetrics {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  activeUsers: number;
  storageUsedGB: number;
  apiCallsCount: number;
  aiTokensUsed: number;
  transactionsProcessed: number;
  peakConcurrentUsers: number;
  complianceViolations: number;
  esgScoreDelta: number;
  carbonOffsetKg: number;
}

export interface TenantRoutingRule {
  ruleId: string;
  tenantIdPattern: string;
  countryCode: string;
  region: FederationRegion;
  isolationLevel: TenantIsolationLevel;
  databaseEndpoint: string;
  schemaName?: string;
  priority: number;
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// 2. ESG & CARBON CREDIT TYPES
// ═══════════════════════════════════════════════════════════════════

export type ESGFramework = 'GRI' | 'SASB' | 'TCFD' | 'CDP' | 'ISSB_S1' | 'ISSB_S2' | 'EU_CSRD' | 'SDG';
export type CarbonStandard = 'GHG_PROTOCOL' | 'ISO_14064' | 'PAS_2060' | 'GOLD_STANDARD' | 'VERRA_VCS';
export type SDGGoal = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

export interface CarbonFootprint {
  footprintId: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  scope1KgCO2e: number;
  scope2KgCO2e: number;
  scope3KgCO2e: number;
  totalKgCO2e: number;
  methodology: CarbonStandard;
  verificationStatus: 'unverified' | 'self_declared' | 'third_party_verified';
  verifierName?: string;
  offsetKgCO2e: number;
  netKgCO2e: number;
  evidence: string[];
  calculatedAt: string;
}

export interface CarbonOffsetProject {
  projectId: string;
  projectName: string;
  projectType: 'reforestation' | 'renewable_energy' | 'energy_efficiency' | 'carbon_capture' | 'community';
  registry: 'GOLD_STANDARD' | 'VERRA_VCS' | 'PURO' | 'CAR' | 'INTERNAL';
  registryProjectId?: string;
  countryCode: string;
  coordinates?: { lat: number; lng: number };
  totalCreditsIssued: number;
  creditsRetired: number;
  creditsAvailable: number;
  pricePerTonneUSD: number;
  sdgGoals: SDGGoal[];
  verificationBody?: string;
  vintage: number;
  startDate: string;
  endDate?: string;
  status: 'registered' | 'active' | 'completed' | 'suspended';
  tenantId: string;
}

export interface CarbonCreditTransaction {
  transactionId: string;
  buyerTenantId: string;
  sellerTenantId?: string;
  projectId: string;
  creditsAmount: number;
  pricePerTonneUSD: number;
  totalAmountUSD: number;
  retirementPurpose?: string;
  beneficiaryDescription?: string;
  transactionDate: string;
  retirementDate?: string;
  serialNumbers: string[];
  status: 'pending' | 'completed' | 'retired' | 'cancelled';
  blockchainTxHash?: string;
}

export interface ESGMetric {
  metricId: string;
  tenantId: string;
  framework: ESGFramework;
  metricCode: string;
  metricName: string;
  category: 'environmental' | 'social' | 'governance';
  subcategory: string;
  unit: string;
  value: number;
  targetValue?: number;
  reportingPeriod: string;
  dataSource: string;
  verificationLevel: 'self_reported' | 'audited' | 'third_party';
  evidenceUrl?: string;
  sdgGoals: SDGGoal[];
}

export interface SDGImpactReport {
  reportId: string;
  tenantId: string;
  programId?: string;
  projectId?: string;
  periodStart: string;
  periodEnd: string;
  sdgImpacts: {
    goal: SDGGoal;
    beneficiariesReached: number;
    outcomesAchieved: string[];
    kpiMetrics: { code: string; name: string; value: number; unit: string }[];
    budgetSpent: number;
    currency: string;
  }[];
  totalBeneficiaries: number;
  totalBudgetSpent: number;
  totalBudgetCurrency: string;
  methodology: string;
  limitations: string;
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// 3. POST-QUANTUM CRYPTOGRAPHY TYPES
// ═══════════════════════════════════════════════════════════════════

export type PQCAlgorithm = 
  | 'KYBER_512' | 'KYBER_768' | 'KYBER_1024'
  | 'DILITHIUM_2' | 'DILITHIUM_3' | 'DILITHIUM_5'
  | 'FALCON_512' | 'FALCON_1024'
  | 'SPHINCS_SHA2_128F' | 'SPHINCS_SHA2_256F'
  | 'HYBRID_X25519_KYBER768';

export type ZeroTrustPolicy = 'always_verify' | 'least_privilege' | 'assume_breach' | 'verify_explicitly';

export interface PQCKeyPair {
  keyId: string;
  algorithm: PQCAlgorithm;
  publicKey: string;
  privateKey?: string;
  keySize: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'rotating' | 'retired' | 'compromised';
  usage: 'kem' | 'signature' | 'both';
  tenantId: string;
}

export interface QuantumSafeEnvelope {
  envelopeId: string;
  algorithm: PQCAlgorithm;
  ciphertext: string;
  encapsulatedKey?: string;
  iv: string;
  authTag: string;
  aad?: string;
  createdAt: string;
  recipientKeyId: string;
}

export interface ZeroTrustSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  deviceFingerprint: string;
  ipAddress: string;
  geoLocation: { country: string; city: string; lat: number; lng: number };
  riskScore: number;
  trustLevel: 'low' | 'medium' | 'high' | 'critical';
  policiesApplied: ZeroTrustPolicy[];
  mfaVerified: boolean;
  deviceCompliant: boolean;
  networkCompliant: boolean;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

export interface SecurityEvent {
  eventId: string;
  tenantId: string;
  userId?: string;
  eventType: 'login' | 'logout' | 'mfa_challenge' | 'permission_denied' | 'data_access' | 'configuration_change' | 'quantum_key_rotation' | 'anomaly_detected';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  geoLocation?: { country: string; city: string };
  mitigated: boolean;
  detectedAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// 4. OBSERVABILITY TYPES
// ═══════════════════════════════════════════════════════════════════

export type TelemetrySignal = 'trace' | 'metric' | 'log' | 'profile';
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  durationMs?: number;
  status: 'UNSET' | 'OK' | 'ERROR';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  links: SpanLink[];
  tenantId: string;
  userId?: string;
}

export interface SpanEvent {
  name: string;
  timeUnixNano: string;
  attributes: Record<string, string | number | boolean>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, string | number | boolean>;
}

export interface MetricPoint {
  metricName: string;
  serviceName: string;
  timestampUnixMs: number;
  value: number;
  unit: string;
  tags: Record<string, string>;
  tenantId: string;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  serviceName: string;
  traceId?: string;
  spanId?: string;
  message: string;
  context: Record<string, unknown>;
  tenantId: string;
  userId?: string;
  requestId?: string;
  error?: { name: string; message: string; stack?: string };
}

export interface SLODefinition {
  sloId: string;
  serviceName: string;
  sloName: string;
  description: string;
  sli: { numeratorQuery: string; denominatorQuery: string };
  target: number;
  window: '1h' | '24h' | '7d' | '30d';
  burnRateThreshold: number;
  alertChannel: string;
  tenantId: string;
  active: boolean;
}

export interface SLOStatus {
  sloId: string;
  currentSLI: number;
  errorBudgetRemaining: number;
  burnRate: number;
  status: 'healthy' | 'warning' | 'critical' | 'exhausted';
  calculatedAt: string;
}

export interface AnomalyDetection {
  detectionId: string;
  metricName: string;
  serviceName: string;
  detectedAt: string;
  anomalyType: 'spike' | 'dip' | 'drift' | 'outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  observedValue: number;
  expectedValue: number;
  deviationStdDev: number;
  confidence: number;
  possibleCauses: string[];
  recommendedActions: string[];
  tenantId: string;
}

// ═══════════════════════════════════════════════════════════════════
// 5. FEDERATION HEALTH TYPES
// ═══════════════════════════════════════════════════════════════════

export interface FederationHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'down';
  computedAt: string;
  tenants: {
    total: number;
    active: number;
    suspended: number;
    onboarding: number;
  };
  regions: Record<FederationRegion, {
    latencyMs: number;
    availability: number;
    errorRate: number;
  }>;
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'critical' | 'down';
    version: string;
    uptime: number;
  }[];
  esg: {
    tenantsReporting: number;
    totalCarbonOffsetKg: number;
    averageESGScore: number;
  };
  security: {
    pqcKeysActive: number;
    keysRotatedLast30Days: number;
    zeroTrustSessionsActive: number;
    securityEventsLast24h: number;
  };
  observability: {
    tracesPerSecond: number;
    metricsIngestedPerSecond: number;
    logsIngestedPerSecond: number;
    sloComplianceRate: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// ZOD SCHEMAS (Runtime Validation)
// ═══════════════════════════════════════════════════════════════════

export const TenantFederationConfigSchema = z.object({
  tenantId: z.string().min(1),
  displayName: z.string().min(1).max(200),
  legalEntity: z.string().min(1),
  countryCode: z.string().length(2),
  defaultCurrency: z.string().length(3),
  defaultLocale: z.string(),
  tier: z.enum(['starter', 'professional', 'enterprise', 'sovereign']),
  isolationLevel: z.enum(['database', 'schema', 'row', 'compute']),
  dataResidency: z.enum(['local', 'regional', 'global']),
  region: z.enum(['mea', 'apac', 'eur', 'amer', 'global']),
  featureFlags: z.record(z.boolean()),
  quotas: z.object({
    maxUsers: z.number().int().positive(),
    maxBeneficiaries: z.number().int().positive(),
    maxTransactions: z.number().int().positive(),
    storageGB: z.number().positive(),
    apiCallsPerDay: z.number().int().positive(),
    aiTokensPerMonth: z.number().int().positive(),
    concurrentSessions: z.number().int().positive(),
  }),
  status: z.enum(['active', 'suspended', 'archived', 'onboarding']),
});

export const CarbonOffsetProjectSchema = z.object({
  projectId: z.string(),
  projectName: z.string().min(1).max(200),
  projectType: z.enum(['reforestation', 'renewable_energy', 'energy_efficiency', 'carbon_capture', 'community']),
  registry: z.enum(['GOLD_STANDARD', 'VERRA_VCS', 'PURO', 'CAR', 'INTERNAL']),
  countryCode: z.string().length(2),
  totalCreditsIssued: z.number().nonnegative(),
  creditsRetired: z.number().nonnegative(),
  creditsAvailable: z.number().nonnegative(),
  pricePerTonneUSD: z.number().positive(),
  sdgGoals: z.array(z.number().int().min(1).max(17)),
  vintage: z.number().int().min(2000).max(2100),
  status: z.enum(['registered', 'active', 'completed', 'suspended']),
  tenantId: z.string(),
});

export const ZeroTrustSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  deviceFingerprint: z.string(),
  ipAddress: z.string(),
  riskScore: z.number().min(0).max(100),
  trustLevel: z.enum(['low', 'medium', 'high', 'critical']),
  policiesApplied: z.array(z.enum(['always_verify', 'least_privilege', 'assume_breach', 'verify_explicitly'])),
  mfaVerified: z.boolean(),
  deviceCompliant: z.boolean(),
  networkCompliant: z.boolean(),
});

export type FederationAuditEntry = {
  auditId: string;
  tenantId: string;
  actor: string;
  action: string;
  resource: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'denied';
  riskScore: number;
  timestamp: string;
  signature: string;
  merkleRoot: string;
};
