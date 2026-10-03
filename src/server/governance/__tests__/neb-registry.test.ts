import { describe, it, expect } from 'vitest';
import { NEB_DOMAINS, auditNebCoverage } from '../neb-registry';

describe('NEB governance registry integrity', () => {
  it('covers exactly NEB-01..NEB-15 with unique codes', () => {
    expect(NEB_DOMAINS).toHaveLength(15);
    const codes = NEB_DOMAINS.map((d) => d.code);
    expect(new Set(codes).size).toBe(15);
    for (let i = 1; i <= 15; i++) {
      expect(codes).toContain(`NEB-${String(i).padStart(2, '0')}`);
    }
  });

  it('gives every domain an owner engine, route mount and anchor tables', () => {
    for (const d of NEB_DOMAINS) {
      expect(d.nameAr, `${d.code} nameAr`).toBeTruthy();
      expect(d.nameEn, `${d.code} nameEn`).toBeTruthy();
      expect(d.engine, `${d.code} engine`).toMatch(/\.engine$/);
      expect(d.routes, `${d.code} routes`).toMatch(/^\/api\/v2\//);
      expect(d.keyTables.length, `${d.code} tables`).toBeGreaterThan(0);
    }
  });

  it('audits coverage as a dated snapshot', () => {
    const audit = auditNebCoverage();
    expect(audit.total).toBe(15);
    expect(audit.domains).toHaveLength(15);
    expect(audit.generatedAt).toBeTruthy();
  });
});
