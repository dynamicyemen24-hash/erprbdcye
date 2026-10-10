import { describe, it, expect } from 'vitest';
import { ROUTE_DEFINITIONS } from '../index';
import type { ActiveTab } from '../../../core/types/dashboard';

/**
 * Trust guard — route registry coverage.
 *
 * WHAT THIS PREVENTS
 * `ROUTE_DEFINITIONS` silently missed 4 live tabs (`workspaces`,
 * `hr_dashboard`, `third-party-network`, `admin_control_center`) while
 * `TAB_CONFIG` rendered them. Any consumer classifying routes by category
 * (permissions UI, sitemap, audit) inherited the blind spot.
 *
 * RULE: adding a tab to `TAB_CONFIG` (App / TabContentRenderer) REQUIRES the
 * same id here with its NEB domain + category. Extend KNOWN_TABS below when
 * you do — the test then guards the new entry forever.
 */
const KNOWN_TABS = [
  'dashboard',
  'workspaces',
  'strategic_planning',
  'control_panel',
  'domains',
  'geospatial',
  'programs',
  'projects',
  'activities',
  'field_tasks',
  'allocations',
  'scenarios',
  'portfolio_intelligence',
  'beneficiaries',
  'sponsorships',
  'procurement',
  'inventory',
  'contracts',
  'commitments_obligations',
  'finance',
  'investments',
  'approvals',
  'currencies',
  'reports',
  'business_intelligence',
  'search',
  'docs',
  'users',
  'settings',
  'audit',
  'backup',
  'admin_control_center',
  'hr_dashboard',
  'third-party-network',
  'sales',
  'communications',
] as const satisfies readonly ActiveTab[];

describe('ROUTE_DEFINITIONS registry', () => {
  it('covers every known live tab (no blind spots)', () => {
    const ids = new Set(ROUTE_DEFINITIONS.map((r) => r.id));
    for (const tab of KNOWN_TABS) {
      expect(ids.has(tab), `missing route registry entry for tab '${tab}'`).toBe(true);
    }
  });

  it('has no duplicate ids', () => {
    const ids = ROUTE_DEFINITIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every entry categorized with a domain code', () => {
    for (const r of ROUTE_DEFINITIONS) {
      expect(r.domainCode.trim().length).toBeGreaterThan(0);
      expect(['core', 'operations', 'governance', 'analytics', 'settings']).toContain(r.category);
    }
  });

  it('marks the secure financial/audit routes', () => {
    const byId = new Map(ROUTE_DEFINITIONS.map((r) => [r.id, r]));
    for (const id of ['finance', 'investments', 'audit'] as const satisfies readonly ActiveTab[]) {
      expect(byId.get(id)?.isSecure, `'${id}' must stay isSecure`).toBe(true);
    }
  });
});
