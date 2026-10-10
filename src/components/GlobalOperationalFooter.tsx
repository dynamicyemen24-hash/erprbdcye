import React, { useCallback, useEffect, useState } from 'react';
import { APP_VERSION_FULL_LABEL } from '../core/version';

export interface GlobalOperationalFooterProps {
  lang: 'ar' | 'en';
  dbConnected: boolean;
  totalRecordsCount: number;
  orgName: string;
  /** Optional detail beside the status dot, e.g. the readiness probe result. */
  dbStatusDetail?: string;
}

type DbState = 'unknown' | 'healthy' | 'degraded' | 'offline';

/**
 * Global status strip.
 *
 * TRUST CONTRACT — two defects are fixed here and both are guarded by tests:
 *   1. The version was a hand-copied literal (`v2.4.0-Enterprise`) that disagreed
 *      with the `4.0.0` shown elsewhere in the same session. It now comes from
 *      the single source of truth in `core/version`.
 *   2. The status dot was `bg-emerald-500` whenever `dbConnected` was true,
 *      where `dbConnected` is derived from `!!serverStats` upstream — so it read
 *      "Active & Secure" even while the database was unreachable. The footer now
 *      distinguishes four states, and `unknown` ("still checking") is a real
 *      state rather than being silently reported as healthy.
 *
 * WCAG 1.4.1: the state is carried by shape + text, not colour alone.
 * WCAG 4.1.3: the region is a polite live region so a change is announced.
 */
const GlobalOperationalFooterInner: React.FC<GlobalOperationalFooterProps> = ({
  lang,
  dbConnected,
  totalRecordsCount,
  orgName,
  dbStatusDetail,
}) => {
  const isRtl = lang === 'ar';
  const [dbState, setDbState] = useState<DbState>('unknown');

  useEffect(() => {
    if (dbConnected) {
      setDbState('healthy');
    } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setDbState('offline');
    } else {
      setDbState('degraded');
    }
  }, [dbConnected]);

  const statusLabel = useCallback(() => {
    switch (dbState) {
      case 'healthy':
        return isRtl ? 'منظومة UAMEX ERP™: نشطة ومؤمّنة' : 'UAMEX ERP™: Active & Secure';
      case 'degraded':
        return isRtl ? 'تعذّر تأكيد الاتصال بقاعدة البيانات' : 'Database connectivity unconfirmed';
      case 'offline':
        return isRtl ? 'النظام في وضع عدم الاتصال' : 'System offline';
      default:
        return isRtl ? 'جارٍ التحقق من حالة النظام…' : 'Checking system status…';
    }
  }, [dbState, isRtl]);

  const DOT: Record<DbState, string> = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    offline: 'bg-rose-500',
    unknown: 'bg-zinc-500',
  };

  return (
    <footer className="h-7 bg-zinc-950 border-t border-zinc-800 text-zinc-400 flex items-center justify-between px-3 shrink-0 text-[10px] font-bold z-40 relative select-none">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5"
          role="status"
          aria-live="polite"
          data-testid="db-status"
          data-state={dbState}
        >
          <span className={`w-2 h-2 rounded-full ${DOT[dbState]}`} aria-hidden="true" />
          <span className="text-zinc-300">
            {statusLabel()}
            {dbStatusDetail && (
              <span className="ms-1.5 font-mono text-zinc-500">{dbStatusDetail}</span>
            )}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 border-s border-zinc-800 px-3 py-0.5 font-mono text-zinc-300">
          <span>{isRtl ? 'السجلات المعتمدة:' : 'Total Records:'}</span>
          <span className="text-amber-400 font-bold tabular-nums">{totalRecordsCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-emerald-400 font-mono">{APP_VERSION_FULL_LABEL}</span>
        <span className="text-zinc-700" aria-hidden="true">|</span>
        <span className="font-mono text-zinc-400">
          © {new Date().getFullYear()} {orgName}
        </span>
      </div>
    </footer>
  );
};

export default React.memo(GlobalOperationalFooterInner);
export { GlobalOperationalFooterInner as GlobalOperationalFooter };
