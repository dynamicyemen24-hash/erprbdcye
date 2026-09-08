// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — PMO Portfolio Management Test Suite (PMBOK® 7th Ed)
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { PortfolioManagementEngine } from '../../src/server/pmo/portfolio';

describe('PortfolioManagementEngine - PMBOK® 7th Edition Portfolio & Program Management', () => {
  let engine: PortfolioManagementEngine;

  beforeEach(() => {
    engine = new PortfolioManagementEngine();
  });

  describe('Portfolio & Program Creation', () => {
    it('should create a portfolio with secure identifier and PLANNING status', () => {
      const portfolio = engine.createPortfolio({
        portfolioCode: 'PORT-WASH-2026',
        name: 'National WASH & Water Resilience Portfolio',
        description: 'Comprehensive water security and borehole drilling across 4 governorates',
        managerId: 'MGR-001',
        totalBudget: 450000000,
        objectives: ['Provide clean water to 250k residents', 'Reduce waterborne diseases by 40%']
      });

      expect(portfolio.id).toMatch(/^PORT-\d+-\d+$/);
      expect(portfolio.portfolioCode).toBe('PORT-WASH-2026');
      expect(portfolio.totalBudget).toBe(450000000);
      expect(portfolio.status).toBe('PLANNING');
      expect(portfolio.objectives.length).toBe(2);
    });

    it('should create a program under a portfolio', () => {
      const program = engine.createProgram({
        programCode: 'PROG-SOLAR-01',
        name: 'Solar Desalination Plants Program',
        portfolioId: 'PORT-WASH-2026',
        managerId: 'MGR-002',
        totalBudget: 180000000,
        objectives: ['Deploy 8 commercial-grade solar desalination units']
      });

      expect(program.id).toMatch(/^PROG-\d+-\d+$/);
      expect(program.portfolioId).toBe('PORT-WASH-2026');
      expect(program.totalBudget).toBe(180000000);
      expect(program.status).toBe('CHARTERED');
    });
  });

  describe('Portfolio Dashboard & Health Metrics', () => {
    it('should generate comprehensive portfolio health dashboard from project metrics', () => {
      const portfolio = engine.createPortfolio({
        portfolioCode: 'PORT-HEALTH-2026',
        name: 'Emergency Health Response Portfolio',
        description: 'Primary healthcare centers operational support',
        managerId: 'MGR-003',
        totalBudget: 300000000
      });

      const dashboard = engine.generatePortfolioDashboard(portfolio, [
        {
          id: 'PRJ-1',
          code: 'P1',
          name: 'Health Center 1',
          progress: 60,
          budgetSpent: 50000000,
          budgetPlanned: 60000000,
          scheduleVariance: 2,
          resourceUtilization: 85,
          riskScore: 25,
          status: 'ON_TRACK'
        },
        {
          id: 'PRJ-2',
          code: 'P2',
          name: 'Health Center 2',
          progress: 40,
          budgetSpent: 45000000,
          budgetPlanned: 40000000,
          scheduleVariance: -5,
          resourceUtilization: 90,
          riskScore: 40,
          status: 'AT_RISK'
        }
      ]);

      expect(dashboard.portfolio.id).toBe(portfolio.id);
      expect(dashboard.portfolio.name).toBe(portfolio.name);
      expect(dashboard.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(dashboard.projectHealthSummary.length).toBe(2);
      expect(dashboard.budgetAnalysis.totalSpent).toBe(95000000);
      expect(dashboard.riskAnalysis.totalRisks).toBe(2);
    });
  });
});
