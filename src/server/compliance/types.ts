// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Continuous Compliance Engine™ (CCE)
// NEB-10: Finance & Compliance OS + NEB-11: Knowledge & Document OS
// Compliance Frameworks: IPSAS 23/24/41, IFRS 15, ASC 958, Sphere 2024, CHS, OECD-DAC, IATI 2.03
// ═══════════════════════════════════════════════════════════════════

/** Compliance Frameworks supported */
export type ComplianceFramework =
  | 'IPSAS_23'        // Revenue from Non-Exchange Transactions
  | 'IPSAS_24'        // Presentation of Budget Information
  | 'IPSAS_41'        // Financial Instruments
  | 'IFRS_15'         // Revenue from Contracts with Customers
  | 'ASC_958'         // Not-for-Profit Entities
  | 'SPHERE_2024'     // Humanitarian Charter
  | 'CHS_9'           // Core Humanitarian Standard
  | 'OECD_DAC'        // Development Assistance Committee
  | 'IATI_2_03'       // International Aid Transparency Initiative
  | 'SOX_404'         // Sarbanes-Oxley Internal Controls
  | 'ISO_27001'       // Information Security Management
  | 'SOC_2_TYPE_II'   // Service Organization Control 2
  | 'EU_AI_ACT_2025'  // EU AI Act Compliance
  | 'GDPR'            // General Data Protection Regulation
  | 'YEMEN_DPL';      // Yemen Data Protection Law

/** Compliance Violation Severity */
export type ViolationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/** Compliance Rule Definition */
export interface ComplianceRule {
  id: string;
  framework: ComplianceFramework;
  code: string;                          // e.g., 'IPSAS-23-001'
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: 'financial' | 'operational' | 'security' | 'data' | 'reporting';
  severity: ViolationSeverity;
  domain: string;                        // NEB-01 to NEB-15
  entityType: string;                    // table or entity
  /** Policy as Code (Rego-style) */
  policyExpression: string;
  /** Auto-remediation if possible */
  autoRemediation?: string;
  /** Required for compliance */
  mandatory: boolean;
  /** Reference to standard document */
  standardReference: string;
}

/** Compliance Violation */
export interface ComplianceViolation {
  id: string;
  ruleId: string;
  framework: ComplianceFramework;
  ruleCode: string;
  severity: ViolationSeverity;
  entityType: string;
  entityId: string;
  tenantId: string;
  description: string;
  descriptionAr: string;
  context: Record<string, unknown>;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  status: 'open' | 'acknowledged' | 'remediated' | 'accepted_risk' | 'false_positive';
}

/** Compliance Assessment Result */
export interface ComplianceAssessment {
  id: string;
  tenantId: string;
  framework: ComplianceFramework;
  startedAt: string;
  completedAt?: string;
  totalRules: number;
  passed: number;
  failed: number;
  warnings: number;
  complianceScore: number;              // 0-100
  violations: ComplianceViolation[];
  assessedBy: string;
  assessmentType: 'manual' | 'automated' | 'continuous';
}

/** Risk Score for transaction */
export interface RiskScore {
  entityId: string;
  entityType: string;
  score: number;                         // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  scoredAt: string;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  description: string;
}

/** IPSAS 23 Revenue Recognition Check */
export interface IPSAS23Check {
  transactionId: string;
  isValid: boolean;
  recognitionMethod: 'CASH' | 'ACCRUAL' | 'DEFERRED' | 'PROPORTIONAL' | 'STRAIGHT_LINE';
  hasRestriction: boolean;
  restrictionType?: 'TEMPORARILY' | 'PERMANENTLY' | 'UNRESTRICTED';
  exchangeType: 'EXCHANGE' | 'NON_EXCHANGE';
  deferredAccountId?: string;
  recognitionDate?: string;
  conditions?: string[];
  violations: string[];
}

/** Sphere/CHS Compliance Check */
export interface HumanitarianStandardCheck {
  projectId: string;
  standard: 'SPHERE' | 'CHS';
  indicators: StandardIndicator[];
  overallScore: number;
  violations: string[];
}

export interface StandardIndicator {
  code: string;
  name: string;
  nameAr: string;
  met: boolean;
  evidence?: string;
  notes?: string;
}

/** IATI Reporting Entry */
export interface IATIReportEntry {
  iatiIdentifier: string;
  reportingOrgRef: string;
  title: string;
  description: string;
  activityStatus: string;
  activityDates: {
    startPlanned?: string;
    startActual?: string;
    endPlanned?: string;
    endActual?: string;
  };
  recipientCountry: string;
  sectors: Array<{ code: string; percentage: number }>;
  budget?: {
    amount: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
  };
  transactions: Array<{
    type: string;
    date: string;
    amount: number;
    currency: string;
    providerOrg?: string;
    receiverOrg?: string;
  }>;
  humanitarianScope?: {
    type: string;
    vocabulary: string;
    code: string;
  };
}

/** Audit Log Entry (Tamper-proof) */
export interface AuditLogEntry {
  id: string;
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
  timestamp: string;
  signature: string;        // HMAC-SHA256
  previousHash: string;     // Chain link
  hash: string;             // Current hash (Merkle-style)
  metadata: Record<string, unknown>;
}

/** Compliance Dashboard Metrics */
export interface ComplianceMetrics {
  tenantId: string;
  overallScore: number;
  byFramework: Record<ComplianceFramework, {
    score: number;
    violations: number;
    lastAssessment?: string;
  }>;
  criticalViolations: number;
  openViolations: number;
  resolvedToday: number;
  trends: {
    date: string;
    score: number;
    violations: number;
  }[];
}
