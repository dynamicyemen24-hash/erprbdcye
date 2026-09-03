// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Global Federation Cockpit™ Unified Exports
// Multi-Tenant + ESG + Post-Quantum + Observability Integration
// ═══════════════════════════════════════════════════════════════════

export * from './types.js';
export { multiTenantManager, MultiTenantManager } from './multiTenantManager.js';
export { esgCarbonEngine, ESGCarbonEngine } from './esgCarbon.js';
export { quantumCryptoEngine, QuantumCryptoEngine } from './quantumCrypto.js';
export { observabilityEngine, ObservabilityEngine } from './observability.js';

import { multiTenantManager } from './multiTenantManager.js';
import { esgCarbonEngine } from './esgCarbon.js';
import { quantumCryptoEngine } from './quantumCrypto.js';
import { observabilityEngine } from './observability.js';
import { logger } from '../core/logger.js';

/**
 * Global Federation Cockpit™ - Unified Controller
 * Orchestrates all federation capabilities
 */
export class FederationCockpit {
  readonly tenants = multiTenantManager;
  readonly esg = esgCarbonEngine;
  readonly quantum = quantumCryptoEngine;
  readonly observability = observabilityEngine;

  /**
   * Initialize federation for a new tenant
   */
  async initializeTenant(tenantConfig: any): Promise<{
    tenant: any;
    pqcKeyId: string;
    sloTargets: string[];
  }> {
    logger.info(`🌐 Initializing tenant in Federation Cockpit: ${tenantConfig.displayName}`, {
      context: 'FederationCockpit'
    });

    // 1. Create tenant
    const tenant = await this.tenants.createTenant(tenantConfig);

    // 2. Generate initial PQC keys
    const pqcKey = await this.quantum.generateKeyPair(tenant.tenantId, 'HYBRID_X25519_KYBER768');

    // 3. Define default SLOs
    const sloIds: string[] = [];
    const defaultSLOs = [
      { name: 'API Availability', target: 0.999 },
      { name: 'API Latency P95', target: 0.99 },
      { name: 'Database Query Success', target: 0.9995 }
    ];

    for (const slo of defaultSLOs) {
      try {
        const sloDef = await this.observability.defineSLO({
          serviceName: 'federation-api',
          sloName: slo.name,
          description: `Default SLO for ${slo.name}`,
          sli: {
            numeratorQuery: `SELECT COUNT(*) as count FROM structured_logs WHERE level != 'ERROR' AND tenant_id = $1 AND timestamp >= $2`,
            denominatorQuery: `SELECT COUNT(*) as count FROM structured_logs WHERE tenant_id = $1 AND timestamp >= $2`
          },
          target: slo.target,
          window: '24h',
          burnRateThreshold: 0.1,
          alertChannel: 'default',
          tenantId: tenant.tenantId
        });
        sloIds.push(sloDef.sloId);
      } catch (err) {
        logger.warn(`SLO setup deferred: ${slo.name}`, { context: 'FederationCockpit' });
      }
    }

    // 4. Record initialization audit event
    await this.tenants.recordAuditEvent(
      tenant.tenantId,
      'federation-cockpit',
      'tenant_initialized',
      { pqcKeyId: pqcKey.keyId, sloCount: sloIds.length }
    );

    logger.info(`✅ Tenant ${tenant.tenantId} fully initialized in Federation`, {
      context: 'FederationCockpit'
    });

    return {
      tenant,
      pqcKeyId: pqcKey.keyId,
      sloTargets: sloIds
    };
  }

  /**
   * Get comprehensive federation status
   */
  async getFederationStatus(): Promise<{
    health: any;
    tenants: { total: number; active: number };
    esg: { totalOffset: number; projects: number };
    security: { activeKeys: number; activeSessions: number };
    observability: { sloCompliance: number };
  }> {
    const [health, tenants, projects, txnSummary] = await Promise.all([
      this.observability.getFederationHealth(),
      this.tenants.listTenants(),
      this.getProjectSummary(),
      this.getOffsetSummary()
    ]);

    return {
      health,
      tenants: {
        total: tenants.length,
        active: tenants.filter(t => t.status === 'active').length
      },
      esg: {
        totalOffset: txnSummary.totalOffset,
        projects: projects.count
      },
      security: {
        activeKeys: health.security.pqcKeysActive,
        activeSessions: health.security.zeroTrustSessionsActive
      },
      observability: {
        sloCompliance: health.observability.sloComplianceRate
      }
    };
  }

  private async getProjectSummary(): Promise<{ count: number }> {
    try {
      const { query } = await import('../core/database.js');
      const result = await query(`SELECT COUNT(*) as count FROM carbon_offset_projects WHERE status = 'active'`);
      return { count: parseInt(result.rows[0]?.count) || 0 };
    } catch {
      return { count: 0 };
    }
  }

  private async getOffsetSummary(): Promise<{ totalOffset: number }> {
    try {
      const { query } = await import('../core/database.js');
      const result = await query(`SELECT COALESCE(SUM(offset_kg_co2e), 0) as total FROM carbon_footprints`);
      return { totalOffset: parseFloat(result.rows[0]?.total) || 0 };
    } catch {
      return { totalOffset: 0 };
    }
  }
}

export const federationCockpit = new FederationCockpit();

export default federationCockpit;
