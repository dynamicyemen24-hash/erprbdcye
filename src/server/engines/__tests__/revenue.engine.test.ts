/**
 * NexoraOS™ — NEB-15 Unified Revenue Engine Tests
 * Unit tests for revenue streams, records lifecycle, posting, collections & intelligence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedQuery } from '../../core/performance';

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
}));

const helpersMock = vi.hoisted(() => ({
  paginatedQuery: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }),
  requireField: vi.fn((v: any) => { if (v === undefined || v === null || v === '') throw new Error('required'); return v; }),
  optionalString: vi.fn((v: any) => v || null),
  generateCode: vi.fn(() => 'TEST-CODE-001'),
  generateTxNumber: vi.fn(() => 'TXN-20260829-0001'),
  auditLog: vi.fn().mockResolvedValue(undefined),
  extractTenantId: vi.fn(() => '00000000-0000-0000-0000-000000000001'),
  parsePagination: vi.fn(() => ({ offset: 0, limit: 50, page: 1 })),
  buildOrderBy: vi.fn(() => 'created_at DESC'),
}));

vi.mock('../../core/helpers', () => ({
  paginatedQuery: helpersMock.paginatedQuery,
  requireField: helpersMock.requireField,
  optionalString: helpersMock.optionalString,
  generateCode: helpersMock.generateCode,
  generateTxNumber: helpersMock.generateTxNumber,
  auditLog: helpersMock.auditLog,
  extractTenantId: helpersMock.extractTenantId,
  parsePagination: helpersMock.parsePagination,
  buildOrderBy: helpersMock.buildOrderBy,
}));

import { RevenueStreamEngine, RevenueEngine, RevenueIntelligenceEngine } from '../revenue.engine';

const ORG = '00000000-0000-0000-0000-000000000001';
const auth = { userId: 'user-1', email: 'admin@test.com', role: 'ADMIN', orgId: ORG, securityLevel: 5 };

/** Simulate a transaction mock that runs the callback against a fake client. */
function mockTransaction(client: { query: ReturnType<typeof vi.fn> }) {
  databaseMock.transaction.mockImplementation(async (cb: (c: any) => Promise<any>) => cb(client));
}

beforeEach(() => {
  vi.clearAllMocks();
  // Flush the 90s read-through snapshot cache so tests don't reuse each other's
  // results (isolated, deterministic). This is test hygiene, not a masking.
  CachedQuery.invalidateTags(['revenue', `org:${ORG}`]);
  databaseMock.query.mockResolvedValue({ rows: [], rowCount: 0 });
  databaseMock.queryOne.mockResolvedValue(null);
  databaseMock.queryMany.mockResolvedValue([]);
  databaseMock.transaction.mockReset();
});

// ─── Revenue Stream Registry ───────────────────────────

describe('RevenueStreamEngine', () => {
  it('should create a stream with defaults', async () => {
    databaseMock.queryOne.mockResolvedValue({ id: 'stream-1', stream_code: 'DONATION_GENERAL' });
    const row = await RevenueStreamEngine.create(ORG, { streamCode: 'donation_general', nameAr: 'تبرعات عامة' }, auth);
    expect(row.stream_code).toBe('DONATION_GENERAL');
    const sql = databaseMock.queryOne.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO revenue_streams');
    expect(sql).toContain('ON CONFLICT');
  });

  it('should reject invalid recognition method', async () => {
    await expect(
      RevenueStreamEngine.create(ORG, { streamCode: 'X', nameAr: 'X', recognitionMethod: 'MAGIC' }, auth)
    ).rejects.toThrow('Invalid recognitionMethod');
  });

  it('should reject invalid exchange type', async () => {
    await expect(
      RevenueStreamEngine.create(ORG, { streamCode: 'X', nameAr: 'X', exchangeType: 'BARTER' }, auth)
    ).rejects.toThrow('Invalid exchangeType');
  });

  it('should throw when streamCode missing', async () => {
    await expect(
      RevenueStreamEngine.create(ORG, { streamCode: '', nameAr: 'X' }, auth)
    ).rejects.toThrow();
  });
});

// ─── Revenue Records Lifecycle ─────────────────────────

describe('RevenueEngine.create', () => {
  it('should create a DRAFT record with generated revenue number', async () => {
    databaseMock.queryOne.mockResolvedValue({
      id: 'stream-1', stream_code: 'DONATION_GENERAL', default_currency: 'YER',
      recognition_method: 'CASH_BASIS', exchange_type: 'NON_EXCHANGE',
    });
    const client = { query: vi.fn()
      .mockResolvedValueOnce({ rows: [{ seq: '42' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'rec-1', revenue_number: 'REV-2026-00042', status: 'DRAFT' }] }) };
    mockTransaction(client);

    const rec = await RevenueEngine.create(ORG, { streamCode: 'DONATION_GENERAL', amount: 150000 }, auth);
    expect(rec.revenue_number).toBe('REV-2026-00042');
    expect(rec.status).toBe('DRAFT');
    expect(client.query.mock.calls[1][0]).toContain('INSERT INTO revenue_records');
  });

  it('should reject non-positive amounts', async () => {
    await expect(RevenueEngine.create(ORG, { amount: -5 }, auth)).rejects.toThrow('positive');
    await expect(RevenueEngine.create(ORG, { amount: 0 }, auth)).rejects.toThrow('positive');
    await expect(RevenueEngine.create(ORG, { amount: Number('abc') }, auth)).rejects.toThrow('positive');
  });

  it('should reject unknown stream code', async () => {
    databaseMock.queryOne.mockResolvedValue(null);
    await expect(
      RevenueEngine.create(ORG, { streamCode: 'UNKNOWN_STREAM', amount: 100 }, auth)
    ).rejects.toThrow('not found or inactive');
  });

  it('should reject invalid exchange rate', async () => {
    await expect(RevenueEngine.create(ORG, { amount: 100, exchangeRate: -2 }, auth)).rejects.toThrow('positive');
  });
});

describe('RevenueEngine lifecycle guards', () => {
  it('approve should reject unknown records', async () => {
    databaseMock.queryOne.mockResolvedValue(null);
    await expect(RevenueEngine.approve(ORG, 'rec-1', auth)).rejects.toThrow('not found');
  });

  it('void should block records with collections', async () => {
    databaseMock.queryOne.mockResolvedValue({
      id: 'rec-1', status: 'POSTED', collected_amount: '50', amount: '100',
      collected_amount_base: '50', earned_amount_base: '0', amount_base: '100',
      stream_id: null, revenue_type: 'DONATION_GENERAL', currency_code: 'YER',
      exchange_rate: 1, ledger_transaction_id: 'tx-9',
    });
    await expect(RevenueEngine.void(ORG, 'rec-1', auth)).rejects.toThrow('Cannot void');
  });
});

// ─── Revenue Intelligence ──────────────────────────────

describe('RevenueIntelligenceEngine.forecast', () => {
  it('should return empty forecast with insufficient data', () => {
    const f = RevenueIntelligenceEngine.forecast([{ month: '2026-01', value: 100 }, { month: '2026-02', value: 120 }]);
    expect(f.next).toHaveLength(0);
    expect(f.confidence).toBe('LOW');
  });

  it('should compute linear forecast with HIGH confidence on linear data', () => {
    const history = [100, 200, 300, 400, 500].map((v, i) => ({ month: `2026-0${i + 1}`, value: v }));
    const f = RevenueIntelligenceEngine.forecast(history, 2);
    expect(f.next).toHaveLength(2);
    expect(f.confidence).toBe('HIGH');
    expect(f.next[0].predicted).toBeCloseTo(600, -1);
  });

  it('should never predict negative revenue', () => {
    const history = [5000, 3000, 1000, 100].map((v, i) => ({ month: `2026-0${i + 1}`, value: v }));
    const f = RevenueIntelligenceEngine.forecast(history, 3);
    for (const p of f.next) expect(p.predicted).toBeGreaterThanOrEqual(0);
  });
});

describe('RevenueIntelligenceEngine.getSnapshot', () => {
  it('should return zero-safe KPIs when no data exists', async () => {
    databaseMock.queryOne.mockResolvedValue({
      record_count: '0', total_recognized: '0', total_collected: '0', total_earned: '0', total_outstanding: '0',
    });
    const snap = await RevenueIntelligenceEngine.getSnapshot(ORG);
    expect(snap.kpis.totalRecognized).toBe(0);
    expect(snap.kpis.collectionRatePct).toBe(0);
    expect(snap.insights.length).toBeGreaterThan(0);
    expect(snap.insights[0]).toContain('لا توجد بيانات');
  });

  it('should flag high concentration risk', async () => {
    databaseMock.queryOne.mockResolvedValue({
      record_count: '4', total_recognized: '1000', total_collected: '900', total_earned: '0', total_outstanding: '100',
    });
    databaseMock.queryMany.mockImplementation(async (sql: string) => {
      if (sql.includes('GROUP BY counterparty_name')) {
        return [{ counterparty_name: 'Big Donor', record_count: '3', total_amount: '900' }];
      }
      return [];
    });
    const snap = await RevenueIntelligenceEngine.getSnapshot(ORG);
    expect(snap.kpis.concentrationTop10Pct).toBe(90);
    expect(snap.insights.some((i: string) => i.includes('تركّز'))).toBe(true);
    expect(snap.kpis.collectionRatePct).toBe(90);
  });
});

// ─── IPSAS Posting & Collections (double-entry automation) ─

describe('RevenueEngine.post', () => {
  const recordRow = {
    id: 'rec-1', status: 'APPROVED', revenue_number: 'REV-2026-00042',
    revenue_type: 'DONATION_GENERAL', stream_name_ar: 'تبرعات عامة',
    recognition_method: 'CASH_BASIS', exchange_type: 'NON_EXCHANGE',
    is_restricted: false, currency_code: 'YER', exchange_rate: 1,
    amount: '1000', amount_base: '1000', collected_amount: '0',
    collected_amount_base: '0', earned_amount_base: '0',
    stream_id: null, project_id: 'proj-1', activity_id: 'act-1', program_id: null,
    ledger_transaction_id: null, revenue_date: '2026-08-29',
  };

  it('should reject records already posted', async () => {
    databaseMock.queryOne.mockResolvedValue({ ...recordRow, ledger_transaction_id: 'tx-existing' });
    await expect(RevenueEngine.post(ORG, 'rec-1', auth)).rejects.toThrow('already posted');
  });

  it('should create balanced double-entry transaction atomically', async () => {
    databaseMock.queryOne.mockResolvedValueOnce({ ...recordRow, status: 'APPROVED', ledger_transaction_id: null });
    // resolveAccounts runs OUTSIDE the transaction → hits the global query() mock
    databaseMock.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM chart_of_accounts WHERE id')) return { rows: [{ id: 'acc-cash', account_code: '1101' }] };
      if (sql.includes('FROM chart_of_accounts')) return { rows: [{ id: 'acc-cash', account_code: '1101' }] };
      return { rows: [], rowCount: 0 };
    });
    const client = { query: vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO transactions')) return { rows: [{ id: 'tx-1' }] };
      if (sql.includes('INSERT INTO transaction_lines')) return { rows: [{ id: 'line' }] };
      if (sql.includes('UPDATE revenue_records')) return { rows: [{ id: 'rec-1', ledger_transaction_id: 'tx-1', status: 'POSTED' }] };
      return { rows: [], rowCount: 0 };
    }) };
    mockTransaction(client);

    const posted = await RevenueEngine.post(ORG, 'rec-1', auth);
    expect(posted.status).toBe('POSTED');
    expect(posted.ledger_transaction_id).toBe('tx-1');
    // Header + 2 lines + update = balance preserved by the engine
    const inserts = client.query.mock.calls.filter(([sql]: string[]) => sql.includes('INSERT INTO transaction_lines'));
    expect(inserts).toHaveLength(2);
    const updateSql = client.query.mock.calls.find(([sql]: string[]) => sql.includes('UPDATE revenue_records'))[0];
    expect(updateSql).toContain("status = 'POSTED'");
  });
});
describe('RevenueEngine.collect', () => {
  it('should reject collections exceeding outstanding balance', async () => {
    databaseMock.queryOne.mockResolvedValue({
      id: 'rec-1', status: 'POSTED', revenue_number: 'REV-2026-00042',
      revenue_type: 'DONATION_GENERAL', stream_name_ar: 'تبرعات عامة',
      recognition_method: 'CASH_BASIS', exchange_type: 'NON_EXCHANGE',
      is_restricted: false, currency_code: 'YER', exchange_rate: 1,
      amount: '1000', amount_base: '1000', collected_amount: '900',
      collected_amount_base: '900', earned_amount_base: '0',
      stream_id: null, project_id: 'proj-1', activity_id: null, program_id: null,
      ledger_transaction_id: 'tx-1', revenue_date: '2026-08-29',
    });
    await expect(RevenueEngine.collect(ORG, 'rec-1', { amount: 200 }, auth)).rejects.toThrow('exceeds outstanding');
  });

  it('should mark a record COLLECTED after full settlement', async () => {
    databaseMock.queryOne.mockResolvedValue({
      id: 'rec-1', status: 'POSTED', revenue_number: 'REV-2026-00042',
      revenue_type: 'DONATION_GENERAL', stream_name_ar: 'تبرعات عامة',
      recognition_method: 'CASH_BASIS', exchange_type: 'NON_EXCHANGE',
      is_restricted: false, currency_code: 'YER', exchange_rate: 1,
      amount: '1000', amount_base: '1000', collected_amount: '0',
      collected_amount_base: '0', earned_amount_base: '0',
      stream_id: null, project_id: 'proj-1', activity_id: 'act-2', program_id: null,
      ledger_transaction_id: null, revenue_date: '2026-08-29',
    });
    // resolveAccounts runs OUTSIDE the transaction → hits the global query() mock
    databaseMock.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM chart_of_accounts WHERE id')) return { rows: [{ id: 'acc-cash', account_code: '1101' }] };
      if (sql.includes('FROM chart_of_accounts')) return { rows: [{ id: 'acc-cash', account_code: '1101' }] };
      return { rows: [], rowCount: 0 };
    });
    const client = { query: vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO revenue_collections')) return { rows: [{ id: 'col-1' }] };
      if (sql.includes('INSERT INTO transactions')) return { rows: [{ id: 'tx-2' }] };
      if (sql.includes('INSERT INTO transaction_lines')) return { rows: [{ id: 'line' }] };
      if (sql.includes('UPDATE revenue_collections')) return { rows: [{ id: 'col-1', ledger_transaction_id: 'tx-2' }] };
      if (sql.includes('UPDATE revenue_records')) return { rows: [{ id: 'rec-1', status: 'COLLECTED', collected_amount: '1000' }] };
      return { rows: [], rowCount: 0 };
    }) };
    mockTransaction(client);

    const res = await RevenueEngine.collect(ORG, 'rec-1', { amount: 1000, paymentMethod: 'BANK_TRANSFER' }, auth);
    expect(res.record.status).toBe('COLLECTED');
    expect(res.collection.id).toBe('col-1');
    // Both recognition (Dr Cash | Cr Revenue) legs are posted as lines
    const lineInserts = client.query.mock.calls.filter(([sql]: string[]) => sql.includes('INSERT INTO transaction_lines'));
    expect(lineInserts).toHaveLength(2);
  });
});
