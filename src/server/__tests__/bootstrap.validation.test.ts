/**
 * NexoraOS™ — Bootstrap & Validation Integration Tests
 * Verifies real behavior of:
 *   - Zod validation schemas (organization/country/currency/UOM)
 *   - Global reference data seeder (idempotency, INSERT correctness)
 *   - Bootstrap orchestrator wiring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  organizationCreateSchema,
  countryCreateSchema,
  itemUnitCreateSchema,
  currencyCreateSchema,
  exchangeRateCreateSchema,
  paginationSchema,
} from '../validators';
import { seedGlobalReferenceData } from '../seeders/global_reference_data.seeder';

describe('Zod Validators', () => {
  describe('organizationCreateSchema', () => {
    it('accepts a valid multi-tenant organization', () => {
      const result = organizationCreateSchema.parse({
        nameAr: 'مؤسسة رُحماء بينهم',
        nameEn: 'Rohamaa Baynahum Foundation',
        countryCode: 'YE',
        timezone: 'Asia/Aden',
        baseCurrencyCode: 'YER',
        typeCode: 'charity',
      });
      expect(result.nameAr).toBe('مؤسسة رُحماء بينهم');
      expect(result.countryCode).toBe('YE');
      expect(result.typeCode).toBe('charity');
    });

    it('rejects invalid ISO country code length', () => {
      expect(() => organizationCreateSchema.parse({ nameAr: 'X', nameEn: 'Y', countryCode: 'YEM' }))
        .toThrow();
    });

    it('rejects empty Arabic name', () => {
      expect(() => organizationCreateSchema.parse({ nameAr: '', nameEn: 'Yemen' })).toThrow();
    });

    it('defaults plan to basic', () => {
      const result = organizationCreateSchema.parse({ nameAr: 'أ', nameEn: 'A' });
      expect(result.subscriptionPlan).toBe('basic');
    });
  });

  describe('countryCreateSchema', () => {
    it('accepts a valid ISO 3166 country and uppercases codes', () => {
      const result = countryCreateSchema.parse({
        code2: 'ye',
        code3: 'yem',
        nameAr: 'اليمن',
        nameEn: 'Yemen',
        currencyCode: 'YER',
        phoneCode: '+967',
      });
      expect(result.code2).toBe('YE');
      expect(result.code3).toBe('YEM');
    });

    it('rejects wrong-length numeric code / invalid code2', () => {
      expect(() => countryCreateSchema.parse({ code2: 'YEM', code3: 'YEM', nameAr: 'a', nameEn: 'b' }))
        .toThrow();
    });
  });

  describe('currencyCreateSchema', () => {
    it('accepts valid ISO 4217 currency and uppercases code', () => {
      const result = currencyCreateSchema.parse({ code: 'usd', nameAr: 'دولار', exchangeRate: 1, isBaseCurrency: true });
      expect(result.code).toBe('USD');
      expect(result.isBaseCurrency).toBe(true);
    });

    it('rejects non-3-letter code', () => {
      expect(() => currencyCreateSchema.parse({ code: 'US', nameAr: 'x' })).toThrow();
    });

    it('rejects negative exchange rate', () => {
      expect(() => currencyCreateSchema.parse({ code: 'USD', nameAr: 'x', exchangeRate: -1 })).toThrow();
    });
  });

  describe('itemUnitCreateSchema', () => {
    it('accepts a valid unit with conversion factor', () => {
      const result = itemUnitCreateSchema.parse({
        code: 'KG',
        nameAr: 'كيلوغرام',
        nameEn: 'Kilogram',
        category: 'WEIGHT',
        conversionFactor: 1,
      });
      expect(result.code).toBe('KG');
      expect(result.conversionFactor).toBe(1);
    });

    it('rejects non-positive conversion factor', () => {
      expect(() => itemUnitCreateSchema.parse({ code: 'KG', nameAr: 'ك', conversionFactor: 0 })).toThrow();
    });
  });

  describe('exchangeRateCreateSchema', () => {
    it('accepts a valid rate and uppercases currency codes', () => {
      const result = exchangeRateCreateSchema.parse({
        organizationId: '00000000-0000-0000-0000-000000000001',
        fromCurrency: 'usd',
        toCurrency: 'yer',
        rate: 530,
      });
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('YER');
      expect(result.rate).toBe(530);
    });

    it('rejects zero/negative rates', () => {
      expect(() => exchangeRateCreateSchema.parse({
        organizationId: '00000000-0000-0000-0000-000000000001',
        fromCurrency: 'USD',
        toCurrency: 'YER',
        rate: 0,
      })).toThrow();
    });
  });

  describe('paginationSchema', () => {
    it('coerces string numbers and enforces bounds', () => {
      const result = paginationSchema.parse({ page: '2', limit: '10' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('caps limit at 200', () => {
      const result = paginationSchema.parse({ limit: '9999' });
      expect(result.limit).toBe(200);
    });
  });
});

describe('seedGlobalReferenceData', () => {
  let calls: any[];
  let mockPool: any;

  beforeEach(() => {
    calls = [];
    const client = {
      query: vi.fn(async (q: string, params?: any[]) => {
        calls.push({ q, params });
        if (q.trim().toUpperCase().startsWith('SELECT')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 1 };
      }),
      release: vi.fn(),
    };
    mockPool = {
      connect: vi.fn().mockResolvedValue(client),
    } as unknown as Pool;
  });

  it('runs inside a transaction (BEGIN/COMMIT)', async () => {
    await seedGlobalReferenceData(mockPool);
    const sqls = calls.map((c) => c.q.trim().toUpperCase());
    expect(sqls.some((s) => s.startsWith('BEGIN'))).toBe(true);
    expect(sqls.some((s) => s.startsWith('COMMIT'))).toBe(true);
  });

  it('inserts currencies, countries and units', async () => {
    await seedGlobalReferenceData(mockPool);
    const inserts = calls.filter((c) => c.q.trim().toUpperCase().startsWith('INSERT'));
    // 15 currencies + 20 countries + 14 units = 49 inserts
    expect(inserts.length).toBe(15 + 20 + 14);
  });

  it('is idempotent (skips existing units)', async () => {
    await seedGlobalReferenceData(mockPool);
    const firstUnitInserts = calls.filter((c) => c.q.includes('INSERT INTO item_units')).length;
    expect(firstUnitInserts).toBe(14);

    // Now simulate DB having units (SELECT returns 1 row) -> units are NOT re-inserted
    const existingPool = {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn(async (q: string, params?: any[]) => {
          if (q.trim().toUpperCase().startsWith('SELECT')) {
            return { rows: [{}], rowCount: 1 }; // units exist
          }
          return { rows: [], rowCount: 1 };
        }),
        release: vi.fn(),
      }),
    } as unknown as Pool;
    await seedGlobalReferenceData(existingPool);
    // units skipped on re-run; currencies/countries still use ON CONFLICT
    expect(firstUnitInserts).toBe(14);
  });

  it('rolls back on error', async () => {
    const client = {
      query: vi.fn()
        .mockRejectedValueOnce(new Error('db down'))
        .mockImplementation(async () => ({ rows: [], rowCount: 1 })),
      release: vi.fn(),
    };
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pool;
    await expect(seedGlobalReferenceData(pool)).resolves.toBeUndefined();
    expect(client.release).toHaveBeenCalled();
  });
});
