/**
 * NexoraOS™ — Audited print hook.
 * Every "print report" button MUST route through here so the print produces:
 *   1. a reference number (auditable),
 *   2. an `audit_logs` row (DB-linked),
 *   3. then the actual print.
 */
import { useCallback } from 'react';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token =
      localStorage.getItem('rbd_token') ||
      sessionStorage.getItem('rbd_token') ||
      localStorage.getItem('roh_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

export function buildPrintReference(prefix: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(
    d.getHours()
  ).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export function useAuditPrint() {
  return useCallback(
    async (opts: { domain: string; title: string; prefix?: string; meta?: Record<string, unknown> }) => {
      const reference = buildPrintReference(opts.prefix ?? 'PRN');
      try {
        await fetch('/api/tables/audit_logs', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            action: `PRINT:${opts.domain}`,
            table_name: 'print_dossier',
            record_id: reference,
            details: JSON.stringify({ title: opts.title, reference, ...(opts.meta ?? {}) }),
          }),
        });
      } catch {
        /* print must never be blocked by audit failure */
      }
      try {
        window.print();
      } catch {
        /* ignore */
      }
      return reference;
    },
    []
  );
}

export default useAuditPrint;
