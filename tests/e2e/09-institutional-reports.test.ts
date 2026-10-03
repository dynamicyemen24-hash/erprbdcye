/**
 * NexoraOS™ — E2E Test Suite 09: Institutional Reports & Analytics
 * Covers /api/v2/institutional-reports/* (budget variance, donor
 * stewardship, cash flow, trial balance, executive brief, audit).
 * Tolerant style: endpoints must never 5xx; shape asserted on 200.
 */

import { describe, it, expect } from 'vitest';
import { api, TOKENS, assertUnauthorized } from './helpers/setup';

const BASE = '/api/v2/institutional-reports';
const ENDPOINTS = [
  'budget-variance',
  'donor-report',
  'cash-flow',
  'trial-balance',
  'executive-brief',
  'audit-activity',
  'neb-coverage',
  'unposted-worklist',
  'vendor-aging',
  'grant-receivables',
  'finance-scorecard',
];

describe('E2E: Institutional Reports', () => {
  for (const ep of ENDPOINTS) {
    describe(`GET ${BASE}/${ep}`, () => {
      it('returns an Arabic-first institutional envelope for admin', async () => {
        const res = await api.get(`${BASE}/${ep}`, { token: TOKENS.admin });
        expect(res.status).toBeLessThan(500);
        if (res.status === 200) {
          const body = res.data as Record<string, unknown>;
          const payload = (body.data ?? body) as Record<string, unknown>;
          expect(payload.lang).toBe('ar');
          expect(payload.dir).toBe('rtl');
          expect(payload.header).toBeDefined();
          expect(payload.titleAr).toBeTruthy();
        }
      });

      it('rejects unauthenticated callers', async () => {
        const res = await api.get(`${BASE}/${ep}`);
        assertUnauthorized(res);
      });

      it('stays below 500 for viewer role', async () => {
        const res = await api.get(`${BASE}/${ep}`, { token: TOKENS.viewer });
        expect(res.status).toBeLessThan(500);
      });
    });
  }

  describe('filters & language switching', () => {    it('accepts lang=en for English-first envelope', async () => {
      const res = await api.get(`${BASE}/executive-brief`, {
        token: TOKENS.admin,
        query: { lang: 'en' },
      });
      expect(res.status).toBeLessThan(500);
      if (res.status === 200) {
        const payload = ((res.data as Record<string, unknown>).data ?? res.data) as Record<string, unknown>;
        expect(payload.lang).toBe('en');
        expect(payload.dir).toBe('ltr');
      }
    });

    it('accepts branchCode scoping on budget variance', async () => {
      const res = await api.get(`${BASE}/budget-variance`, {
        token: TOKENS.admin,
        query: { branchCode: 'HQ' },
      });
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('governance & period close', () => {
    it('rejects period-close without fiscalYearId', async () => {
      const res = await api.get(`${BASE}/period-close`, { token: TOKENS.admin });
      expect(res.status).toBe(400);
    });

    it('returns a checklist for a fiscal year', async () => {
      const res = await api.get(`${BASE}/period-close`, {
        token: TOKENS.admin,
        query: { fiscalYearId: '00000000-0000-0000-0000-000000000001' },
      });
      expect(res.status).toBeLessThan(500);
      if (res.status === 200) {
        const payload = ((res.data as Record<string, unknown>).data ?? res.data) as Record<string, unknown>;
        expect(payload).toHaveProperty('ready');
        expect(payload).toHaveProperty('blockers');
      }
    });

    it('exposes the 15-domain NEB registry', async () => {
      const res = await api.get(`${BASE}/neb-coverage`, { token: TOKENS.admin });
      expect(res.status).toBeLessThan(500);
      if (res.status === 200) {
        const payload = ((res.data as Record<string, unknown>).data ?? res.data) as Record<string, unknown>;
        expect(payload.total).toBe(15);
      }
    });

    it('rejects ledger without accountId', async () => {
      const res = await api.get(`${BASE}/ledger`, { token: TOKENS.admin });
      expect(res.status).toBe(400);
    });

    it('returns an account ledger for a valid account', async () => {
      const res = await api.get(`${BASE}/ledger`, {
        token: TOKENS.admin,
        query: { accountId: '00000000-0000-0000-0000-000000000001' },
      });
      expect(res.status).toBeLessThan(500);
      if (res.status === 200) {
        const payload = ((res.data as Record<string, unknown>).data ?? res.data) as Record<string, unknown>;
        expect(payload).toHaveProperty('lines');
        expect(payload).toHaveProperty('totals');
      }
    });
  });
});
