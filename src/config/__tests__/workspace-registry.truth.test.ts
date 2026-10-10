import { describe, it, expect } from 'vitest';
import { WORKSPACE_ROLE_KEYS, WORKSPACE_OPERATIONAL_MAP } from '../workspaceRegistry';
import { REPORT_WORKSPACE_REGISTRY } from '../reportWorkspaceRegistry';

/**
 * Trust guard — SAP-style operational hierarchy coverage.
 *
 * WHAT THIS PREVENTS
 * `WORKSPACE_ROLE_KEYS` once covered 12 roles while NEB has 15 domains —
 * portfolio (NEB-02), funding (NEB-08), assets, community, knowledge and
 * integration had DB + API but no operational workspace. Reports registry
 * was orphan (8 entries, 0 consumers). Any new NEB domain or workspace
 * must extend BOTH registries here — the test guards the linkage forever.
 *
 * RULE: adding a workspace key REQUIRES:
 *   1. entry in WORKSPACE_OPERATIONAL_MAP (nebCodes/sapModules/activeTab/dbTables/apiEndpoints/reportId)
 *   2. matching report id in REPORT_WORKSPACE_REGISTRY
 *   3. definitions + quickActions in InstitutionalRoleWorkspaces
 */
const KNOWN_WORKSPACES = [
  'strategy',
  'portfolio',
  'programs',
  'operations',
  'field_tasks',
  'beneficiaries',
  'community',
  'funding',
  'finance',
  'procurement',
  'inventory',
  'assets',
  'sales',
  'knowledge',
  'integration',
  'meal',
  'admin',
  'hr',
] as const;

const KNOWN_REPORTS = [
  'strategy',
  'portfolio',
  'projects',
  'activities',
  'beneficiaries',
  'community',
  'funding',
  'assets',
  'hr',
  'finance',
  'commitments',
  'knowledge',
  'integration',
  'meal',
  'procurement',
  'inventory',
  'sales',
  'admin',
] as const;

describe('WORKSPACE_OPERATIONAL_MAP registry', () => {
  it('covers every known operational workspace (no blind spots)', () => {
    const keys = new Set(WORKSPACE_ROLE_KEYS as readonly string[]);
    for (const w of KNOWN_WORKSPACES) {
      expect(keys.has(w), `missing workspace key '${w}'`).toBe(true);
      expect(WORKSPACE_OPERATIONAL_MAP[w as keyof typeof WORKSPACE_OPERATIONAL_MAP], `missing operational link for '${w}'`).toBeTruthy();
    }
  });

  it('links every workspace to NEB + SAP + tab + DB + API + report', () => {
    for (const key of WORKSPACE_ROLE_KEYS) {
      const link = WORKSPACE_OPERATIONAL_MAP[key];
      expect(link.nebCodes.length, `'${key}' needs nebCodes`).toBeGreaterThan(0);
      expect(link.sapModules.length, `'${key}' needs sapModules`).toBeGreaterThan(0);
      expect(link.activeTab.trim().length, `'${key}' needs activeTab`).toBeGreaterThan(0);
      expect(link.dbTables.length, `'${key}' needs dbTables`).toBeGreaterThan(0);
      expect(link.apiEndpoints.length, `'${key}' needs apiEndpoints`).toBeGreaterThan(0);
      expect(link.reportId.trim().length, `'${key}' needs reportId`).toBeGreaterThan(0);
    }
  });

  it('covers all 15 NEB domains across workspaces', () => {
    const covered = new Set<string>();
    for (const key of WORKSPACE_ROLE_KEYS) {
      for (const c of WORKSPACE_OPERATIONAL_MAP[key].nebCodes) covered.add(c.toUpperCase());
    }
    for (let i = 1; i <= 15; i++) {
      const code = `NEB-${String(i).padStart(2, '0')}`;
      expect(covered.has(code), `no workspace covers ${code}`).toBe(true);
    }
  });
});

describe('REPORT_WORKSPACE_REGISTRY', () => {
  it('covers every known report (no orphan domains)', () => {
    const ids = new Set(REPORT_WORKSPACE_REGISTRY.map((r) => r.id));
    for (const r of KNOWN_REPORTS) {
      expect(ids.has(r), `missing report '${r}'`).toBe(true);
    }
  });

  it('links every report to NEB + workspace + document', () => {
    for (const r of REPORT_WORKSPACE_REGISTRY) {
      expect(r.nebCodes.length, `'${r.id}' needs nebCodes`).toBeGreaterThan(0);
      expect(r.workspaceTab.trim().length, `'${r.id}' needs workspaceTab`).toBeGreaterThan(0);
      expect(r.documentAr.trim().length, `'${r.id}' needs documentAr`).toBeGreaterThan(0);
    }
  });

  it('every workspace reportId resolves to a real report', () => {
    const ids = new Set(REPORT_WORKSPACE_REGISTRY.map((r) => r.id));
    for (const key of WORKSPACE_ROLE_KEYS) {
      const reportId = WORKSPACE_OPERATIONAL_MAP[key].reportId;
      expect(ids.has(reportId), `workspace '${key}' points to missing report '${reportId}'`).toBe(true);
    }
  });
});
