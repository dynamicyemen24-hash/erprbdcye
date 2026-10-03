import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => ({
  getPool: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  getPool: dbMock.getPool,
}));

import {
  getAccountLedger,
  getUnpostedWorklist,
  getVendorAging,
  getGrantReceivablesFollowUp,
  estimateZakatDue,
} from '../accountant-workbench.service';

function poolWith(handler: (text: string) => { rows: Record<string, unknown>[] }) {
  return { query: vi.fn(async (text: string) => handler(text)) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAccountLedger', () => {
  it('computes opening, running and closing balances', async () => {
    dbMock.getPool.mockReturnValue(
      poolWith((t) => {
        if (t.includes('FROM chart_of_accounts')) return { rows: [{ id: 'a1', account_code: '1101' }] };
        if (t.includes('as balance')) return { rows: [{ balance: 1000 }] };
        return {
          rows: [
            { entry_date: '2026-01-05', voucher_number: 'V1', description: null, debit: 500, credit: 0 },
            { entry_date: '2026-01-06', voucher_number: 'V2', description: 'x', debit: 0, credit: 200 },
          ],
        };
      })
    );
    const r = await getAccountLedger('org-1', 'a1', {});
    expect(r.openingBalance).toBe(1000);
    expect(r.lines[0].runningBalance).toBe(1500);
    expect(r.lines[1].runningBalance).toBe(1300);
    expect(r.totals).toEqual({ totalDebit: 500, totalCredit: 200, closingBalance: 1300 });
  });

  it('degrades to empty ledger when storage fails', async () => {
    dbMock.getPool.mockReturnValue({ query: vi.fn(async () => { throw new Error('down'); }) });
    const r = await getAccountLedger('org-1', 'a1', {});
    expect(r.lines).toEqual([]);
    expect(r.totals.closingBalance).toBe(0);
  });
});

describe('getUnpostedWorklist', () => {
  it('merges draft transactions and journals with totals', async () => {
    dbMock.getPool.mockReturnValue(
      poolWith(() => ({ rows: [
        { kind: 'TRANSACTION', voucher_number: 'T1', amount: 100 },
        { kind: 'JOURNAL', voucher_number: 'J1', amount: 50 },
      ] }))
    );
    const r = await getUnpostedWorklist('org-1', {});
    expect(r.count).toBe(2);
    expect(r.totalDraftAmount).toBe(150);
  });
});

describe('getVendorAging', () => {
  it('buckets outstanding invoices by age', async () => {
    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    dbMock.getPool.mockReturnValue(
      poolWith(() => ({ rows: [
        { vendor_id: 'v1', vendor_name: 'مورد', amount: 100, invoice_date: daysAgo(10) },
        { vendor_id: 'v1', vendor_name: 'مورد', amount: 200, invoice_date: daysAgo(45) },
        { vendor_id: 'v2', vendor_name: 'مورد2', amount: 400, invoice_date: daysAgo(120) },
      ] }))
    );
    const r = await getVendorAging('org-1');
    expect(r.vendors).toHaveLength(2);
    expect(r.vendors[0].vendorId).toBe('v2');
    expect(r.totals).toEqual({ current: 100, days30: 200, days60: 0, days90plus: 400, grandTotal: 700 });
  });
});

describe('getGrantReceivablesFollowUp', () => {
  it('splits overdue, due-soon and upcoming with totals', async () => {
    const iso = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    dbMock.getPool.mockReturnValue(
      poolWith(() => ({ rows: [
        { id: 'i1', grant_number: 'G1', grant_title: null, donor_name: 'd', installment_number: 1, amount: 1000, currency_code: 'USD', expected_date: iso(-10), status: 'PENDING', overdue_days: 10 },
        { id: 'i2', grant_number: 'G1', grant_title: null, donor_name: 'd', installment_number: 2, amount: 2000, currency_code: 'USD', expected_date: iso(20), status: 'PENDING', overdue_days: -20 },
        { id: 'i3', grant_number: 'G2', grant_title: null, donor_name: 'd', installment_number: 1, amount: 3000, currency_code: 'USD', expected_date: iso(200), status: 'PENDING', overdue_days: -200 },
      ] }))
    );
    const r = await getGrantReceivablesFollowUp('org-1', 45);
    expect(r.overdue).toHaveLength(1);
    expect(r.dueSoon).toHaveLength(1);
    expect(r.upcoming).toHaveLength(1);
    expect(r.totals).toEqual({ overdueTotal: 1000, dueSoonTotal: 2000, upcomingTotal: 3000, grandTotal: 6000 });
    expect(r.overdue[0].urgency).toBe('OVERDUE');
  });
});

describe('estimateZakatDue', () => {
  it('applies 2.5% above the 595g silver nisab', () => {
    const r = estimateZakatDue({ cashAndBank: 100000, receivables: 20000, debtsOwed: 20000 }, 100);
    expect(r.nisabThreshold).toBe(59500);
    expect(r.zakatableBase).toBe(100000);
    expect(r.meetsNisab).toBe(true);
    expect(r.zakatDue).toBe(2500);
  });
  it('charges nothing below nisab', () => {
    const r = estimateZakatDue({ cashAndBank: 1000, receivables: 0 }, 100);
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });
});
