// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ - Project Management Office (PMO) Module
// Stakeholder Management Engine - NEB-04 Project Management OS
// ═══════════════════════════════════════════════════════════════════════════════
//
// © 2026 Rohamaa Baynahum Charity Foundation - UAMEX ERP™
// One Platform. One Organization. One Vision.
//
// Stakeholder Management per PMBOK® Guide 7th Edition
// Power/Interest Grid, Engagement Assessment, Communication Planning
// ═══════════════════════════════════════════════════════════════════════════════

import { randomInt } from 'crypto';
import type {
  Stakeholder,
  StakeholderPower,
  StakeholderInterest,
  StakeholderInfluence,
  EngagementLevel,
  StakeholderMatrix,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Engine Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StakeholderAnalysis {
  stakeholder: Stakeholder;
  powerInterestPosition: 'KEEP_SATISFIED' | 'MANAGE_CLOSELY' | 'KEEP_INFORMED' | 'MONITOR';
  engagementGap: number;
  engagementStrategy: string;
  communicationFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StakeholderDashboard {
  totalStakeholders: number;
  byEngagementLevel: Record<EngagementLevel, number>;
  byPowerLevel: Record<StakeholderPower, number>;
  byInfluenceLevel: Record<StakeholderInfluence, number>;
  engagementScore: number;
  riskAssessment: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  quadrantDistribution: {
    keepSatisfied: number;
    manageClosely: number;
    keepInformed: number;
    monitor: number;
  };
  communicationPlan: {
    totalCommunications: number;
    plannedCommunications: number;
    completedCommunications: number;
    overdueCommunications: number;
  };
  recommendations: string[];
}

export interface CommunicationPlan {
  stakeholderId: string;
  stakeholderName: string;
  communications: Array<{
    id: string;
    type: 'EMAIL' | 'MEETING' | 'REPORT' | 'PRESENTATION' | 'INFORMAL';
    subject: string;
    frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
    nextDate: string;
    status: 'PLANNED' | 'SENT' | 'OVERDUE';
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Power/Interest Grid Position Mapping
// ─────────────────────────────────────────────────────────────────────────────

type QuadrantPosition = 'KEEP_SATISFIED' | 'MANAGE_CLOSELY' | 'KEEP_INFORMED' | 'MONITOR';

const POWER_INTEREST_MAP: Record<string, QuadrantPosition> = {
  'HIGH-HIGH': 'MANAGE_CLOSELY',
  'HIGH-MEDIUM': 'MANAGE_CLOSELY',
  'MEDIUM-HIGH': 'MANAGE_CLOSELY',
  'HIGH-LOW': 'KEEP_SATISFIED',
  'MEDIUM-MEDIUM': 'KEEP_INFORMED',
  'MEDIUM-LOW': 'MONITOR',
  'LOW-HIGH': 'KEEP_INFORMED',
  'LOW-MEDIUM': 'MONITOR',
  'LOW-LOW': 'MONITOR',
};

// ─────────────────────────────────────────────────────────────────────────────
// Stakeholder Management Engine
// ─────────────────────────────────────────────────────────────────────────────

export class StakeholderManagementEngine {
  /**
   * Analyze a single stakeholder
   */
  analyzeStakeholder(stakeholder: Stakeholder): StakeholderAnalysis {
    const position = this.getQuadrantPosition(stakeholder.power, stakeholder.interest);
    const engagementGap = this.calculateEngagementGap(stakeholder);
    const strategy = this.developEngagementStrategy(stakeholder, position);
    const frequency = this.determineCommunicationFrequency(stakeholder, position);
    const riskLevel = this.assessStakeholderRisk(stakeholder);

    return {
      stakeholder,
      powerInterestPosition: position,
      engagementGap,
      engagementStrategy: strategy,
      communicationFrequency: frequency,
      riskLevel,
    };
  }

  /**
   * Get quadrant position on power/interest grid
   */
  getQuadrantPosition(power: StakeholderPower, interest: StakeholderInterest): QuadrantPosition {
    const key = `${power}-${interest}`;
    return POWER_INTEREST_MAP[key] ?? 'MONITOR';
  }

  /**
   * Calculate engagement gap (desired - current)
   */
  private calculateEngagementGap(stakeholder: Stakeholder): number {
    const engagementLevels: Record<EngagementLevel, number> = {
      UNAWARE: 0,
      RESISTANT: 1,
      NEUTRAL: 2,
      SUPPORTIVE: 3,
      LEADING: 4,
    };

    const currentLevel = engagementLevels[stakeholder.currentEngagement];
    const desiredLevel = engagementLevels[stakeholder.desiredEngagement];

    return desiredLevel - currentLevel;
  }

  /**
   * Develop engagement strategy based on stakeholder profile
   */
  private developEngagementStrategy(
    stakeholder: Stakeholder,
    position: QuadrantPosition
  ): string {
    const strategies: Record<QuadrantPosition, string> = {
      MANAGE_CLOSELY: `Engage ${stakeholder.name} actively through regular, proactive communication. ` +
        'Involve in key decisions, seek input on important matters, and ensure their concerns are addressed promptly. ' +
        'Maintain close partnership and collaborative relationship.',
      
      KEEP_SATISFIED: `Ensure ${stakeholder.name} remains satisfied with project outcomes. ` +
        'Provide regular updates on progress, especially regarding items of interest to them. ' +
        'Manage expectations and address any concerns proactively to maintain their support.',
      
      KEEP_INFORMED: `Keep ${stakeholder.name} informed about project developments. ` +
        'Provide regular status updates, milestones achieved, and upcoming activities. ' +
        'Respond to inquiries promptly and ensure they have adequate information.',
      
      MONITOR: `Monitor ${stakeholder.name} for changes in attitude or influence. ` +
        'Provide periodic updates through standard communication channels. ' +
        'Be prepared to increase engagement if their interest or power increases.',
    };

    return strategies[position];
  }

  /**
   * Determine appropriate communication frequency
   */
  private determineCommunicationFrequency(
    stakeholder: Stakeholder,
    position: QuadrantPosition
  ): StakeholderAnalysis['communicationFrequency'] {
    // Adjust based on power and influence
    if (stakeholder.power === 'HIGH' && stakeholder.influence === 'HIGH') {
      return 'WEEKLY';
    }

    switch (position) {
      case 'MANAGE_CLOSELY':
        return 'WEEKLY';
      case 'KEEP_SATISFIED':
        return 'MONTHLY';
      case 'KEEP_INFORMED':
        return 'BIWEEKLY';
      case 'MONITOR':
        return 'QUARTERLY';
      default:
        return 'MONTHLY';
    }
  }

  /**
   * Assess risk level for stakeholder engagement
   */
  private assessStakeholderRisk(stakeholder: Stakeholder): StakeholderAnalysis['riskLevel'] {
    // Resistant stakeholders are high risk
    if (stakeholder.currentEngagement === 'RESISTANT') {
      return 'CRITICAL';
    }

    // Large engagement gap is concerning
    const gap = this.calculateEngagementGap(stakeholder);
    if (gap >= 3) return 'HIGH';
    if (gap >= 2) return 'MEDIUM';

    // Low engagement despite high power/interest is risky
    if (stakeholder.power === 'HIGH' && stakeholder.currentEngagement === 'NEUTRAL') {
      return 'HIGH';
    }

    return 'LOW';
  }

  /**
   * Generate stakeholder matrix data
   */
  generateStakeholderMatrix(stakeholders: Stakeholder[]): StakeholderMatrix {
    const quadrants = {
      keepSatisfied: [] as Stakeholder[],
      manageClosely: [] as Stakeholder[],
      monitor: [] as Stakeholder[],
      keepInformed: [] as Stakeholder[],
    };

    for (const stakeholder of stakeholders) {
      const position = this.getQuadrantPosition(stakeholder.power, stakeholder.interest);
      
      switch (position) {
        case 'KEEP_SATISFIED':
          quadrants.keepSatisfied.push(stakeholder);
          break;
        case 'MANAGE_CLOSELY':
          quadrants.manageClosely.push(stakeholder);
          break;
        case 'KEEP_INFORMED':
          quadrants.keepInformed.push(stakeholder);
          break;
        case 'MONITOR':
          quadrants.monitor.push(stakeholder);
          break;
      }
    }

    return {
      projectId: stakeholders[0]?.projectId ?? '',
      quadrants,
    };
  }

  /**
   * Generate comprehensive stakeholder dashboard
   */
  generateDashboard(stakeholders: Stakeholder[]): StakeholderDashboard {
    const engagementLevels: Record<EngagementLevel, number> = {
      UNAWARE: 0,
      RESISTANT: 0,
      NEUTRAL: 0,
      SUPPORTIVE: 0,
      LEADING: 0,
    };

    const powerLevels: Record<StakeholderPower, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    const influenceLevels: Record<StakeholderInfluence, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    const quadrantDistribution = {
      keepSatisfied: 0,
      manageClosely: 0,
      keepInformed: 0,
      monitor: 0,
    };

    const riskAssessment = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const stakeholder of stakeholders) {
      engagementLevels[stakeholder.currentEngagement]++;
      powerLevels[stakeholder.power]++;
      influenceLevels[stakeholder.influence]++;

      const position = this.getQuadrantPosition(stakeholder.power, stakeholder.interest);
      switch (position) {
        case 'KEEP_SATISFIED': quadrantDistribution.keepSatisfied++; break;
        case 'MANAGE_CLOSELY': quadrantDistribution.manageClosely++; break;
        case 'KEEP_INFORMED': quadrantDistribution.keepInformed++; break;
        case 'MONITOR': quadrantDistribution.monitor++; break;
      }

      const analysis = this.analyzeStakeholder(stakeholder);
      riskAssessment[analysis.riskLevel]++;
    }

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(stakeholders);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      stakeholders,
      engagementLevels,
      quadrantDistribution
    );

    return {
      totalStakeholders: stakeholders.length,
      byEngagementLevel: engagementLevels,
      byPowerLevel: powerLevels,
      byInfluenceLevel: influenceLevels,
      engagementScore,
      riskAssessment,
      quadrantDistribution,
      communicationPlan: {
        totalCommunications: stakeholders.length * 4,
        plannedCommunications: stakeholders.length * 4,
        completedCommunications: 0,
        overdueCommunications: 0,
      },
      recommendations,
    };
  }

  /**
   * Calculate overall engagement score (0-100)
   */
  private calculateEngagementScore(stakeholders: Stakeholder[]): number {
    if (stakeholders.length === 0) return 0;

    const engagementValues: Record<EngagementLevel, number> = {
      UNAWARE: 0,
      RESISTANT: 20,
      NEUTRAL: 50,
      SUPPORTIVE: 80,
      LEADING: 100,
    };

    const totalScore = stakeholders.reduce(
      (sum, s) => sum + engagementValues[s.currentEngagement],
      0
    );

    return Math.round(totalScore / stakeholders.length);
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    stakeholders: Stakeholder[],
    engagementLevels: Record<EngagementLevel, number>,
    quadrantDistribution: StakeholderDashboard['quadrantDistribution']
  ): string[] {
    const recommendations: string[] = [];

    // Check for resistant stakeholders
    if (engagementLevels.RESISTANT > 0) {
      recommendations.push(
        `Address ${engagementLevels.RESISTANT} resistant stakeholder(s) immediately through targeted engagement`
      );
    }

    // Check for unaware stakeholders
    if (engagementLevels.UNAWARE > 0) {
      recommendations.push(
        `Initiate awareness campaign for ${engagementLevels.UNAWARE} unaware stakeholder(s)`
      );
    }

    // Check quadrant balance
    if (quadrantDistribution.manageClosely > stakeholders.length * 0.5) {
      recommendations.push(
        'Consider delegating some stakeholder management to team members to reduce PM workload'
      );
    }

    if (quadrantDistribution.monitor > stakeholders.length * 0.6) {
      recommendations.push(
        'Review stakeholder register - many stakeholders may not require active management'
      );
    }

    // Low engagement score
    const avgEngagement = this.calculateEngagementScore(stakeholders);
    if (avgEngagement < 50) {
      recommendations.push(
        'Overall stakeholder engagement is low - develop targeted engagement plans for key stakeholders'
      );
    }

    return recommendations;
  }

  /**
   * Create a new stakeholder
   */
  createStakeholder(params: {
    projectId: string;
    stakeholderId: string;
    name: string;
    organization: string;
    role: string;
    power: StakeholderPower;
    interest: StakeholderInterest;
    influence: StakeholderInfluence;
    currentEngagement?: EngagementLevel;
    desiredEngagement?: EngagementLevel;
  }): Stakeholder {
    const currentEngagement = params.currentEngagement ?? 'NEUTRAL';
    const desiredEngagement = params.desiredEngagement ?? 'SUPPORTIVE';

    const engagementStrategy = this.analyzeStakeholder({
      id: '',
      projectId: params.projectId,
      stakeholderId: params.stakeholderId,
      name: params.name,
      organization: params.organization,
      role: params.role,
      power: params.power,
      interest: params.interest,
      influence: params.influence,
      currentEngagement,
      desiredEngagement,
      engagementStrategy: '',
      communicationPlan: '',
      importance: 5,
      assessmentDate: new Date().toISOString(),
    }).engagementStrategy;

    return {
      id: `STK-${Date.now()}-${randomInt(0, 1000)}`,
      projectId: params.projectId,
      stakeholderId: params.stakeholderId,
      name: params.name,
      organization: params.organization,
      role: params.role,
      power: params.power,
      interest: params.interest,
      influence: params.influence,
      currentEngagement,
      desiredEngagement,
      engagementStrategy,
      communicationPlan: '',
      importance: this.calculateImportance(params.power, params.interest),
      assessmentDate: new Date().toISOString(),
    };
  }

  /**
   * Calculate stakeholder importance (1-10)
   */
  private calculateImportance(power: StakeholderPower, interest: StakeholderInterest): number {
    const powerScore = power === 'HIGH' ? 5 : power === 'MEDIUM' ? 3 : 1;
    const interestScore = interest === 'HIGH' ? 5 : interest === 'MEDIUM' ? 3 : 1;
    return powerScore + interestScore;
  }

  /**
   * Update stakeholder engagement level
   */
  updateEngagementLevel(
    stakeholder: Stakeholder,
    newLevel: EngagementLevel
  ): Stakeholder {
    return {
      ...stakeholder,
      currentEngagement: newLevel,
    };
  }

  /**
   * Generate communication plan for a stakeholder
   */
  generateCommunicationPlan(stakeholder: Stakeholder): CommunicationPlan {
    const analysis = this.analyzeStakeholder(stakeholder);
    
    // Map to valid communication frequency
    const validFrequency = this.mapToValidFrequency(analysis.communicationFrequency);
    
    const communications: CommunicationPlan['communications'] = [
      {
        id: `COMM-${Date.now()}-1`,
        type: 'EMAIL',
        subject: 'Project Status Update',
        frequency: validFrequency,
        nextDate: this.getNextCommunicationDate(validFrequency),
        status: 'PLANNED',
      },
    ];

    if (analysis.powerInterestPosition === 'MANAGE_CLOSELY') {
      communications.push({
        id: `COMM-${Date.now()}-2`,
        type: 'MEETING',
        subject: 'Key Decision Discussion',
        frequency: 'MONTHLY',
        nextDate: this.getNextCommunicationDate('MONTHLY'),
        status: 'PLANNED',
      });
    }

    return {
      stakeholderId: stakeholder.stakeholderId,
      stakeholderName: stakeholder.name,
      communications,
    };
  }

  /**
   * Get next communication date based on frequency
   */
  private getNextCommunicationDate(frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'): string {
    const now = new Date();
    const days: Record<string, number> = {
      ONE_TIME: 0,
      DAILY: 1,
      WEEKLY: 7,
      BIWEEKLY: 14,
      MONTHLY: 30,
      QUARTERLY: 90,
    };

    now.setDate(now.getDate() + (days[frequency] ?? 30));
    return now.toISOString();
  }

  /**
   * Map communication frequency to valid type
   */
  private mapToValidFrequency(freq: StakeholderAnalysis['communicationFrequency']):
    'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' {
    switch (freq) {
      case 'DAILY': return 'DAILY';
      case 'WEEKLY': return 'WEEKLY';
      case 'BIWEEKLY': return 'BIWEEKLY';
      case 'MONTHLY': return 'MONTHLY';
      case 'QUARTERLY': return 'QUARTERLY';
      default: return 'MONTHLY';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

export function createStakeholderEngine(): StakeholderManagementEngine {
  return new StakeholderManagementEngine();
}
