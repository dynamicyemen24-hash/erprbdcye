import { describe, it, expect } from 'vitest';
import {
  NEB_DOMAINS,
  registerNebDomain,
  getExtendedNebDomains,
  getAllNebDomains,
  type NebDomain,
} from '../neb-registry';

const makeDomain = (code: string): NebDomain => ({
  code,
  nameAr: 'نظام تجريبي للمشترك',
  nameEn: 'Subscriber Trial System',
  engine: 'trial.engine',
  routes: '/api/v2/trial',
  keyTables: ['trial_records'],
});

describe('NEB registry subscriber extensions', () => {
  it('keeps the base catalog frozen at NEB-01..NEB-15', () => {
    expect(NEB_DOMAINS).toHaveLength(15);
    expect(getAllNebDomains().length).toBeGreaterThanOrEqual(15);
  });

  it('registers a well-formed subscriber domain (NEB-16)', () => {
    const added = registerNebDomain(makeDomain('NEB-16'));
    expect(added.code).toBe('NEB-16');
    expect(getExtendedNebDomains().map((d) => d.code)).toContain('NEB-16');
    expect(getAllNebDomains().map((d) => d.code)).toContain('NEB-16');
    expect(NEB_DOMAINS).toHaveLength(15);
  });

  it('rejects duplicate codes from base or extensions', () => {
    expect(() => registerNebDomain(makeDomain('NEB-01'))).toThrow(/already registered/);
    expect(() => registerNebDomain(makeDomain('NEB-16'))).toThrow(/already registered/);
  });

  it('rejects malformed extension domains with the same integrity rules', () => {
    expect(() => registerNebDomain(makeDomain('TRIAL-1'))).toThrow(/NEB-NN/);
    expect(() => registerNebDomain({ ...makeDomain('NEB-17'), engine: 'trial' })).toThrow(/\.engine/);
    expect(() => registerNebDomain({ ...makeDomain('NEB-17'), routes: '/api/v9/trial' })).toThrow(/\/api\/v2\//);
    expect(() => registerNebDomain({ ...makeDomain('NEB-17'), keyTables: [] })).toThrow(/anchor table/);
  });
});
