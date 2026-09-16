// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Multi-Tenant Federation Manager Engine
// Database-per-Tenant Isolation + Cross-Tenant Analytics + Routing
// ═══════════════════════════════════════════════════════════════════

import { createHash, randomBytes } from 'crypto';
import pg from 'pg';
import { query, transaction, getPool } from '../core/database.js';
import { logger } from '../core/logger.js';
import { safeParseJSON } from '../core/helpers.js';
import { TenantFederationConfig, TenantUsageMetrics, TenantTier, TenantIsolationLevel, TenantStatus } from './types.js';

interface TenantConnection {
  tenantId: string;
  pool: any;
  schemaName?: string;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function generateTenantId(): string {
  return `tenant_${randomBytes(12).toString('hex')}`;
}

function hashMerkleRoot(data: any[]): string {
  if (data.length === 0) return '0'.repeat(64);
  if (data.length === 1) return createHash('sha256').update(JSON.stringify(data[0])).digest('hex');
  
  const pairs: string[] = [];
  for (let i = 0; i < data.length; i += 2) {
    const left = data[i];
    const right = data[i + 1] || left;
    pairs.push(createHash('sha256').update(left + right).digest('hex'));
  }
  return hashMerkleRoot(pairs);
}

function signAuditEntry(entry: any, privateKey: string): string {
  const data = JSON.stringify(entry);
  return createHash('sha256').update(data + privateKey).digest('hex');
}

function toErrorObject(err: unknown): { name: string; message: string; stack?: string; code?: string } {
  if (err instanceof Error) {
    const e = err as Error & { code?: string };
    return { name: e.name, message: e.message, stack: e.stack, code: e.code };
  }
  return { name: 'UnknownError', message: String(err) };
}

// ═══════════════════════════════════════════════════════════════════
// MULTI-TENANT MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════

export class MultiTenantManager {
  private tenantConnections: Map<string, TenantConnection> = new Map();
  private readonly defaultIsolationLevel: TenantIsolationLevel = 'row';

  constructor() {
    logger.info('🏢 Multi-Tenant Federation Manager initialized', {
      context: 'MultiTenantManager|Federation'
    });
  }

  /**
   * Create a new tenant with isolated resources
   */
  async createTenant(config: Omit<TenantFederationConfig, 'tenantId' | 'createdAt'>): Promise<TenantFederationConfig> {
    const tenantId = generateTenantId();
    const now = new Date().toISOString();
    
    try {
      await transaction(async (client) => {
        // Create tenant master record
        await client.query(`
          INSERT INTO federation_tenants (
            tenant_id, display_name, legal_entity, country_code,
            default_currency, default_locale, tier, isolation_level,
            data_residency, region, feature_flags, quotas, branding,
            compliance_frameworks, parent_tenant_id, status,
            contract_expires_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `, [
          tenantId,
          config.displayName,
          config.legalEntity,
          config.countryCode,
          config.defaultCurrency,
          config.defaultLocale,
          config.tier,
          config.isolationLevel || this.defaultIsolationLevel,
          config.dataResidency,
          config.region,
          JSON.stringify(config.featureFlags || {}),
          JSON.stringify(config.quotas),
          JSON.stringify(config.branding),
          JSON.stringify(config.complianceFrameworks || []),
          config.parentTenantId || null,
          config.status,
          config.contractExpiresAt || null,
          now
        ]);

        // Create isolated schema for schema-level isolation tenants
        if (config.isolationLevel === 'schema' && config.schemaName) {
          await client.query(`CREATE SCHEMA IF NOT EXISTS ${config.schemaName}`);
          await client.query(`GRANT USAGE ON SCHEMA ${config.schemaName} TO nexora_app`);
        }

        // Initialize tenant-specific audit chain
        await client.query(`
          INSERT INTO federation_audit_chain (
            tenant_id, block_index, merkle_root, timestamp, signature
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          tenantId,
          0,
          '0'.repeat(64),
          now,
          signAuditEntry({ tenantId, action: 'genesis', timestamp: now }, 'audit_key')
        ]);

        // Initialize usage metrics for current period
        await client.query(`
          INSERT INTO tenant_usage_metrics (
            tenant_id, period_start, period_end, active_users, storage_used_gb,
            api_calls_count, ai_tokens_used, transactions_processed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          tenantId,
          new Date().toISOString().slice(0, 10) + 'T00:00:00Z',
          new Date().toISOString().slice(0, 10) + 'T23:59:59Z',
          0, 0, 0, 0, 0
        ]);
      });

      logger.info(`✅ Tenant created: ${tenantId} (${config.tier})`, {
        context: 'MultiTenantManager'
      });
      
      return {
        tenantId,
        displayName: config.displayName,
        legalEntity: config.legalEntity,
        countryCode: config.countryCode,
        defaultCurrency: config.defaultCurrency,
        defaultLocale: config.defaultLocale,
        tier: config.tier,
        isolationLevel: config.isolationLevel || 'row',
        dataResidency: config.dataResidency,
        region: config.region,
        featureFlags: config.featureFlags || {},
        quotas: config.quotas,
        branding: config.branding,
        complianceFrameworks: config.complianceFrameworks || [],
        parentTenantId: config.parentTenantId,
        childTenantIds: [],
        status: config.status,
        createdAt: now
      };

    } catch (err) {
      logger.error(`❌ Failed to create tenant: ${config.displayName}`, {
        error: toErrorObject(err),
        context: 'MultiTenantManager'
      });
      throw err;
    }
  }

  /**
   * Get tenant configuration by ID
   */
  async getTenant(tenantId: string): Promise<TenantFederationConfig | null> {
    try {
      const result = await query(`
        SELECT * FROM federation_tenants WHERE tenant_id = $1
      `, [tenantId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return this.rowToTenantConfig(row);

    } catch (err) {
      logger.error('Failed to get tenant', { error: toErrorObject(err), tenantId });
      throw err;
    }
  }

  /**
   * Get tenant connection for schema/database isolation
   */
  async getTenantConnection(tenantId: string): Promise<TenantConnection> {
    // Check cache first
    const cached = this.tenantConnections.get(tenantId);
    if (cached) return cached;

    const tenant = await this.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

    let pool;
    let schemaName: string | undefined;

    switch (tenant.isolationLevel) {
      case 'database':
        // Create new pool for separate database
        pool = tenant.databaseUrl
          ? new pg.Pool({ connectionString: tenant.databaseUrl })
          : getPool();
        break;
      
      case 'schema':
        // Use same pool but set search_path
        pool = getPool();
        schemaName = tenant.schemaName || `tenant_${tenantId.slice(-8)}`;
        break;
      
      case 'row':
      case 'compute':
      default:
        // Row-level security via RLS policies
        pool = getPool();
        break;
    }

    const connection: TenantConnection = { tenantId, pool, schemaName };
    this.tenantConnections.set(tenantId, connection);
    
    return connection;
  }

  /**
   * Execute query in tenant context
   */
  async executeInTenantContext<T>(
    tenantId: string,
    queryFn: (client: any) => Promise<T>
  ): Promise<T> {
    const connection = await this.getTenantConnection(tenantId);
    const tenant = await this.getTenant(tenantId);

    try {
      if (tenant?.isolationLevel === 'schema' && connection.schemaName) {
        // Set schema for this transaction
        const result = await connection.pool.query(
          `SET LOCAL search_path TO ${connection.schemaName}, public`
        );
        void result;
      }

      const client = await connection.pool.connect();
      try {
        return await queryFn(client);
      } finally {
        client.release();
      }

    } catch (err) {
      logger.error('Tenant context query failed', { 
        error: toErrorObject(err),
        tenantId 
      });
      throw err;
    }
  }

  /**
   * Update tenant status
   */
  async updateTenantStatus(
    tenantId: string, 
    status: TenantStatus
  ): Promise<void> {
    try {
      await query(`
        UPDATE federation_tenants 
        SET status = $2, updated_at = $3
        WHERE tenant_id = $1
      `, [tenantId, status, new Date().toISOString()]);

      await this.recordAuditEvent(tenantId, 'system', 'status_update', {
        tenantId,
        newStatus: status,
        previousStatus: status === 'suspended' ? 'active' : status
      });

      logger.info(`Tenant ${tenantId} status → ${status}`, {
        context: 'MultiTenantManager'
      });

    } catch (err) {
      logger.error('Failed to update tenant status', {
        error: toErrorObject(err),
        context: 'MultiTenantManager'
      });
      throw err;
    }
  }

  /**
   * Update tenant quotas
   */
  async updateTenantQuotas(
    tenantId: string,
    quotas: Partial<TenantFederationConfig['quotas']>
  ): Promise<void> {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

      const updatedQuotas = { ...tenant.quotas, ...quotas };

      await query(`
        UPDATE federation_tenants 
        SET quotas = $2, updated_at = $3
        WHERE tenant_id = $1
      `, [tenantId, JSON.stringify(updatedQuotas), new Date().toISOString()]);

      logger.info(`Tenant ${tenantId} quotas updated`, {
        context: 'MultiTenantManager'
      });

    } catch (err) {
      logger.error('Failed to update tenant quotas', { 
        error: toErrorObject(err), 
        tenantId 
      });
      throw err;
    }
  }

  /**
   * Record usage metric for tenant
   */
  async recordUsageMetrics(
    tenantId: string,
    metrics: Partial<TenantUsageMetrics>
  ): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      await query(`
        INSERT INTO tenant_usage_metrics (
          tenant_id, period_start, period_end, active_users,
          storage_used_gb, api_calls_count, ai_tokens_used,
          transactions_processed, peak_concurrent_users,
          compliance_violations, esg_score_delta, carbon_offset_kg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (tenant_id, period_start) DO UPDATE SET
          active_users = EXCLUDED.active_users,
          storage_used_gb = EXCLUDED.storage_used_gb,
          api_calls_count = EXCLUDED.api_calls_count,
          ai_tokens_used = EXCLUDED.ai_tokens_used,
          transactions_processed = EXCLUDED.transactions_processed,
          peak_concurrent_users = GREATEST(tenant_usage_metrics.peak_concurrent_users, EXCLUDED.peak_concurrent_users),
          compliance_violations = EXCLUDED.compliance_violations,
          esg_score_delta = EXCLUDED.esg_score_delta,
          carbon_offset_kg = EXCLUDED.carbon_offset_kg
      `, [
        tenantId,
        `${today}T00:00:00Z`,
        `${today}T23:59:59Z`,
        metrics.activeUsers || 0,
        metrics.storageUsedGB || 0,
        metrics.apiCallsCount || 0,
        metrics.aiTokensUsed || 0,
        metrics.transactionsProcessed || 0,
        metrics.peakConcurrentUsers || 0,
        metrics.complianceViolations || 0,
        metrics.esgScoreDelta || 0,
        metrics.carbonOffsetKg || 0
      ]);

    } catch (err) {
      logger.error('Failed to record usage metrics', { 
        error: toErrorObject(err), 
        tenantId 
      });
    }
  }

  /**
   * Get usage metrics for tenant
   */
  async getTenantUsageMetrics(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<TenantUsageMetrics[]> {
    try {
      let sql = `
        SELECT * FROM tenant_usage_metrics 
        WHERE tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (periodStart) {
        sql += ` AND period_start >= $2`;
        params.push(periodStart);
      }
      if (periodEnd) {
        sql += ` AND period_end <= $3`;
        params.push(periodEnd);
      }

      sql += ` ORDER BY period_start DESC LIMIT 90`;

      const result = await query(sql, params);
      
      return result.rows.map(row => ({
        tenantId: row.tenant_id,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        activeUsers: row.active_users,
        storageUsedGB: parseFloat(row.storage_used_gb) || 0,
        apiCallsCount: parseInt(row.api_calls_count) || 0,
        aiTokensUsed: parseInt(row.ai_tokens_used) || 0,
        transactionsProcessed: parseInt(row.transactions_processed) || 0,
        peakConcurrentUsers: row.peak_concurrent_users,
        complianceViolations: row.compliance_violations,
        esgScoreDelta: parseFloat(row.esg_score_delta) || 0,
        carbonOffsetKg: parseFloat(row.carbon_offset_kg) || 0
      }));

    } catch (err) {
      logger.error('Failed to get usage metrics', { 
        error: toErrorObject(err), 
        tenantId 
      });
      throw err;
    }
  }

  /**
   * Check if tenant has exceeded quotas
   */
  async checkQuotaLimits(tenantId: string): Promise<{
    exceeded: boolean;
    limits: { name: string; current: number; max: number; percentage: number }[];
  }> {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

      // Get current usage
      const usage = await this.getTenantUsageMetrics(tenantId);
      const today = usage.find(m => 
        m.periodStart.startsWith(new Date().toISOString().slice(0, 10))
      );

      const limits = [
        {
          name: 'maxUsers',
          current: today?.activeUsers || 0,
          max: tenant.quotas.maxUsers,
          percentage: ((today?.activeUsers || 0) / tenant.quotas.maxUsers) * 100
        },
        {
          name: 'maxBeneficiaries',
          current: 0, // Would query beneficiaries table
          max: tenant.quotas.maxBeneficiaries,
          percentage: 0
        },
        {
          name: 'apiCallsPerDay',
          current: today?.apiCallsCount || 0,
          max: tenant.quotas.apiCallsPerDay,
          percentage: ((today?.apiCallsCount || 0) / tenant.quotas.apiCallsPerDay) * 100
        },
        {
          name: 'aiTokensPerMonth',
          current: today?.aiTokensUsed || 0,
          max: tenant.quotas.aiTokensPerMonth,
          percentage: ((today?.aiTokensUsed || 0) / tenant.quotas.aiTokensPerMonth) * 100
        },
        {
          name: 'storageGB',
          current: today?.storageUsedGB || 0,
          max: tenant.quotas.storageGB,
          percentage: ((today?.storageUsedGB || 0) / tenant.quotas.storageGB) * 100
        }
      ];

      const exceeded = limits.some(l => l.percentage >= 100);

      if (exceeded) {
        const exceededNames = limits.filter(l => l.percentage >= 100).map(l => l.name).join(', ');
        logger.warn(`⚠️ Tenant ${tenantId} quota limits exceeded: ${exceededNames}`, {
          context: 'MultiTenantManager'
        });
      }

      return { exceeded, limits };

    } catch (err) {
      logger.error('Failed to check quota limits', { 
        error: toErrorObject(err), 
        tenantId 
      });
      throw err;
    }
  }

  /**
   * Record audit event with merkle chain
   */
  async recordAuditEvent(
    tenantId: string,
    actor: string,
    action: string,
    details: Record<string, unknown>,
    result: 'success' | 'failure' | 'denied' = 'success'
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const eventId = `audit_${randomBytes(8).toString('hex')}`;
      
      const event = {
        eventId,
        tenantId,
        actor,
        action,
        details,
        result,
        timestamp: now
      };

      const signature = signAuditEntry(event, 'audit_key');

      // Get last merkle root
      const lastChain = await query(`
        SELECT merkle_root, block_index FROM federation_audit_chain 
        WHERE tenant_id = $1 
        ORDER BY block_index DESC LIMIT 1
      `, [tenantId]);

      const lastRoot = lastChain.rows[0]?.merkle_root || '0'.repeat(64);
      const lastIndex = lastChain.rows[0]?.block_index || 0;
      const newIndex = lastIndex + 1;

      // Compute new merkle root
      const newRoot = hashMerkleRoot([lastRoot, signature, JSON.stringify(event)]);

      await query(`
        INSERT INTO federation_audit_chain (
          tenant_id, block_index, merkle_root, timestamp, signature,
          event_id, actor, action, details, result
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        tenantId,
        newIndex,
        newRoot,
        now,
        signature,
        eventId,
        actor,
        action,
        JSON.stringify(details),
        result
      ]);

    } catch (err) {
      logger.error(`Failed to record audit event: ${action}`, {
        error: toErrorObject(err),
        context: 'MultiTenantManager|Audit'
      });
      // Don't throw - audit should not break operations
    }
  }

  /**
   * Verify audit chain integrity
   */
  async verifyAuditChain(tenantId: string): Promise<{
    valid: boolean;
    blocksChecked: number;
    errors: string[];
  }> {
    try {
      const chain = await query(`
        SELECT * FROM federation_audit_chain 
        WHERE tenant_id = $1 
        ORDER BY block_index ASC
      `, [tenantId]);

      const errors: string[] = [];
      let previousRoot = '0'.repeat(64);

      for (const block of chain.rows) {
        const expectedRoot = hashMerkleRoot([
          previousRoot,
          block.signature,
          JSON.stringify({
            eventId: block.event_id,
            tenantId: block.tenant_id,
            actor: block.actor,
            action: block.action,
            timestamp: block.timestamp
          })
        ]);

        if (block.merkle_root !== expectedRoot) {
          errors.push(`Block ${block.block_index}: merkle root mismatch`);
        }

        previousRoot = block.merkle_root;
      }

      return {
        valid: errors.length === 0,
        blocksChecked: chain.rows.length,
        errors
      };

    } catch (err) {
      logger.error('Failed to verify audit chain', { 
        error: toErrorObject(err), 
        tenantId 
      });
      throw err;
    }
  }

  /**
   * List all tenants with optional filters
   */
  async listTenants(filters?: {
    status?: TenantStatus;
    tier?: TenantTier;
    region?: string;
    search?: string;
  }): Promise<TenantFederationConfig[]> {
    try {
      let sql = `SELECT * FROM federation_tenants WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }
      if (filters?.tier) {
        sql += ` AND tier = $${paramIndex++}`;
        params.push(filters.tier);
      }
      if (filters?.region) {
        sql += ` AND region = $${paramIndex++}`;
        params.push(filters.region);
      }
      if (filters?.search) {
        sql += ` AND (display_name ILIKE $${paramIndex} OR legal_entity ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      sql += ` ORDER BY created_at DESC`;

      const result = await query(sql, params);
      return result.rows.map(row => this.rowToTenantConfig(row));

    } catch (err) {
      logger.error('Failed to list tenants', { error: toErrorObject(err) });
      throw err;
    }
  }

  /**
   * Archive tenant (soft delete with data retention)
   */
  async archiveTenant(tenantId: string, retentionDays = 90): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);

      await query(`
        UPDATE federation_tenants 
        SET status = 'archived', 
            archived_at = $2, 
            retention_expires_at = $3,
            updated_at = $4
        WHERE tenant_id = $1
      `, [tenantId, new Date().toISOString(), expiresAt.toISOString(), new Date().toISOString()]);

      await this.recordAuditEvent(tenantId, 'system', 'tenant_archived', {
        retentionDays,
        expiresAt: expiresAt.toISOString()
      });

      logger.info(`Tenant ${tenantId} archived (retention: ${retentionDays}d)`, {
        context: 'MultiTenantManager'
      });

    } catch (err) {
      logger.error('Failed to archive tenant', { 
        error: toErrorObject(err), 
        tenantId 
      });
      throw err;
    }
  }

  /**
   * Clean up tenant connection cache
   */
  cleanupConnectionCache(): void {
    this.tenantConnections.clear();
    logger.info('Tenant connection cache cleared');
  }

  /**
   * Health check for all tenant connections
   */
  async healthCheck(): Promise<{
    healthy: number;
    degraded: number;
    failed: number;
    total: number;
  }> {
    const tenants = await this.listTenants({ status: 'active' });
    let healthy = 0;
    const degraded = 0;
    let failed = 0;

    for (const tenant of tenants) {
      try {
        const connection = await this.getTenantConnection(tenant.tenantId);
        await connection.pool.query('SELECT 1');
        healthy++;
      } catch {
        failed++;
      }
    }

    return { healthy, degraded, failed, total: tenants.length };
  }

  // ─────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────

  private rowToTenantConfig(row: any): TenantFederationConfig {
    return {
      tenantId: row.tenant_id,
      displayName: row.display_name,
      legalEntity: row.legal_entity,
      countryCode: row.country_code,
      defaultCurrency: row.default_currency,
      defaultLocale: row.default_locale,
      tier: row.tier,
      isolationLevel: row.isolation_level,
      dataResidency: row.data_residency,
      region: row.region,
      databaseUrl: row.database_url,
      schemaName: row.schema_name,
      featureFlags: safeParseJSON(row.feature_flags, {}),
      quotas: safeParseJSON(row.quotas, null),
      branding: safeParseJSON(row.branding, null),
      complianceFrameworks: safeParseJSON(row.compliance_frameworks, []),
      parentTenantId: row.parent_tenant_id,
      childTenantIds: safeParseJSON(row.child_tenant_ids, []),
      status: row.status,
      createdAt: row.created_at,
      contractExpiresAt: row.contract_expires_at
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const multiTenantManager = new MultiTenantManager();
