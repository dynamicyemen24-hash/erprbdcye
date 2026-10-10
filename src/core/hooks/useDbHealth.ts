import React from 'react';

/**
 * Database/服务 health probe.
 *
 * WHY THIS EXISTS
 * `App.tsx` derived its footer status from `!!serverStats` — the truthiness of
 * a value that had been fetched once at session start. That boolean stayed
 * `true` for the rest of the session even when the database became unreachable,
 * so the global status strip kept reading "Active & Secure" during a real outage.
 * A status light that cannot go red is worse than no status light.
 *
 * The real signal already exists in this codebase: `/api/v2/health/readiness`
 * returns `checks.database.status`, and `e2e/comprehensive.spec.ts` asserts on
 * it. This hook polls that endpoint on an interval and re-probes when the
 * browser reports it is back online.
 *
 * Trust rules, in order of precedence:
 *   1. An explicit override (tests, training sandbox) always wins.
 *   2. A successful probe reporting `healthy` reports healthy.
 *   3. A successful probe reporting anything else reports DEGRADED — never healthy.
 *   4. An unreachable/failed probe reports UNKNOWN, which the UI must not
 *      silently upgrade to healthy.
 */

export type DbHealthState = 'unknown' | 'healthy' | 'degraded' | 'offline';

export interface DbHealth {
  state: DbHealthState;
  /** Raw `checks.database.status` when the probe answered, else null. */
  detail: string | null;
  /** True until the first probe resolves — so callers can avoid a false green. */
  pending: boolean;
  /** Re-run the probe now. */
  refresh: () => void;
}

const DEFAULT_INTERVAL_MS = 60_000;

function readProbeState(payload: unknown): { state: DbHealthState; detail: string | null } {
  if (!payload || typeof payload !== 'object') {
    return { state: 'unknown', detail: null };
  }
  const body = payload as {
    status?: unknown;
    checks?: { database?: { status?: unknown } };
  };
  const dbStatus = body.checks?.database?.status;
  const detail = typeof dbStatus === 'string' ? dbStatus : null;

  // A 200 readiness response is not by itself proof the database is reachable:
  // the endpoint answers 503 while bootstrap is incomplete, and the database
  // sub-check carries its own status. Only an explicit `healthy` counts.
  if (detail === 'healthy') return { state: 'healthy', detail };

  const overall = typeof body.status === 'string' ? body.status : null;
  if (overall === 'alive' || overall === 'ready') {
    return { state: 'degraded', detail: detail ?? overall };
  }
  return { state: 'degraded', detail: detail ?? overall };
}

export function useDbHealth(
  intervalMs: number = DEFAULT_INTERVAL_MS,
  enabled: boolean = true
): DbHealth {
  const [state, setState] = React.useState<DbHealthState>('unknown');
  const [detail, setDetail] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(enabled);
  const [nonce, setNonce] = React.useState(0);

  const refresh = React.useCallback(() => setNonce((n) => n + 1), []);

  React.useEffect(() => {
    if (!enabled) {
      setPending(false);
      return;
    }
    const controller = new AbortController();
    let active = true;

    const probe = async () => {
      try {
        const resp = await fetch('/api/v2/health/readiness', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const parsed = readProbeState(await resp.json());
        if (!active) return;
        setState(parsed.state);
        setDetail(parsed.detail);
      } catch (e) {
        if (controller.signal.aborted || !active) return;
        // Distinguish "no network at all" from "server answered badly" — the
        // footer offers different recovery advice for each.
        const offline =
          typeof navigator !== 'undefined' && navigator.onLine === false;
        setState(offline ? 'offline' : 'unknown');
        setDetail(null);
      } finally {
        if (active) setPending(false);
      }
    };

    void probe();
    const timer = window.setInterval(probe, intervalMs);

    const onOnline = () => void probe();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
    };
  }, [intervalMs, enabled, nonce]);

  return { state, detail, pending, refresh };
}

export default useDbHealth;