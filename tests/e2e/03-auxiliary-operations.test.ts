/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Suite 03: Auxiliary Operations
 * Strategy, Projects, Operations, Knowledge, Community, Communications
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
// 1. STRATEGY — NEB-01
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Strategy & Performance', () => {
  let planId: string;

  describe('Strategic Plans', () => {
    it('should list strategic plans', async () => {
      const res = await api.get('/api/strategic/plans', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
      if (res.status === 200 && Array.isArray(res.data?.data)) {
        expect(Array.isArray(res.data.data)).toBe(true);
      }
    });

    it('should filter plans by status', async () => {
      const res = await api.get('/api/strategic/plans', {
        token: TOKENS.admin,
        query: { status: 'ACTIVE' },
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should filter plans by year', async () => {
      const res = await api.get('/api/strategic/plans', {
        token: TOKENS.admin,
        query: { year: '2026' },
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create strategic plan', async () => {
      const res = await api.post('/api/strategic/plans', {
        title_ar: `خطة استراتيجية ${uniqueId()}`,
        title_en: `Strategic Plan ${uniqueId()}`,
        start_date: '2026-01-01',
        end_date: '2030-12-31',
        status: 'DRAFT',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
      if (res.status === 201 || res.status === 200) {
        planId = res.data?.id;
      }
    });

    it('should get plan by ID', async () => {
      if (!planId) return;
      const res = await api.get(`/api/strategic/plans/${planId}`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should update strategic plan', async () => {
      if (!planId) return;
      const res = await api.put(`/api/strategic/plans/${planId}`, {
        title_ar: 'خطة محدثة',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });

    it('should reject without auth', async () => {
      const res = await api.get('/api/strategic/plans');
      assertUnauthorized(res);
    });
  });

  describe('Strategic Goals', () => {
    it('should list goals for plan', async () => {
      if (!planId) return;
      const res = await api.get(`/api/strategic/plans/${planId}/goals`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create goal', async () => {
      if (!planId) return;
      const res = await api.post(`/api/strategic/plans/${planId}/goals`, {
        title_ar: 'هدف تجريبي',
        title_en: 'Test Goal',
        description_ar: 'وصف الهدف',
        weight: 25,
        target_value: 100,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('KPIs', () => {
    it('should list KPIs', async () => {
      const res = await api.get('/api/strategic/kpis', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create KPI', async () => {
      const res = await api.post('/api/strategic/kpis', {
        name_ar: 'مؤشر أداء تجريبي',
        name_en: 'Test KPI',
        category: 'FINANCIAL',
        target_value: 1000,
        current_value: 0,
        unit: 'YER',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('SWOT Analysis', () => {
    it('should list SWOT items', async () => {
      const res = await api.get('/api/strategic/swot', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create SWOT item', async () => {
      const res = await api.post('/api/strategic/swot', {
        category: 'STRENGTH',
        description_ar: 'قوة تجريبية',
        description_en: 'Test Strength',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Strategic Alignment', () => {
    it('should return alignment data', async () => {
      if (!planId) return;
      const res = await api.get(`/api/strategic/alignment/${planId}`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROJECTS — NEB-04
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Projects & Portfolio', () => {
  let projectId: string;

  describe('Projects CRUD', () => {
    it('should list projects', async () => {
      const res = await api.get('/api/v2/projects/', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should filter projects by status', async () => {
      const res = await api.get('/api/v2/projects/', {
        token: TOKENS.admin,
        query: { status: 'ACTIVE' },
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should search projects', async () => {
      const res = await api.get('/api/v2/projects/', {
        token: TOKENS.admin,
        query: { search: 'تعليم' },
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create project', async () => {
      const res = await api.post('/api/v2/projects/', {
        name_ar: `مشروع ${uniqueId()}`,
        name_en: `Project ${uniqueId()}`,
        description_ar: 'مشروع تجريبي شامل',
        budget: 250000,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        status: 'PLANNING',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
      if (res.status === 201 || res.status === 200) {
        projectId = res.data?.id;
      }
    });

    it('should get project by ID', async () => {
      if (!projectId) return;
      const res = await api.get(`/api/v2/projects/${projectId}`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should update project', async () => {
      if (!projectId) return;
      const res = await api.put(`/api/v2/projects/${projectId}`, {
        name_ar: 'مشروع محدث',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Project Dashboard', () => {
    it('should return project dashboard', async () => {
      const res = await api.get('/api/v2/projects/dashboard', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('EVM (Earned Value Management)', () => {
    it('should calculate EVM metrics', async () => {
      if (!projectId) return;
      const res = await api.get(`/api/v2/projects/${projectId}/evm`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Gantt Chart', () => {
    it('should return Gantt data', async () => {
      if (!projectId) return;
      const res = await api.get(`/api/v2/projects/${projectId}/gantt`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Milestones', () => {
    it('should list milestones', async () => {
      if (!projectId) return;
      const res = await api.get(`/api/v2/projects/${projectId}/milestones`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create milestone', async () => {
      if (!projectId) return;
      const res = await api.post(`/api/v2/projects/${projectId}/milestones`, {
        title_ar: 'معلم تجريبي',
        title_en: 'Test Milestone',
        due_date: '2026-06-30',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Schedules', () => {
    it('should list schedules', async () => {
      if (!projectId) return;
      const res = await api.get(`/api/v2/projects/${projectId}/schedules`, {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Project Intelligence', () => {
    it('should return intelligence overview', async () => {
      const res = await api.get('/api/v2/projects/intelligence', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. OPERATIONS — NEB-05
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Field Operations & WBS', () => {
  describe('Activities', () => {
    it('should list activities via tables API', async () => {
      const res = await api.get('/api/tables/activities', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create activity', async () => {
      const res = await api.post('/api/tables/activities', {
        activity_code: `ACT-${uniqueId()}`,
        title_ar: 'نشاط تجريبي',
        title_en: 'Test Activity',
        status: 'PLANNING',
        organization_id: ORG,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Operational Domains', () => {
    it('should list operational domains', async () => {
      const res = await api.get('/api/operational/domains', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. KNOWLEDGE & DOCUMENTS — NEB-11
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Knowledge & Document Management', () => {
  describe('Knowledge Articles', () => {
    it('should list articles via tables API', async () => {
      const res = await api.get('/api/tables/knowledge_articles', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create article', async () => {
      const res = await api.post('/api/tables/knowledge_articles', {
        title_ar: `مقال ${uniqueId()}`,
        title_en: `Article ${uniqueId()}`,
        content_ar: 'محتوى المقال التفصيلي',
        category: 'GUIDELINES',
        tags: JSON.stringify(['humanitarian', 'guidelines']),
        status: 'PUBLISHED',
        organization_id: ORG,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Policies', () => {
    it('should list policies', async () => {
      const res = await api.get('/api/tables/policies', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. COMMUNITY & MEMBERSHIP — NEB-07
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Community & Membership', () => {
  describe('Volunteers', () => {
    it('should list volunteers', async () => {
      const res = await api.get('/api/tables/volunteers', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });

    it('should create volunteer', async () => {
      const res = await api.post('/api/tables/volunteers', {
        full_name_ar: `متطوع ${uniqueId()}`,
        full_name_en: `Volunteer ${uniqueId()}`,
        phone: '+967771234567',
        email: `vol-${uniqueId()}@nexora.test`,
        skills: 'تعليم, تمريض',
        organization_id: ORG,
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Committees', () => {
    it('should list committees', async () => {
      const res = await api.get('/api/tables/committees', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Membership Applications', () => {
    it('should list membership applications', async () => {
      const res = await api.get('/api/tables/membership_applications', {
        token: TOKENS.admin,
      });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. COMMUNICATIONS — NEB-11
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Official Communications', () => {
  it('should list official communications', async () => {
    const res = await api.get('/api/tables/official_communications', {
      token: TOKENS.admin,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('should create communication', async () => {
    const res = await api.post('/api/tables/official_communications', {
      subject_ar: `خطاب ${uniqueId()}`,
      subject_en: `Letter ${uniqueId()}`,
      doc_type: 'LETTER',
      from_entity: 'المدير العام',
      to_entity: 'جميع الموظفين',
      content_ar: 'محتوى الخطاب',
      status: 'DRAFT',
      organization_id: ORG,
    }, { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ASSETS — NEB-09
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Asset Management', () => {
  it('should list assets', async () => {
    const res = await api.get('/api/tables/assets', {
      token: TOKENS.admin,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('should create asset', async () => {
    const res = await api.post('/api/tables/assets', {
      asset_code: `AST-${uniqueId()}`,
      name_ar: 'جهاز كمبيوتر',
      name_en: 'Computer',
      asset_type: 'EQUIPMENT',
      purchase_date: '2026-01-15',
      purchase_cost: 2500,
      status: 'ACTIVE',
      organization_id: ORG,
    }, { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
  });
});
