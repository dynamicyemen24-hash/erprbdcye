/**
 * NexoraOS™ — Comprehensive Tests for Untested Engines
 * NEB-01 Strategy, NEB-05 Operations, NEB-09 HR/Assets, NEB-07 Community,
 * NEB-11 Knowledge & Communications, NEB-08 Funding, NEB-05/09 Inventory,
 * NEB-14 Tenders, System Self-Healing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Database ─────────────────────────────────────

const databaseMock = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  queryOne: vi.fn().mockResolvedValue(null),
  queryMany: vi.fn().mockResolvedValue([]),
  transaction: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  query: databaseMock.query,
  queryOne: databaseMock.queryOne,
  queryMany: databaseMock.queryMany,
  transaction: databaseMock.transaction,
  getPool: vi.fn(() => ({ query: databaseMock.query, connect: vi.fn() })),
}));

// ─── Mock Helpers ──────────────────────────────────────

const helpersMock = vi.hoisted(() => ({
  paginatedQuery: vi.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  }),
  requireField: vi.fn((v: any) => {
    if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) throw new Error('Field is required');
    return String(v).trim();
  }),
  optionalString: vi.fn((v: any) => v || null),
  optionalNumber: vi.fn((v: any) => v ?? null),
  sanitize: vi.fn((v: any) => v),
  generateCode: vi.fn(() => 'TEST-CODE-001'),
  generateTxNumber: vi.fn(() => 'TXN-20260819-0001'),
  auditLog: vi.fn().mockResolvedValue(undefined),
  extractTenantId: vi.fn(() => '00000000-0000-0000-0000-000000000001'),
  parsePagination: vi.fn(() => ({ offset: 0, limit: 50, page: 1 })),
  buildOrderBy: vi.fn(() => 'created_at DESC'),
}));

vi.mock('../../core/helpers', () => ({
  paginatedQuery: helpersMock.paginatedQuery,
  requireField: helpersMock.requireField,
  optionalString: helpersMock.optionalString,
  optionalNumber: helpersMock.optionalNumber,
  sanitize: helpersMock.sanitize,
  generateCode: helpersMock.generateCode,
  generateTxNumber: helpersMock.generateTxNumber,
  auditLog: helpersMock.auditLog,
  extractTenantId: helpersMock.extractTenantId,
  parsePagination: helpersMock.parsePagination,
  buildOrderBy: helpersMock.buildOrderBy,
}));

// ─── Mock Logger ───────────────────────────────────────

vi.mock('../../core/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Mock Config ───────────────────────────────────────

vi.mock('../../config/index', async () => {
  const actual = await vi.importActual('../../config/index');
  return {
    ...actual,
    serverConfig: {
      defaultOrgId: '00000000-0000-0000-0000-000000000001',
      jwtSecret: 'test-secret',
    },
  };
});

// ─── Mock Inventory Types ──────────────────────────────

vi.mock('../../../features/inventory/inventoryTypes', () => ({
  INBOUND_MOVEMENT_TYPES: ['RECEIPT', 'TRANSFER_IN', 'ADJUSTMENT_IN'],
  INVENTORY_ROLE_PERMISSIONS: {
    ADMIN: ['inventory.items.manage', 'inventory.receipt.post', 'inventory.issue.post', 'inventory.adjustment.manage', 'inventory.approve', 'inventory.transfer.manage', 'inventory.stocktake.manage', 'inventory.policies.manage', 'inventory.warehouses.manage'],
    MANAGER: ['inventory.items.manage', 'inventory.receipt.post', 'inventory.issue.post', 'inventory.adjustment.manage', 'inventory.approve', 'inventory.transfer.manage', 'inventory.stocktake.manage'],
    VIEWER: [],
  },
  TRANSFER_TRANSITIONS: {
    DRAFT: ['APPROVED', 'CANCELLED'],
    APPROVED: ['IN_TRANSIT'],
    IN_TRANSIT: ['RECEIVED'],
  },
  ADJUSTMENT_TRANSITIONS: {
    DRAFT: ['APPROVED', 'REJECTED'],
    APPROVED: ['POSTED'],
    POSTED: [],
    REJECTED: [],
  },
  STOCKTAKE_TRANSITIONS: {
    COUNTING: ['PENDING_APPROVAL'],
    PENDING_APPROVAL: ['APPROVED'],
    APPROVED: ['POSTED'],
    POSTED: [],
  },
}));

// ─── Auth Context ──────────────────────────────────────

const mockAuth = {
  userId: '00000000-0000-0000-0000-000000000099',
  orgId: '00000000-0000-0000-0000-000000000001',
  email: 'test@test.com',
  name: 'Test User',
  role: 'ADMIN',
  securityLevel: 5,
};

const orgId = '00000000-0000-0000-0000-000000000001';

// ─── Helper: make transaction pass through callback ────

function mockTransactionSuccess(returnValue?: any) {
  databaseMock.transaction.mockImplementation(async (cb: any) => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [returnValue || { id: 'mock-id' }], rowCount: 1 }),
    };
    return cb(client);
  });
}

function mockTransactionRows(rows: any[]) {
  databaseMock.transaction.mockImplementation(async (cb: any) => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows, rowCount: rows.length }),
    };
    return cb(client);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-01: STRATEGY & PERFORMANCE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import {
  StrategicPlanEngine,
  StrategicGoalEngine,
  KPIEngine2,
  SWOTEngine,
  StrategicAlignmentEngine,
} from '../strategy.engine';

describe('StrategicPlanEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated strategic plans', async () => {
      helpersMock.paginatedQuery.mockResolvedValue({ data: [{ id: '1', title_ar: 'X' }], pagination: { total: 1 } });
      const result = await StrategicPlanEngine.list(orgId);
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should pass status filter', async () => {
      await StrategicPlanEngine.list(orgId, {}, { status: 'ACTIVE' });
      const sql = helpersMock.paginatedQuery.mock.calls[0][0];
      expect(sql).toContain('sp.status = $2');
    });

    it('should pass year filter', async () => {
      await StrategicPlanEngine.list(orgId, {}, { year: 2026 });
      const sql = helpersMock.paginatedQuery.mock.calls[0][0];
      expect(sql).toContain('sp.start_year <= $2');
      expect(sql).toContain('sp.end_year >= $2');
    });
  });

  describe('getById', () => {
    it('should return null for non-existent plan', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await StrategicPlanEngine.getById('nonexistent')).toBeNull();
    });

    it('should return plan with goals and KPIs', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: '1', title_ar: 'Plan' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'g1' }]);
      const result = await StrategicPlanEngine.getById('1');
      expect(result).toHaveProperty('goals');
      expect(result).toHaveProperty('kpis');
    });
  });

  describe('create', () => {
    it('should create a strategic plan with generated code', async () => {
      mockTransactionSuccess({ id: '1', plan_code: 'TEST-CODE-001', title_ar: 'Test Plan' });
      const result = await StrategicPlanEngine.create(
        { organizationId: orgId, titleAr: 'Test Plan', startYear: 2024, endYear: 2028 },
        mockAuth
      );
      expect(result.title_ar).toBe('Test Plan');
    });

    it('should throw if titleAr is missing', async () => {
      mockTransactionSuccess();
      await expect(
        StrategicPlanEngine.create(
          { organizationId: orgId, titleAr: '', startYear: 2024, endYear: 2028 },
          mockAuth
        )
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should return null if no fields provided', async () => {
      const result = await StrategicPlanEngine.update('1', {});
      expect(result).toBeNull();
    });

    it('should update provided fields', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: '1', title_ar: 'Updated' });
      const result = await StrategicPlanEngine.update('1', { titleAr: 'Updated' });
      expect(result.title_ar).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('should delete goals then plan', async () => {
      await StrategicPlanEngine.delete('1');
      expect(databaseMock.query).toHaveBeenCalledTimes(2);
    });
  });
});

describe('StrategicGoalEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('listByPlan', () => {
    it('should return goals for a plan', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'g1', goal_code: 'G1' }]);
      const result = await StrategicGoalEngine.listByPlan('plan-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create goal within a plan', async () => {
      mockTransactionRows([{ id: 'g1', title_ar: 'Goal' }]);
      const result = await StrategicGoalEngine.create(
        { planId: 'plan-1', goalCode: 'G1', titleAr: 'Goal' },
        mockAuth
      );
      expect(result.title_ar).toBe('Goal');
    });

    it('should throw if plan not found', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        return cb(client);
      });
      await expect(
        StrategicGoalEngine.create({ planId: 'bad', goalCode: 'G1', titleAr: 'X' }, mockAuth)
      ).rejects.toThrow('Strategic plan not found');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await StrategicGoalEngine.update('g1', {})).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete KPIs then goal', async () => {
      await StrategicGoalEngine.delete('g1');
      expect(databaseMock.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('recalculateProgress', () => {
    it('should update plan progress if weight > 0', async () => {
      databaseMock.queryOne.mockResolvedValue({ weighted_progress: 80, total_weight: 100 });
      await StrategicGoalEngine.recalculateProgress('plan-1');
      expect(databaseMock.query).toHaveBeenCalledWith(
        expect.stringContaining('overall_progress_pct'),
        [80, 'plan-1']
      );
    });

    it('should do nothing if total weight is 0', async () => {
      databaseMock.queryOne.mockResolvedValue({ weighted_progress: 0, total_weight: 0 });
      await StrategicGoalEngine.recalculateProgress('plan-1');
      expect(databaseMock.query).not.toHaveBeenCalled();
    });
  });
});

describe('KPIEngine2', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated KPIs', async () => {
      await KPIEngine2.list(orgId, {}, { category: 'FINANCE' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a KPI', async () => {
      mockTransactionRows([{ id: 'kpi-1', kpi_code: 'K1' }]);
      const result = await KPIEngine2.create(
        { organizationId: orgId, kpiCode: 'K1', nameAr: 'KPI One' },
        mockAuth
      );
      expect(result.kpi_code).toBe('K1');
    });
  });

  describe('updateValue', () => {
    it('should throw if KPI not found', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      await expect(KPIEngine2.updateValue('bad', 50)).rejects.toThrow('KPI not found');
    });

    it('should set ON_TRACK when >= 80% of target', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'k1', target_value: 100, current_value: 0 })
        .mockResolvedValueOnce({ id: 'k1', status: 'ON_TRACK' });
      const result = await KPIEngine2.updateValue('k1', 85);
      expect(result.status).toBe('ON_TRACK');
    });

    it('should set AT_RISK when >= 50% of target', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'k1', target_value: 100, current_value: 0 })
        .mockResolvedValueOnce({ id: 'k1', status: 'AT_RISK' });
      const result = await KPIEngine2.updateValue('k1', 60);
      expect(result.status).toBe('AT_RISK');
    });

    it('should set BEHIND when < 50% of target', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'k1', target_value: 100, current_value: 0 })
        .mockResolvedValueOnce({ id: 'k1', status: 'BEHIND' });
      const result = await KPIEngine2.updateValue('k1', 30);
      expect(result.status).toBe('BEHIND');
    });
  });
});

describe('SWOTEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getByPlan', () => {
    it('should return SWOT items for a plan', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 's1', category: 'STRENGTH' }]);
      const result = await SWOTEngine.getByPlan('plan-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create SWOT item', async () => {
      mockTransactionRows([{ id: 's1', category: 'STRENGTH' }]);
      const result = await SWOTEngine.create(
        { planId: 'plan-1', organizationId: orgId, category: 'STRENGTH', titleAr: 'Good' },
        mockAuth
      );
      expect(result.category).toBe('STRENGTH');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await SWOTEngine.update('s1', {})).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete SWOT item', async () => {
      await SWOTEngine.delete('s1');
      expect(databaseMock.query).toHaveBeenCalled();
    });
  });

  describe('getMatrix', () => {
    it('should group items into SWOT categories', async () => {
      databaseMock.queryMany.mockResolvedValue([
        { id: '1', category: 'STRENGTH' },
        { id: '2', category: 'WEAKNESS' },
        { id: '3', category: 'OPPORTUNITY' },
        { id: '4', category: 'THREAT' },
      ]);
      const result = await SWOTEngine.getMatrix(orgId);
      expect(result.strengths).toHaveLength(1);
      expect(result.weaknesses).toHaveLength(1);
      expect(result.opportunities).toHaveLength(1);
      expect(result.threats).toHaveLength(1);
    });

    it('should accept optional planId filter', async () => {
      databaseMock.queryMany.mockResolvedValue([]);
      await SWOTEngine.getMatrix(orgId, 'plan-1');
      const sql = databaseMock.queryMany.mock.calls[0][0];
      expect(sql).toContain('plan_id = $2');
    });
  });
});

describe('StrategicAlignmentEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAlignment', () => {
    it('should return goals, projects, and alignment score', async () => {
      databaseMock.queryMany
        .mockResolvedValueOnce([{ id: 'g1', weight_pct: 50, progress_pct: 80 }])
        .mockResolvedValueOnce([{ id: 'p1', name_ar: 'Project' }]);
      const result = await StrategicAlignmentEngine.getAlignment(orgId, 'plan-1');
      expect(result).toHaveProperty('goals');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('alignmentScore');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-05: OPERATIONS & FIELD EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ActivityEngine,
  ResourceAllocationEngine,
  GeospatialEngine,
  TaskEngine,
} from '../operations.engine';

describe('ActivityEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated activities', async () => {
      await ActivityEngine.list(orgId, {}, { projectId: 'p1' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });

    it('should pass search filter with ILIKE', async () => {
      await ActivityEngine.list(orgId, {}, { search: 'test' });
      const sql = helpersMock.paginatedQuery.mock.calls[0][0];
      expect(sql).toContain('ILIKE');
    });
  });

  describe('getById', () => {
    it('should return activity with project name', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'a1', project_name_ar: 'P' });
      const result = await ActivityEngine.getById('a1');
      expect(result.project_name_ar).toBe('P');
    });
  });

  describe('create', () => {
    it('should create activity with audit log', async () => {
      mockTransactionSuccess({ id: 'a1', code: 'ACT-001' });
      const result = await ActivityEngine.create(
        { organizationId: orgId, code: 'ACT-001', nameAr: 'Activity' },
        mockAuth
      );
      expect(result.code).toBe('ACT-001');
    });

    it('should throw if code is missing', async () => {
      mockTransactionSuccess();
      await expect(
        ActivityEngine.create({ organizationId: orgId, code: '', nameAr: 'X' }, mockAuth)
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await ActivityEngine.update('a1', {})).toBeNull();
    });

    it('should map camelCase keys to snake_case columns', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'a1', budget: 5000 });
      await ActivityEngine.update('a1', { budgetAllocated: 5000 });
      const sql = databaseMock.queryOne.mock.calls[0][0];
      expect(sql).toContain('budget');
    });
  });

  describe('delete', () => {
    it('should soft-delete activity', async () => {
      await ActivityEngine.delete('a1');
      expect(databaseMock.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at = NOW()'),
        ['a1']
      );
    });
  });

  describe('updateProgress', () => {
    it('should throw if progress < 0', async () => {
      await expect(ActivityEngine.updateProgress('a1', -1, mockAuth)).rejects.toThrow('Progress must be between 0 and 100');
    });

    it('should throw if progress > 100', async () => {
      await expect(ActivityEngine.updateProgress('a1', 101, mockAuth)).rejects.toThrow('Progress must be between 0 and 100');
    });

    it('should throw if activity not found', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        return cb(client);
      });
      await expect(ActivityEngine.updateProgress('bad', 50, mockAuth)).rejects.toThrow('Activity not found');
    });
  });

  describe('getWBS', () => {
    it('should return WBS tree with summary', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'a1', budget: 100, actual_cost: 50 }]);
      databaseMock.queryOne.mockResolvedValue({ id: 'p1', name_ar: 'Project' });
      const result = await ActivityEngine.getWBS('p1');
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('wbs');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalBudget).toBe(100);
    });
  });
});

describe('ResourceAllocationEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return allocations', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'r1' }]);
      const result = await ResourceAllocationEngine.list(orgId);
      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      databaseMock.queryMany.mockRejectedValue(new Error('DB error'));
      const result = await ResourceAllocationEngine.list(orgId);
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create allocation', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'r1', resource_name: 'Dev' });
      const result = await ResourceAllocationEngine.create({
        organizationId: orgId, resourceName: 'Dev', resourceType: 'HUMAN',
        allocatedHours: 40, allocationDate: '2026-01-01',
      });
      expect(result.resource_name).toBe('Dev');
    });

    it('should return null on error', async () => {
      databaseMock.queryOne.mockRejectedValue(new Error('DB error'));
      const result = await ResourceAllocationEngine.create({
        organizationId: orgId, resourceName: 'Dev', resourceType: 'HUMAN',
        allocatedHours: 40, allocationDate: '2026-01-01',
      });
      expect(result).toBeNull();
    });
  });
});

describe('GeospatialEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('listAreas', () => {
    it('should return geographic areas', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'ga1', name_ar: 'Area' }]);
      const result = await GeospatialEngine.listAreas(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('createArea', () => {
    it('should create geographic area', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'ga1', code: 'GA1' });
      const result = await GeospatialEngine.createArea({ code: 'GA1', nameAr: 'Area' });
      expect(result.code).toBe('GA1');
    });
  });

  describe('getProjectLocations', () => {
    it('should return project locations', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'p1', latitude: 24.7 }]);
      const result = await GeospatialEngine.getProjectLocations(orgId);
      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      databaseMock.queryMany.mockRejectedValue(new Error('fail'));
      const result = await GeospatialEngine.getProjectLocations(orgId);
      expect(result).toEqual([]);
    });
  });
});

describe('TaskEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('listByActivity', () => {
    it('should return tasks for activity', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 't1', title_ar: 'Task' }]);
      const result = await TaskEngine.listByActivity('act-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      databaseMock.queryMany.mockRejectedValue(new Error('fail'));
      const result = await TaskEngine.listByActivity('act-1');
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create task in activity', async () => {
      mockTransactionRows([{ id: 't1', title_ar: 'Task', status_code: 'TODO' }]);
      const result = await TaskEngine.create(
        { activityId: 'act-1', titleAr: 'Task' },
        mockAuth
      );
      expect(result.status_code).toBe('TODO');
    });

    it('should throw if activity not found', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        return cb(client);
      });
      await expect(
        TaskEngine.create({ activityId: 'bad', titleAr: 'X' }, mockAuth)
      ).rejects.toThrow('Activity not found');
    });
  });

  describe('updateProgress', () => {
    it('should throw if progress out of range', async () => {
      await expect(TaskEngine.updateProgress('t1', -5, mockAuth)).rejects.toThrow('Progress must be between 0 and 100');
    });

    it('should throw if task not found', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        return cb(client);
      });
      await expect(TaskEngine.updateProgress('bad', 50, mockAuth)).rejects.toThrow('Task not found');
    });
  });

  describe('delete', () => {
    it('should soft-delete task', async () => {
      await TaskEngine.delete('t1');
      expect(databaseMock.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at = NOW()'),
        ['t1']
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-09: HUMAN RESOURCES ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { HREngine, AttendanceEngine, LeaveEngine } from '../hr.engine';

describe('HREngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('listStaff', () => {
    it('should return paginated staff', async () => {
      await HREngine.listStaff(orgId, {}, { department: 'IT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });

    it('should pass search filter', async () => {
      await HREngine.listStaff(orgId, {}, { search: 'ahmed' });
      const sql = helpersMock.paginatedQuery.mock.calls[0][0];
      expect(sql).toContain('ILIKE');
    });
  });

  describe('getStaffById', () => {
    it('should return staff member', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 's1', full_name_ar: 'أحمد' });
      const result = await HREngine.getStaffById('s1');
      expect(result.full_name_ar).toBe('أحمد');
    });

    it('should return null for non-existent staff', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await HREngine.getStaffById('bad')).toBeNull();
    });
  });

  describe('createStaff', () => {
    it('should create staff with audit log', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [], rowCount: 0 })
            .mockResolvedValueOnce({ rows: [{ id: 's1', employee_number: 'EMP-001' }], rowCount: 1 }),
        };
        return cb(client);
      });
      const result = await HREngine.createStaff(
        { organizationId: orgId, employeeNumber: 'EMP-001', fullNameAr: 'أحمد' },
        mockAuth
      );
      expect(result.employee_number).toBe('EMP-001');
    });

    it('should throw for duplicate employee number', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'existing' }] }),
        };
        return cb(client);
      });
      await expect(
        HREngine.createStaff(
          { organizationId: orgId, employeeNumber: 'DUP', fullNameAr: 'X' },
          mockAuth
        )
      ).rejects.toThrow('Employee number already exists');
    });
  });

  describe('updateStaff', () => {
    it('should return null if no fields', async () => {
      expect(await HREngine.updateStaff('s1', {})).toBeNull();
    });

    it('should update staff fields', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 's1', full_name_ar: 'Updated' });
      const result = await HREngine.updateStaff('s1', { fullNameAr: 'Updated' });
      expect(result.full_name_ar).toBe('Updated');
    });
  });

  describe('deleteStaff', () => {
    it('should soft-terminate staff', async () => {
      await HREngine.deleteStaff('s1');
      expect(databaseMock.query).toHaveBeenCalledWith(
        expect.stringContaining('TERMINATED'),
        ['s1']
      );
    });
  });

  describe('getDashboard', () => {
    it('should return staff statistics', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_staff: 10, active: 8, departments: 3 });
      databaseMock.queryMany.mockResolvedValue([{ department: 'IT', count: 5 }]);
      const result = await HREngine.getDashboard(orgId);
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('byDepartment');
    });
  });
});

describe('AttendanceEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('clockIn', () => {
    it('should record clock in', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'att-1', clock_in: new Date().toISOString() });
      const result = await AttendanceEngine.clockIn('staff-1', { location: 'Office' });
      expect(result.id).toBe('att-1');
    });

    it('should return null on error', async () => {
      databaseMock.queryOne.mockRejectedValue(new Error('fail'));
      const result = await AttendanceEngine.clockIn('staff-1', {});
      expect(result).toBeNull();
    });
  });

  describe('clockOut', () => {
    it('should record clock out', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'att-1', hours_worked: 8 });
      const result = await AttendanceEngine.clockOut('att-1', {});
      expect(result.hours_worked).toBe(8);
    });
  });

  describe('getStaffAttendance', () => {
    it('should return attendance records', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'att-1' }]);
      const result = await AttendanceEngine.getStaffAttendance('staff-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      databaseMock.queryMany.mockRejectedValue(new Error('fail'));
      const result = await AttendanceEngine.getStaffAttendance('staff-1');
      expect(result).toEqual([]);
    });
  });
});

describe('LeaveEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('requestLeave', () => {
    it('should create leave request with PENDING status', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'lr-1', status: 'PENDING' });
      const result = await LeaveEngine.requestLeave({
        staffId: 's1', leaveType: 'ANNUAL',
        startDate: '2026-01-01', endDate: '2026-01-05',
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('approveLeave', () => {
    it('should approve pending leave', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'lr-1', status: 'APPROVED' });
      const result = await LeaveEngine.approveLeave('lr-1', 'manager-1');
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('rejectLeave', () => {
    it('should reject pending leave', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'lr-1', status: 'REJECTED' });
      const result = await LeaveEngine.rejectLeave('lr-1', 'manager-1', 'Busy');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('getStaffLeaves', () => {
    it('should return leave records', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'lr-1' }]);
      const result = await LeaveEngine.getStaffLeaves('s1');
      expect(result).toHaveLength(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-09: RESOURCE & ASSET ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { AssetEngine, InventoryEngine, WarehouseEngine } from '../assets.engine';

describe('AssetEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated assets', async () => {
      await AssetEngine.list(orgId, {}, { category: 'IT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return asset with lifecycle', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'a1', name_ar: 'Laptop' });
      databaseMock.queryMany.mockResolvedValue([{ event_type: 'MAINTENANCE' }]);
      const result = await AssetEngine.getById('a1');
      expect(result).toHaveProperty('lifecycle');
    });

    it('should return null for non-existent asset', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await AssetEngine.getById('bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create asset with audit log', async () => {
      mockTransactionRows([{ id: 'a1', asset_code: 'AST-001' }]);
      const result = await AssetEngine.create(
        { organizationId: orgId, assetCode: 'AST-001', nameAr: 'Laptop', purchaseCost: 1000 },
        mockAuth
      );
      expect(result.asset_code).toBe('AST-001');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await AssetEngine.update('a1', {})).toBeNull();
    });
  });

  describe('delete', () => {
    it('should hard-delete asset', async () => {
      await AssetEngine.delete('a1');
      expect(databaseMock.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM fixed_assets'),
        ['a1']
      );
    });
  });

  describe('recordLifecycleEvent', () => {
    it('should record lifecycle event', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'ev-1', event_type: 'MAINTENANCE' });
      const result = await AssetEngine.recordLifecycleEvent({
        assetId: 'a1', eventType: 'MAINTENANCE', description: 'Oil change', cost: 50,
      });
      expect(result.event_type).toBe('MAINTENANCE');
    });
  });

  describe('calculateDepreciation', () => {
    it('should return depreciation data', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'a1', calculated_value: 800 }]);
      const result = await AssetEngine.calculateDepreciation(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('getDashboard', () => {
    it('should return asset statistics', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_assets: 20, active: 15 });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await AssetEngine.getDashboard(orgId);
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('byCategory');
    });
  });
});

describe('InventoryEngine (assets)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated inventory items', async () => {
      await InventoryEngine.list(orgId, {}, { warehouseId: 'w1' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create inventory item', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'i1', item_code: 'ITM-001' });
      const result = await InventoryEngine.create(
        { organizationId: orgId, itemCode: 'ITM-001', nameAr: 'Item' },
        mockAuth
      );
      expect(result.item_code).toBe('ITM-001');
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'i1', total_quantity_on_hand: 50 });
      const result = await InventoryEngine.updateStock('i1', 10, 'restock');
      expect(result.total_quantity_on_hand).toBe(50);
    });
  });
});

describe('WarehouseEngine (assets)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return warehouses with item counts', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'w1', items_count: 5 }]);
      const result = await WarehouseEngine.list(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create warehouse', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'w1', code: 'WH1' });
      const result = await WarehouseEngine.create(
        { organizationId: orgId, code: 'WH1', nameAr: 'Main Warehouse' },
        mockAuth
      );
      expect(result.code).toBe('WH1');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await WarehouseEngine.update('w1', {})).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-11: KNOWLEDGE & DOCUMENT ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { KnowledgeArticleEngine } from '../knowledge.engine';

describe('KnowledgeArticleEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated articles', async () => {
      await KnowledgeArticleEngine.list(orgId, {}, { category: 'HR' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });

    it('should pass tags filter', async () => {
      await KnowledgeArticleEngine.list(orgId, {}, { tags: ['policy'] });
      const sql = helpersMock.paginatedQuery.mock.calls[0][0];
      expect(sql).toContain('tags @>');
    });
  });

  describe('getById', () => {
    it('should return article', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'ka1', title_ar: 'Article' });
      const result = await KnowledgeArticleEngine.getById('ka1');
      expect(result.title_ar).toBe('Article');
    });
  });

  describe('create', () => {
    it('should create article with PUBLISHED status', async () => {
      mockTransactionRows([{ id: 'ka1', status: 'PUBLISHED' }]);
      const result = await KnowledgeArticleEngine.create(
        { organizationId: orgId, titleAr: 'Article', tags: ['policy'] },
        mockAuth
      );
      expect(result.status).toBe('PUBLISHED');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await KnowledgeArticleEngine.update('ka1', {})).toBeNull();
    });

    it('should handle tags as JSON', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'ka1', tags: ['new'] });
      await KnowledgeArticleEngine.update('ka1', { tags: ['new'] });
      expect(databaseMock.queryOne).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete article', async () => {
      await KnowledgeArticleEngine.delete('ka1');
      expect(databaseMock.query).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return search results', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'ka1', rank: 0.9 }]);
      const result = await KnowledgeArticleEngine.search(orgId, 'policy');
      expect(result).toHaveLength(1);
    });
  });

  describe('getByTag', () => {
    it('should return articles by tag', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'ka1', tags: ['hr'] }]);
      const result = await KnowledgeArticleEngine.getByTag(orgId, 'hr');
      expect(result).toHaveLength(1);
    });
  });

  describe('getCategories', () => {
    it('should return category counts', async () => {
      databaseMock.queryMany.mockResolvedValue([{ category: 'HR', count: 5 }]);
      const result = await KnowledgeArticleEngine.getCategories(orgId);
      expect(result).toHaveLength(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-07: COMMUNITY & MEMBERSHIP ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { VolunteerEngine, CommitteeEngine, MembershipEngine } from '../community.engine';

describe('VolunteerEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated volunteers', async () => {
      await VolunteerEngine.list(orgId, {}, { status: 'ACTIVE' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return volunteer with tasks', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'v1', name: 'Vol' });
      databaseMock.queryMany.mockResolvedValue([{ id: 't1' }]);
      const result = await VolunteerEngine.getById('v1');
      expect(result).toHaveProperty('tasks');
    });

    it('should return null for non-existent volunteer', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await VolunteerEngine.getById('bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create volunteer', async () => {
      mockTransactionRows([{ id: 'v1', name: 'Vol' }]);
      const result = await VolunteerEngine.create(
        { organizationId: orgId, name: 'Vol' },
        mockAuth
      );
      expect(result.name).toBe('Vol');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await VolunteerEngine.update('v1', {})).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete volunteer', async () => {
      await VolunteerEngine.delete('v1');
      expect(databaseMock.query).toHaveBeenCalled();
    });
  });

  describe('getHoursReport', () => {
    it('should return hours report', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'v1', total_hours: 40 }]);
      const result = await VolunteerEngine.getHoursReport(orgId);
      expect(result).toHaveLength(1);
    });
  });
});

describe('CommitteeEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return committees', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'c1', member_count: 5 }]);
      const result = await CommitteeEngine.list(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create committee', async () => {
      mockTransactionRows([{ id: 'c1', name_ar: 'Committee' }]);
      const result = await CommitteeEngine.create(
        { organizationId: orgId, nameAr: 'Committee' },
        mockAuth
      );
      expect(result.name_ar).toBe('Committee');
    });
  });

  describe('addMember', () => {
    it('should add member to committee', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'cm1', committee_id: 'c1' });
      const result = await CommitteeEngine.addMember('c1', { volunteerId: 'v1' });
      expect(result.committee_id).toBe('c1');
    });
  });

  describe('getMembers', () => {
    it('should return committee members', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'cm1', volunteer_name: 'Vol' }]);
      const result = await CommitteeEngine.getMembers('c1');
      expect(result).toHaveLength(1);
    });
  });
});

describe('MembershipEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated applications', async () => {
      await MembershipEngine.list(orgId, {}, { status: 'PENDING' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create application', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [], rowCount: 0 })
            .mockResolvedValueOnce({ rows: [{ id: 'ma1', status: 'PENDING' }], rowCount: 1 }),
        };
        return cb(client);
      });
      const result = await MembershipEngine.create(
        { organizationId: orgId, applicantName: 'Applicant' },
        mockAuth
      );
      expect(result.status).toBe('PENDING');
    });

    it('should throw for duplicate pending application', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'existing' }] }),
        };
        return cb(client);
      });
      await expect(
        MembershipEngine.create(
          { organizationId: orgId, applicantName: 'Dup' },
          mockAuth
        )
      ).rejects.toThrow('pending application already exists');
    });
  });

  describe('review', () => {
    it('should approve application', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'ma1', status: 'APPROVED' });
      const result = await MembershipEngine.review('ma1', 'APPROVED');
      expect(result.status).toBe('APPROVED');
    });

    it('should reject application', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'ma1', status: 'REJECTED' });
      const result = await MembershipEngine.review('ma1', 'REJECTED', 'Not qualified');
      expect(result.status).toBe('REJECTED');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-11: COMMUNICATIONS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { CommunicationsEngine } from '../communications.engine';

describe('CommunicationsEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated communications', async () => {
      databaseMock.queryOne.mockResolvedValue({ total: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await CommunicationsEngine.list(orgId);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });

    it('should apply status filter', async () => {
      databaseMock.queryOne.mockResolvedValue({ total: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      await CommunicationsEngine.list(orgId, { status: 'DRAFT' });
      const sql = databaseMock.queryOne.mock.calls[0][0];
      expect(sql).toContain('c.status = $2');
    });

    it('should apply search filter', async () => {
      databaseMock.queryOne.mockResolvedValue({ total: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      await CommunicationsEngine.list(orgId, { search: 'test' });
      const sql = databaseMock.queryOne.mock.calls[0][0];
      expect(sql).toContain('ILIKE');
    });
  });

  describe('getById', () => {
    it('should return communication with recipients', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', subject_ar: 'Test' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'r1' }]);
      const result = await CommunicationsEngine.getById(orgId, 'c1');
      expect(result).toHaveProperty('recipients');
    });

    it('should return null if not found', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await CommunicationsEngine.getById(orgId, 'bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create DRAFT communication', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ n: '1' })
        .mockResolvedValueOnce({ id: 'c1', subject_ar: 'Test', status: 'DRAFT' });
      databaseMock.queryMany.mockResolvedValue([]);
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [{ id: 'c1' }] }) };
        return cb(client);
      });
      const result = await CommunicationsEngine.create(orgId, mockAuth, {
        docType: 'MEMO', subjectAr: 'Test Memo', fromEntity: 'HR',
      });
      expect(result.subject_ar).toBe('Test');
    });

    it('should throw if subjectAr is missing', async () => {
      await expect(
        CommunicationsEngine.create(orgId, mockAuth, {
          docType: 'MEMO', subjectAr: '', fromEntity: 'HR',
        })
      ).rejects.toThrow('Subject (Arabic) is required');
    });

    it('should throw if fromEntity is missing', async () => {
      await expect(
        CommunicationsEngine.create(orgId, mockAuth, {
          docType: 'MEMO', subjectAr: 'Test', fromEntity: '',
        })
      ).rejects.toThrow('From entity is required');
    });

    it('should throw for invalid doc type', async () => {
      await expect(
        CommunicationsEngine.create(orgId, mockAuth, {
          docType: 'INVALID' as any, subjectAr: 'Test', fromEntity: 'HR',
        })
      ).rejects.toThrow('Invalid document type');
    });
  });

  describe('submit', () => {
    it('should submit a DRAFT', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'c1', status: 'DRAFT' })
        .mockResolvedValueOnce({ id: 'c1', status: 'SUBMITTED' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await CommunicationsEngine.submit(orgId, 'c1', mockAuth.userId);
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw if not DRAFT', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', status: 'APPROVED' });
      await expect(
        CommunicationsEngine.submit(orgId, 'c1', mockAuth.userId)
      ).rejects.toThrow('Only DRAFT');
    });
  });

  describe('approve', () => {
    it('should approve a SUBMITTED communication', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'c1', status: 'SUBMITTED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'APPROVED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'APPROVED' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await CommunicationsEngine.approve(orgId, 'c1', mockAuth.userId);
      expect(result.status).toBe('APPROVED');
    });

    it('should throw if not SUBMITTED', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', status: 'DRAFT' });
      await expect(
        CommunicationsEngine.approve(orgId, 'c1', mockAuth.userId)
      ).rejects.toThrow('Only SUBMITTED');
    });
  });

  describe('reject', () => {
    it('should reject a SUBMITTED communication', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'c1', status: 'SUBMITTED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'REJECTED' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await CommunicationsEngine.reject(orgId, 'c1', mockAuth.userId, 'Not ready');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('issue', () => {
    it('should issue an APPROVED communication', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'c1', status: 'APPROVED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'ISSUED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'ISSUED' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await CommunicationsEngine.issue(orgId, 'c1');
      expect(result.status).toBe('ISSUED');
    });

    it('should throw if not APPROVED', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', status: 'DRAFT' });
      await expect(CommunicationsEngine.issue(orgId, 'c1')).rejects.toThrow('Only APPROVED');
    });
  });

  describe('distribute', () => {
    it('should distribute an ISSUED communication', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'c1', status: 'ISSUED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'DISTRIBUTED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'DISTRIBUTED' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      databaseMock.queryMany.mockResolvedValue([]);
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rowCount: 1 }) };
        return cb(client);
      });
      const result = await CommunicationsEngine.distribute(orgId, 'c1');
      expect(result.status).toBe('DISTRIBUTED');
    });
  });

  describe('close', () => {
    it('should close a DISTRIBUTED communication', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 'c1', status: 'DISTRIBUTED' })
        .mockResolvedValueOnce({ id: 'c1', status: 'CLOSED' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await CommunicationsEngine.close(orgId, 'c1');
      expect(result.status).toBe('CLOSED');
    });
  });

  describe('remove', () => {
    it('should soft-delete a DRAFT communication', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', status: 'DRAFT' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      const result = await CommunicationsEngine.remove(orgId, 'c1', mockAuth.userId);
      expect(result.ok).toBe(true);
    });

    it('should throw if status is not deletable', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', status: 'APPROVED' });
      await expect(
        CommunicationsEngine.remove(orgId, 'c1', mockAuth.userId)
      ).rejects.toThrow('Only DRAFT, REJECTED or VOIDED');
    });
  });

  describe('overview', () => {
    it('should return dashboard stats', async () => {
      databaseMock.queryMany
        .mockResolvedValueOnce([{ status: 'DRAFT', count: 5 }])
        .mockResolvedValueOnce([{ doc_type: 'MEMO', count: 3 }])
        .mockResolvedValueOnce([{ priority: 'HIGH', count: 2 }]);
      databaseMock.queryOne
        .mockResolvedValueOnce({ c: '1' })
        .mockResolvedValueOnce({ c: '0' });
      const result = await CommunicationsEngine.overview(orgId);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('pendingApproval');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-08: PARTNERSHIP & FUNDING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import {
  DonorEngine,
  GrantEngine,
  GrantInstallmentEngine,
  ProposalEngine,
  PartnerAgreementEngine,
  UtilizationReportEngine,
} from '../funding.engine';

describe('DonorEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated donors', async () => {
      await DonorEngine.list(orgId, {}, { donorType: 'INDIVIDUAL' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return donor with grants', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'd1', name_ar: 'Donor' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'g1' }]);
      const result = await DonorEngine.getById('d1');
      expect(result).toHaveProperty('grants');
    });

    it('should return null for non-existent donor', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await DonorEngine.getById('bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create donor with generated code', async () => {
      mockTransactionRows([{ id: 'd1', donor_code: 'TEST-CODE-001' }]);
      const result = await DonorEngine.create(
        { organizationId: orgId, nameAr: 'Donor' },
        mockAuth
      );
      expect(result.donor_code).toBe('TEST-CODE-001');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await DonorEngine.update('d1', {})).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete donor with no grants', async () => {
      databaseMock.queryOne.mockResolvedValue({ count: '0' });
      await DonorEngine.delete('d1');
      expect(databaseMock.query).toHaveBeenCalled();
    });

    it('should throw if donor has grants', async () => {
      databaseMock.queryOne.mockResolvedValue({ count: '3' });
      await expect(DonorEngine.delete('d1')).rejects.toThrow('Cannot delete donor with existing grants');
    });
  });
});

describe('GrantEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated grants', async () => {
      await GrantEngine.list(orgId, {}, { status: 'ACTIVE' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return grant with installments', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'g1', title_ar: 'Grant' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'inst-1' }]);
      const result = await GrantEngine.getById('g1');
      expect(result).toHaveProperty('installments');
    });

    it('should return null for non-existent grant', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await GrantEngine.getById('bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create grant', async () => {
      mockTransactionRows([{ id: 'g1', grant_number: 'GR-001' }]);
      const result = await GrantEngine.create(
        { organizationId: orgId, donorId: 'd1', grantNumber: 'GR-001', titleAr: 'Grant', totalAmount: 100000 },
        mockAuth
      );
      expect(result.grant_number).toBe('GR-001');
    });
  });

  describe('update', () => {
    it('should return null if no fields', async () => {
      expect(await GrantEngine.update('g1', {})).toBeNull();
    });
  });
});

describe('GrantInstallmentEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('should create installment with PENDING status', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'inst-1', status: 'PENDING' });
      const result = await GrantInstallmentEngine.create({
        grantId: 'g1', organizationId: orgId, installmentNumber: 1,
        dueDate: '2026-06-01', expectedAmount: 25000,
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('receive', () => {
    it('should receive installment', async () => {
      mockTransactionRows([{ id: 'inst-1', status: 'RECEIVED', received_amount: 25000 }]);
      const result = await GrantInstallmentEngine.receive('inst-1', {
        receivedAmount: 25000, receivedDate: '2026-06-01', receivedBy: 'u1',
      });
      expect(result.status).toBe('RECEIVED');
    });

    it('should throw if installment not found or already received', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        return cb(client);
      });
      await expect(
        GrantInstallmentEngine.receive('bad', {
          receivedAmount: 25000, receivedDate: '2026-06-01', receivedBy: 'u1',
        })
      ).rejects.toThrow('Installment not found or already received');
    });
  });

  describe('listByGrant', () => {
    it('should return installments for grant', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'inst-1' }]);
      const result = await GrantInstallmentEngine.listByGrant('g1');
      expect(result).toHaveLength(1);
    });
  });
});

describe('ProposalEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated proposals', async () => {
      await ProposalEngine.list(orgId, {}, { status: 'DRAFT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create proposal with DRAFT status', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'fp1', status: 'DRAFT' });
      const result = await ProposalEngine.create(
        { organizationId: orgId, titleAr: 'Proposal', proposedAmount: 50000 },
        mockAuth
      );
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('updateStatus', () => {
    it('should update proposal status', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'fp1', status: 'SUBMITTED' });
      const result = await ProposalEngine.updateStatus('fp1', 'SUBMITTED');
      expect(result.status).toBe('SUBMITTED');
    });
  });
});

describe('PartnerAgreementEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return agreements', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'pa1' }]);
      const result = await PartnerAgreementEngine.list(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create agreement', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'pa1', status: 'ACTIVE' });
      const result = await PartnerAgreementEngine.create(
        { organizationId: orgId, partnerId: 'd1', agreementNumber: 'PA-001', titleAr: 'Agreement', startDate: '2026-01-01', endDate: '2026-12-31' },
        mockAuth
      );
      expect(result.status).toBe('ACTIVE');
    });
  });
});

describe('UtilizationReportEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('generate', () => {
    it('should generate utilization report for grants', async () => {
      databaseMock.queryMany.mockResolvedValue([{
        id: 'g1', grant_number: 'GR-001', total_amount: 100000,
        total_received: 80000, total_spent: 60000, currency_code: 'USD',
        donor_name: 'Donor', title_ar: 'Grant',
      }]);
      const result = await UtilizationReportEngine.generate(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].utilizationPct).toBe(60);
      expect(result[0].remainingAmount).toBe(40000);
    });

    it('should handle zero total amount', async () => {
      databaseMock.queryMany.mockResolvedValue([{
        id: 'g1', grant_number: 'GR-002', total_amount: 0,
        total_received: 0, total_spent: 0, currency_code: 'USD',
        donor_name: 'Donor', title_ar: 'Grant',
      }]);
      const result = await UtilizationReportEngine.generate(orgId);
      expect(result[0].utilizationPct).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-05/09: INVENTORY & WAREHOUSE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import {
  hasInventoryPermission,
  assertInventoryPermission,
  InventoryPolicyEngine,
  ItemEngine,
  CategoryEngine,
  UomEngine,
  WarehouseEngine as InventoryWarehouseEngine,
  StockMovementEngine,
  TransferEngine,
  AdjustmentEngine,
  StocktakeEngine,
  InventoryAnalyticsEngine,
} from '../inventory.engine';

describe('hasInventoryPermission', () => {
  it('should return true for matching role/permission', () => {
    expect(hasInventoryPermission('ADMIN', 'inventory.items.manage')).toBe(true);
  });

  it('should return false for non-matching role', () => {
    expect(hasInventoryPermission('VIEWER', 'inventory.items.manage')).toBe(false);
  });

  it('should return false for undefined role', () => {
    expect(hasInventoryPermission(undefined, 'inventory.items.manage')).toBe(false);
  });
});

describe('assertInventoryPermission', () => {
  it('should throw if permission not granted', () => {
    expect(() => assertInventoryPermission({ ...mockAuth, role: 'VIEWER' }, 'inventory.items.manage'))
      .toThrow('ليست لديك صلاحية');
  });

  it('should not throw if permission granted', () => {
    expect(() => assertInventoryPermission(mockAuth, 'inventory.items.manage')).not.toThrow();
  });
});

describe('InventoryPolicyEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('get', () => {
    it('should return existing policy', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'p1', costing_method: 'WEIGHTED_AVERAGE' });
      const result = await InventoryPolicyEngine.get(orgId);
      expect(result.costing_method).toBe('WEIGHTED_AVERAGE');
    });

    it('should create default policy if none exists', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'p1', costing_method: 'WEIGHTED_AVERAGE' });
      const result = await InventoryPolicyEngine.get(orgId);
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should throw for invalid costing method', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'p1' });
      await expect(
        InventoryPolicyEngine.update(orgId, { costing_method: 'LIFO' }, mockAuth)
      ).rejects.toThrow('طريقة التقييم غير معتمدة');
    });

    it('should update allowed fields', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'p1' });
      await InventoryPolicyEngine.update(orgId, { allow_negative_stock: true }, mockAuth);
      expect(databaseMock.query).toHaveBeenCalled();
    });
  });
});

describe('ItemEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated items', async () => {
      await ItemEngine.list(orgId, {}, { status: 'ACTIVE' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return item with balances', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'i1', name_ar: 'Item' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'b1', warehouse_name_ar: 'WH' }]);
      const result = await ItemEngine.getById(orgId, 'i1');
      expect(result).toHaveProperty('balances');
    });

    it('should return null for non-existent item', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await ItemEngine.getById(orgId, 'bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create item with auto-generated code', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'i1', item_code: 'TEST-CODE-001' });
      const result = await ItemEngine.create(orgId, { name_ar: 'Item' }, mockAuth);
      expect(result.item_code).toBeDefined();
    });

    it('should throw if name_ar is missing', async () => {
      await expect(
        ItemEngine.create(orgId, {}, mockAuth)
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should throw if item not found', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      await expect(
        ItemEngine.update(orgId, 'bad', { name_ar: 'X' }, mockAuth)
      ).rejects.toThrow('الصنف غير موجود');
    });
  });
});

describe('CategoryEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return categories', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'c1', name_ar: 'Food' }]);
      const result = await CategoryEngine.list(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create category', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'c1', code: 'CAT-001' });
      const result = await CategoryEngine.create(orgId, { name_ar: 'Food' }, mockAuth);
      expect(result.code).toBe('CAT-001');
    });
  });
});

describe('UomEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return UOMs', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'u1', code: 'KG' }]);
      const result = await UomEngine.list(orgId);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create UOM', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'u1', code: 'KG' });
      const result = await UomEngine.create(orgId, { code: 'KG', name_ar: 'كيلوغرام' }, mockAuth);
      expect(result.code).toBe('KG');
    });
  });
});

describe('StockMovementEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('postMovement', () => {
    it('should throw for non-positive quantity', async () => {
      await expect(
        StockMovementEngine.postMovement(orgId, {
          movementType: 'RECEIPT', warehouseId: 'w1', itemId: 'i1', quantity: 0,
        }, mockAuth)
      ).rejects.toThrow('الكمية يجب أن تكون');
    });

    it('should throw for invalid movement type', async () => {
      await expect(
        StockMovementEngine.postMovement(orgId, {
          movementType: 'INVALID' as any, warehouseId: 'w1', itemId: 'i1', quantity: 10,
        }, mockAuth)
      ).rejects.toThrow('نوع حركة المخزون غير معتمد');
    });

    it('should post a RECEIPT movement', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ costing_method: 'WEIGHTED_AVERAGE', allow_negative_stock: false }] })
            .mockResolvedValueOnce({ rows: [{ item_id: 'i1', warehouse_id: 'w1' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'b1', quantity_on_hand: 0, unit_cost: 0, quantity_reserved: 0 }] })
            .mockResolvedValueOnce({ rowCount: 1 })
            .mockResolvedValueOnce({ rows: [{ id: 'm1', movement_number: 'TXN-001' }] }),
        };
        return cb(client);
      });
      const result = await StockMovementEngine.postMovement(orgId, {
        movementType: 'RECEIPT', warehouseId: 'w1', itemId: 'i1', quantity: 10, unitCost: 5,
      }, mockAuth);
      expect(result.movement_number).toBe('TXN-001');
    });
  });

  describe('list', () => {
    it('should return paginated movements', async () => {
      await StockMovementEngine.list(orgId, {}, { movementType: 'RECEIPT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('listBalances', () => {
    it('should return paginated balances', async () => {
      await StockMovementEngine.listBalances(orgId, {}, { warehouseId: 'w1' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });

    it('should handle belowReorder filter', async () => {
      await StockMovementEngine.listBalances(orgId, {}, { belowReorder: true });
      const sql = helpersMock.paginatedQuery.mock.calls[0][0];
      expect(sql).toContain('reorder_level');
    });
  });
});

describe('TransferEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated transfers', async () => {
      await TransferEngine.list(orgId, {}, { status: 'DRAFT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return transfer with lines', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 't1', from_warehouse_name_ar: 'WH1' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'l1', item_code: 'ITM-001' }]);
      const result = await TransferEngine.getById(orgId, 't1');
      expect(result).toHaveProperty('lines');
    });

    it('should return null for non-existent transfer', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await TransferEngine.getById(orgId, 'bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create transfer with lines', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 't1', transfer_number: 'TXN-001' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      const result = await TransferEngine.create(orgId, {
        from_warehouse_id: 'w1', to_warehouse_id: 'w2',
        lines: [{ item_id: 'i1', quantity: 10, unit_cost: 5 }],
      }, mockAuth);
      expect(result.transfer_number).toBeDefined();
    });

    it('should throw if no lines', async () => {
      await expect(
        TransferEngine.create(orgId, { from_warehouse_id: 'w1', to_warehouse_id: 'w2', lines: [] }, mockAuth)
      ).rejects.toThrow('يجب إضافة بند واحد على الأقل');
    });

    it('should throw if same warehouse', async () => {
      await expect(
        TransferEngine.create(orgId, {
          from_warehouse_id: 'w1', to_warehouse_id: 'w1',
          lines: [{ item_id: 'i1', quantity: 10, unit_cost: 5 }],
        }, mockAuth)
      ).rejects.toThrow('لا يمكن التحويل من المخزن إلى نفسه');
    });
  });
});

describe('AdjustmentEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated adjustments', async () => {
      await AdjustmentEngine.list(orgId, {}, { status: 'DRAFT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create adjustment with lines', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'a1', adjustment_number: 'ADJ-001' });
      databaseMock.query.mockResolvedValue({ rowCount: 1 });
      const result = await AdjustmentEngine.create(orgId, {
        warehouse_id: 'w1', direction: 'IN', reason_code: 'PHYSICAL_COUNT',
        lines: [{ item_id: 'i1', quantity: 5, unit_cost: 10 }],
      }, mockAuth);
      expect(result.adjustment_number).toBeDefined();
    });

    it('should throw if no lines', async () => {
      await expect(
        AdjustmentEngine.create(orgId, {
          warehouse_id: 'w1', direction: 'IN', reason_code: 'X', lines: [],
        }, mockAuth)
      ).rejects.toThrow('يجب إضافة بند واحد على الأقل');
    });

    it('should throw for invalid direction', async () => {
      await expect(
        AdjustmentEngine.create(orgId, {
          warehouse_id: 'w1', direction: 'INVALID', reason_code: 'X',
          lines: [{ item_id: 'i1', quantity: 1, unit_cost: 1 }],
        }, mockAuth)
      ).rejects.toThrow('اتجاه التسوية يجب أن يكون');
    });
  });
});

describe('StocktakeEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated stocktakes', async () => {
      await StocktakeEngine.list(orgId, {}, { warehouseId: 'w1' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create stocktake', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'st1', stocktake_number: 'STK-001' });
      databaseMock.query.mockResolvedValue({ rowCount: 0 });
      const result = await StocktakeEngine.create(orgId, { warehouse_id: 'w1' }, mockAuth);
      expect(result.stocktake_number).toBeDefined();
    });

    it('should throw if no warehouse_id', async () => {
      await expect(
        StocktakeEngine.create(orgId, {}, mockAuth)
      ).rejects.toThrow('يجب تحديد المخزن');
    });
  });

  describe('getLines', () => {
    it('should return stocktake lines', async () => {
      databaseMock.queryMany.mockResolvedValue([{ id: 'l1', item_code: 'ITM-001' }]);
      const result = await StocktakeEngine.getLines(orgId, 'st1');
      expect(result).toHaveLength(1);
    });
  });
});

describe('InventoryAnalyticsEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('dashboard', () => {
    it('should return dashboard with all sections', async () => {
      databaseMock.queryMany
        .mockResolvedValueOnce([{ total_stock_value: 50000, total_units: 200, active_skus: 20, active_warehouses: 3 }])
        .mockResolvedValueOnce([{ below_reorder: 2, near_expiry: 1, zero_stock: 3 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const result = await InventoryAnalyticsEngine.dashboard(orgId);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('pendingDocs');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEB-14: PROCUREMENT & TENDERS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { TenderEngine, AuctionEngine } from '../tender.engine';

describe('TenderEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated tenders', async () => {
      await TenderEngine.list(orgId, {}, { status: 'DRAFT' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return tender with bids and summary', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ id: 't1', title_ar: 'Tender' })
        .mockResolvedValueOnce({ total: 2, avg_amount: 5000, min_amount: 3000, best_score: 85 });
      databaseMock.queryMany.mockResolvedValue([{ id: 'b1', vendor_name_ar: 'Vendor' }]);
      const result = await TenderEngine.getById(orgId, 't1');
      expect(result).toHaveProperty('bids');
      expect(result).toHaveProperty('summary');
    });

    it('should return null for non-existent tender', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      expect(await TenderEngine.getById(orgId, 'bad')).toBeNull();
    });
  });

  describe('create', () => {
    it('should create tender in DRAFT status', async () => {
      mockTransactionRows([{ id: 't1', tender_number: 'TEST-CODE-001', status: 'DRAFT' }]);
      const result = await TenderEngine.create(
        { titleAr: 'Tender', estimatedValue: 50000, submissionDeadline: '2026-06-01' },
        mockAuth
      );
      expect(result.status).toBe('DRAFT');
    });

    it('should throw if estimated value <= 0', async () => {
      mockTransactionSuccess();
      await expect(
        TenderEngine.create({ titleAr: 'T', estimatedValue: -100 }, mockAuth)
      ).rejects.toThrow('القيمة التقديرية يجب أن تكون رقماً موجباً');
    });
  });

  describe('transitionTender', () => {
    it('should throw for invalid transition', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = { query: vi.fn().mockResolvedValue({ rows: [{ id: 't1', status: 'DRAFT', estimated_value: 100, submission_deadline: '2026-06-01' }] }) };
        return cb(client);
      });
      await expect(
        TenderEngine.transitionTender('t1', 'COMPLETED', mockAuth)
      ).rejects.toThrow('انتقال حالة غير صالح');
    });
  });

  describe('submitBid', () => {
    it('should submit bid for open tender', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 't1', status: 'PUBLISHED', submission_deadline: '2026-12-31', organization_id: orgId, currency_code: 'USD' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'v1' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 'b1', bid_amount: 5000 }] }),
        };
        return cb(client);
      });
      const result = await TenderEngine.submitBid('t1', {
        vendorId: 'v1', bidAmount: 5000,
      }, mockAuth);
      expect(result.bid_amount).toBe(5000);
    });

    it('should throw if tender not in submission phase', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn().mockResolvedValue({ rows: [{ id: 't1', status: 'DRAFT' }] }),
        };
        return cb(client);
      });
      await expect(
        TenderEngine.submitBid('t1', { vendorId: 'v1', bidAmount: 5000 }, mockAuth)
      ).rejects.toThrow('باب استلام العروض مغلق');
    });

    it('should throw for duplicate bid', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 't1', status: 'PUBLISHED', submission_deadline: '2026-12-31', organization_id: orgId }] })
            .mockResolvedValueOnce({ rows: [{ id: 'v1' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'existing-bid' }] }),
        };
        return cb(client);
      });
      await expect(
        TenderEngine.submitBid('t1', { vendorId: 'v1', bidAmount: 5000 }, mockAuth)
      ).rejects.toThrow('هذا المورد قدّم عرضاً مسبقاً');
    });

    it('should throw for zero bid amount', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn().mockResolvedValue({ rows: [{ id: 't1', status: 'PUBLISHED', submission_deadline: '2026-12-31' }] }),
        };
        return cb(client);
      });
      await expect(
        TenderEngine.submitBid('t1', { vendorId: 'v1', bidAmount: 0 }, mockAuth)
      ).rejects.toThrow('مبلغ العرض يجب أن يكون موجباً');
    });
  });

  describe('evaluateBid', () => {
    it('should throw for out-of-range technical score', async () => {
      await expect(
        TenderEngine.evaluateBid('b1', { technicalScore: 150 }, mockAuth)
      ).rejects.toThrow('الدرجة الفنية يجب أن تكون بين 0 و 100');
    });
  });

  describe('awardTender', () => {
    it('should award tender to winning bid', async () => {
      mockTransactionSuccess();
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 't1', status: 'AWARD_PENDING', organization_id: orgId }] })
            .mockResolvedValueOnce({ rows: [{ id: 'b1', vendor_id: 'v1', computed_score: 85, bid_amount: 5000, currency_code: 'USD' }] })
            .mockResolvedValue({ rowCount: 1, rows: [{ id: 'po1', po_number: 'PO-001' }] }),
        };
        return cb(client);
      });
      const result = await TenderEngine.awardTender('t1', 'b1', mockAuth);
      expect(result).toHaveProperty('tender');
      expect(result).toHaveProperty('winningBid');
      expect(result).toHaveProperty('purchaseOrder');
    });
  });
});

describe('AuctionEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated auctions', async () => {
      await AuctionEngine.list(orgId, {}, { status: 'LIVE' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return auction with bids', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'a1', tender_number: 'TND-001' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'ab1', vendor_name_ar: 'Vendor' }]);
      const result = await AuctionEngine.getById('a1');
      expect(result).toHaveProperty('bids');
    });

    it('should throw for non-existent auction', async () => {
      databaseMock.queryOne.mockResolvedValue(null);
      await expect(AuctionEngine.getById('bad')).rejects.toThrow('المزاد غير موجود');
    });
  });

  describe('create', () => {
    it('should create auction', async () => {
      mockTransactionRows([{ id: 'a1', auction_number: 'TEST-CODE-001' }]);
      const result = await AuctionEngine.create(
        { organizationId: orgId, titleAr: 'Auction', auctionType: 'FORWARD' },
        mockAuth
      );
      expect(result.auction_number).toBeDefined();
    });

    it('should throw if titleAr is missing', async () => {
      await expect(
        AuctionEngine.create({ organizationId: orgId, titleAr: '' }, mockAuth)
      ).rejects.toThrow();
    });
  });

  describe('openLive', () => {
    it('should open auction for live bidding', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'a1', status: 'SCHEDULED' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'a1', status: 'LIVE' }] }),
        };
        return cb(client);
      });
      const result = await AuctionEngine.openLive('a1', mockAuth);
      expect(result.status).toBe('LIVE');
    });
  });

  describe('close', () => {
    it('should close auction and select winning bid', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'a1', status: 'LIVE', auction_type: 'FORWARD', organization_id: orgId }] })
            .mockResolvedValueOnce({ rows: [{ id: 'ab1', bid_amount: 5000 }] })
            .mockResolvedValue({ rowCount: 1, rows: [{ id: 'a1', status: 'CLOSED' }] }),
        };
        return cb(client);
      });
      const result = await AuctionEngine.close('a1', mockAuth);
      expect(result.status).toBe('CLOSED');
    });
  });

  describe('placeBid', () => {
    it('should throw if auction is not LIVE', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn().mockResolvedValue({ rows: [{ id: 'a1', status: 'CLOSED' }] }),
        };
        return cb(client);
      });
      await expect(
        AuctionEngine.placeBid('a1', { vendorId: 'v1', bidAmount: 5000 }, mockAuth)
      ).rejects.toThrow('المزاد غير نشط حالياً');
    });

    it('should throw if vendor or amount missing', async () => {
      await expect(
        AuctionEngine.placeBid('a1', { vendorId: '', bidAmount: 0 }, mockAuth)
      ).rejects.toThrow('المورد ومبلغ العرض مطلوبان');
    });
  });

  describe('award', () => {
    it('should award auction to winning bid', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'a1', status: 'CLOSED', organization_id: orgId, tender_id: 't1' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'ab1', vendor_id: 'v1', bid_amount: 5000, currency_code: 'USD', is_winning: true }] })
            .mockResolvedValue({ rowCount: 1, rows: [{ id: 'po1', po_number: 'PO-001' }] }),
        };
        return cb(client);
      });
      const result = await AuctionEngine.award('a1', mockAuth);
      expect(result).toHaveProperty('auction');
      expect(result).toHaveProperty('winningBid');
      expect(result).toHaveProperty('purchaseOrder');
    });

    it('should throw if no winning bid', async () => {
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'a1', status: 'CLOSED', organization_id: orgId }] })
            .mockResolvedValueOnce({ rows: [] }),
        };
        return cb(client);
      });
      await expect(AuctionEngine.award('a1', mockAuth)).rejects.toThrow('لا يوجد عرض فائز');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM SELF-HEALING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { SystemSelfHealingEngine } from '../systemSelfHealing.engine';

describe('SystemSelfHealingEngine', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('auditSystemIntegrity', () => {
    it('should return OPTIMAL status when no issues', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '1000', diff: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.auditSystemIntegrity(orgId);
      expect(result.status).toBe('OPTIMAL');
      expect(result.healthScore).toBe(100);
      expect(result.integrityIssues).toHaveLength(0);
    });

    it('should detect CRITICAL ledger imbalance', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '900', diff: '100' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.auditSystemIntegrity(orgId);
      expect(result.integrityIssues).toHaveLength(1);
      expect(result.integrityIssues[0].severity).toBe('CRITICAL');
      expect(result.integrityIssues[0].code).toBe('IPSAS_LEDGER_UNBALANCED');
      expect(result.healthScore).toBe(70);
      expect(result.metrics.ledgerBalanceStatus).toBe('UNBALANCED');
    });

    it('should detect HIGH project budget overruns', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '1000', diff: '0' });
      databaseMock.queryMany
        .mockResolvedValueOnce([{ id: 'p1', name_ar: 'Project', overrun: '5000' }])
        .mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.auditSystemIntegrity(orgId);
      expect(result.integrityIssues).toHaveLength(1);
      expect(result.integrityIssues[0].severity).toBe('HIGH');
      expect(result.healthScore).toBe(85);
    });

    it('should detect INFO pending 3-way matches', async () => {
      databaseMock.queryOne
        .mockResolvedValueOnce({ total_debit: '1000', total_credit: '1000', diff: '0' })
        .mockResolvedValueOnce({ count: '3' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.auditSystemIntegrity(orgId);
      expect(result.integrityIssues).toHaveLength(1);
      expect(result.integrityIssues[0].severity).toBe('INFO');
    });

    it('should cap health score at 0', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '0', diff: '1000' });
      databaseMock.queryMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }]);
      const result = await SystemSelfHealingEngine.auditSystemIntegrity(orgId);
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
    });

    it('should return correct metadata', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '0', total_credit: '0', diff: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.auditSystemIntegrity(orgId);
      expect(result.systemName).toContain('NexoraOS');
      expect(result.domainsAudited).toBe(15);
      expect(result.metrics.activeDomainCount).toBe(15);
      expect(result.metrics.securityPolicyEnforced).toBe(true);
    });
  });

  describe('autoHealLedgerDiscrepancies', () => {
    it('should return no-heal if ledger is balanced', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '1000', diff: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.autoHealLedgerDiscrepancies(orgId, mockAuth);
      expect(result.healed).toBe(false);
      expect(result.actionTaken).toContain('No ledger discrepancies');
    });

    it('should create adjustment transaction for imbalance', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '900', diff: '100' });
      databaseMock.queryMany.mockResolvedValue([]);
      databaseMock.transaction.mockImplementation(async (cb: any) => {
        const client = {
          query: vi.fn()
            .mockResolvedValueOnce({ rows: [{ total_debit: '1000', total_credit: '900' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'adj-tx-1' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'acc-1' }] })
            .mockResolvedValue({ rowCount: 1 }),
        };
        return cb(client);
      });
      const result = await SystemSelfHealingEngine.autoHealLedgerDiscrepancies(orgId, mockAuth);
      expect(result.healed).toBe(true);
      expect(result.actionTaken).toContain('Self-Healing Adjustment');
    });

    it('should return no-heal when diff is negligible', async () => {
      databaseMock.queryOne.mockResolvedValue({ total_debit: '1000', total_credit: '1000', diff: '0' });
      databaseMock.queryMany.mockResolvedValue([]);
      const result = await SystemSelfHealingEngine.autoHealLedgerDiscrepancies(orgId, mockAuth);
      expect(result.healed).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY WAREHOUSE ENGINE (from inventory.engine.ts)
// ═══════════════════════════════════════════════════════════════════════════════

describe('InventoryWarehouseEngine (inventory)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('should return paginated warehouses', async () => {
      await InventoryWarehouseEngine.list(orgId, {}, { status: 'ACTIVE' });
      expect(helpersMock.paginatedQuery).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create warehouse', async () => {
      databaseMock.queryOne.mockResolvedValue({ id: 'w1', name_ar: 'Main WH' });
      const result = await InventoryWarehouseEngine.create(orgId, { name_ar: 'Main WH' }, mockAuth);
      expect(result.name_ar).toBe('Main WH');
    });

    it('should throw if name_ar missing', async () => {
      await expect(
        InventoryWarehouseEngine.create(orgId, {}, mockAuth)
      ).rejects.toThrow();
    });
  });
});
