// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Project Management Office (PMO) Types
// Global Standards: PMBOK, PRINCE2, Agile, ISO 21500, EVM
// ═══════════════════════════════════════════════════════════════════

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// METHODOLOGY TYPES
// ═══════════════════════════════════════════════════════════════════

export type Methodology = 'PMBOK' | 'PRINCE2' | 'AGILE_SCRUM' | 'WATERFALL' | 'HYBRID' | 'CUSTOM';
export type ProjectType = 'PROGRAM' | 'PROJECT' | 'SUB_PROJECT' | 'TASK';
export type ProjectStatus = 'CHARTERED' | 'INITIATING' | 'PLANNING' | 'EXECUTING' | 'MONITORING' | 'CLOSING' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Complexity = 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX';

// ═══════════════════════════════════════════════════════════════════
// PMBOK KNOWLEDGE AREAS
// ═══════════════════════════════════════════════════════════════════

export type KnowledgeArea = 
  | 'INTEGRATION' | 'SCOPE' | 'SCHEDULE' | 'COST' | 'QUALITY'
  | 'RESOURCES' | 'COMMUNICATIONS' | 'RISK' | 'PROCUREMENT' | 'STAKEHOLDER';

// ═══════════════════════════════════════════════════════════════════
// PRINCE2 THEMES & PROCESSES
// ═══════════════════════════════════════════════════════════════════

export type Prince2Theme = 
  | 'BUSINESS_CASE' | 'ORGANIZATION' | 'QUALITY' | 'PLANS' 
  | 'RISK' | 'CHANGE' | 'PROGRESS';

export type Prince2Process = 
  | 'SU' | 'IP' | 'DP' | 'MP' | 'SB' | 'CP' | 'VE';

// ═══════════════════════════════════════════════════════════════════
// WBS & SCHEDULE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface WBSElement {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId?: string;
  type: 'PORTFOLIO' | 'PROGRAM' | 'PROJECT' | 'PHASE' | 'DELIVERABLE' | 'WORK_PACKAGE' | 'ACTIVITY';
  responsibleId?: string;
  plannedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: string;
  endDate?: string;
  plannedCost?: number;
  actualCost?: number;
  earnedValue?: number;
  physicalProgressPct?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'AT_RISK';
}

export interface ScheduleActivity {
  id: string;
  wbsId: string;
  activityCode: string;
  name: string;
  durationDays: number;
  earliestStart?: Date;
  earliestFinish?: Date;
  latestStart?: Date;
  latestFinish?: Date;
  totalFloat?: number;
  freeFloat?: number;
  isCritical: boolean;
  dependencies: string[];
  assignedResources: string[];
  baselineStart?: Date;
  baselineFinish?: Date;
  actualStart?: Date;
  actualFinish?: Date;
  percentComplete: number;
  scheduledHours: number;
  actualHours: number;
}

export interface GanttNode {
  id: string;
  parentId?: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  isMilestone: boolean;
  isCritical: boolean;
  level: number;
  color?: string;
}

// ═══════════════════════════════════════════════════════════════════
// RESOURCE & CAPACITY TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ResourceAllocation {
  id: string;
  resourceId: string;
  resourceName: string;
  roleCode: string;
  projectId: string;
  taskId: string;
  allocatedHours: number;
  allocatedPct: number;
  startDate: string;
  endDate: string;
  status: 'ASSIGNED' | 'COMMITTED' | 'COMPLETED' | 'OVERALLOCATED' | 'UNDERALLOCATED';
}

export interface ResourceCapacity {
  resourceId: string;
  resourceName: string;
  role: string;
  maxHoursPerDay: number;
  availableHours: number;
  allocatedHours: number;
  utilizationPct: number;
  calendar: WorkCalendar;
}

export interface WorkCalendar {
  workingDays: number[]; // 0=Sunday, 1=Monday, etc.
  workingHours: { start: string; end: string };
  holidays: { date: string; name: string }[];
}

// ═══════════════════════════════════════════════════════════════════
// EARNED VALUE MANAGEMENT (EVM) TYPES
// ═══════════════════════════════════════════════════════════════════

export interface EarnedValueData {
  projectId: string;
  dataDate: string;
  
  // Planned Value
  plannedValue: number;      // PV - Budgeted cost of work scheduled
  totalBudgetAtCompletion: number; // BAC
  
  // Earned Value
  earnedValue: number;      // EV - Budgeted cost of work performed
  
  // Actual Cost
  actualCost: number;       // AC - Actual cost of work performed
  
  // Derived Metrics
  scheduleVariance: number;  // SV = EV - PV
  schedulePerformanceIndex: number; // SPI = EV / PV
  costVariance: number;      // CV = EV - AC
  costPerformanceIndex: number; // CPI = EV / AC
  
  // Forecasts
  estimateAtCompletion: number; // EAC (various methods)
  estimateToComplete: number;  // ETC
  varianceAtCompletion: number; // VAC = BAC - EAC
  
  // Project Health
  healthStatus: 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'CRITICAL';
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  
  // Time Analysis
  plannedDurationDays: number;
  actualDurationDays: number;
  estimatedCompletionDate: Date;
  scheduleVarianceDays: number;
}

export type EACMethod =
  | 'TYPICAL'  // Typical: EAC = BAC / CPI
  | 'ATYPICAL' // Atypical: EAC = AC + (BAC - EV)
  | 'BEST_CASE' // Best Case: EAC = AC + ((BAC - EV) / CPI)
  | 'MANUAL';   // Manual: User-provided estimate

// ═══════════════════════════════════════════════════════════════════
// CRITICAL PATH & NETWORK TYPES
// ═══════════════════════════════════════════════════════════════════

export interface NetworkDiagram {
  projectId: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  criticalPath: string[];
  totalFloatDays: number;
  projectDurationDays: number;
}

export interface NetworkNode {
  id: string;
  activityId: string;
  name: string;
  duration: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  from: string;
  to: string;
  type: 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, Start-Start, etc.
  lag: number;
}

// ═══════════════════════════════════════════════════════════════════
// RISK MANAGEMENT TYPES (ISO 31000)
// ═══════════════════════════════════════════════════════════════════

export type RiskCategory = 
  | 'TECHNICAL' | 'SCHEDULE' | 'COST' | 'QUALITY' | 'RESOURCE' 
  | 'EXTERNAL' | 'LEGAL' | 'REPUTATIONAL' | 'ENVIRONMENTAL';

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type RiskStatus = 'IDENTIFIED' | 'MITIGATED' | 'OCCURRED' | 'CLOSED';
export type ResponseStrategy = 'AVOID' | 'MITIGATE' | 'TRANSFER' | 'ACCEPT' | 'ESCALATE';

export interface Risk {
  id: string;
  projectId: string;
  riskCode: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: number; // 0-1
  impact: RiskLevel;
  riskScore: number; // P × I
  inherentRiskLevel: RiskLevel;
  responseStrategy: ResponseStrategy;
  mitigationPlan: string;
  contingencyPlan: string;
  ownerId: string;
  status: RiskStatus;
  identifiedDate: string;
  targetDate?: string;
  actualDate?: string;
  triggers: string[];
  fallbackDate?: string;
  fallbackTrigger?: string;
}

export interface RiskMatrix {
  projectId: string;
  date: string;
  cells: RiskMatrixCell[];
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface RiskMatrixCell {
  probability: number;
  impact: RiskLevel;
  count: number;
  risks: string[];
  color: string;
}

// ═══════════════════════════════════════════════════════════════════
// STAKEHOLDER MANAGEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export type StakeholderPower = 'LOW' | 'MEDIUM' | 'HIGH';
export type StakeholderInterest = 'LOW' | 'MEDIUM' | 'HIGH';
export type StakeholderInfluence = 'LOW' | 'MEDIUM' | 'HIGH';
export type EngagementLevel = 'UNAWARE' | 'RESISTANT' | 'NEUTRAL' | 'SUPPORTIVE' | 'LEADING';

export interface Stakeholder {
  id: string;
  projectId: string;
  stakeholderId: string;
  name: string;
  organization: string;
  role: string;
  power: StakeholderPower;
  interest: StakeholderInterest;
  influence: StakeholderInfluence;
  currentEngagement: EngagementLevel;
  desiredEngagement: EngagementLevel;
  engagementStrategy: string;
  communicationPlan: string;
  importance: number;
  assessmentDate: string;
  lastCommunication?: string;
  notes?: string;
}

export interface StakeholderMatrix {
  projectId: string;
  quadrants: {
    keepSatisfied: Stakeholder[];
    manageClosely: Stakeholder[];
    monitor: Stakeholder[];
    keepInformed: Stakeholder[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// ISSUE & CHANGE MANAGEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export type IssueType = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type ChangeImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ChangeStatus = 'SUBMITTED' | 'ASSESSED' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface Issue {
  id: string;
  projectId: string;
  issueNumber: string;
  title: string;
  description: string;
  type: IssueType;
  priority: Priority;
  status: IssueStatus;
  raisedBy: string;
  assignedTo: string;
  dueDate?: string;
  resolvedDate?: string;
  rootCause?: string;
  resolution?: string;
  relatedRisks: string[];
  relatedChanges: string[];
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  changeNumber: string;
  title: string;
  description: string;
  rationale: string;
  impact: ChangeImpact;
  scopeImpact: string;
  scheduleImpactDays: number;
  costImpact: number;
  riskImpact: string;
  status: ChangeStatus;
  submittedBy: string;
  submittedDate: string;
  assessedBy?: string;
  assessedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  implementationPlan?: string;
  implementedBy?: string;
  implementedDate?: string;
}

// ═══════════════════════════════════════════════════════════════════
// LESSONS LEARNED TYPES
// ═══════════════════════════════════════════════════════════════════

export type LessonCategory = 
  | 'TECHNICAL' | 'PROCESS' | 'MANAGEMENT' | 'RESOURCE' 
  | 'COMMUNICATION' | 'RISK' | 'QUALITY' | 'PROCUREMENT';

export type LessonType = 'SUCCESS' | 'FAILURE' | 'BEST_PRACTICE' | 'IMPROVEMENT';

export interface LessonLearned {
  id: string;
  projectId: string;
  projectCode: string;
  title: string;
  description: string;
  category: LessonCategory;
  type: LessonType;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  rootCause?: string;
  recommendation: string;
  evidence?: string;
  tags: string[];
  applicableProjects: string[];
  sharedBy: string;
  sharedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED';
}

// ═══════════════════════════════════════════════════════════════════
// QUALITY MANAGEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface QualityMetric {
  id: string;
  projectId: string;
  metricCode: string;
  name: string;
  description: string;
  targetValue: number;
  tolerance: number;
  measurementMethod: string;
  frequency: string;
  currentValue?: number;
  lastMeasurementDate?: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  status: 'ON_TARGET' | 'WARNING' | 'BREACHED';
}

export interface QualityAudit {
  id: string;
  projectId: string;
  auditNumber: string;
  title: string;
  scope: string;
  criteria: string[];
  auditor: string;
  auditedBy: string;
  startDate: string;
  endDate: string;
  findings: QualityFinding[];
  overallResult: 'PASS' | 'FAIL' | 'PARTIAL';
  nextAuditDate?: string;
}

export interface QualityFinding {
  id: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  description: string;
  criteriaNotMet: string;
  evidence: string;
  recommendation: string;
  dueDate?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  closedDate?: string;
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ProjectDashboard {
  projectId: string;
  projectName: string;
  projectCode: string;
  status: ProjectStatus;
  overallHealth: 'GREEN' | 'YELLOW' | 'RED';
  
  // Schedule Health
  schedule: {
    plannedEndDate: string;
    estimatedEndDate: string;
    daysRemaining: number;
    scheduleVarianceDays: number;
    schedulePerformanceIndex: number;
    criticalPathLength: number;
    milestonesTotal: number;
    milestonesCompleted: number;
    milestonesOnTime: number;
    milestonesLate: number;
    healthStatus: 'ON_TRACK' | 'SLIPPING' | 'DELAYED';
  };
  
  // Cost Health
  cost: {
    budgetAtCompletion: number;
    estimateAtCompletion: number;
    actualCost: number;
    costVariance: number;
    costPerformanceIndex: number;
    fundsRemaining: number;
    spendRate: number;
    predictedFinalCost: number;
    healthStatus: 'ON_TRACK' | 'OVER_BUDGET' | 'UNDER_BUDGET';
  };
  
  // Scope Health
  scope: {
    baselineScopeItems: number;
    approvedChanges: number;
    rejectedChanges: number;
    pendingChanges: number;
    scopeCreepPct: number;
    healthStatus: 'STABLE' | 'CHANGING' | 'UNSTABLE';
  };
  
  // Resource Health
  resources: {
    totalResources: number;
    allocatedResources: number;
    overallUtilizationPct: number;
    overallocatedResources: number;
    underallocatedResources: number;
    turnoverRate: number;
    healthStatus: 'OPTIMAL' | 'OVERUTILIZED' | 'UNDERUTILIZED';
  };
  
  // Quality Health
  quality: {
    openDefects: number;
    closedDefects: number;
    defectLeakageRate: number;
    customerSatisfactionScore: number;
    auditsPassed: number;
    auditsFailed: number;
    healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  };
  
  // Risk Health
  risks: {
    totalRisks: number;
    highRisks: number;
    mediumRisks: number;
    lowRisks: number;
    riskExposure: number;
    mitigationEffectiveness: number;
    healthStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  };
  
  // Stakeholder Health
  stakeholders: {
    totalStakeholders: number;
    supportive: number;
    neutral: number;
    resistant: number;
    issuesRaised: number;
    issuesResolved: number;
    communicationEffectiveness: number;
    healthStatus: 'ENGAGED' | 'MANAGED' | 'UNMANAGED';
  };
  
  // Deliverables
  deliverables: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    acceptanceRate: number;
  };
  
  // Overall Metrics
  overall: {
    overallProgressPct: number;
    baselineProgressPct: number;
    earnedValue: number;
    plannedValue: number;
    productivityIndex: number;
    changeFailureRate: number;
    defectDensity: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// PORTFOLIO MANAGEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface Portfolio {
  id: string;
  portfolioCode: string;
  name: string;
  description: string;
  managerId: string;
  objectives: string[];
  constraints: string[];
  strategicAlignment: string[];
  totalBudget: number;
  totalSpent: number;
  totalPlannedValue: number;
  totalEarnedValue: number;
  overallProgress: number;
  healthScore: number;
  projects: string[];
  programs: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'PLANNING';
  createdAt: string;
}

export interface Program {
  id: string;
  programCode: string;
  name: string;
  portfolioId: string;
  managerId: string;
  objectives: string[];
  benefits: string[];
  totalBudget: number;
  totalSpent: number;
  overallProgress: number;
  projects: string[];
  status: 'CHARTERED' | 'ACTIVE' | 'CLOSED';
}

export interface PortfolioOptimization {
  currentPortfolio: {
    totalValue: number;
    riskAdjustedReturn: number;
    riskScore: number;
    resourceUtilization: number;
  };
  optimizedPortfolio: {
    totalValue: number;
    riskAdjustedReturn: number;
    riskScore: number;
    resourceUtilization: number;
    recommendedActions: {
      type: 'ADD' | 'REMOVE' | 'REPRIORITIZE' | 'RESCHEDULE';
      projectId: string;
      reason: string;
      expectedImpact: number;
    }[];
  };
  efficiencyGain: number;
}

// ═══════════════════════════════════════════════════════════════════
// ZOD SCHEMAS (Runtime Validation)
// ═══════════════════════════════════════════════════════════════════

export const RiskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  riskCode: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  category: z.enum(['TECHNICAL', 'SCHEDULE', 'COST', 'QUALITY', 'RESOURCE', 'EXTERNAL', 'LEGAL', 'REPUTATIONAL', 'ENVIRONMENTAL']),
  probability: z.number().min(0).max(1),
  impact: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  riskScore: z.number(),
  responseStrategy: z.enum(['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT', 'ESCALATE']),
  mitigationPlan: z.string(),
  ownerId: z.string(),
  status: z.enum(['IDENTIFIED', 'MITIGATED', 'OCCURRED', 'CLOSED']),
});

export const EarnedValueDataSchema = z.object({
  projectId: z.string(),
  dataDate: z.string(),
  plannedValue: z.number().nonnegative(),
  totalBudgetAtCompletion: z.number().nonnegative(),
  earnedValue: z.number().nonnegative(),
  actualCost: z.number().nonnegative(),
  scheduleVariance: z.number(),
  schedulePerformanceIndex: z.number(),
  costVariance: z.number(),
  costPerformanceIndex: z.number(),
});

export const ChangeRequestSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  changeNumber: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  rationale: z.string(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  scheduleImpactDays: z.number(),
  costImpact: z.number(),
  status: z.enum(['SUBMITTED', 'ASSESSED', 'APPROVED', 'REJECTED', 'IMPLEMENTED']),
  submittedBy: z.string(),
});

export type RiskInput = z.infer<typeof RiskSchema>;
export type EVMInput = z.infer<typeof EarnedValueDataSchema>;
export type ChangeInput = z.infer<typeof ChangeRequestSchema>;
