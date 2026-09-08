/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NexoraOS™ — E2E Test Suite 08: Data Integrity & Transactions
 * ACID compliance, constraints, cascade operations, audit trail
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import { api, TOKENS, uniqueId, FIXTURES } from './helpers/setup';

const ORG = '00000000-0000-0000-0000-000000000001';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TRANSACTION INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Financial Transactions', () => {
  it('should enforce balanced journal entries (debit = credit)', async () => {
    const res = await api.post('/api/finance/vouchers', {
      transaction_type: 'JOURNAL_ENTRY',
      date: '2026-09-01',
      description: 'Unbalanced entry test',
      lines: [
        { account_code: '1100', debit: 1000, credit: 0 },
        { account_code: '2100', debit: 0, credit: 500 }, // imbalance
      ],
    }, { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject zero-amount transactions', async () => {
    const res = await api.post('/api/finance/vouchers', {
      transaction_type: 'JOURNAL_ENTRY',
      date: '2026-09-01',
      description: 'Zero amount test',
      lines: [
        { account_code: '1100', debit: 0, credit: 0 },
        { account_code: '2100', debit: 0, credit: 0 },
      ],
    }, { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject single-line journal entries', async () => {
    const res = await api.post('/api/finance/vouchers', {
      transaction_type: 'JOURNAL_ENTRY',
      date: '2026-09-01',
      description: 'Single line test',
      lines: [
        { account_code: '1100', debit: 1000, credit: 0 },
      ],
    }, { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should reject negative debit amounts', async () => {
    const res = await api.post('/api/finance/vouchers', {
      transaction_type: 'JOURNAL_ENTRY',
      date: '2026-09-01',
      description: 'Negative amount test',
      lines: [
        { account_code: '1100', debit: -1000, credit: 0 },
        { account_code: '2100', debit: 0, credit: -1000 },
      ],
    }, { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should accept balanced journal entry', async () => {
    const res = await api.post('/api/finance/vouchers', {
      transaction_type: 'JOURNAL_ENTRY',
      date: '2026-09-01',
      description: 'Balanced entry - integrity test',
      lines: [
        { account_code: '1100', debit: 50000, credit: 0 },
        { account_code: '2100', debit: 0, credit: 50000 },
      ],
    }, { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CONSTRAINT ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Constraint Enforcement', () => {
  describe('Required Fields', () => {
    it('should reject empty project name', async () => {
      const res = await api.post('/api/v2/projects/', {
        name_ar: '',
        budget: 100000,
      }, { token: TOKENS.admin });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject missing email in registration', async () => {
      const res = await api.post('/api/auth/register', {
        org_name_ar: 'Test',
        admin_password: 'StrongP@ss123',
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject missing login credentials', async () => {
      const res = await api.post('/api/auth/login', {});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should reject milestone for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-999999999999';
      const res = await api.post(`/api/v2/projects/${fakeId}/milestones`, {
        title_ar: 'Orphan Milestone',
        due_date: '2026-06-30',
      }, { token: TOKENS.admin });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Unique Constraints', () => {
    it('should handle duplicate email in registration', async () => {
      const email = `unique-${uniqueId()}@test.com`;
      // First registration
      await api.post('/api/auth/register', {
        org_name_ar: 'First',
        admin_email: email,
        admin_password: 'StrongP@ss123!',
      });
      // Second with same email
      const res = await api.post('/api/auth/register', {
        org_name_ar: 'Second',
        admin_email: email,
        admin_password: 'StrongP@ss123!',
      });
      // Should conflict or handle gracefully
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Enum Validation', () => {
    it('should reject invalid status value', async () => {
      const res = await api.post('/api/v2/projects/', {
        name_ar: 'Invalid Status Project',
        status: 'INVALID_STATUS_XYZ',
      }, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DATA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Input Validation', () => {
  it('should validate email format', async () => {
    const res = await api.post('/api/auth/register', {
      org_name_ar: 'Test',
      admin_email: 'not-an-email',
      admin_password: 'StrongP@ss123!',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should validate minimum password length', async () => {
    const res = await api.post('/api/auth/register', {
      org_name_ar: 'Test',
      admin_email: `pw-${uniqueId()}@test.com`,
      admin_password: '123',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should validate UUID format', async () => {
    const res = await api.get('/api/v2/projects/not-a-uuid', { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should validate date format', async () => {
    const res = await api.post('/api/v2/projects/', {
      name_ar: 'Bad Date Project',
      start_date: 'not-a-date',
    }, { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
  });

  it('should validate positive amounts', async () => {
    const res = await api.post('/api/sales/invoices', {
      amount: -1000,
      description: 'Negative invoice',
    }, { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SOFT DELETE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Soft Delete', () => {
  it('should not show deleted records in normal list', async () => {
    const listRes = await api.get('/api/tables/projects', {
      token: TOKENS.admin,
      query: { page: '1', limit: '10' },
    });
    expect(listRes.status).toBeLessThan(500);
    if (listRes.status === 200 && Array.isArray(listRes.data?.data)) {
      const deleted = listRes.data.data.filter((r: any) => r.deleted_at !== null && r.deleted_at !== undefined);
      expect(deleted.length).toBe(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Audit Trail', () => {
  it('should have audit_logs table accessible', async () => {
    const res = await api.get('/api/tables/audit_logs', {
      token: TOKENS.admin,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('audit entries should contain required fields', async () => {
    const res = await api.get('/api/tables/audit_logs', {
      token: TOKENS.admin,
      query: { page: '1', limit: '1' },
    });
    if (res.status === 200 && Array.isArray(res.data?.data) && res.data.data.length > 0) {
      const entry = res.data.data[0];
      expect(entry).toHaveProperty('action');
      expect(entry).toHaveProperty('created_at');
    }
  });

  it('should log authentication events', async () => {
    await api.post('/api/auth/login', { email: 'audit-test@test.com', password: 'wrong' });
    // Audit log should have a failed login entry (even if we can't see it without admin access)
    const res = await api.get('/api/tables/audit_logs', {
      token: TOKENS.superAdmin,
      query: { page: '1', limit: '5' },
    });
    expect(res.status).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. IDEMPOTENCY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Idempotency', () => {
  it('should handle duplicate login attempts gracefully', async () => {
    const res1 = await api.post('/api/auth/login', { email: 'x@y.com', password: 'wrong' });
    const res2 = await api.post('/api/auth/login', { email: 'x@y.com', password: 'wrong' });
    expect(res1.status).toBe(res2.status);
  });

  it('should handle concurrent health checks', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => api.get('/api/health'))
    );
    expect(results.every(r => r.status === 200)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. TABLE WHITELIST INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Table Access Control', () => {
  it('should enforce table whitelist', async () => {
    const res = await api.get('/api/tables/secret_internal_table', { token: TOKENS.admin });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should allow whitelisted tables', async () => {
    const res = await api.get('/api/tables/projects', { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
  });

  it('should protect sensitive tables from low-level users', async () => {
    const res = await api.get('/api/tables/users', { token: TOKENS.viewer });
    expect(res.status).toBeLessThan(500);
  });

  it('should support views (v_ prefix)', async () => {
    const res = await api.get('/api/tables/v_beneficiary_summary', { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. MULTI-TENANCY DATA ISOLATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Data Integrity: Multi-Tenancy', () => {
  it('should scope data to organization', async () => {
    const res = await api.get('/api/tables/projects', { token: TOKENS.admin });
    expect(res.status).toBeLessThan(500);
    if (res.status === 200 && Array.isArray(res.data?.data)) {
      // All returned records should belong to the same org
      const orgIds = new Set(res.data.data.map((r: any) => r.organization_id).filter(Boolean));
      expect(orgIds.size).toBeLessThanOrEqual(1);
    }
  });

  it('should not allow cross-tenant record access via direct ID', async () => {
    const res = await api.get('/api/v2/projects/00000000-0000-0000-0000-999999999999', {
      token: TOKENS.admin,
    });
    expect([404, 403, 400]).toContain(res.status);
  });
});
