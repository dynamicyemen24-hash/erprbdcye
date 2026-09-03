// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Hyper-Scale Integration Mesh™ (NEB-12)
// Integration Adapters for External Systems
// Supports: IATI, UN OCHA FTS, UNHCR proGres, WFP SCOPE, SAP S4
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { getPool } from '../core/database';
import logger from '../core/logger';

/** Integration Adapter Types */
export type ExternalSystem = 
  | 'IATI' 
  | 'UN_OCHA_FTS' 
  | 'UNHCR_PROGRES' 
  | 'WFP_SCOPE' 
  | 'SAP_S4' 
  | 'ORACLE_FUSION' 
  | 'MOZAMBIQUE_GOVT' 
  | 'CUSTOM';

export type TransportType = 'rest' | 'graphql' | 'soap' | 'sftp' | 'kafka';
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

/** Integration configuration per system */
interface SystemConfig {
  code: ExternalSystem;
  displayName: string;
  displayNameAr: string;
  version: string;
  specUrl: string;
  transport: TransportType;
  endpoint: string;
  authProfile: AuthProfile;
  syncIntervalMinutes: number;
  defaultSyncDirection: SyncDirection;
}

/** Authentication profiles */
interface AuthProfile {
  type: 'hmac' | 'jwt' | 'oauth2' | 'mtls' | 'api_key' | 'basic';
  tokenUrl?: string;
  scope?: string;
  keyPath?: string;
  certPath?: string;
}

/** Field mapping configuration */
interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'upper' | 'lower' | 'date.iso' | 'currency.iso' | 'number' | 'json' | 'uuid';
  required: boolean;
  defaultValue?: unknown;
}

/** Integration sync job */
interface SyncJob {
  id: string;
  systemCode: ExternalSystem;
  direction: SyncDirection;
  entityType: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage?: string;
}

/** Pre-configured system integrations */
const SYSTEM_CONFIGS: Record<ExternalSystem, SystemConfig> = {
  IATI: {
    code: 'IATI',
    displayName: 'IATI Datastore',
    displayNameAr: 'قاعدة بيانات معايير الشفافية الدولية',
    version: '2.03',
    specUrl: 'https://www.iatistandard.org/en/developers/datastore/',
    transport: 'rest',
    endpoint: process.env.IATI_API_URL || 'https://www.iatistandard.org/api',
    authProfile: { type: 'api_key', keyPath: 'IATI_API_KEY' },
    syncIntervalMinutes: 60,
    defaultSyncDirection: 'pull',
  },
  UN_OCHA_FTS: {
    code: 'UN_OCHA_FTS',
    displayName: 'UN OCHA Financial Tracking Service',
    displayNameAr: 'خدمة تتبع التمويل التابعة للأمم المتحدة',
    version: '3.0',
    specUrl: 'https://fts.unocha.org/api/v1/',
    transport: 'rest',
    endpoint: process.env.OCHA_FTS_URL || 'https://api.hpc.tools/v1',
    authProfile: { type: 'api_key', keyPath: 'OCHA_FTS_API_KEY' },
    syncIntervalMinutes: 30,
    defaultSyncDirection: 'pull',
  },
  UNHCR_PROGRES: {
    code: 'UNHCR_PROGRES',
    displayName: 'UNHCR proGres',
    displayNameAr: 'نظام تتبع المستفيدين UNHCR',
    version: '4.5',
    specUrl: 'https://www.unhcr.org/progref4.html',
    transport: 'rest',
    endpoint: process.env.UNHCR_API_URL || 'https://api.unhcr.org/v1',
    authProfile: { type: 'oauth2', tokenUrl: 'https://api.unhcr.org/token', scope: 'progref' },
    syncIntervalMinutes: 15,
    defaultSyncDirection: 'bidirectional',
  },
  WFP_SCOPE: {
    code: 'WFP_SCOPE',
    displayName: 'WFP SCOPE',
    displayNameAr: 'نظام SCOPE للتسجيل',
    version: '2.0',
    specUrl: 'https://docs.wfp.org/api/scope/',
    transport: 'rest',
    endpoint: process.env.WFP_API_URL || 'https://api.wfp.org/v1',
    authProfile: { type: 'oauth2', tokenUrl: 'https://api.wfp.org/oauth/token', scope: 'scope.read' },
    syncIntervalMinutes: 20,
    defaultSyncDirection: 'bidirectional',
  },
  SAP_S4: {
    code: 'SAP_S4',
    displayName: 'SAP S/4HANA',
    displayNameAr: 'نظام SAP للمحاسبة',
    version: '2023',
    specUrl: 'https://api.sap.com/saps4hana',
    transport: 'rest',
    endpoint: process.env.SAP_API_URL || '',
    authProfile: { type: 'oauth2', tokenUrl: `${process.env.SAP_API_URL}/oauth/token`, scope: 'sap.common'},
    syncIntervalMinutes: 5,
    defaultSyncDirection: 'bidirectional',
  },
  ORACLE_FUSION: {
    code: 'ORACLE_FUSION',
    displayName: 'Oracle Fusion Cloud',
    displayNameAr: 'أوراكل فيوجن كلاود',
    version: '11i',
    specUrl: 'https://docs.oracle.com/en/cloud/paas/ integration/',
    transport: 'rest',
    endpoint: process.env.ORACLE_API_URL || '',
    authProfile: { type: 'oauth2' },
    syncIntervalMinutes: 10,
    defaultSyncDirection: 'bidirectional',
  },
  MOZAMBIQUE_GOVT: {
    code: 'MOZAMBIQUE_GOVT',
    displayName: 'Mozambique Government Systems',
    displayNameAr: 'أنظمة حكومة موزمبيق',
    version: '1.0',
    specUrl: '',
    transport: 'sftp',
    endpoint: process.env.MOZAMBIQUE_SFTP_URL || '',
    authProfile: { type: 'hmac' },
    syncIntervalMinutes: 240,
    defaultSyncDirection: 'pull',
  },
  CUSTOM: {
    code: 'CUSTOM',
    displayName: 'Custom Integration',
    displayNameAr: 'تكامل مخصص',
    version: '1.0',
    specUrl: '',
    transport: 'rest',
    endpoint: '',
    authProfile: { type: 'api_key' },
    syncIntervalMinutes: 60,
    defaultSyncDirection: 'push',
  },
};

/** IATI Field Mappings — Activity to Project */
const IATI_ACTIVITY_MAPPING: FieldMapping[] = [
  { sourceField: 'iati-identifier', targetField: 'project_code', transform: 'uuid', required: true },
  { sourceField: 'title.narrative', targetField: 'name_ar', required: true },
  { sourceField: 'description.narrative', targetField: 'description', required: false },
  { sourceField: 'activity-status.code', targetField: 'status', transform: 'upper', required: true },
  { sourceField: 'activity-date[@type="start-planned"]', targetField: 'planned_start_date', transform: 'date.iso', required: false },
  { sourceField: 'activity-date[@type="end-planned"]', targetField: 'planned_end_date', transform: 'date.iso', required: false },
  { sourceField: 'recipient-country[@code]', targetField: 'country_code', transform: 'upper', required: true },
  { sourceField: 'sector[@vocabulary="DAC"]/@code', targetField: 'sector_code', required: false },
  { sourceField: 'budget/value', targetField: 'budget_amount', transform: 'number', required: false },
  { sourceField: 'budget/value/@currency', targetField: 'budget_currency', transform: 'currency.iso', required: false },
];

/** IATI Field Mappings — Transaction to Financial Record */
const IATI_TRANSACTION_MAPPING: FieldMapping[] = [
  { sourceField: 'transaction-type/@code', targetField: 'transaction_type', required: true },
  { sourceField: 'transaction-date/@iso-date', targetField: 'transaction_date', transform: 'date.iso', required: true },
  { sourceField: 'value', targetField: 'amount', transform: 'number', required: true },
  { sourceField: 'value/@currency', targetField: 'currency_code', transform: 'currency.iso', required: true },
  { sourceField: 'provider-org/@ref', targetField: 'donor_code', required: false },
  { sourceField: 'receiver-org/@ref', targetField: 'implementing_org', required: false },
  { sourceField: 'description/narrative', targetField: 'description', required: false },
];

/**
 * Integration Adapter — Generic adapter for external systems
 */
export class IntegrationAdapter {
  private config: SystemConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(systemCode: ExternalSystem, customEndpoint?: string) {
    this.config = { ...SYSTEM_CONFIGS[systemCode] };
    if (customEndpoint) {
      this.config.endpoint = customEndpoint;
    }
  }

  /** Get OAuth2 access token */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    if (this.config.authProfile.type !== 'oauth2') {
      throw new Error(`System ${this.config.code} does not use OAuth2`);
    }

    const { tokenUrl, scope } = this.config.authProfile;
    if (!tokenUrl) throw new Error('OAuth2 token URL not configured');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env[`${this.config.code}_CLIENT_ID`] || '',
      client_secret: process.env[`${this.config.code}_CLIENT_SECRET`] || '',
      scope: scope || '',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth2 token fetch failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);
    
    return this.accessToken;
  }

  /** Make authenticated API request */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Apply authentication
    switch (this.config.authProfile.type) {
      case 'api_key':
        headers['Authorization'] = `ApiKey ${process.env[`${this.config.code}_API_KEY`]}`;
        break;
      case 'oauth2':
        headers['Authorization'] = `Bearer ${await this.getAccessToken()}`;
        break;
      case 'basic': {
        const creds = Buffer.from(
          `${process.env[`${this.config.code}_USERNAME`]}:${process.env[`${this.config.code}_PASSWORD`]}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${creds}`;
        break;
      }
      case 'hmac': {
        const timestamp = Date.now().toString();
        const signature = this.computeHMACSignature(timestamp, method, path);
        headers['X-Timestamp'] = timestamp;
        headers['X-Signature'] = signature;
        break;
      }
    }

    const url = `${this.config.endpoint}${path}`;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`${this.config.code} API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /** Compute HMAC signature for request authentication */
  private computeHMACSignature(timestamp: string, method: string, path: string): string {
    const secret = process.env[`${this.config.code}_HMAC_SECRET`] || '';
    const payload = `${timestamp}${method}${path}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /** Health check */
  async healthCheck(): Promise<{ status: string; latencyMs: number; message?: string }> {
    const start = Date.now();
    try {
      await this.request('GET', '/health');
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (err) {
      return { 
        status: 'unhealthy', 
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}

/**
 * IATI Integration Adapter — Specialized for IATI standard
 */
export class IATIAdapter extends IntegrationAdapter {
  constructor() {
    super('IATI');
  }

  /** Fetch activities by country/date range */
  async fetchActivities(params: {
    country?: string;
    sector?: string;
    reportingOrg?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<IATIActivity[]> {
    const query = new URLSearchParams();
    if (params.country) query.set('recipient-country', params.country);
    if (params.sector) query.set('sector', params.sector);
    if (params.reportingOrg) query.set('reporting-org', params.reportingOrg);
    if (params.startDate) query.set('activity-date-start', params.startDate);
    if (params.endDate) query.set('activity-date-end', params.endDate);
    query.set('format', 'json');
    query.set('limit', String(params.limit || 100));
    query.set('offset', String(params.offset || 0));

    const data = await this.request<{ data: IATIActivity[] }>('GET', `/activities?${query.toString()}`);
    return data.data || [];
  }

  /** Transform IATI activity to project record */
  transformActivityToProject(activity: IATIActivity): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const mapping of IATI_ACTIVITY_MAPPING) {
      const value = this.getNestedValue(activity, mapping.sourceField);
      if (value !== undefined) {
        result[mapping.targetField] = this.applyTransform(value, mapping.transform);
      } else if (mapping.required && !mapping.defaultValue) {
        logger.warn(`[IATI] Missing required field: ${mapping.sourceField}`);
      } else if (mapping.defaultValue !== undefined) {
        result[mapping.targetField] = mapping.defaultValue;
      }
    }
    return result;
  }

  /** Fetch transactions for an activity */
  async fetchTransactions(activityId: string): Promise<IATITransaction[]> {
    const data = await this.request<{ transactions: { transaction: IATITransaction[] } }>(
      'GET', `/activities/${activityId}/transactions`
    );
    return data.transactions?.transaction || [];
  }

  /** Transform IATI transaction to financial record */
  transformTransactionToFinancialRecord(transaction: IATITransaction): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const mapping of IATI_TRANSACTION_MAPPING) {
      const value = this.getNestedValue(transaction, mapping.sourceField);
      if (value !== undefined) {
        result[mapping.targetField] = this.applyTransform(value, mapping.transform);
      }
    }
    return result;
  }

  /** Get nested value from object using dot notation */
  private getNestedValue(obj: any, path: string): unknown {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      // Handle attribute selectors like [@type="start-planned"]
      const attrMatch = part.match(/^(.+?)\[@(.+?)=["'](.+)["']\]$/);
      if (attrMatch) {
        const [, arrayKey, attr, value] = attrMatch;
        const array = current[arrayKey];
        if (Array.isArray(array)) {
          current = array.find((item: any) => item[attr] === value);
        } else {
          return undefined;
        }
      } else if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /** Apply transform to value */
  private applyTransform(value: unknown, transform?: string): unknown {
    switch (transform) {
      case 'upper': return String(value).toUpperCase();
      case 'lower': return String(value).toLowerCase();
      case 'number': return parseFloat(String(value));
      case 'uuid': return crypto.createHash('sha256').update(String(value)).digest('hex').substring(0, 36);
      case 'date.iso': return new Date(String(value)).toISOString().split('T')[0];
      case 'currency.iso': return String(value).toUpperCase();
      default: return value;
    }
  }
}

/** IATI Data Types */
interface IATIActivity {
  'iati-identifier': string;
  title: { narrative: string }[];
  description?: { narrative: string }[];
  'activity-status': { code: string };
  'activity-date': Array<{ '@type': string; '@iso-date': string }>;
  'recipient-country': Array<{ '@code': string }>;
  sector?: Array<{ '@vocabulary': string; '@code': string }>;
  budget?: Array<{ value: { '#text': string; '@currency': string } }>;
}

interface IATITransaction {
  'transaction-type': { '@code': string };
  'transaction-date': { '@iso-date': string };
  value: { '#text': string; '@currency': string };
  'provider-org'?: { '@ref': string };
  'receiver-org'?: { '@ref': string };
  description?: { narrative: string }[];
}

/**
 * Sync Orchestrator — Manages sync jobs for all integrations
 */
export class SyncOrchestrator {
  private pool: ReturnType<typeof getPool>;

  constructor() {
    this.pool = getPool();
  }

  /** Start a sync job */
  async startSyncJob(systemCode: ExternalSystem, direction: SyncDirection, entityType: string): Promise<string> {
    const jobId = crypto.randomUUID();
    await this.pool.query(
      `INSERT INTO integration_sync_jobs 
       (id, system_code, direction, entity_type, status, records_processed, started_at)
       VALUES ($1, $2, $3, $4, 'running', 0, NOW())`,
      [jobId, systemCode, direction, entityType]
    );
    logger.info(`[SyncOrchestrator] Started sync job ${jobId} for ${systemCode}`);
    return jobId;
  }

  /** Update sync job progress */
  async updateSyncJob(
    jobId: string,
    recordsProcessed: number,
    recordsCreated: number,
    recordsUpdated: number,
    recordsFailed: number
  ): Promise<void> {
    await this.pool.query(
      `UPDATE integration_sync_jobs 
       SET records_processed = $2, records_created = $3, records_updated = $4, records_failed = $5
       WHERE id = $1`,
      [jobId, recordsProcessed, recordsCreated, recordsUpdated, recordsFailed]
    );
  }

  /** Complete a sync job */
  async completeSyncJob(
    jobId: string,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE integration_sync_jobs 
       SET status = $2, completed_at = NOW(), error_message = $3
       WHERE id = $1`,
      [jobId, status, errorMessage]
    );
    logger.info(`[SyncOrchestrator] Completed sync job ${jobId} with status ${status}`);
  }

  /** Get recent sync history */
  async getSyncHistory(systemCode?: ExternalSystem, limit = 50): Promise<SyncJob[]> {
    let query = `SELECT * FROM integration_sync_jobs`;
    const params: unknown[] = [];
    
    if (systemCode) {
      query += ` WHERE system_code = $1`;
      params.push(systemCode);
    }
    
    query += ` ORDER BY started_at DESC LIMIT ${limit}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }
}

/** Factory functions */
export function createIntegrationAdapter(systemCode: ExternalSystem): IntegrationAdapter {
  return new IntegrationAdapter(systemCode);
}

export function createIATIAdapter(): IATIAdapter {
  return new IATIAdapter();
}

export function createSyncOrchestrator(): SyncOrchestrator {
  return new SyncOrchestrator();
}

export { SYSTEM_CONFIGS, IATI_ACTIVITY_MAPPING, IATI_TRANSACTION_MAPPING };
export type { SystemConfig, FieldMapping, SyncJob, AuthProfile };
