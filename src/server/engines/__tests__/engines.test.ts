/**
 * NexoraOS™ — Comprehensive Engine Tests
 * Unit & Integration tests for all operational engines
 */

import { describe, it, expect, beforeAll, afterAll, jest, beforeEach } from 'vitest';

// ─── Mock Database ─────────────────────────────────────

const mockQuery = jest.fn();
const mockQueryOne = jest.fn();
const mockQueryMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../../core/database', () => ({
  query: mockQuery,
  queryOne: mockQueryOne,
  queryMany: mockQueryMany,
  transaction: mockTransaction,
}));

jest.mock('../../core/helpers', () => ({
  paginatedQuery: jest.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }),
  requireField: jest.fn((v: any) => v),
  optionalString: jest.fn((v: any) => v || null),
  optionalNumber: jest.fn((v: any) => v || null),
  generateCode: jest.fn(() => 'TEST-CODE-001'),
  generateTxNumber: jest.fn(() => 'TXN-20260819-0001'),
  auditLog: jest.fn().mockResolvedValue(undefined),
  extractTenantId: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

jest.mock('../../config/index', () => ({
  serverConfig: {
    defaultOrgId: '00000000-0000-0000-0000-000000000001',
    jwtSecret: 'test-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtExpiresIn: '8h',
    jwtRefreshExpiresIn: '7d',
    bcryptRounds: 10,
  },
}));

// ─── Auth Engine Tests ─────────────────────────────────

import { AuthEngine } from '../auth.engine';

describe('AuthEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw error for non-existent user', async () => {
      mockQueryOne.mockResolvedValue(null);

      await expect(
        AuthEngine.login('nonexistent@test.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      mockQueryOne.mockResolvedValue({ id: '1', status: 'inactive', password_hash: 'hash' });

      await expect(
        AuthEngine.login('user@test.com', 'password123')
      ).rejects.toThrow('Account is suspended or inactive');
    });

    it('should throw error for wrong password', async () => {
      mockQueryOne.mockResolvedValue({
        id: '1', email: 'user@test.com', status: 'active',
        password_hash: '$2a$10$abcdefghijklmnopqrstuu', // bcrypt hash
        name: 'Test User', name_ar: 'مستخدم', security_level: 5, default_language: 'ar'
      });

      await expect(
        AuthEngine.login('user@test.com', 'wrongpassword')
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: '1', email: 'test@test.com', role: 'ADMIN', org_id: 'org1', security_level: 5 },
        'test-secret',
        { expiresIn: '1h' }
      );

      const decoded = AuthEngine.verifyToken(token);
      expect(decoded.id).toBe('1');
      expect(decoded.email).toBe('test@test.com');
    });
  });

  describe('checkRole', () => {
    it('should return true for allowed role', () => {
      expect(AuthEngine.checkRole('ADMIN', 'ADMIN', 'MANAGER')).toBe(true);
    });

    it('should return false for disallowed role', () => {
      expect(AuthEngine.checkRole('VIEWER', 'ADMIN', 'MANAGER')).toBe(false);
    });
  });

  describe('checkSecurityLevel', () => {
    it('should return true when level meets requirement', () => {
      expect(AuthEngine.checkSecurityLevel(5, 3)).toBe(true);
    });

    it('should return false when level is below requirement', () => {
      expect(AuthEngine.checkSecurityLevel(2, 5)).toBe(false);
    });
  });
});

// ─── Finance Engine Tests ──────────────────────────────

import { LedgerEngine, ChartOfAccountsService, FiscalYearService, BudgetService, CurrencyService } from '../finance.engine';

describe('LedgerEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('postVoucher', () => {
    it('should reject unbalanced voucher', async () => {
      const mockClient = {
        query: jest.fn(),
      };

      mockTransaction.mockImplementation(async (cb: any) => {
        return cb(mockClient);
      });

      await expect(
        LedgerEngine.postVoucher({
          organizationId: 'org1',
          transactionType: 'JOURNAL_ENTRY',
          transactionNumber: 'TXN-001',
          description: 'Test',
          lines: [
            { accountId: 'acc1', debit: 100, credit: 0 },
            { accountId: 'acc2', debit: 0, credit: 50 }, //不平衡
          ],
        }, {
          userId: 'user1',
          email: 'test@test.com',
          role: 'ADMIN',
          orgId: 'org1',
          securityLevel: 5,
        })
      ).rejects.toThrow('IPSAS Validation');
    });

    it('should reject zero amount voucher', async () => {
      const mockClient = { query: jest.fn() };
      mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        LedgerEngine.postVoucher({
          organizationId: 'org1',
          transactionType: 'JOURNAL_ENTRY',
          transactionNumber: 'TXN-002',
          description: 'Test',
          lines: [
            { accountId: 'acc1', debit: 0, credit: 0 },
            { accountId: 'acc2', debit: 0, credit: 0 },
          ],
        }, {
          userId: 'user1',
          email: 'test@test.com',
          role: 'ADMIN',
          orgId: 'org1',
          securityLevel: 5,
        })
      ).rejects.toThrow('Transaction amount cannot be zero');
    });

    it('should reject voucher with less than 2 lines', async () => {
      const mockClient = { query: jest.fn() };
      mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

      await expect(
        LedgerEngine.postVoucher({
          organizationId: 'org1',
          transactionType: 'JOURNAL_ENTRY',
          transactionNumber: 'TXN-003',
          description: 'Test',
          lines: [
            { accountId: 'acc1', debit: 100, credit: 0 },
          ],
        }, {
          userId: 'user1',
          email: 'test@test.com',
          role: 'ADMIN',
          orgId: 'org1',
          securityLevel: 5,
        })
      ).rejects.toThrow('Double-entry requires at least 2 lines');
    });
  });

  describe('getTrialBalance', () => {
    it('should return balanced trial balance', async () => {
      mockQueryMany.mockResolvedValue([
        { account_id: '1', account_code: '1100', name_ar: 'نقدي', account_type: 'ASSET', total_debit: '1000', total_credit: '0', net_balance: '1000' },
        { account_id: '2', account_code: '2100', name_ar: 'capital', account_type: 'EQUITY', total_debit: '0', total_credit: '1000', net_balance: '-1000' },
      ]);

      const result = await LedgerEngine.getTrialBalance('org1');

      expect(result.summary.isBalanced).toBe(true);
      expect(result.accounts).toHaveLength(2);
    });
  });
});

describe('ChartOfAccountsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list accounts', async () => {
    mockQueryMany.mockResolvedValue([
      { id: '1', account_code: '1100', name_ar: 'نقدي' }
    ]);

    const result = await ChartOfAccountsService.list('org1');
    expect(result.data).toHaveLength(1);
  });

  it('should reject duplicate account code', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ id: 'existing' }] }),
    };
    mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

    await expect(
      ChartOfAccountsService.create('org1', {
        accountCode: '1100',
        nameAr: 'نقدي',
        accountType: 'ASSET',
      })
    ).rejects.toThrow('already exists');
  });
});

describe('CurrencyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return rate 1 for same currency', async () => {
    const result = await CurrencyService.getExchangeRate('org1', 'YER', 'YER');
    expect(result.rate).toBe(1);
  });

  it('should convert amount correctly', async () => {
    mockQueryOne.mockResolvedValue({ rate: '250' });

    const result = await CurrencyService.convert(100, 'USD', 'YER', 'org1');
    expect(result.convertedAmount).toBe(25000);
    expect(result.rate).toBe('250');
  });
});

// ─── Project Engine Tests ──────────────────────────────

import { ProjectEngine, MilestoneEngine } from '../project.engine';

describe('ProjectEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateEVM', () => {
    it('should calculate EVM metrics correctly', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ id: 'p1', budget: '100000', progress_percent: '60' }) // project
        .mockResolvedValueOnce({ total_activity_budget: '100000', total_actual_cost: '80000' }) // activities
        .mockResolvedValueOnce({ total: '5', completed: '3', milestone_completion_pct: '0.6' }); // milestones

      const evm = await ProjectEngine.calculateEVM('p1');

      expect(evm).not.toBeNull();
      expect(evm!.pv).toBe(100000);
      expect(evm!.ev).toBe(60000); // 100000 * 0.6
      expect(evm!.ac).toBe(80000);
      expect(evm!.cpi).toBe(0.75); // 60000 / 80000
      expect(evm!.spi).toBe(0.6); // 60000 / 100000
    });

    it('should return null for non-existent project', async () => {
      mockQueryOne.mockResolvedValue(null);
      const evm = await ProjectEngine.calculateEVM('nonexistent');
      expect(evm).toBeNull();
    });
  });
});

describe('MilestoneEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create milestone', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'p1', organization_id: 'org1' }] }) // project check
        .mockResolvedValueOnce({ rows: [{ id: 'm1', title_ar: 'معلم 1', project_id: 'p1' }] }), // insert
    };
    mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

    const milestone = await MilestoneEngine.create(
      { projectId: 'p1', titleAr: 'معلم 1' },
      { userId: 'user1', email: 'test@test.com', role: 'ADMIN', orgId: 'org1', securityLevel: 5 }
    );

    expect(milestone.title_ar).toBe('معلم 1');
  });
});

// ─── Procurement Engine Tests ──────────────────────────

import { RFQEngine, ThreeWayMatchEngine, VendorPerformanceEngine } from '../procurement.engine';

describe('RFQEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create RFQ', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{
          id: 'rfq1', tender_number: 'RFQ-001', title_ar: 'شراء أجهزة',
          status: 'DRAFT', organization_id: 'org1'
        }]
      }),
    };
    mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

    const rfq = await RFQEngine.create(
      { organizationId: 'org1', titleAr: 'شراء أجهزة' },
      { userId: 'user1', email: 'test@test.com', role: 'ADMIN', orgId: 'org1', securityLevel: 5 }
    );

    expect(rfq.title_ar).toBe('شراء أجهزة');
    expect(rfq.status).toBe('DRAFT');
  });
});

describe('ThreeWayMatchEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform 3-way match', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'po1', total_amount: '1000', organization_id: 'org1', po_number: 'PO-001' }] }) // PO
        .mockResolvedValue({ rows: [{ total_received: '1000' }] }) // receipts
        .mockResolvedValue({ rows: [{ id: 'match1' }] }), // insert match
    };
    mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

    const result = await ThreeWayMatchEngine.performMatch(
      'po1',
      {
        invoiceNumber: 'INV-001',
        invoiceAmount: 1000,
        invoiceDate: '2026-08-19',
      },
      { userId: 'user1', email: 'test@test.com', role: 'ADMIN', orgId: 'org1', securityLevel: 5 }
    );

    expect(result.match.fullyMatched).toBe(true);
    expect(result.status).toBe('MATCHED');
  });
});

// ─── Service Delivery Engine Tests ─────────────────────

import { BeneficiaryEngine, ServiceDeliveryEngine, AidDistributionEngine } from '../serviceDelivery.engine';

describe('BeneficiaryEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDuplicates', () => {
    it('should detect duplicates by national ID', async () => {
      mockQueryMany
        .mockResolvedValueOnce([{ id: 'b1', beneficiary_code: 'BEN-00001', full_name_ar: 'أحمد' }])
        .mockResolvedValue([]);

      const result = await BeneficiaryEngine.checkDuplicates('org1', '1234567890');

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates[0].matchType).toBe('NATIONAL_ID');
    });

    it('should return no duplicates when none found', async () => {
      mockQueryMany.mockResolvedValue([]);

      const result = await BeneficiaryEngine.checkDuplicates('org1', '9999999999');

      expect(result.hasDuplicates).toBe(false);
    });
  });
});

describe('ServiceDeliveryEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create service delivery', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{
          id: 'sd1', service_type: 'EDUCATION', service_number: 'SVC-001',
          beneficiaries_reached: 50, status: 'COMPLETED'
        }]
      }),
    };
    mockTransaction.mockImplementation(async (cb: any) => cb(mockClient));

    const delivery = await ServiceDeliveryEngine.create(
      {
        organizationId: 'org1',
        serviceType: 'EDUCATION',
        beneficiaryCount: 50,
        deliveryDate: '2026-08-19',
      },
      { userId: 'user1', email: 'test@test.com', role: 'ADMIN', orgId: 'org1', securityLevel: 5 }
    );

    expect(delivery.service_type).toBe('EDUCATION');
    expect(delivery.beneficiaries_reached).toBe(50);
  });
});

// ─── Reporting Engine Tests ────────────────────────────

import { KPIEngine, ViewEngine, ReportExportEngine } from '../reporting.engine';

describe('KPIEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get consolidated KPIs', async () => {
    mockQueryOne
      .mockResolvedValueOnce({ total: '10', active: '5', completed: '3', avg_progress: '65', total_budget: '500000' }) // projects
      .mockResolvedValueOnce({ total: '200', active: '180', family_members_reached: '800', high_vulnerability: '30' }) // beneficiaries
      .mockResolvedValueOnce({ total_receipts: '100000', total_payments: '80000', total_transactions: '180000', total_budget: '200000', total_spent: '80000' }) // finance
      .mockResolvedValueOnce({ total_rfqs: '5', open_rfqs: '2', awarded_rfqs: '3', total_pos: '4', total_po_value: '150000' }) // procurement
      .mockResolvedValueOnce({ total_staff: '25', active_staff: '23', departments: '6' }); // hr

    const kpis = await KPIEngine.getConsolidatedKPIs('org1');

    expect(kpis.projects.total).toBe(10);
    expect(kpis.beneficiaries.total).toBe(200);
    expect(kpis.finance.budgetUtilization).toBe(40); // 80000/200000 * 100
    expect(kpis.procurement.totalRFQs).toBe(5);
    expect(kpis.hr.totalStaff).toBe(25);
  });
});

describe('ViewEngine', () => {
  it('should reject non-whitelisted views', async () => {
    await expect(
      ViewEngine.executeView('users', 'org1')
    ).rejects.toThrow('not whitelisted');
  });

  it('should execute whitelisted view', async () => {
    mockQueryMany.mockResolvedValue([{ id: 1, name: 'test' }]);

    const result = await ViewEngine.executeView('v_beneficiary_summary', 'org1');

    expect(result.view).toBe('v_beneficiary_summary');
    expect(result.data).toHaveLength(1);
  });
});

describe('ReportExportEngine', () => {
  it('should throw for unknown report type', async () => {
    await expect(
      ReportExportEngine.generateReport('org1', 'unknown_report')
    ).rejects.toThrow('Unknown report type');
  });

  it('should generate beneficiary report', async () => {
    mockQueryOne.mockResolvedValue({
      total: '100', male: '45', female: '55', family_members: '400',
      high_vuln: '20', med_vuln: '30', low_vuln: '50'
    });
    mockQueryMany.mockResolvedValue([]);

    const report = await ReportExportEngine.generateReport('org1', 'beneficiary_summary');

    expect(report.title).toContain('المستفيدين');
    expect(report.summary.total).toBe('100');
  });
});

// ─── Helper Function Tests ─────────────────────────────

describe('Core Helpers', () => {
  const { parsePagination, buildOrderBy } = require('../../core/helpers');

  describe('parsePagination', () => {
    it('should return defaults for empty params', () => {
      const result = parsePagination({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should calculate correct offset', () => {
      const result = parsePagination({ page: 3, limit: 20 });
      expect(result.offset).toBe(40);
    });

    it('should cap limit at 500', () => {
      const result = parsePagination({ limit: 1000 });
      expect(result.limit).toBe(500);
    });
  });

  describe('buildOrderBy', () => {
    it('should return default order when no sortBy', () => {
      expect(buildOrderBy()).toBe('created_at DESC');
    });

    it('should use specified sort', () => {
      expect(buildOrderBy('name', 'asc')).toBe('name ASC');
    });

    it('should sanitize invalid sortBy', () => {
      expect(buildOrderBy('name; DROP TABLE', 'asc')).toBe('created_at ASC');
    });
  });
});
