import { useMemo } from 'react';
import {
  resolvePermissions,
  can as canAllCheck,
  type PermissionKey,
  type PermissionSubject,
} from './permission-map';

const TOKEN_KEY = 'rbd_token';
const LEGACY_TOKEN_KEY = 'roh_token';
const USER_KEYS = ['rbd_user', 'roh_user'];

function readStorage(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Decode the (unverified — display-only) JWT payload for role/clearance claims. */
export function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Resolve the current session's permission subject:
 *   1. JWT claims from `rbd_token` (server-issued: role + security_level + org)
 *   2. saved session user object (`rbd_user` / `roh_user`)
 *   3. null → empty permission set (fails closed)
 */
export function readPermissionSubject(): PermissionSubject | null {
  const ls = typeof localStorage !== 'undefined' ? localStorage : undefined;
  const ss = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;

  for (const store of [ls, ss]) {
    const token = readStorage(store, TOKEN_KEY) || readStorage(store, LEGACY_TOKEN_KEY);
    if (token) {
      const claims = decodeJwtClaims(token);
      if (claims && (claims.role || claims.security_level)) {
        return {
          role: (claims.role as string) ?? null,
          security_level: (claims.security_level as number) ?? (claims.securityLevel as number) ?? 0,
        };
      }
    }
  }

  for (const key of USER_KEYS) {
    const raw = readStorage(ls, key) || readStorage(ss, key);
    if (!raw) continue;
    try {
      const user = JSON.parse(raw);
      if (user && (user.role || user.security_level || user.securityLevel)) {
        return {
          role: user.role ?? null,
          security_level: user.security_level ?? user.securityLevel ?? 0,
        };
      }
    } catch {
      /* ignore malformed session */
    }
  }

  return null;
}

export interface UsePermissionsResult {
  subject: PermissionSubject | null;
  perms: Set<PermissionKey>;
  can: (key: PermissionKey) => boolean;
  /** true when a signed-in session was found (even if permissions are limited) */
  authenticated: boolean;
}

/**
 * Session-aware permission set. Recomputed on render — login/logout re-renders
 * the tree, and cross-tab changes are picked up via the `storage` event on the
 * next render.
 */
export function usePermissions(): UsePermissionsResult {
  const subject = useMemo(() => readPermissionSubject(), []);
  const perms = useMemo(() => resolvePermissions(subject), [subject]);
  return {
    subject,
    perms,
    can: (key: PermissionKey) => perms.has(key),
    authenticated: subject !== null,
  };
}

/** Single-key convenience wrapper. */
export function useCan(key: PermissionKey): boolean {
  const { perms } = usePermissions();
  return perms.has(key);
}

export { canAllCheck };
