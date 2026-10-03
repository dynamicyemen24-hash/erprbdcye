import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  resolvePermissions,
  can,
  canAll,
} from '../permission-map';

describe('resolvePermissions', () => {
  it('fails closed for missing subjects', () => {
    expect(resolvePermissions(null).size).toBe(0);
    expect(resolvePermissions(undefined).size).toBe(0);
    expect(can(null, PERMISSIONS.DASHBOARD_READ)).toBe(false);
  });

  it('grants everything to ADMIN and to clearance level 5', () => {
    expect(resolvePermissions({ role: 'ADMIN', security_level: 1 })).toEqual(
      new Set(ALL_PERMISSIONS)
    );
    expect(resolvePermissions({ role: 'member', security_level: 5 }).size).toBe(
      ALL_PERMISSIONS.length
    );
  });

  it('is case-insensitive for the Administrator role', () => {
    const perms = resolvePermissions({ role: 'administrator', security_level: 1 });
    expect(perms.has(PERMISSIONS.USERS_MANAGE)).toBe(true);
    expect(perms.has(PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
  });

  it('mirrors the server security-level ladder for writes', () => {
    const lvl1 = resolvePermissions({ role: 'VIEWER', security_level: 1 });
    expect(lvl1.has(PERMISSIONS.PROJECTS_WRITE)).toBe(false);

    const lvl2 = resolvePermissions({ role: 'MEMBER', security_level: 2 });
    expect(lvl2.has(PERMISSIONS.PROJECTS_WRITE)).toBe(true);
    expect(lvl2.has(PERMISSIONS.PROCUREMENT_WRITE)).toBe(false);

    const lvl3 = resolvePermissions({ role: 'MEMBER', security_level: 3 });
    expect(lvl3.has(PERMISSIONS.PROCUREMENT_WRITE)).toBe(true);
    expect(lvl3.has(PERMISSIONS.PROCUREMENT_APPROVE)).toBe(false);

    const lvl4 = resolvePermissions({ role: 'MEMBER', security_level: 4 });
    expect(lvl4.has(PERMISSIONS.PROCUREMENT_APPROVE)).toBe(true);
    expect(lvl4.has(PERMISSIONS.USERS_MANAGE)).toBe(true);
  });

  it('scopes ACCOUNTANT to finance and hides HR/audit', () => {
    const perms = resolvePermissions({ role: 'ACCOUNTANT', security_level: 1 });
    expect(perms.has(PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.FINANCE_WRITE)).toBe(true);
    expect(perms.has(PERMISSIONS.HR_READ)).toBe(false);
    expect(perms.has(PERMISSIONS.AUDIT_READ)).toBe(false);
    expect(perms.has(PERMISSIONS.USERS_READ)).toBe(false);
  });

  it('scopes HR roles away from the financial ledger', () => {
    const perms = resolvePermissions({ role: 'HR_MANAGER', security_level: 1 });
    expect(perms.has(PERMISSIONS.HR_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.HR_WRITE)).toBe(true);
    expect(perms.has(PERMISSIONS.FINANCE_READ)).toBe(false);
    expect(perms.has(PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  it('gives VIEWER every read and no writes', () => {
    const perms = resolvePermissions({ role: 'VIEWER', security_level: 1 });
    expect(perms.has(PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.HR_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.AUDIT_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.PROJECTS_WRITE)).toBe(false);
    expect(perms.has(PERMISSIONS.APPROVALS_ACT)).toBe(false);
  });

  it('keeps legacy/unknown roles read-open and write-closed', () => {
    const perms = resolvePermissions({ role: 'Institutional Lead', security_level: 1 });
    expect(perms.has(PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.HR_READ)).toBe(true);
    expect(perms.has(PERMISSIONS.PROJECTS_WRITE)).toBe(false);
    expect(perms.has(PERMISSIONS.USERS_MANAGE)).toBe(false);
  });
});

describe('can / canAll', () => {
  it('accepts either a subject or a resolved set', () => {
    const subject = { role: 'ACCOUNTANT', security_level: 1 };
    const perms = resolvePermissions(subject);
    expect(can(perms, PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(can(subject, PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(can(subject, PERMISSIONS.HR_READ)).toBe(false);
  });

  it('canAll requires every key', () => {
    const subject = { role: 'MANAGER', security_level: 2 };
    expect(canAll(subject, [PERMISSIONS.FINANCE_READ, PERMISSIONS.PROJECTS_WRITE])).toBe(true);
    expect(canAll(subject, [PERMISSIONS.FINANCE_READ, PERMISSIONS.USERS_MANAGE])).toBe(false);
  });
});
