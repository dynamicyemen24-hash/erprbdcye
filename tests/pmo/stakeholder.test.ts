// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — PMO Stakeholder Management Test Suite (PMBOK® 7th Ed)
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { StakeholderManagementEngine } from '../../src/server/pmo/stakeholder';

describe('StakeholderManagementEngine - PMBOK® 7th Edition Stakeholder Engagement', () => {
  let engine: StakeholderManagementEngine;

  beforeEach(() => {
    engine = new StakeholderManagementEngine();
  });

  describe('Stakeholder Registration & Power-Interest Classification', () => {
    it('should create stakeholder engagement with valid ID and importance rating', () => {
      const st = engine.createStakeholder({
        projectId: 'PRJ-001',
        stakeholderId: 'USER-101',
        name: 'Ministry of Water & Environment Representative',
        organization: 'Ministry of Water and Environment',
        role: 'Regulator & Inspector',
        power: 'HIGH',
        interest: 'HIGH',
        influence: 'HIGH',
        currentEngagement: 'SUPPORTIVE',
        desiredEngagement: 'LEADING'
      });

      expect(st.id).toMatch(/^STK-\d+-\d+$/);
      expect(st.power).toBe('HIGH');
      expect(st.interest).toBe('HIGH');
      expect(st.importance).toBeGreaterThanOrEqual(1);
    });

    it('should determine correct Power/Interest grid quadrant positions', () => {
      expect(engine.getQuadrantPosition('HIGH', 'HIGH')).toBe('MANAGE_CLOSELY');
      expect(engine.getQuadrantPosition('HIGH', 'LOW')).toBe('KEEP_SATISFIED');
      expect(engine.getQuadrantPosition('LOW', 'HIGH')).toBe('KEEP_INFORMED');
      expect(engine.getQuadrantPosition('LOW', 'LOW')).toBe('MONITOR');
    });

    it('should analyze stakeholder and compute engagement gap and strategy', () => {
      const st = engine.createStakeholder({
        projectId: 'PRJ-001',
        stakeholderId: 'S-RESISTANT',
        name: 'Hesitant Community Elder',
        organization: 'Tribal Council',
        role: 'Community Elder',
        power: 'HIGH',
        interest: 'MEDIUM',
        influence: 'HIGH',
        currentEngagement: 'RESISTANT',
        desiredEngagement: 'SUPPORTIVE'
      });

      const analysis = engine.analyzeStakeholder(st);
      expect(analysis.powerInterestPosition).toBeDefined();
      expect(analysis.engagementGap).toBeGreaterThan(0);
      expect(analysis.engagementStrategy).toBeDefined();
      expect(analysis.communicationFrequency).toBeDefined();
    });

    it('should generate matrix mapping across all 4 quadrants', () => {
      const s1 = engine.createStakeholder({
        projectId: 'PRJ-001',
        stakeholderId: 'S1',
        name: 'Donor Liaison',
        organization: 'UN OCHA',
        role: 'Donor',
        power: 'HIGH',
        interest: 'HIGH',
        influence: 'HIGH',
        currentEngagement: 'SUPPORTIVE',
        desiredEngagement: 'LEADING'
      });
      const s2 = engine.createStakeholder({
        projectId: 'PRJ-001',
        stakeholderId: 'S2',
        name: 'Local Municipality',
        organization: 'District Office',
        role: 'Regulator',
        power: 'HIGH',
        interest: 'LOW',
        influence: 'HIGH',
        currentEngagement: 'NEUTRAL',
        desiredEngagement: 'SUPPORTIVE'
      });

      const matrix = engine.generateStakeholderMatrix([s1, s2]);
      expect(matrix.projectId).toBe('PRJ-001');
      expect(matrix.quadrants.manageClosely.length).toBe(1);
      expect(matrix.quadrants.keepSatisfied.length).toBe(1);
    });
  });
});
