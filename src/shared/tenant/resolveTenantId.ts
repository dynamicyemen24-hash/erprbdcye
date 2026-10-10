/**
 * NexoraOS™ — Central Tenant Resolver (DEBT PAID)
 *
 * Replaces every hardcoded `'00000000-0000-0000-0000-000000000001'` fallback
 * scattered across frontend mutations. Fail-closed: never invents an org.
 *
 * Priority: session subject → JWT claim → explicit header/storage → throw.
 */

export interface TenantSubject {
  organization_id?: string | null;
  org_id?: string | null;
  organizationId?: string | null;
  tenantId?: string | null;
}

function decodeJwtOrgId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return (
      payload.organization_id || payload.org_id || payload.organizationId || payload.tenantId || payload.tenant_id || null
    );
  } catch {
    return null;
  }
}

/**
 * Resolve the active tenant id. Throws when no tenant can be proven —
 * callers must surface the error instead of writing to a default org.
 */
export function resolveTenantId(subject?: TenantSubject | null): string {
  const fromSubject =
    subject?.organization_id || subject?.org_id || subject?.organizationId || subject?.tenantId || null;
  if (fromSubject && fromSubject !== 'hq') return String(fromSubject);

  if (typeof window !== 'undefined') {
    try {
      const stored =
        localStorage.getItem('uamex_tenant_id') ||
        localStorage.getItem('uamex_active_org') ||
        sessionStorage.getItem('uamex_tenant_id');
      if (stored && stored !== 'hq' && stored.length >= 8) return stored;
    } catch { /* storage unavailable — continue */ }
    const fromJwt = decodeJwtOrgId(localStorage.getItem('rbd_token'));
    if (fromJwt) return fromJwt;
  }
  throw new Error('TENANT_UNRESOLVED: no authenticated organization — refusing to fall back to a default org');
}

/** Non-throwing variant for read paths that render an honest empty state. */
export function tryResolveTenantId(subject?: TenantSubject | null): string | null {
  try {
    return resolveTenantId(subject);
  } catch {
    return null;
  }
}
