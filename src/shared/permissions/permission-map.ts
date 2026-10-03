/**
 * -------------------------------------------------------------------------------
 * NexoraOS — Shared Permission Core (Server + Client)
 *
 * Single source of truth for the role/clearance → permission matrix. Imported by:
 *   - server: `requirePermission(...)` middleware (read/write enforcement on APIs)
 *   - client: `usePermissions()` hook, `<PermissionGate>`, sidebar/nav gating
 *
 * Design rules (mirrors the server guard ladder so the UI only offers actions the
 * API would actually accept):
 *   - `security_level` ladder  → same thresholds as `requireSecurityLevel(n)`
 *       level >= 2 : operational writes (create/update field & ops records)
 *       level >= 3 : advanced writes (procurement docs, program administration)
 *       level >= 4 : approvals/award/manage (users, settings, PO approval)
 *       level >= 5 : full bypass (matches checkActivityPermission org-admin rule)
 *   - role base grants         → read scopes + domain-specific writes
 *   - unknown roles            → read-open / write-closed fallback (never hides
 *     existing data from legacy department-code roles, never grants writes)
 *
 * Pure module: no DOM, no Node APIs — safe for both runtimes.
 * -------------------------------------------------------------------------------
 */

export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  STRATEGY_READ: 'strategy:read',
  MASTER_READ: 'master:read',
  MASTER_WRITE: 'master:write',
  FINANCE_READ: 'finance:read',
  FINANCE_WRITE: 'finance:write',
  PROCUREMENT_READ: 'procurement:read',
  PROCUREMENT_WRITE: 'procurement:write',
  PROCUREMENT_APPROVE: 'procurement:approve',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  ACTIVITIES_READ: 'activities:read',
  ACTIVITIES_WRITE: 'activities:write',
  BENEFICIARIES_READ: 'beneficiaries:read',
  BENEFICIARIES_WRITE: 'beneficiaries:write',
  HR_READ: 'hr:read',
  HR_WRITE: 'hr:write',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  REPORTS_READ: 'reports:read',
  APPROVALS_READ: 'approvals:read',
  APPROVALS_ACT: 'approvals:act',
  COMMUNICATIONS_READ: 'communications:read',
  COMMUNICATIONS_WRITE: 'communications:write',
  AUDIT_READ: 'audit:read',
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);

const READ_PERMISSIONS: readonly PermissionKey[] = ALL_PERMISSIONS.filter((p) =>
  p.endsWith(':read')
);

const OPERATIONAL_WRITES: readonly PermissionKey[] = [
  PERMISSIONS.PROJECTS_WRITE,
  PERMISSIONS.ACTIVITIES_WRITE,
  PERMISSIONS.BENEFICIARIES_WRITE,
  PERMISSIONS.INVENTORY_WRITE,
  PERMISSIONS.COMMUNICATIONS_WRITE,
];

const ADVANCED_WRITES: readonly PermissionKey[] = [
  PERMISSIONS.PROCUREMENT_WRITE,
  PERMISSIONS.COMMUNICATIONS_WRITE,
  PERMISSIONS.MASTER_WRITE,
];

const APPROVAL_POWERS: readonly PermissionKey[] = [
  PERMISSIONS.APPROVALS_ACT,
  PERMISSIONS.PROCUREMENT_APPROVE,
];

const ADMIN_POWERS: readonly PermissionKey[] = [
  PERMISSIONS.USERS_MANAGE,
  PERMISSIONS.SETTINGS_MANAGE,
  PERMISSIONS.HR_WRITE,
  PERMISSIONS.FINANCE_WRITE,
];

type RoleProfile = {
  reads: readonly PermissionKey[];
  writes: readonly PermissionKey[];
};

const ALL_READS = READ_PERMISSIONS;

/** Role code (upper-cased) → base grant profile, before the clearance ladder. */
const ROLE_PROFILES: Record<string, RoleProfile> = {
  SUPER_ADMIN: { reads: ALL_READS, writes: ALL_PERMISSIONS.filter((p) => !p.endsWith(':read')) },
  ADMIN: { reads: ALL_READS, writes: ALL_PERMISSIONS.filter((p) => !p.endsWith(':read')) },
  ADMINISTRATOR: { reads: ALL_READS, writes: ALL_PERMISSIONS.filter((p) => !p.endsWith(':read')) },

  MANAGER: {
    reads: ALL_READS,
    writes: [...OPERATIONAL_WRITES, PERMISSIONS.FINANCE_WRITE, PERMISSIONS.MASTER_WRITE, PERMISSIONS.APPROVALS_ACT],
  },

  ACCOUNTANT: {
    reads: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.FINANCE_READ,
      PERMISSIONS.MASTER_READ,
      PERMISSIONS.PROCUREMENT_READ,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.ACTIVITIES_READ,
      PERMISSIONS.COMMUNICATIONS_READ,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.APPROVALS_READ,
      PERMISSIONS.STRATEGY_READ,
      PERMISSIONS.SETTINGS_READ,
    ],
    writes: [PERMISSIONS.FINANCE_WRITE, PERMISSIONS.MASTER_WRITE, PERMISSIONS.APPROVALS_ACT],
  },

  HR_MANAGER: {
    reads: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.HR_READ,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.BENEFICIARIES_READ,
      PERMISSIONS.ACTIVITIES_READ,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.COMMUNICATIONS_READ,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.APPROVALS_READ,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.STRATEGY_READ,
    ],
    writes: [PERMISSIONS.HR_WRITE, PERMISSIONS.BENEFICIARIES_WRITE, PERMISSIONS.ACTIVITIES_WRITE, PERMISSIONS.APPROVALS_ACT],
  },

  HR_OFFICER: {
    reads: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.HR_READ,
      PERMISSIONS.BENEFICIARIES_READ,
      PERMISSIONS.ACTIVITIES_READ,
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.COMMUNICATIONS_READ,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.SETTINGS_READ,
    ],
    writes: [PERMISSIONS.BENEFICIARIES_WRITE, PERMISSIONS.ACTIVITIES_WRITE],
  },

  AUDITOR: { reads: ALL_READS, writes: [] },
  INTERNAL_AUDITOR: { reads: ALL_READS, writes: [] },
  VIEWER: { reads: ALL_READS, writes: [] },
  MEMBER: { reads: ALL_READS, writes: [] },

  /**
   * Unknown / legacy department-code roles (e.g. "FIN", "Institutional Lead"):
   * read-open so no existing screen loses its data, write-closed until the
   * clearance ladder or an explicit role profile grants the action.
   */
  __FALLBACK__: { reads: ALL_READS, writes: [] },
};

export interface PermissionSubject {
  role?: string | null;
  security_level?: number | null;
}

/**
 * Resolve the effective permission set for a subject (JWT claims on the server,
 * session claims on the client). Fails closed: no subject → empty set.
 */
export function resolvePermissions(subject: PermissionSubject | null | undefined): Set<PermissionKey> {
  if (!subject) return new Set();

  const roleKey = String(subject.role ?? '').trim().toUpperCase();
  const profile = ROLE_PROFILES[roleKey] ?? ROLE_PROFILES.__FALLBACK__;
  const perms = new Set<PermissionKey>(profile.reads);
  for (const w of profile.writes) perms.add(w);

  const level = Number(subject.security_level ?? 0) || 0;
  if (level >= 2) for (const w of OPERATIONAL_WRITES) perms.add(w);
  if (level >= 3) for (const w of ADVANCED_WRITES) perms.add(w);
  if (level >= 4) {
    for (const w of APPROVAL_POWERS) perms.add(w);
    for (const w of ADMIN_POWERS) perms.add(w);
  }
  if (level >= 5 || roleKey === 'SUPER_ADMIN') return new Set(ALL_PERMISSIONS);

  return perms;
}

export function can(
  subject: PermissionSubject | Set<PermissionKey> | null | undefined,
  key: PermissionKey
): boolean {
  if (subject instanceof Set) return subject.has(key);
  return resolvePermissions(subject).has(key);
}

export function canAll(
  subject: PermissionSubject | Set<PermissionKey> | null | undefined,
  keys: readonly PermissionKey[]
): boolean {
  return keys.every((k) => can(subject, k));
}
