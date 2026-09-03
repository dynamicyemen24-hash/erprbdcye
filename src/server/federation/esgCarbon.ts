// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — ESG & Carbon Credit Engine
// GHG Protocol + SDG Impact Mapping + Carbon Offset Trading
// ═══════════════════════════════════════════════════════════════════

import { createHash, randomBytes } from 'crypto';
import { query, transaction } from '../core/database.js';
import { logger } from '../core/logger.js';
import {
  CarbonFootprint, CarbonOffsetProject, CarbonCreditTransaction, ESGMetric,
  SDGImpactReport, CarbonStandard, ESGFramework, SDGGoal
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

function toErrorObject(err: unknown): { name: string; message: string; stack?: string; code?: string } {
  if (err instanceof Error) {
    const e = err as Error & { code?: string };
    return { name: e.name, message: e.message, stack: e.stack, code: e.code };
  }
  return { name: 'UnknownError', message: String(err) };
}

// Emission factors for common humanitarian activities (kg CO2e per unit)
const EMISSION_FACTORS: Record<string, { factor: number; unit: string; source: string }> = {
  // Transport
  'vehicle_km_petrol': { factor: 0.21, unit: 'km', source: 'DEFRA 2024' },
  'vehicle_km_diesel': { factor: 0.17, unit: 'km', source: 'DEFRA 2024' },
  'flight_km_short': { factor: 0.255, unit: 'km', source: 'DEFRA 2024' },
  'flight_km_long': { factor: 0.195, unit: 'km', source: 'DEFRA 2024' },
  // Energy
  'electricity_kwh_grid': { factor: 0.417, unit: 'kWh', source: 'IPCC 2023' },
  'electricity_kwh_solar': { factor: 0.041, unit: 'kWh', source: 'IPCC 2023' },
  'natural_gas_m3': { factor: 2.0, unit: 'm³', source: 'DEFRA 2024' },
  'diesel_liter': { factor: 3.1, unit: 'L', source: 'DEFRA 2024' },
  // Materials
  'paper_kg': { factor: 3.5, unit: 'kg', source: 'EPA 2023' },
  'plastic_kg': { factor: 6.0, unit: 'kg', source: 'EPA 2023' },
  // Food
  'food_waste_kg': { factor: 2.5, unit: 'kg', source: 'DEFRA 2024' },
  'beef_kg': { factor: 27.0, unit: 'kg', source: 'DEFRA 2024' },
};

// SDG category mapping
const SDG_CATEGORIES: Record<number, string[]> = {
  1: ['poverty', 'social_protection'],
  2: ['food_security', 'nutrition', 'agriculture'],
  3: ['health', 'wellbeing'],
  4: ['education', 'skills'],
  5: ['gender', 'equality'],
  6: ['water', 'sanitation'],
  7: ['energy', 'renewable'],
  8: ['employment', 'economic_growth'],
  9: ['infrastructure', 'innovation'],
  10: ['inequality', 'inclusion'],
  11: ['urban', 'housing'],
  12: ['consumption', 'waste'],
  13: ['climate', 'emissions'],
  14: ['marine', 'oceans'],
  15: ['forestry', 'biodiversity'],
  16: ['governance', 'peace'],
  17: ['partnerships', 'aid'],
};

// ═══════════════════════════════════════════════════════════════════
// ESG CARBON ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════

export class ESGCarbonEngine {
  constructor() {
    logger.info('🌱 ESG & Carbon Credit Engine initialized', { 
      context: 'ESGCarbonEngine' 
    });
  }

  /**
   * Calculate carbon footprint for a project/activity
   */
  async calculateFootprint(
    tenantId: string,
    activities: {
      type: string;
      quantity: number;
      unit: string;
    }[],
    periodStart: string,
    periodEnd: string
  ): Promise<CarbonFootprint> {
    const footprintId = generateId('footprint');

    let scope1 = 0; // Direct emissions (owned sources)
    let scope2 = 0; // Indirect emissions (purchased energy)
    let scope3 = 0; // Value chain emissions

    for (const activity of activities) {
      const factor = EMISSION_FACTORS[activity.type];
      if (!factor) {
        logger.warn(`Unknown emission factor: ${activity.type}`);
        continue;
      }

      const emissions = factor.factor * activity.quantity;
      
      // Categorize by scope
      if (activity.type.includes('vehicle') || activity.type.includes('diesel')) {
        scope1 += emissions;
      } else if (activity.type.includes('electricity') || activity.type.includes('gas')) {
        scope2 += emissions;
      } else {
        scope3 += emissions;
      }
    }

    const total = scope1 + scope2 + scope3;

    try {
      await query(`
        INSERT INTO carbon_footprints (
          footprint_id, tenant_id, period_start, period_end,
          scope1_kg_co2e, scope2_kg_co2e, scope3_kg_co2e, total_kg_co2e,
          methodology, verification_status, offset_kg_co2e, net_kg_co2e,
          activities_detail, calculated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        footprintId, tenantId, periodStart, periodEnd,
        scope1, scope2, scope3, total,
        'GHG_PROTOCOL', 'unverified', 0, total,
        JSON.stringify(activities), new Date().toISOString()
      ]);

      logger.info(`Carbon footprint calculated: ${total} kg CO2e (scope1: ${scope1}, scope2: ${scope2}, scope3: ${scope3})`, {
        context: 'ESGCarbonEngine'
      });

      return {
        footprintId: footprintId,
        tenantId: tenantId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        scope1KgCO2e: scope1,
        scope2KgCO2e: scope2,
        scope3KgCO2e: scope3,
        totalKgCO2e: total,
        methodology: 'GHG_PROTOCOL' as CarbonStandard,
        verificationStatus: 'unverified',
        offsetKgCO2e: 0,
        netKgCO2e: total,
        evidence: [],
        calculatedAt: new Date().toISOString()
      };

    } catch (err) {
      logger.error('Failed to calculate footprint', { 
        error: toErrorObject(err),
        context: 'ESGCarbonEngine' 
      });
      throw err;
    }
  }

  /**
   * Register a carbon offset project
   */
  async registerOffsetProject(
    tenantId: string,
    project: Omit<CarbonOffsetProject, 'projectId' | 'status' | 'creditsIssued' | 'creditsRetired' | 'creditsAvailable'>
  ): Promise<CarbonOffsetProject> {
    const projectId = generateId('proj');

    try {
      await query(`
        INSERT INTO carbon_offset_projects (
          project_id, project_name, project_type, registry, registry_project_id,
          country_code, coordinates, total_credits_issued, credits_retired,
          credits_available, price_per_tonne_usd, sdg_goals, verification_body,
          vintage, start_date, end_date, status, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        projectId, project.projectName, project.projectType, project.registry,
        project.registryProjectId || null,
        project.countryCode, 
        project.coordinates ? JSON.stringify(project.coordinates) : null,
        0, 0, 0, project.pricePerTonneUSD,
        JSON.stringify(project.sdgGoals), project.verificationBody || null,
        project.vintage, project.startDate, project.endDate || null,
        'registered', tenantId
      ]);

      logger.info(`Carbon offset project registered: ${project.projectName}`, {
        context: 'ESGCarbonEngine'
      });

      const result: CarbonOffsetProject = {
        projectId: projectId,
        projectName: project.projectName,
        projectType: project.projectType,
        registry: project.registry,
        registryProjectId: project.registryProjectId,
        countryCode: project.countryCode,
        coordinates: project.coordinates,
        totalCreditsIssued: 0,
        creditsRetired: 0,
        creditsAvailable: 0,
        pricePerTonneUSD: project.pricePerTonneUSD,
        sdgGoals: project.sdgGoals,
        verificationBody: project.verificationBody,
        vintage: project.vintage,
        startDate: project.startDate,
        endDate: project.endDate,
        status: 'registered',
        tenantId: tenantId
      };
      return result;

    } catch (err) {
      logger.error('Failed to register offset project', { 
        error: toErrorObject(err),
        context: 'ESGCarbonEngine' 
      });
      throw err;
    }
  }

  /**
   * Issue credits to a project
   */
  async issueCredits(
    projectId: string,
    amountTonnes: number,
    serialNumbers: string[]
  ): Promise<void> {
    try {
      await transaction(async (client) => {
        // Update project totals
        await client.query(`
          UPDATE carbon_offset_projects 
          SET total_credits_issued = total_credits_issued + $2,
              credits_available = credits_available + $2
          WHERE project_id = $1
        `, [projectId, amountTonnes]);

        // Record issuance
        await client.query(`
          INSERT INTO carbon_credit_transactions (
            transaction_id, buyer_tenant_id, project_id, credits_amount,
            price_per_tonne_usd, total_amount_usd, transaction_date,
            status, serial_numbers, type
          ) VALUES ($1, 'ISSUER', $2, $3, 0, 0, $4, 'completed', $5, 'issuance')
        `, [
          generateId('txn'),
          projectId,
          amountTonnes,
          new Date().toISOString(),
          JSON.stringify(serialNumbers)
        ]);
      });

      logger.info(`Credits issued: ${amountTonnes}t`, {
        context: 'ESGCarbonEngine'
      });

    } catch (err) {
      logger.error('Failed to issue credits', { 
        error: toErrorObject(err),
        context: 'ESGCarbonEngine' 
      });
      throw err;
    }
  }

  /**
   * Retire credits for a beneficiary/cause
   */
  async retireCredits(
    buyerTenantId: string,
    projectId: string,
    amountTonnes: number,
    purpose: string,
    beneficiaryDescription?: string
  ): Promise<CarbonCreditTransaction> {
    const transactionId = generateId('txn');
    const serialNumbers = Array.from({ length: Math.ceil(amountTonnes) }, 
      () => `${projectId}-${randomBytes(4).toString('hex').toUpperCase()}`
    );

    // Get project price
    const project = await query(`
      SELECT price_per_tonne_usd, credits_available FROM carbon_offset_projects 
      WHERE project_id = $1 AND status = 'active'
    `, [projectId]);

    if (project.rows.length === 0) {
      throw new Error(`Active project not found: ${projectId}`);
    }

    const { price_per_tonne_usd, credits_available } = project.rows[0];
    
    if (credits_available < amountTonnes) {
      throw new Error(`Insufficient credits: available ${credits_available}t, requested ${amountTonnes}t`);
    }

    try {
      await transaction(async (client) => {
        // Deduct from project
        await client.query(`
          UPDATE carbon_offset_projects 
          SET credits_available = credits_available - $2,
              credits_retired = credits_retired + $2
          WHERE project_id = $1
        `, [projectId, amountTonnes]);

        // Record transaction
        await client.query(`
          INSERT INTO carbon_credit_transactions (
            transaction_id, buyer_tenant_id, seller_tenant_id, project_id,
            credits_amount, price_per_tonne_usd, total_amount_usd,
            retirement_purpose, beneficiary_description, transaction_date,
            retirement_date, status, serial_numbers, type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          transactionId, buyerTenantId, 'ISSUER', projectId,
          amountTonnes, price_per_tonne_usd, amountTonnes * price_per_tonne_usd,
          purpose, beneficiaryDescription || null,
          new Date().toISOString(), new Date().toISOString(),
          'retired', JSON.stringify(serialNumbers), 'retirement'
        ]);
      });

      logger.info(`Credits retired: ${amountTonnes}t for ${purpose}`, {
        context: 'ESGCarbonEngine'
      });

      const txnResult: CarbonCreditTransaction = {
        transactionId: transactionId,
        buyerTenantId: buyerTenantId,
        sellerTenantId: 'ISSUER',
        projectId: projectId,
        creditsAmount: amountTonnes,
        pricePerTonneUSD: price_per_tonne_usd,
        totalAmountUSD: amountTonnes * price_per_tonne_usd,
        retirementPurpose: purpose,
        beneficiaryDescription: beneficiaryDescription,
        transactionDate: new Date().toISOString(),
        retirementDate: new Date().toISOString(),
        serialNumbers: serialNumbers,
        status: 'retired'
      };
      return txnResult;

    } catch (err) {
      logger.error('Failed to retire credits', { 
        error: toErrorObject(err),
        context: 'ESGCarbonEngine' 
      });
      throw err;
    }
  }

  /**
   * Record ESG metric
   */
  async recordESGMetric(
    tenantId: string,
    metric: Omit<ESGMetric, 'metricId'>
  ): Promise<ESGMetric> {
    const metricId = generateId('esg');

    try {
      await query(`
        INSERT INTO esg_metrics (
          metric_id, tenant_id, framework, metric_code, metric_name,
          category, subcategory, unit, value, target_value, reporting_period,
          data_source, verification_level, evidence_url, sdg_goals
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        metricId, tenantId, metric.framework, metric.metricCode,
        metric.metricName, metric.category, metric.subcategory, metric.unit,
        metric.value, metric.targetValue || null, metric.reportingPeriod,
        metric.dataSource, metric.verificationLevel, metric.evidenceUrl || null,
        JSON.stringify(metric.sdgGoals)
      ]);

      logger.info(`ESG metric recorded: ${metric.metricCode} = ${metric.value}${metric.unit}`, {
        context: 'ESGCarbonEngine'
      });

      const metricResult: ESGMetric = {
        metricId: metricId,
        tenantId: tenantId,
        framework: metric.framework,
        metricCode: metric.metricCode,
        metricName: metric.metricName,
        category: metric.category,
        subcategory: metric.subcategory,
        unit: metric.unit,
        value: metric.value,
        targetValue: metric.targetValue,
        reportingPeriod: metric.reportingPeriod,
        dataSource: metric.dataSource,
        verificationLevel: metric.verificationLevel,
        evidenceUrl: metric.evidenceUrl,
        sdgGoals: metric.sdgGoals
      };
      return metricResult;

    } catch (err) {
      logger.error('Failed to record ESG metric', { 
        error: toErrorObject(err),
        context: 'ESGCarbonEngine' 
      });
      throw err;
    }
  }

  /**
   * Generate SDG Impact Report
   */
  async generateSDGImpactReport(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    programId?: string,
    projectId?: string
  ): Promise<SDGImpactReport> {
    const reportId = generateId('sdg');

    try {
      // Aggregate ESG metrics by SDG goal
      const metrics = await query(`
        SELECT * FROM esg_metrics 
        WHERE tenant_id = $1 
          AND reporting_period >= $2 
          AND reporting_period <= $3
          ${programId ? 'AND program_id = $4' : ''}
          ${projectId ? `AND project_id = ${programId ? '$5' : '$4'}` : ''}
        ORDER BY framework, metric_code
      `, programId 
        ? projectId 
          ? [tenantId, periodStart, periodEnd, programId, projectId]
          : [tenantId, periodStart, periodEnd, programId]
        : [tenantId, periodStart, periodEnd]
      );

      // Group by SDG
      const sdgImpacts: SDGImpactReport['sdgImpacts'] = [];
      
      for (let goal = 1; goal <= 17; goal++) {
        const goalMetrics = metrics.rows.filter(m => {
          const sdgs: number[] = typeof m.sdg_goals === 'string' 
            ? JSON.parse(m.sdg_goals) : m.sdg_goals || [];
          return sdgs.includes(goal);
        });

        if (goalMetrics.length > 0) {
          sdgImpacts.push({
            goal: goal as SDGGoal,
            beneficiariesReached: this.calculateBeneficiariesForGoal(goalMetrics),
            outcomesAchieved: this.extractOutcomes(goalMetrics),
            kpiMetrics: goalMetrics.map(m => ({
              code: m.metric_code,
              name: m.metric_name,
              value: parseFloat(m.value),
              unit: m.unit
            })),
            budgetSpent: this.calculateBudgetForGoal(goalMetrics),
            currency: 'USD'
          });
        }
      }

      const totalBeneficiaries = sdgImpacts.reduce((sum, g) => sum + g.beneficiariesReached, 0);
      const totalBudget = sdgImpacts.reduce((sum, g) => sum + g.budgetSpent, 0);

      await query(`
        INSERT INTO sdg_impact_reports (
          report_id, tenant_id, program_id, project_id, period_start,
          period_end, sdg_impacts, total_beneficiaries, total_budget_spent,
          total_budget_currency, methodology, generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        reportId, tenantId, programId || null, projectId || null,
        periodStart, periodEnd, JSON.stringify(sdgImpacts),
        totalBeneficiaries, totalBudget, 'USD',
        'Aggregated from ESG metrics with SDG goal mapping',
        new Date().toISOString()
      ]);

      logger.info(`SDG Impact Report generated (${sdgImpacts.length} goals covered)`, {
        context: 'ESGCarbonEngine'
      });

      const reportResult: SDGImpactReport = {
        reportId: reportId,
        tenantId: tenantId,
        programId: programId,
        projectId: projectId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        sdgImpacts: sdgImpacts,
        totalBeneficiaries: totalBeneficiaries,
        totalBudgetSpent: totalBudget,
        totalBudgetCurrency: 'USD',
        methodology: 'Aggregated from ESG metrics with SDG goal mapping',
        limitations: 'Data quality depends on reporting completeness',
        generatedAt: new Date().toISOString()
      };
      return reportResult;

    } catch (err) {
      logger.error('Failed to generate SDG report', { 
        error: toErrorObject(err),
        context: 'ESGCarbonEngine' 
      });
      throw err;
    }
  }

  /**
   * Get carbon offset projects for tenant
   */
  async getOffsetProjects(
    tenantId: string,
    filters?: { status?: string; registry?: string }
  ): Promise<CarbonOffsetProject[]> {
    let sql = `SELECT * FROM carbon_offset_projects WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (filters?.status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }
    if (filters?.registry) {
      sql += ` AND registry = $${params.length + 1}`;
      params.push(filters.registry);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);

    return result.rows.map(row => ({
      projectId: row.project_id,
      projectName: row.project_name,
      projectType: row.project_type,
      registry: row.registry,
      registryProjectId: row.registry_project_id,
      countryCode: row.country_code,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : undefined,
      totalCreditsIssued: parseFloat(row.total_credits_issued),
      creditsRetired: parseFloat(row.credits_retired),
      creditsAvailable: parseFloat(row.credits_available),
      pricePerTonneUSD: parseFloat(row.price_per_tonne_usd),
      sdgGoals: typeof row.sdg_goals === 'string' ? JSON.parse(row.sdg_goals) : row.sdg_goals,
      verificationBody: row.verification_body,
      vintage: row.vintage,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      tenantId: row.tenant_id
    }));
  }

  /**
   * Get carbon credit transactions
   */
  async getCreditTransactions(
    tenantId: string,
    filters?: { type?: string; status?: string }
  ): Promise<CarbonCreditTransaction[]> {
    let sql = `
      SELECT * FROM carbon_credit_transactions 
      WHERE buyer_tenant_id = $1 OR seller_tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (filters?.type) {
      sql += ` AND type = $${params.length + 1}`;
      params.push(filters.type);
    }
    if (filters?.status) {
      sql += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY transaction_date DESC LIMIT 100`;

    const result = await query(sql, params);

    return result.rows.map(row => ({
      transactionId: row.transaction_id,
      buyerTenantId: row.buyer_tenant_id,
      sellerTenantId: row.seller_tenant_id,
      projectId: row.project_id,
      creditsAmount: parseFloat(row.credits_amount),
      pricePerTonneUSD: parseFloat(row.price_per_tonne_usd),
      totalAmountUSD: parseFloat(row.total_amount_usd),
      retirementPurpose: row.retirement_purpose,
      beneficiaryDescription: row.beneficiary_description,
      transactionDate: row.transaction_date,
      retirementDate: row.retirement_date,
      serialNumbers: typeof row.serial_numbers === 'string' 
        ? JSON.parse(row.serial_numbers) : row.serial_numbers,
      status: row.status,
      blockchainTxHash: row.blockchain_tx_hash
    }));
  }

  /**
   * Get ESG metrics summary
   */
  async getESGMetricsSummary(
    tenantId: string,
    framework?: ESGFramework
  ): Promise<Record<string, { total: number; average: number; count: number }>> {
    let sql = `
      SELECT category, SUM(value::numeric) as total, 
             AVG(value::numeric) as average, COUNT(*) as count
      FROM esg_metrics 
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (framework) {
      sql += ` AND framework = $2`;
      params.push(framework);
    }

    sql += ` GROUP BY category`;

    const result = await query(sql, params);

    const summary: Record<string, { total: number; average: number; count: number }> = {};
    for (const row of result.rows) {
      summary[row.category] = {
        total: parseFloat(row.total) || 0,
        average: parseFloat(row.average) || 0,
        count: parseInt(row.count) || 0
      };
    }

    return summary;
  }

  // ─────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────

  private calculateBeneficiariesForGoal(metrics: any[]): number {
    const beneficiaryMetrics = metrics.filter(m => 
      m.metric_code.toLowerCase().includes('beneficiary') ||
      m.metric_code.toLowerCase().includes('person') ||
      m.metric_code.toLowerCase().includes('household')
    );
    
    return beneficiaryMetrics.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);
  }

  private extractOutcomes(metrics: any[]): string[] {
    return metrics
      .filter(m => m.category === 'outcome')
      .map(m => `${m.metric_name}: ${m.value} ${m.unit}`)
      .slice(0, 10);
  }

  private calculateBudgetForGoal(metrics: any[]): number {
    const budgetMetrics = metrics.filter(m => 
      m.metric_code.toLowerCase().includes('budget') ||
      m.metric_code.toLowerCase().includes('cost') ||
      m.metric_code.toLowerCase().includes('spend')
    );
    
    return budgetMetrics.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

export const esgCarbonEngine = new ESGCarbonEngine();
