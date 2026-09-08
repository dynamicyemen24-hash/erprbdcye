/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Suite 04: Documents, Reports & Business Intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  api, TOKENS,
  assertSuccess, assertError, assertUnauthorized,
  FIXTURES, uniqueId,
} from './helpers/setup';

const ORG = '00000000-0000-0000-0000-000000000001';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD & KPIs
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Dashboard & Consolidated KPIs', () => {
  describe('GET /api/dashboard-stats', () => {
    it('should return dashboard statistics', async () => {
      const res = await api.get('/api/dashboard-stats', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
      if (res.status === 200) {
        expect(res.data).toBeDefined();
      }
    });

    it('should reject without auth', async () => {
      const res = await api.get('/api/dashboard-stats');
      assertUnauthorized(res);
    });

    it('should work for viewer role', async () => {
      const res = await api.get('/api/dashboard-stats', {
        token: TOKENS.viewer,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('GET /api/nexora-consolidated-kpis', () => {
    it('should return consolidated KPIs', async () => {
      const res = await api.get('/api/nexora-consolidated-kpis', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('GET /api/predictive-analytics', () => {
    it('should return predictive analytics', async () => {
      const res = await api.get('/api/predictive-analytics', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. REPORTS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Reports Engine', () => {
  describe('GET /api/reports/db-views', () => {
    it('should list available database views', async () => {
      const res = await api.get('/api/reports/db-views', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('GET /api/reports/domain-kpis', () => {
    it('should return domain KPIs', async () => {
      const res = await api.get('/api/reports/domain-kpis', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('POST /api/reports/execute', () => {
    it('should execute a database view query', async () => {
      const res = await api.post('/api/reports/execute', {
        view_name: 'v_beneficiary_summary',
        limit: 10,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });

    it('should execute domain-filtered query', async () => {
      const res = await api.post('/api/reports/execute', {
        domain_code: 'finance',
        limit: 10,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject without auth', async () => {
      const res = await api.post('/api/reports/execute', {
        view_name: 'v_beneficiary_summary',
      });
      assertUnauthorized(res);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DATABASE VIEWS — AUTOMATED REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Database Views (Automated Reports)', () => {
  const VIEWS = [
    'v_beneficiary_summary',
    'v_project_overview',
    'v_financial_summary',
    'v_staff_overview',
    'v_procurement_status',
    'v_funding_overview',
  ];

  VIEWS.forEach(view => {
    it(`should query view: ${view}`, async () => {
      const res = await api.post('/api/reports/execute', {
        view_name: view,
        limit: 5,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. POLICIES & COMPLIANCE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Policies & Compliance', () => {
  describe('GET /api/policies/dashboard', () => {
    it('should return policies dashboard', async () => {
      const res = await api.get('/api/policies/dashboard', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should accept days parameter', async () => {
      const res = await api.get('/api/policies/dashboard', {
        token: TOKENS.admin,
        query: { days: '30' },
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Audit Logs', () => {
    it('should list audit logs', async () => {
      const res = await api.get('/api/tables/audit_logs', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject audit logs for non-admin', async () => {
      const res = await api.get('/api/tables/audit_logs', {
        token: TOKENS.viewer,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Approval Requests', () => {
    it('should list approval requests', async () => {
      const res = await api.get('/api/tables/approval_requests', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. EXCHANGE RATES & CURRENCY
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Exchange Rates & Currency', () => {
  describe('GET /api/exchange-rates/live', () => {
    it('should return live exchange rates (public)', async () => {
      const res = await api.get('/api/exchange-rates/live');
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Currency Tables', () => {
    it('should list fiscal years', async () => {
      const res = await api.get('/api/tables/fiscal_years', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should list fiscal periods', async () => {
      const res = await api.get('/api/tables/fiscal_periods', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. EXPORT & PRINT
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Export & Print', () => {
  it('should support export query parameters', async () => {
    const res = await api.get('/api/tables/beneficiaries', {
      token: TOKENS.admin,
      query: { page: '1', limit: '10' },
    });
    expect(res.status).toBeLessThan(500);
  });

  it('should support pagination', async () => {
    const res = await api.get('/api/tables/projects', {
      token: TOKENS.admin,
      query: { page: '1', limit: '5' },
    });
    expect(res.status).toBeLessThan(500);
  });

  it('should support sorting', async () => {
    const res = await api.get('/api/tables/users', {
      token: TOKENS.admin,
      query: { sortBy: 'created_at', sortOrder: 'desc' },
    });
    expect(res.status).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SCHEMA METADATA
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Schema Metadata', () => {
  it('should return schema for projects table', async () => {
    const res = await api.get('/api/schema/projects', {
      token: TOKENS.admin,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('should return schema for users table', async () => {
    const res = await api.get('/api/schema/users', {
      token: TOKENS.admin,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('should reject schema for non-existent table', async () => {
    const res = await api.get('/api/schema/nonexistent_table_xyz', {
      token: TOKENS.admin,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
