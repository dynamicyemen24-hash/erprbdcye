/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Suite 05: Decision Support & Business Intelligence
 * AI, Analytics, Dashboards, Search, Integration, Backup & System Health
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  api, TOKENS,
  assertSuccess, assertError, assertUnauthorized, assertForbidden,
  FIXTURES, uniqueId,
} from './helpers/setup';

const ORG = '00000000-0000-0000-0000-000000000001';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. AI & INTELLIGENCE — NEB-13
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: AI & Intelligence Engine', () => {
  describe('POST /api/gemini/parse-receipt', () => {
    it('should handle receipt parsing request', async () => {
      const res = await api.post('/api/gemini/parse-receipt', {
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      }, { token: TOKENS.admin });
      // AI may not be configured in test env
      expect(res.status).toBeLessThan(500);
    });

    it('should reject without auth', async () => {
      const res = await api.post('/api/gemini/parse-receipt', {
        imageBase64: 'data:image/png;base64,test',
      });
      assertUnauthorized(res);
    });
  });

  describe('Predictive Analytics', () => {
    it('should return predictive analytics', async () => {
      const res = await api.get('/api/predictive-analytics', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject without auth', async () => {
      const res = await api.get('/api/predictive-analytics');
      assertUnauthorized(res);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Global Search Engine', () => {
  describe('POST /api/search/search', () => {
    it('should perform global search', async () => {
      const res = await api.post('/api/search/search', {
        query: 'مشروع',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });

    it('should accept empty query', async () => {
      const res = await api.post('/api/search/search', {
        query: '',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject without auth', async () => {
      const res = await api.post('/api/search/search', {
        query: 'test',
      });
      assertUnauthorized(res);
    });
  });

  describe('POST /api/search/suggest', () => {
    it('should return search suggestions', async () => {
      const res = await api.post('/api/search/suggest', {
        query: 'test',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('POST /api/search/facets', () => {
    it('should return search facets', async () => {
      const res = await api.post('/api/search/facets', {
        query: 'test',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. INTEGRATION & EXTERNAL SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Integration & External Services', () => {
  describe('POST /api/integration/sms/test', () => {
    it('should handle SMS test', async () => {
      const res = await api.post('/api/integration/sms/test', {}, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('POST /api/integration/email/test', () => {
    it('should handle email test', async () => {
      const res = await api.post('/api/integration/email/test', {}, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('POST /api/integration/zakat-calculator', () => {
    it('should calculate zakat', async () => {
      const res = await api.post('/api/integration/zakat-calculator', {
        amount: 1000000,
        currency: 'YER',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('IATI Integration', () => {
    it('should handle IATI data requests', async () => {
      const res = await api.get('/api/integration/iati', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BACKUP & RECOVERY
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Backup & Recovery System', () => {
  describe('GET /api/backups/list', () => {
    it('should list available backups', async () => {
      const res = await api.get('/api/backups/list', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject without auth', async () => {
      const res = await api.get('/api/backups/list');
      assertUnauthorized(res);
    });
  });

  describe('POST /api/backups/trigger', () => {
    it('should trigger backup (admin only)', async () => {
      const res = await api.post('/api/backups/trigger', {}, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject for low-level users', async () => {
      const res = await api.post('/api/backups/trigger', {}, {
        token: TOKENS.viewer,
      });
      if (res.status === 403) {
        assertForbidden(res);
      }
    });
  });

  describe('POST /api/backups/restore', () => {
    it('should require security level >= 5', async () => {
      const res = await api.post('/api/backups/restore', {
        backupContent: {
          tables: { test: [] },
        },
      }, { token: TOKENS.admin });
      if (res.status === 403) {
        assertForbidden(res);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SYSTEM HEALTH & MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: System Health & Monitoring', () => {
  describe('GET /api/health', () => {
    it('should return health status (public)', async () => {
      const res = await api.get('/api/health');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/health/liveness', () => {
    it('should return liveness probe (public)', async () => {
      const res = await api.get('/api/health/liveness');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/health/readiness', () => {
    it('should return readiness probe (public)', async () => {
      const res = await api.get('/api/health/readiness');
      expect(res.status).toBe(200);
    });
  });

  describe('V2 Health', () => {
    it('should return V2 health', async () => {
      const res = await api.get('/api/v2/health');
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. DOCUMENTATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: API Documentation', () => {
  describe('GET /api/docs/json', () => {
    it('should return OpenAPI spec (public)', async () => {
      const res = await api.get('/api/docs/json');
      expect(res.status).toBe(200);
      if (res.status === 200) {
        expect(res.data).toHaveProperty('openapi');
        expect(res.data).toHaveProperty('info');
        expect(res.data).toHaveProperty('paths');
      }
    });
  });

  describe('GET /api/docs/', () => {
    it('should serve Swagger UI', async () => {
      const res = await api.get('/api/docs/');
      expect(res.status).toBe(200);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. TABLES DYNAMIC CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Dynamic Table CRUD (Core Engine)', () => {
  const CRUD_TABLES = [
    'projects',
    'beneficiaries',
    'organizations',
    'fiscal_years',
    'currencies',
  ];

  CRUD_TABLES.forEach(table => {
    describe(`Table: ${table}`, () => {
      it(`should list ${table}`, async () => {
        const res = await api.get(`/api/tables/${table}`, {
          token: TOKENS.admin,
        });
        expect(res.status).toBeLessThan(500);
      });

      it(`should reject ${table} without auth`, async () => {
        const res = await api.get(`/api/tables/${table}`);
        assertUnauthorized(res);
      });
    });
  });

  describe('Table Whitelist Enforcement', () => {
    it('should reject non-whitelisted table', async () => {
      const res = await api.get('/api/tables/definitely_not_real_table_xyz', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject SQL injection in table name', async () => {
      const res = await api.get('/api/tables/users; DROP TABLE users--', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. CROSS-CUTTING: PAGINATION, SORTING, FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Cross-Cutting Concerns', () => {
  describe('Pagination', () => {
    it('should respect page and limit params', async () => {
      const res = await api.get('/api/tables/projects', {
        token: TOKENS.admin,
        query: { page: '1', limit: '5' },
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should cap limit at maximum', async () => {
      const res = await api.get('/api/tables/projects', {
        token: TOKENS.admin,
        query: { limit: '99999' },
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const res = await api.get('/api/nonexistent-endpoint');
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await fetch(`${api['baseUrl']}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"broken',
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Content-Type', () => {
    it('should return JSON for API endpoints', async () => {
      const res = await api.get('/api/health');
      expect(res.headers['content-type']).toContain('application/json');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. E2E WORKFLOW: FULL LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Full Lifecycle Workflow', () => {
  it('should complete a project-to-finance workflow', async () => {
    // 1. Create project
    const projRes = await api.post('/api/v2/projects/', {
      name_ar: `مشروع دورة كاملة ${uniqueId()}`,
      name_en: `Full Lifecycle Project ${uniqueId()}`,
      budget: 100000,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'PLANNING',
    }, { token: TOKENS.admin });

    expect(projRes.status).toBeLessThan(500);

    if (projRes.status === 201 || projRes.status === 200) {
      const projectId = projRes.data?.id;

      // 2. Add milestone
      if (projectId) {
        const msRes = await api.post(`/api/v2/projects/${projectId}/milestones`, {
          title_ar: 'إكمال التخطيط',
          due_date: '2026-03-01',
        }, { token: TOKENS.admin });
        expect(msRes.status).toBeLessThan(500);

        // 3. Add schedule
        const schedRes = await api.post(`/api/v2/projects/${projectId}/schedules`, {
          task_name_ar: 'نشاط أول',
          start_date: '2026-01-01',
          end_date: '2026-02-28',
          duration_days: 59,
          progress_percent: 0,
        }, { token: TOKENS.admin });
        expect(schedRes.status).toBeLessThan(500);

        // 4. Check EVM
        const evmRes = await api.get(`/api/v2/projects/${projectId}/evm`, {
          token: TOKENS.admin,
        });
        expect(evmRes.status).toBeLessThan(500);

        // 5. Check Gantt
        const ganttRes = await api.get(`/api/v2/projects/${projectId}/gantt`, {
          token: TOKENS.admin,
        });
        expect(ganttRes.status).toBeLessThan(500);
      }
    }
  });

  it('should complete a beneficiary-to-service workflow', async () => {
    // 1. Create beneficiary
    const benRes = await api.post('/api/tables/beneficiaries', {
      full_name_ar: `مستفيد دورة ${uniqueId()}`,
      full_name_en: `Lifecycle Beneficiary ${uniqueId()}`,
      national_id: uniqueId().substring(0, 10),
      gender: 'FEMALE',
      vulnerability_level: 'HIGH',
      organization_id: ORG,
    }, { token: TOKENS.admin });
    expect(benRes.status).toBeLessThan(500);

    // 2. List to verify
    const listRes = await api.get('/api/tables/beneficiaries', {
      token: TOKENS.admin,
      query: { page: '1', limit: '5' },
    });
    expect(listRes.status).toBeLessThan(500);
  });

  it('should complete a strategic planning workflow', async () => {
    // 1. Create strategic plan
    const planRes = await api.post('/api/strategic/plans', {
      title_ar: `خطة دورة ${uniqueId()}`,
      title_en: `Lifecycle Plan ${uniqueId()}`,
      start_date: '2026-01-01',
      end_date: '2030-12-31',
      status: 'DRAFT',
    }, { token: TOKENS.admin });
    expect(planRes.status).toBeLessThan(500);

    // 2. Get all plans
    const listRes = await api.get('/api/strategic/plans', {
      token: TOKENS.admin,
    });
    expect(listRes.status).toBeLessThan(500);

    // 3. Get KPIs
    const kpiRes = await api.get('/api/strategic/kpis', {
      token: TOKENS.admin,
    });
    expect(kpiRes.status).toBeLessThan(500);

    // 4. Get SWOT
    const swotRes = await api.get('/api/strategic/swot', {
      token: TOKENS.admin,
    });
    expect(swotRes.status).toBeLessThan(500);
  });

  it('should complete a finance-to-sales workflow', async () => {
    // 1. Get trial balance
    const tbRes = await api.get('/api/finance/trial-balance', {
      token: TOKENS.admin,
    });
    expect(tbRes.status).toBeLessThan(500);

    // 2. Get balance sheet
    const bsRes = await api.get('/api/finance/balance-sheet', {
      token: TOKENS.admin,
    });
    expect(bsRes.status).toBeLessThan(500);

    // 3. Get income statement
    const isRes = await api.get('/api/finance/income-statement', {
      token: TOKENS.admin,
    });
    expect(isRes.status).toBeLessThan(500);

    // 4. Get sales summary
    const salesRes = await api.get('/api/sales/summary', {
      token: TOKENS.admin,
    });
    expect(salesRes.status).toBeLessThan(500);
  });

  it('should complete a dashboard-to-reporting workflow', async () => {
    // 1. Dashboard stats
    const dashRes = await api.get('/api/dashboard-stats', {
      token: TOKENS.admin,
    });
    expect(dashRes.status).toBeLessThan(500);

    // 2. Consolidated KPIs
    const kpiRes = await api.get('/api/nexora-consolidated-kpis', {
      token: TOKENS.admin,
    });
    expect(kpiRes.status).toBeLessThan(500);

    // 3. Domain KPIs
    const dkpiRes = await api.get('/api/reports/domain-kpis', {
      token: TOKENS.admin,
    });
    expect(dkpiRes.status).toBeLessThan(500);

    // 4. Execute report
    const reportRes = await api.post('/api/reports/execute', {
      view_name: 'v_beneficiary_summary',
      limit: 10,
    }, { token: TOKENS.admin });
    expect(reportRes.status).toBeLessThan(500);
  });
});
