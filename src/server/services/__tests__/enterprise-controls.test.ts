import { describe, it, expect, vi, beforeEach } from 'vitest';

const coreMock = vi.hoisted(() => ({
  getPool: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  getPool: coreMock.getPool,
  transaction: coreMock.transaction,
}));

import {
  formatDocumentNumber,
  allocateDocumentNumber,
  resolvePostingRule,
  validateDimensionValues,
  checkSoDConflict,
  ensureControlDefaults,
} from '../enterprise-controls.service';

function fakePool(impl: (text: string, params?: unknown[]) => { rows: Record<string, unknown>[] }) {
  return { query: vi.fn(async (text: string, params?: unknown[]) => impl(text, params)) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('formatDocumentNumber', () => {
  it('pads with prefix', () => {
    expect(formatDocumentNumber('JV-', 42, 6)).toBe('JV-000042');
  });
  it('clamps invalid numbers', () => {
    expect(formatDocumentNumber('PV-', 0, 4)).toBe('PV-0001');
    expect(formatDocumentNumber('PV-', -5, 4)).toBe('PV-0001');
  });
});

describe('allocateDocumentNumber', () => {
  it('locks, formats and increments inside one transaction', async () => {
    const queries: string[] = [];
    const client = {
      query: vi.fn(async (text: string) => {
        queries.push(text);
        if (text.includes('FOR UPDATE')) {
          return { rows: [{ prefix: 'JV-', next_number: 7, increment_by: 1, min_digits: 6 }] };
        }
        return { rows: [] };
      }),
    };
    coreMock.transaction.mockImplementation(async (cb: (c: unknown) => Promise<string>) => cb(client));
    const res = await allocateDocumentNumber('org-1', 'JV');
    expect(res).toBe('JV-000007');
    expect(queries.some((q) => q.includes('FOR UPDATE'))).toBe(true);
    expect(queries.some((q) => q.startsWith('UPDATE document_number_series'))).toBe(true);
  });
  it('throws when series is missing', async () => {
    const client = { query: vi.fn(async () => ({ rows: [] })) };
    coreMock.transaction.mockImplementation(async (cb: (c: unknown) => Promise<string>) => cb(client));
    await expect(allocateDocumentNumber('org-1', 'NOPE')).rejects.toThrow('Number series not found');
  });
});

describe('resolvePostingRule', () => {
  it('returns highest-priority rule or null', async () => {
    const pool = fakePool(() => ({ rows: [{ id: 'r1', debit_account_id: 'a', credit_account_id: 'b' }] }));
    coreMock.getPool.mockReturnValue(pool);
    const rule = await resolvePostingRule('org-1', 'donations', 'CASH_RECEIPT');
    expect(rule?.id).toBe('r1');
    const empty = fakePool(() => ({ rows: [] }));
    coreMock.getPool.mockReturnValue(empty);
    expect(await resolvePostingRule('org-1', 'donations', 'UNKNOWN')).toBeNull();
  });
});

describe('validateDimensionValues', () => {
  it('collects missing pairs', async () => {
    const pool = fakePool((_t, p) => ({ rows: (p?.[1] === 'COST_CENTER' ? [{ id: 'v1' }] : []) }));
    coreMock.getPool.mockReturnValue(pool);
    const res = await validateDimensionValues('org-1', [
      { dimensionCode: 'COST_CENTER', valueCode: 'CC-01' },
      { dimensionCode: 'PROJECT', valueCode: 'P-X' },
    ]);
    expect(res.valid).toBe(false);
    expect(res.missing).toEqual(['PROJECT:P-X']);
  });
});

describe('checkSoDConflict', () => {
  it('maps conflict rows and nulls', async () => {
    const pool = fakePool(() => ({
      rows: [{ role_a: 'AP_CLERK', role_b: 'PAYMENT_APPROVER', severity: 'CRITICAL', description_ar: 'x', is_blocking: true }],
    }));
    coreMock.getPool.mockReturnValue(pool);
    const hit = await checkSoDConflict('AP_CLERK', 'PAYMENT_APPROVER');
    expect(hit?.severity).toBe('CRITICAL');
    expect(hit?.isBlocking).toBe(true);
    coreMock.getPool.mockReturnValue(fakePool(() => ({ rows: [] })));
    expect(await checkSoDConflict('A', 'B')).toBeNull();
  });
});

describe('ensureControlDefaults', () => {
  it('inserts standard dimensions and SoD pairs idempotently', async () => {
    const seen: string[] = [];
    const pool = fakePool((t) => {
      seen.push(t);
      return { rows: [] };
    });
    coreMock.getPool.mockReturnValue(pool);
    await ensureControlDefaults('org-1');
    expect(seen.filter((q) => q.includes('INSERT INTO dimensions')).length).toBe(4);
    expect(seen.filter((q) => q.includes('INSERT INTO sod_conflict_matrix')).length).toBe(4);
    expect(seen.every((q) => q.includes('ON CONFLICT'))).toBe(true);
  });
});
