import { describe, it, expect } from 'vitest';
import {
  unwrap,
  mapConsolidatedToKpiCards,
  buildLiveReportCards,
} from '../useInstitutionalReports';

describe('unwrap', () => {
  it('extracts data from success envelopes', () => {
    expect(unwrap({ success: true, data: { a: 1 } })).toEqual({ a: 1 });
  });
  it('passes raw payloads through', () => {
    expect(unwrap([1, 2])).toEqual([1, 2]);
  });
  it('throws on failure envelopes', () => {
    expect(() => unwrap({ success: false, error: 'x' })).toThrow();
  });
});

describe('mapConsolidatedToKpiCards', () => {
  it('maps live KPI domains to six cards', () => {
    const cards = mapConsolidatedToKpiCards({
      finance: { totalReceipts: 5000, budgetUtilization: 42 },
      beneficiaries: { total: 120 },
      projects: { active: 7, avgProgress: 63 },
    });
    expect(cards).toHaveLength(6);
    expect(cards[0].value).toBe('5000');
    expect(cards[2].value).toBe('7');
    expect(cards[3].value).toBe('63%');
    expect(cards[4].value).toBe('42%');
  });
  it('degrades safely on empty payload', () => {
    const cards = mapConsolidatedToKpiCards({});
    expect(cards).toHaveLength(6);
    expect(cards[0].value).toBe('0');
  });
});

describe('buildLiveReportCards', () => {
  it('builds six endpoint-bound cards', () => {
    const cards = buildLiveReportCards({ generatedAt: '2026-10-03T00:00:00.000Z' });
    expect(cards).toHaveLength(6);
    expect(cards.every((c) => c.endpoint.startsWith('/api/v2/institutional-reports/'))).toBe(true);
    expect(cards[0].status).toBe('ready');
    expect(cards[0].last_generated).toBe('2026-10-03');
  });
  it('marks cards scheduled without a brief', () => {
    const cards = buildLiveReportCards(null);
    expect(cards.every((c) => c.status === 'scheduled')).toBe(true);
  });
});
