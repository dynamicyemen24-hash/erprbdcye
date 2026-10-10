/**
 * NexoraOS™ — NEB-08 funding completion contract (static, source-level)
 *
 * Guards the e2e break we just paid: GrantInstallmentEngine and
 * PartnerAgreementEngine were imported in domains.routes but never mounted,
 * so grant → installment → report dead-ended at the API layer while the
 * FundingWorkspaceView already linked those screens.
 *
 * Static on purpose (mirrors api-fallthrough.contract.test.ts): booting the
 * real server needs Postgres + bootstrap.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES_SRC = readFileSync(join(process.cwd(), 'src/server/routes/v2/domains.routes.ts'), 'utf8');
const VIEW_SRC = readFileSync(join(process.cwd(), 'src/components/FundingWorkspaceView.tsx'), 'utf8');

describe('NEB-08 funding completion contract', () => {
  it('mounts grant installment collection + receive routes', () => {
    expect(ROUTES_SRC).toMatch(/router\.get\('\/grants\/:id\/installments'/);
    expect(ROUTES_SRC).toMatch(/router\.post\('\/grants\/:id\/installments'/);
    expect(ROUTES_SRC).toMatch(/router\.post\('\/installments\/:id\/receive'/);
  });

  it('mounts partner agreement routes', () => {
    expect(ROUTES_SRC).toMatch(/router\.get\('\/agreements'/);
    expect(ROUTES_SRC).toMatch(/router\.post\('\/agreements'/);
  });

  it('wires the mounted routes to their engines (no dead imports)', () => {
    expect(ROUTES_SRC).toMatch(/GrantInstallmentEngine\.listByGrant/);
    expect(ROUTES_SRC).toMatch(/GrantInstallmentEngine\.create/);
    expect(ROUTES_SRC).toMatch(/GrantInstallmentEngine\.receive/);
    expect(ROUTES_SRC).toMatch(/PartnerAgreementEngine\.list/);
    expect(ROUTES_SRC).toMatch(/PartnerAgreementEngine\.create/);
  });

  it('keeps the workspace UI tabs aligned with the mounted routes', () => {
    for (const tab of ['installments', 'compliance', 'utilization'] as const) {
      expect(VIEW_SRC).toContain(`'${tab}'`);
    }
    expect(VIEW_SRC).toMatch(/\/grants\/\$\{.*\}\/installments/);
    expect(VIEW_SRC).toMatch(/\/installments\/\$\{.*\}\/receive/);
    expect(VIEW_SRC).toMatch(/\/api\/operations\/iati-export/);
    expect(VIEW_SRC).toMatch(/donor_compliance_requirements/);
  });
});
