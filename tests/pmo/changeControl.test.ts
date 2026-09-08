// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — PMO Change Control & Issue Management Test Suite (PMBOK® 7th Ed)
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeControlEngine } from '../../src/server/pmo/changeControl';

describe('ChangeControlEngine - PMBOK® 7th Edition Change Management', () => {
  let engine: ChangeControlEngine;

  beforeEach(() => {
    engine = new ChangeControlEngine();
  });

  describe('Change Request Creation & Lifecycle', () => {
    it('should create a change request with SUBMITTED status and secure ID', () => {
      const cr = engine.createChangeRequest({
        projectId: 'PRJ-001',
        title: 'Add solar water filtration system',
        description: 'Upgrade the existing manual pump with solar filtration',
        rationale: 'Improve clean water access for 500 additional beneficiaries',
        submittedBy: 'Eng. Ahmed Ba-Thawab',
        impact: {
          costImpact: 25000,
          scheduleImpactDays: 10,
          scopeImpact: 'Addition of solar panels and automated filtration unit'
        }
      });

      expect(cr.id).toMatch(/^CR-\d+-\d+$/);
      expect(cr.changeNumber).toMatch(/^CR-[A-Z0-9]+$/);
      expect(cr.status).toBe('SUBMITTED');
      expect(cr.costImpact).toBe(25000);
      expect(cr.scheduleImpactDays).toBe(10);
    });

    it('should perform impact and risk assessment on change requests', () => {
      const cr = engine.createChangeRequest({
        projectId: 'PRJ-001',
        title: 'Emergency Flood Protection Levee',
        description: 'Construct emergency levee around dispensary',
        rationale: 'Protect medical supplies during torrential rains',
        submittedBy: 'Field Operations Director',
        impact: {
          costImpact: 150000,
          scheduleImpactDays: 45,
          scopeImpact: 'Major earthworks and civil construction over 300 meters along the riverbank to protect hospital facility'
        }
      });

      const assessment = engine.assessChangeRequest(cr);
      expect(assessment.changeRequest.id).toBe(cr.id);
      expect(['HIGH', 'CRITICAL']).toContain(assessment.riskAssessment.level);
      expect(assessment.impactAnalysis.scopeImpact).toBe('SIGNIFICANT');
      expect(assessment.impactAnalysis.resourceImpact).toBe('HIGH');
    });

    it('should handle change request status updates', () => {
      const cr = engine.createChangeRequest({
        projectId: 'PRJ-002',
        title: 'Minor signage addition',
        description: 'Add directional signs in beneficiary staging area',
        rationale: 'Improve crowd management',
        submittedBy: 'Logistics Lead',
        impact: {
          costImpact: 500,
          scheduleImpactDays: 1,
          scopeImpact: 'Signage boards'
        }
      });

      const approvedCr = engine.updateChangeStatus(cr, 'APPROVED');
      expect(approvedCr.status).toBe('APPROVED');
      expect(approvedCr.approvedDate).toBeDefined();
    });
  });

  describe('Issue Tracking & Status Updates', () => {
    it('should create an issue with unique identifier and OPEN status', () => {
      const issue = engine.createIssue({
        projectId: 'PRJ-001',
        title: 'Supply chain delay in cement delivery',
        description: 'Road blockages delaying delivery of high-grade cement by 4 days',
        type: 'MAJOR',
        priority: 'HIGH',
        raisedBy: 'Site Engineer',
        assignedTo: 'Procurement Specialist'
      });

      expect(issue.id).toMatch(/^ISS-\d+-\d+$/);
      expect(issue.issueNumber).toMatch(/^ISS-[A-Z0-9]+$/);
      expect(issue.status).toBe('OPEN');
      expect(issue.priority).toBe('HIGH');
      expect(issue.type).toBe('MAJOR');
    });

    it('should update issue status and record resolved date', () => {
      const issue = engine.createIssue({
        projectId: 'PRJ-001',
        title: 'Generator voltage fluctuation',
        description: 'Unstable power supply to cold chain vaccine storage',
        type: 'CRITICAL',
        priority: 'CRITICAL',
        raisedBy: 'Health Lead'
      });

      const resolved = engine.updateIssueStatus(issue, 'RESOLVED');
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedDate).toBeDefined();
    });
  });

  describe('Metrics & KPI Rollups', () => {
    it('should calculate aggregate change metrics accurately', () => {
      const cr1 = engine.createChangeRequest({
        projectId: 'PRJ-001',
        title: 'Scope add 1',
        description: 'Descr',
        rationale: 'Reason',
        submittedBy: 'Eng A',
        impact: { costImpact: 10000, scheduleImpactDays: 5, scopeImpact: 'Scope A' }
      });
      const cr2 = engine.createChangeRequest({
        projectId: 'PRJ-001',
        title: 'Scope add 2',
        description: 'Descr',
        rationale: 'Reason',
        submittedBy: 'Eng B',
        impact: { costImpact: 20000, scheduleImpactDays: 10, scopeImpact: 'Scope B' }
      });

      const approvedCr1 = engine.updateChangeStatus(cr1, 'APPROVED');
      const metrics = engine.calculateMetrics([approvedCr1, cr2]);

      expect(metrics.totalRequests).toBe(2);
      expect(metrics.byStatus.APPROVED).toBe(1);
      expect(metrics.byStatus.SUBMITTED).toBe(1);
      expect(metrics.approvalRate).toBe(50);
      expect(metrics.costImpactTotal).toBe(30000);
    });

    it('should calculate issue metrics accurately', () => {
      const issue1 = engine.createIssue({
        projectId: 'P1',
        title: 'I1',
        description: 'D1',
        type: 'MAJOR',
        priority: 'HIGH',
        raisedBy: 'U1'
      });
      const issue2 = engine.createIssue({
        projectId: 'P1',
        title: 'I2',
        description: 'D2',
        type: 'MINOR',
        priority: 'LOW',
        raisedBy: 'U2'
      });

      const resolvedIssue1 = engine.updateIssueStatus(issue1, 'RESOLVED');
      const metrics = engine.calculateIssueMetrics([resolvedIssue1, issue2]);

      expect(metrics.totalIssues).toBe(2);
      expect(metrics.byStatus.RESOLVED).toBe(1);
      expect(metrics.byStatus.OPEN).toBe(1);
      expect(metrics.openIssues).toBe(1);
    });
  });
});
