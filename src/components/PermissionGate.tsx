import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '../shared/permissions/usePermissions';
import type { PermissionKey } from '../shared/permissions/permission-map';

interface PermissionGateProps {
  /** Required permission (shared matrix key, e.g. 'finance:write') */
  perm: PermissionKey;
  /**
   * hide      → render nothing when denied (default)
   * disabled  → render children dimmed & non-interactive
   * fallback  → render the provided node when denied
   */
  mode?: 'hide' | 'disabled' | 'fallback';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Client-side visibility gate for actions/screens. The server enforces the same
 * matrix via `requirePermission(...)` — this only avoids offering actions the
 * API would reject.
 */
export function PermissionGate({ perm, mode = 'hide', fallback, children }: PermissionGateProps) {
  const { can } = usePermissions();

  if (can(perm)) return <>{children}</>;

  if (mode === 'fallback' && fallback !== undefined) return <>{fallback}</>;
  if (mode === 'disabled') {
    return (
      <span aria-disabled="true" className="pointer-events-none opacity-40 inline-block">
        {children}
      </span>
    );
  }
  return null;
}

/** Compact denial notice for permission-scoped panels. */
export function PermissionDeniedNotice({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 text-sm font-bold text-amber-700 dark:text-amber-300"
    >
      <ShieldAlert className="w-4 h-4 shrink-0" />
      {lang === 'ar'
        ? 'لا تملك صلاحية عرض هذه البيانات — تواصل مع مدير النظام'
        : 'You do not have permission to view this data — contact your administrator'}
    </div>
  );
}

export default PermissionGate;
