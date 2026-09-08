// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Continuous Compliance Engine™ (CCE)
// Core Engine: Policy-as-Code Evaluator + Risk Scoring + Audit Chain
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { getPool } from '../core/database';
import logger from '../core/logger';
import {
  ComplianceFramework,
  ComplianceRule,
  ComplianceViolation,
  ComplianceAssessment,
  RiskScore,
  RiskFactor,
  IPSAS23Check,
  HumanitarianStandardCheck,
  StandardIndicator,
  AuditLogEntry,
  ViolationSeverity
} from './types';

/** Error normalizer */
function toErrorObject(err: unknown): { name: string; message: string; stack?: string; code?: string } {
  if (err instanceof Error) {
    const e = err as Error & { code?: string };
    return { name: e.name, message: e.message, stack: e.stack, code: e.code };
  }
  return { name: 'UnknownError', message: String(err) };
}

/**
 * Continuous Compliance Engine
 * - Policy-as-Code evaluation
 * - Real-time risk scoring
 * - IPSAS/Sphere/CHS/OECD-DAC checks
 * - Tamper-proof audit log
 */
export class ContinuousComplianceEngine {
  private pool: ReturnType<typeof getPool>;
  private rules: Map<string, ComplianceRule> = new Map();
  private lastAuditHash: string = '';

  constructor() {
    this.pool = getPool();
    this.loadDefaultRules();
  }

  /** Load default compliance rules from standards */
  private loadDefaultRules(): void {
    // IPSAS 23 - Revenue from Non-Exchange Transactions
    this.registerRule({
      id: 'ipsas-23-001',
      framework: 'IPSAS_23',
      code: 'IPSAS-23-001',
      name: 'Revenue Recognition Period',
      nameAr: 'فترة إثبات الإيرادات',
      description: 'Non-exchange revenue must be recognized when control is obtained and recognition criteria met',
      descriptionAr: 'يجب إثبات الإيرادات غير التبادلية عند الحصول على السيطرة وتحقق معايير الإثبات',
      category: 'financial',
      severity: 'high',
      domain: 'NEB-10',
      entityType: 'transactions',
      policyExpression: 'transaction.exchange_type == "NON_EXCHANGE" && transaction.recognition_date != null',
      autoRemediation: 'set_recognition_date',
      mandatory: true,
      standardReference: 'IPSAS 23.30',
    });

    this.registerRule({
      id: 'ipsas-23-002',
      framework: 'IPSAS_23',
      code: 'IPSAS-23-002',
      name: 'Restricted Fund Segregation',
      nameAr: 'فصل الأموال المقيدة',
      description: 'Restricted funds must be tracked separately from unrestricted funds',
      descriptionAr: 'يجب تتبع الأموال المقيدة بشكل منفصل عن الأموال غير المقيدة',
      category: 'financial',
      severity: 'critical',
      domain: 'NEB-10',
      entityType: 'transactions',
      policyExpression: 'transaction.is_restricted == true && transaction.fund_classification != null',
      mandatory: true,
      standardReference: 'IPSAS 23.45-47',
    });

    // IFRS 15 - Revenue from Contracts
    this.registerRule({
      id: 'ifrs-15-001',
      framework: 'IFRS_15',
      code: 'IFRS-15-001',
      name: 'Five-Step Revenue Recognition',
      nameAr: 'إثبات الإيرادات بخمسة خطوات',
      description: 'Exchange transactions must follow 5-step model: identify contract, identify performance obligations, determine transaction price, allocate price, recognize revenue',
      descriptionAr: 'يجب أن تتبع المعاملات التبادلية نموذج 5 خطوات: تحديد العقد، تحديد التزامات الأداء، تحديد سعر المعاملة، توزيع السعر، إثبات الإيراد',
      category: 'financial',
      severity: 'high',
      domain: 'NEB-10',
      entityType: 'revenue_records',
      policyExpression: 'revenue.performance_obligations.length > 0 && revenue.transaction_price > 0',
      mandatory: true,
      standardReference: 'IFRS 15.9-10',
    });

    // Sphere 2024 - Humanitarian Standards
    this.registerRule({
      id: 'sphere-2024-001',
      framework: 'SPHERE_2024',
      code: 'SPHERE-001',
      name: 'Minimum WASH Standards',
      nameAr: 'الحد الأدنى لمعايير المياه والصرف الصحي',
      description: 'Water access: 15L/person/day, Sanitation: 1 toilet/20 people, Hygiene promotion',
      descriptionAr: 'الوصول للمياه: 15 لتر/شخص/يوم، الصرف الصحي: مرحاض لكل 20 شخص، تعزيز النظافة',
      category: 'operational',
      severity: 'critical',
      domain: 'NEB-05',
      entityType: 'projects',
      policyExpression: 'project.sector == "WASH" && project.water_per_person_liters >= 15 && project.sanitation_ratio >= 0.05',
      mandatory: true,
      standardReference: 'Sphere 2024 - Water Supply Standard 1.1',
    });

    // CHS - Core Humanitarian Standard (9 commitments)
    this.registerRule({
      id: 'chs-001',
      framework: 'CHS_9',
      code: 'CHS-C1',
      name: 'CHS Commitment 1: Humanitarian Response Appropriate and Relevant',
      nameAr: 'الالتزام 1: الاستجابة الإنسانية مناسبة وملائمة',
      description: 'Communities and people affected by crisis receive assistance appropriate to their needs',
      descriptionAr: 'تتلقى المجتمعات والأشخاص المتضررون من الأزمات مساعدة مناسبة لاحتياجاتهم',
      category: 'operational',
      severity: 'high',
      domain: 'NEB-06',
      entityType: 'service_delivery',
      policyExpression: 'service.needs_assessment_date != null && service.affected_population_consulted == true',
      mandatory: true,
      standardReference: 'CHS Commitment 1',
    });

    // OECD-DAC - Development Assistance
    this.registerRule({
      id: 'oecd-dac-001',
      framework: 'OECD_DAC',
      code: 'OECD-DAC-CR',
      name: 'Creditor Reporting System Markers',
      nameAr: 'علامات نظام إعداد التقارير للدائنين',
      description: 'All aid activities must include Rio Markers for environment, gender, and biodiversity',
      descriptionAr: 'يجب أن تتضمن جميع الأنشطة الإغاثية علامات ريو للبيئة والنوع الاجتماعي والتنوع البيولوجي',
      category: 'reporting',
      severity: 'medium',
      domain: 'NEB-03',
      entityType: 'projects',
      policyExpression: 'project.rio_markers.environment != null && project.rio_markers.gender != null',
      mandatory: true,
      standardReference: 'OECD-DAC CRS Directives',
    });

    // SOX 404 - Internal Controls
    this.registerRule({
      id: 'sox-404-001',
      framework: 'SOX_404',
      code: 'SOX-404-01',
      name: 'Segregation of Duties',
      nameAr: 'فصل الواجبات',
      description: 'Authorization, recording, and custody of assets must be separated',
      descriptionAr: 'يجب فصل التفويض والتسجيل وحفظ الأصول',
      category: 'financial',
      severity: 'critical',
      domain: 'NEB-10',
      entityType: 'transactions',
      policyExpression: 'transaction.created_by != transaction.approved_by',
      mandatory: true,
      standardReference: 'SOX Section 404',
    });

    // ISO 27001
    this.registerRule({
      id: 'iso-27001-001',
      framework: 'ISO_27001',
      code: 'ISO-27001-A9',
      name: 'Access Control Policy',
      nameAr: 'سياسة التحكم في الوصول',
      description: 'Access to information systems must follow least privilege principle',
      descriptionAr: 'يجب أن يتبع الوصول إلى أنظمة المعلومات مبدأ الحد الأدنى من الامتيازات',
      category: 'security',
      severity: 'high',
      domain: 'NEB-12',
      entityType: 'users',
      policyExpression: 'user.role_count <= user.required_roles',
      mandatory: true,
      standardReference: 'ISO 27001:2022 - A.9.1.1',
    });

    // GDPR
    this.registerRule({
      id: 'gdpr-001',
      framework: 'GDPR',
      code: 'GDPR-Art-6',
      name: 'Lawful Basis for Processing',
      nameAr: 'الأساس القانوني للمعالجة',
      description: 'Personal data processing must have a lawful basis (consent, contract, legal obligation, vital interests, public task, legitimate interests)',
      descriptionAr: 'يجب أن يكون لمعالجة البيانات الشخصية أساس قانوني',
      category: 'data',
      severity: 'critical',
      domain: 'NEB-06',
      entityType: 'beneficiaries',
      policyExpression: 'beneficiary.consent_obtained == true || beneficiary.legal_basis != null',
      mandatory: true,
      standardReference: 'GDPR Article 6',
    });

    // Yemen Data Protection Law
    this.registerRule({
      id: 'yemen-dpl-001',
      framework: 'YEMEN_DPL',
      code: 'YEMEN-DPL-001',
      name: 'Cross-Border Data Transfer',
      nameAr: 'نقل البيانات عبر الحدود',
      description: 'Personal data transfer outside Yemen requires explicit consent or adequacy decision',
      descriptionAr: 'يتطلب نقل البيانات الشخصية خارج اليمن موافقة صريحة أو قرار كفاءة',
      category: 'data',
      severity: 'high',
      domain: 'NEB-06',
      entityType: 'beneficiaries',
      policyExpression: 'beneficiary.country != "YE" && beneficiary.cross_border_consent == true',
      mandatory: true,
      standardReference: 'Yemen Data Protection Law 2024 - Article 22',
    });

    logger.info(`[CCE] Loaded ${this.rules.size} default compliance rules`);
  }

  /** Register a compliance rule */
  registerRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  /** Get rules for framework */
  getRulesByFramework(framework: ComplianceFramework): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(r => r.framework === framework);
  }

  /**
   * Evaluate compliance for a transaction
   * Real-time check on financial transaction
   */
  async evaluateTransaction(transaction: Record<string, unknown>): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // IPSAS 23 Check
    if (transaction.exchange_type === 'NON_EXCHANGE' && !transaction.recognition_date) {
      violations.push(this.createViolation('ipsas-23-001', transaction, {
        reason: 'Non-exchange transaction missing recognition date',
      }));
    }

    // SOX 404 Segregation of Duties
    if (transaction.created_by === transaction.approved_by) {
      violations.push(this.createViolation('sox-404-001', transaction, {
        reason: 'Same user created and approved transaction',
      }));
    }

    // Restricted fund check
    if (transaction.is_restricted && !transaction.fund_classification) {
      violations.push(this.createViolation('ipsas-23-002', transaction, {
        reason: 'Restricted fund without classification',
      }));
    }

    // Persist violations
    if (violations.length > 0) {
      await this.persistViolations(violations);
    }

    return violations;
  }

  /**
   * IPSAS 23 Revenue Recognition Check
   */
  async checkIPSAS23(transaction: Record<string, unknown>): Promise<IPSAS23Check> {
    const isRestricted = Boolean(transaction.is_restricted);
    const exchangeType = String(transaction.exchange_type || 'NON_EXCHANGE');
    const violations: string[] = [];

    let recognitionMethod: 'CASH' | 'ACCRUAL' | 'DEFERRED' | 'PROPORTIONAL' | 'STRAIGHT_LINE' = 'ACCRUAL';
    
    if (transaction.recognition_method) {
      recognitionMethod = transaction.recognition_method as any;
    } else if (exchangeType === 'EXCHANGE') {
      recognitionMethod = 'ACCRUAL';
    } else {
      recognitionMethod = isRestricted ? 'DEFERRED' : 'CASH';
    }

    if (isRestricted && !transaction.fund_classification) {
      violations.push('Restricted fund requires classification');
    }
    if (exchangeType === 'NON_EXCHANGE' && !transaction.recognition_date) {
      violations.push('Non-exchange revenue requires recognition date');
    }
    if (isRestricted && !transaction.restriction_period_end) {
      violations.push('Restricted fund requires restriction period');
    }

    return {
      transactionId: String(transaction.id || ''),
      isValid: violations.length === 0,
      recognitionMethod,
      hasRestriction: isRestricted,
      restrictionType: isRestricted ? (transaction.restriction_type as any || 'TEMPORARILY') : 'UNRESTRICTED',
      exchangeType: exchangeType as 'EXCHANGE' | 'NON_EXCHANGE',
      deferredAccountId: transaction.deferred_account_id as string | undefined,
      recognitionDate: transaction.recognition_date as string | undefined,
      conditions: transaction.conditions as string[] | undefined,
      violations,
    };
  }

  /**
   * Sphere/CHS Humanitarian Standards Check
   */
  async checkHumanitarianStandards(project: Record<string, unknown>): Promise<HumanitarianStandardCheck> {
    const indicators: StandardIndicator[] = [];
    const violations: string[] = [];
    let score = 0;
    let totalIndicators = 0;

    // Sphere: Water access (WASH)
    if (project.sector === 'WASH') {
      totalIndicators += 1;
      const waterPerPerson = Number(project.water_per_person_liters || 0);
      const met = waterPerPerson >= 15;
      indicators.push({
        code: 'SPHERE-W1.1',
        name: 'Water quantity per person',
        nameAr: 'كمية المياه لكل شخص',
        met,
        evidence: `${waterPerPerson}L/person/day`,
        notes: met ? undefined : 'Below minimum 15L/person/day',
      });
      if (met) score += 1; else violations.push('Water access below Sphere minimum');
    }

    // Sphere: Food security
    if (project.sector === 'FOOD_SECURITY') {
      totalIndicators += 2;
      const kcalPerPerson = Number(project.kilocalories_per_person || 0);
      const metKcal = kcalPerPerson >= 2100;
      indicators.push({
        code: 'SPHERE-F1.1',
        name: 'Minimum caloric intake',
        nameAr: 'الحد الأدنى من السعرات الحرارية',
        met: metKcal,
        evidence: `${kcalPerPerson} kcal/person/day`,
      });
      if (metKcal) score += 1; else violations.push('Food below Sphere minimum');
    }

    // CHS: Community participation
    totalIndicators += 1;
    const communityConsulted = Boolean(project.community_consulted);
    indicators.push({
      code: 'CHS-C4',
      name: 'Community participation in decisions',
      nameAr: 'مشاركة المجتمع في القرارات',
      met: communityConsulted,
      evidence: communityConsulted ? 'Community consultation conducted' : 'No evidence of community consultation',
    });
    if (communityConsulted) score += 1; else violations.push('No community participation evidence');

    // CHS: Complaint mechanism
    totalIndicators += 1;
    const hasComplaintMech = Boolean(project.complaint_mechanism);
    indicators.push({
      code: 'CHS-C5',
      name: 'Complaint and feedback mechanism',
      nameAr: 'آلية الشكاوى والملاحظات',
      met: hasComplaintMech,
    });
    if (hasComplaintMech) score += 1; else violations.push('No complaint mechanism');

    const overallScore = totalIndicators > 0 ? Math.round((score / totalIndicators) * 100) : 100;

    return {
      projectId: String(project.id || ''),
      standard: 'SPHERE',
      indicators,
      overallScore,
      violations,
    };
  }

  /**
   * Calculate risk score for an entity
   */
  async calculateRiskScore(entityType: string, entity: Record<string, unknown>): Promise<RiskScore> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Financial risk factors
    if (entityType === 'transactions' || entityType === 'revenue_records') {
      // Amount factor
      const amount = Number(entity.amount || 0);
      if (amount > 1000000) {
        factors.push({
          name: 'High Value',
          weight: 30,
          value: Math.min(amount / 1000000, 10),
          contribution: 30,
          description: 'Transaction exceeds 1M threshold',
        });
        totalScore += 30;
      }
      totalWeight += 30;

      // No approval chain
      if (!entity.approved_by) {
        factors.push({
          name: 'Missing Approval',
          weight: 25,
          value: 1,
          contribution: 25,
          description: 'No approver assigned',
        });
        totalScore += 25;
      }
      totalWeight += 25;

      // Single-signature
      if (entity.signatures_count === 1) {
        factors.push({
          name: 'Single Signature',
          weight: 20,
          value: 1,
          contribution: 20,
          description: 'Only one signature for amount > 500K',
        });
        totalScore += 20;
      }
      totalWeight += 20;
    }

    // Beneficiary risk factors
    if (entityType === 'beneficiaries') {
      // No national ID
      if (!entity.national_id) {
        factors.push({
          name: 'Missing National ID',
          weight: 15,
          value: 1,
          contribution: 15,
          description: 'No national ID on file',
        });
        totalScore += 15;
      }
      totalWeight += 15;

      // No consent
      if (!entity.consent_obtained) {
        factors.push({
          name: 'No Consent',
          weight: 25,
          value: 1,
          contribution: 25,
          description: 'GDPR consent not obtained',
        });
        totalScore += 25;
      }
      totalWeight += 25;
    }

    // Project risk factors
    if (entityType === 'projects') {
      // No budget
      if (!entity.budget || Number(entity.budget) === 0) {
        factors.push({
          name: 'No Budget',
          weight: 20,
          value: 1,
          contribution: 20,
          description: 'Project has no budget',
        });
        totalScore += 20;
      }
      totalWeight += 20;
    }

    const normalizedScore = totalWeight > 0 ? Math.min(100, (totalScore / totalWeight) * 100) : 0;
    const level: 'low' | 'medium' | 'high' | 'critical' = 
      normalizedScore >= 75 ? 'critical' :
      normalizedScore >= 50 ? 'high' :
      normalizedScore >= 25 ? 'medium' : 'low';

    return {
      entityId: String(entity.id || ''),
      entityType,
      score: Math.round(normalizedScore),
      level,
      factors,
      recommendations: this.generateRecommendations(level, factors),
      scoredAt: new Date().toISOString(),
    };
  }

  /** Generate remediation recommendations */
  private generateRecommendations(level: string, factors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    
    if (level === 'critical' || level === 'high') {
      recommendations.push('Escalate to compliance officer for review');
      recommendations.push('Require dual signature approval before posting');
    }
    
    for (const factor of factors) {
      if (factor.name === 'Missing Approval') {
        recommendations.push('Assign appropriate approver based on delegation matrix');
      }
      if (factor.name === 'No Consent') {
        recommendations.push('Obtain GDPR consent before processing personal data');
      }
      if (factor.name === 'Missing National ID') {
        recommendations.push('Collect national ID or alternative identification document');
      }
    }
    
    return recommendations;
  }

  /**
   * Run full compliance assessment
   */
  async runFullAssessment(framework: ComplianceFramework, tenantId: string, assessedBy: string): Promise<ComplianceAssessment> {
    const assessmentId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const rules = this.getRulesByFramework(framework);
    const violations: ComplianceViolation[] = [];

    for (const rule of rules) {
      const ruleViolations = await this.checkRule(rule, tenantId);
      violations.push(...ruleViolations);
    }

    const passed = rules.length - new Set(violations.map(v => v.ruleId)).size;
    const failed = new Set(violations.map(v => v.ruleId)).size;
    const warnings = violations.filter(v => v.severity === 'low' || v.severity === 'medium').length;
    const complianceScore = rules.length > 0 ? Math.round((passed / rules.length) * 100) : 100;

    const assessment: ComplianceAssessment = {
      id: assessmentId,
      tenantId,
      framework,
      startedAt,
      completedAt: new Date().toISOString(),
      totalRules: rules.length,
      passed,
      failed,
      warnings,
      complianceScore,
      violations,
      assessedBy,
      assessmentType: 'automated',
    };

    // Persist assessment
    await this.persistAssessment(assessment);

    return assessment;
  }

  /** Check a specific rule across all entities */
  private async checkRule(rule: ComplianceRule, tenantId: string): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    try {
      // Get all entities of this type for the tenant
      const result = await this.pool.query(
        `SELECT * FROM ${rule.entityType} WHERE organization_id = $1 LIMIT 1000`,
        [tenantId]
      );

      for (const entity of result.rows) {
        // Simplified policy evaluation
        const isValid = this.evaluatePolicyExpression(rule.policyExpression, entity);
        if (!isValid) {
          violations.push(this.createViolation(rule.id, entity, {
            ruleCode: rule.code,
            severity: rule.severity,
            domain: rule.domain,
            reason: `Failed ${rule.code}: ${rule.name}`,
          }));
        }
      }
    } catch (err) {
      logger.error(`[CCE] Failed to check rule ${rule.id}`, { error: toErrorObject(err) });
    }

    return violations;
  }

  /** Simple policy expression evaluator */
  private evaluatePolicyExpression(expression: string, entity: Record<string, unknown>): boolean {
    try {
      // Very simple evaluation - just checks existence of required fields
      // In production, this would use a proper expression engine like jsonata
      const matches = expression.match(/(\w+)\s*!=\s*null/g) || [];
      for (const match of matches) {
        const fieldName = match.split('.')[0];
        if (entity[fieldName] === null || entity[fieldName] === undefined) {
          return false;
        }
      }
      return true;
    } catch {
      return true; // Default to passing if cannot evaluate
    }
  }

  /** Create a compliance violation */
  private createViolation(
    ruleId: string,
    entity: Record<string, unknown>,
    context: Record<string, unknown>
  ): ComplianceViolation {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    return {
      id: crypto.randomUUID(),
      ruleId,
      framework: rule.framework,
      ruleCode: rule.code,
      severity: (context.severity as ViolationSeverity) || rule.severity,
      entityType: rule.entityType,
      entityId: String(entity.id || ''),
      tenantId: String(entity.organization_id || ''),
      description: context.reason as string || `Violation of ${rule.code}`,
      descriptionAr: `مخالفة ${rule.code}`,
      context: { ...context, entity },
      detectedAt: new Date().toISOString(),
      status: 'open',
    };
  }

  /** Persist violations to database */
  private async persistViolations(violations: ComplianceViolation[]): Promise<void> {
    for (const v of violations) {
      try {
        await this.pool.query(
          `INSERT INTO compliance_violations 
           (id, rule_id, framework, rule_code, severity, entity_type, entity_id, tenant_id, description, description_ar, context, status, detected_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [v.id, v.ruleId, v.framework, v.ruleCode, v.severity, v.entityType, v.entityId, v.tenantId, v.description, v.descriptionAr, JSON.stringify(v.context), v.status, v.detectedAt]
        );
      } catch (err) {
        logger.error('[CCE] Failed to persist violation', { error: toErrorObject(err), meta: { violationId: v.id } });
      }
    }
  }

  /** Persist assessment */
  private async persistAssessment(assessment: ComplianceAssessment): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO compliance_assessments 
         (id, tenant_id, framework, started_at, completed_at, total_rules, passed, failed, warnings, compliance_score, assessed_by, assessment_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [assessment.id, assessment.tenantId, assessment.framework, assessment.startedAt, assessment.completedAt, 
         assessment.totalRules, assessment.passed, assessment.failed, assessment.warnings, 
         assessment.complianceScore, assessment.assessedBy, assessment.assessmentType]
      );
    } catch (err) {
      logger.error('[CCE] Failed to persist assessment', { error: toErrorObject(err) });
    }
  }

  /**
   * Create tamper-proof audit log entry
   * Uses Merkle-style hash chain
   */
  async createAuditLog(params: {
    tenantId: string;
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEntry> {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();

    const entry: Omit<AuditLogEntry, 'hash'> = {
      id,
      tenantId: params.tenantId,
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp,
      signature: '',
      previousHash: this.lastAuditHash,
      metadata: params.metadata || {},
    };

    // Compute signature
    const signaturePayload = JSON.stringify({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      timestamp: entry.timestamp,
    });
    entry.signature = crypto.createHmac('sha256', process.env.AUDIT_HMAC_SECRET || crypto.createHash('sha256').update('nexora-audit-' + (process.env.JWT_SECRET || '')).digest('hex'))
      .update(signaturePayload)
      .digest('hex');

    // Compute hash (Merkle-style)
    const hashInput = JSON.stringify({ ...entry, previousHash: this.lastAuditHash });
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    this.lastAuditHash = hash;

    // Persist
    try {
      await this.pool.query(
        `INSERT INTO audit_logs_tamper_proof 
         (id, tenant_id, user_id, user_name, action, entity_type, entity_id, 
          before_data, after_data, ip_address, user_agent, timestamp, 
          signature, previous_hash, hash, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [entry.id, entry.tenantId, entry.userId, entry.userName, entry.action, entry.entityType, entry.entityId,
         JSON.stringify(entry.before), JSON.stringify(entry.after), entry.ipAddress, entry.userAgent, entry.timestamp,
         entry.signature, entry.previousHash, hash, JSON.stringify(entry.metadata)]
      );
    } catch (err) {
      logger.error('[CCE] Failed to persist audit log', { error: toErrorObject(err) });
    }

    return { ...entry, hash };
  }

  /** Verify audit chain integrity */
  async verifyAuditChain(tenantId: string, fromDate?: string): Promise<{
    valid: boolean;
    entriesChecked: number;
    brokenAt?: string;
  }> {
    let previousHash = '';
    let entriesChecked = 0;

    try {
      const result = await this.pool.query(
        `SELECT * FROM audit_logs_tamper_proof 
         WHERE tenant_id = $1 
         ${fromDate ? 'AND timestamp >= $2' : ''}
         ORDER BY timestamp ASC`,
        fromDate ? [tenantId, fromDate] : [tenantId]
      );

      for (const row of result.rows) {
        entriesChecked++;
        if (row.previous_hash !== previousHash) {
          return { valid: false, entriesChecked, brokenAt: row.id };
        }
        
        // Verify hash
        const entryData = {
          id: row.id,
          tenantId: row.tenant_id,
          userId: row.user_id,
          userName: row.user_name,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          before: row.before_data,
          after: row.after_data,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          timestamp: row.timestamp,
          signature: row.signature,
          previousHash: row.previous_hash,
          metadata: row.metadata,
        };
        const expectedHash = crypto.createHash('sha256').update(JSON.stringify(entryData)).digest('hex');
        if (expectedHash !== row.hash) {
          return { valid: false, entriesChecked, brokenAt: row.id };
        }
        previousHash = row.hash;
      }

      return { valid: true, entriesChecked };
    } catch (err) {
      logger.error('[CCE] Audit chain verification failed', { error: toErrorObject(err) });
      return { valid: false, entriesChecked };
    }
  }
}

/** Factory */
export function createComplianceEngine(): ContinuousComplianceEngine {
  return new ContinuousComplianceEngine();
}
